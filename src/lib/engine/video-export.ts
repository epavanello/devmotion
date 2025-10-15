/**
 * Video export using ffmpeg.wasm
 */
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { Project } from '$lib/types/animation';

let ffmpegInstance: FFmpeg | null = null;

export async function initFFmpeg(onProgress?: (progress: number) => void): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;

  const ffmpeg = new FFmpeg();

  if (onProgress) {
    ffmpeg.on('progress', ({ progress }) => {
      onProgress(progress * 100);
    });
  }

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/unithread';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
  });

  ffmpegInstance = ffmpeg;
  return ffmpeg;
}

export async function exportToMP4(
  project: Project,
  canvas: HTMLCanvasElement,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const ffmpeg = await initFFmpeg(onProgress);

  const fps = project.fps;
  const totalFrames = Math.floor(project.duration * fps);

  // Capture frames
  const frames: Blob[] = [];
  for (let i = 0; i < totalFrames; i++) {
    const time = i / fps;
    // This will be called from the component that has access to the rendering engine
    // For now, we'll just capture the canvas
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, 'image/png');
    });
    frames.push(blob);

    if (onProgress) {
      onProgress((i / totalFrames) * 50); // First 50% is frame capture
    }
  }

  // Write frames to ffmpeg
  for (let i = 0; i < frames.length; i++) {
    const data = await fetchFile(frames[i]);
    await ffmpeg.writeFile(`frame${i.toString().padStart(5, '0')}.png`, data);
  }

  // Run ffmpeg
  await ffmpeg.exec([
    '-framerate',
    fps.toString(),
    '-i',
    'frame%05d.png',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-preset',
    'medium',
    '-crf',
    '23',
    'output.mp4'
  ]);

  // Read output
  const data = await ffmpeg.readFile('output.mp4');
  const blob = new Blob([data], { type: 'video/mp4' });

  // Cleanup
  for (let i = 0; i < frames.length; i++) {
    await ffmpeg.deleteFile(`frame${i.toString().padStart(5, '0')}.png`);
  }
  await ffmpeg.deleteFile('output.mp4');

  if (onProgress) {
    onProgress(100);
  }

  return blob;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
