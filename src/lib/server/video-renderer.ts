import { chromium } from 'playwright';
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough, Readable } from 'stream';
import { EventEmitter } from 'events';
import { generateRenderToken, invalidateRenderToken } from './render-token';
import type { ProjectData } from '$lib/schemas/animation';

interface RenderConfig {
  projectId: string;
  renderId: string; // Unique ID for this specific render session
  width: number;
  height: number;
  fps: number;
  duration: number;
  baseUrl: string;
  /** Optional project data for extracting audio tracks */
  projectData?: ProjectData;
}

export interface RenderProgress {
  phase: 'initializing' | 'capturing' | 'encoding' | 'done' | 'error';
  currentFrame: number;
  totalFrames: number;
  percent: number;
  error?: string;
}

/**
 * Audio track info extracted from project layers
 */
interface AudioTrackInfo {
  src: string;
  enterTime: number;
  exitTime: number;
  mediaStartTime: number;
  mediaEndTime: number;
  volume: number;
  muted: boolean;
}

/**
 * Extract audio tracks from project data (video and audio layers)
 */
function extractAudioTracks(projectData: ProjectData): AudioTrackInfo[] {
  const tracks: AudioTrackInfo[] = [];

  for (const layer of projectData.layers) {
    if ((layer.type === 'video' || layer.type === 'audio') && layer.props.src) {
      const muted =
        layer.type === 'video'
          ? ((layer.props.muted as boolean) ?? false)
          : ((layer.props.muted as boolean) ?? false);

      if (!muted) {
        tracks.push({
          src: layer.props.src as string,
          enterTime: layer.enterTime ?? 0,
          exitTime: layer.exitTime ?? projectData.duration,
          mediaStartTime: (layer.props.mediaStartTime as number) ?? 0,
          mediaEndTime: (layer.props.mediaEndTime as number) ?? 0,
          volume: (layer.props.volume as number) ?? 1,
          muted
        });
      }
    }
  }

  return tracks;
}

// Global emitter for render progress
export const renderEmitter = new EventEmitter();

/**
 * Render a project to video using Playwright screenshots and FFmpeg.
 * Returns a Readable stream that will yield the MP4 data.
 *
 * When projectData is provided, audio tracks from video and audio layers
 * are extracted and mixed into the final output.
 */
export async function renderProjectToVideoStream(config: RenderConfig): Promise<Readable> {
  const { projectId, renderId, width, height, fps, duration, baseUrl, projectData } = config;
  const totalFrames = Math.ceil(fps * duration);

  const videoStream = new PassThrough();
  const token = generateRenderToken(projectId);
  const renderUrl = `${baseUrl}/render/${projectId}?token=${token}`;

  // Extract audio tracks if project data is available
  const audioTracks = projectData ? extractAudioTracks(projectData) : [];

  // Helper to emit progress
  const emitProgress = (progress: RenderProgress) => {
    renderEmitter.emit(`progress:${renderId}`, progress);
  };

  // Run the render process in the background
  (async () => {
    let browser = null;
    let page = null;
    let ffmpegCommand: ffmpeg.FfmpegCommand | null = null;

    const MAX_RENDER_DURATION_MS = 10 * 60 * 1000; // 10 minutes max
    const renderTimeout = setTimeout(() => {
      console.error('Render timeout exceeded');
      emitProgress({
        phase: 'error',
        currentFrame: 0,
        totalFrames,
        percent: 0,
        error: 'Render timeout exceeded'
      });
      videoStream.destroy(new Error('Render timeout'));
    }, MAX_RENDER_DURATION_MS);

    try {
      emitProgress({ phase: 'initializing', currentFrame: 0, totalFrames, percent: 0 });

      const launchArgs = ['--disable-gpu', '--disable-dev-shm-usage', '--disable-setuid-sandbox'];

      if (process.env.PLAYWRIGHT_ALLOW_INSECURE_FLAGS === 'true') {
        launchArgs.push('--no-sandbox', '--disable-web-security');
      }

      browser = await chromium.launch({
        headless: true,
        args: launchArgs
      });

      page = await browser.newPage({
        viewport: { width, height },
        deviceScaleFactor: 1
      });

      await page.goto(renderUrl, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => window.__DEVMOTION__?.ready, { timeout: 30000 });

      const pageConfig = await page.evaluate(() => window.__DEVMOTION__?.getConfig());
      const actualFps = pageConfig?.fps || fps;
      const actualDuration = pageConfig?.duration || duration;
      const actualTotalFrames = Math.ceil(actualFps * actualDuration);

      // Initialize FFmpeg
      const frameStream = new PassThrough();

      ffmpegCommand = ffmpeg().input(frameStream).inputFormat('image2pipe').inputFPS(actualFps);

      // Add audio tracks as additional inputs
      for (const track of audioTracks) {
        ffmpegCommand = ffmpegCommand.input(track.src);
      }

      // Build output options
      const outputOptions = [
        '-c:v libx264',
        '-preset ultrafast',
        '-crf 18',
        '-pix_fmt yuv420p',
        `-s ${width}x${height}`,
        '-movflags +faststart+frag_keyframe+empty_moov'
      ];

      // If we have audio tracks, build a complex filter for mixing
      if (audioTracks.length > 0) {
        const filterParts: string[] = [];
        const audioInputs: string[] = [];

        audioTracks.forEach((track, i) => {
          const inputIndex = i + 1; // 0 is the video frame stream
          const trimStart = track.mediaStartTime;
          const trimEnd = track.mediaEndTime > 0 ? track.mediaEndTime : undefined;
          const delay = Math.round(track.enterTime * 1000); // ms
          const vol = track.volume;

          // Trim and delay each audio track, then adjust volume
          let filter = `[${inputIndex}:a]`;
          if (trimStart > 0 || trimEnd) {
            filter += `atrim=start=${trimStart}`;
            if (trimEnd) {
              filter += `:end=${trimEnd}`;
            }
            filter += ',asetpts=PTS-STARTPTS,';
          }
          if (delay > 0) {
            filter += `adelay=${delay}|${delay},`;
          }
          filter += `volume=${vol}[a${i}]`;
          filterParts.push(filter);
          audioInputs.push(`[a${i}]`);
        });

        // Mix all audio tracks together
        if (audioInputs.length > 0) {
          filterParts.push(
            `${audioInputs.join('')}amix=inputs=${audioInputs.length}:duration=longest[aout]`
          );
          outputOptions.push('-filter_complex', filterParts.join(';'));
          outputOptions.push('-map', '0:v', '-map', '[aout]');
          outputOptions.push('-c:a aac', '-b:a 192k');
        }
      }

      ffmpegCommand = ffmpegCommand
        .outputOptions(outputOptions)
        .format('mp4')
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          emitProgress({
            phase: 'error',
            currentFrame: 0,
            totalFrames: actualTotalFrames,
            percent: 0,
            error: err.message
          });
          videoStream.destroy(err);
        })
        .on('end', () => {
          emitProgress({
            phase: 'done',
            currentFrame: actualTotalFrames,
            totalFrames: actualTotalFrames,
            percent: 100
          });
        });

      ffmpegCommand.pipe(videoStream);

      emitProgress({
        phase: 'capturing',
        currentFrame: 0,
        totalFrames: actualTotalFrames,
        percent: 0
      });

      let clientDisconnected = false;
      videoStream.on('close', () => {
        clientDisconnected = true;
      });
      videoStream.on('error', () => {
        clientDisconnected = true;
      });

      // Capture frames and pipe to FFmpeg
      for (let frameIndex = 0; frameIndex < actualTotalFrames; frameIndex++) {
        if (clientDisconnected || videoStream.destroyed || frameStream.destroyed) {
          console.log('Stopping render: client disconnected or stream destroyed');
          break;
        }

        const time = frameIndex / actualFps;
        await page.evaluate((t) => window.__DEVMOTION__?.seek(t), time);

        // Wait ~2 frames at 60fps for JS/canvas updates to settle after seek
        const FRAME_SETTLE_DELAY_MS = 32;
        await new Promise((resolve) => setTimeout(resolve, FRAME_SETTLE_DELAY_MS));

        const screenshot = await page.screenshot({
          type: 'png',
          clip: { x: 0, y: 0, width, height }
        });

        const canWrite = frameStream.write(screenshot);
        if (!canWrite) {
          await new Promise<void>((resolve, reject) => {
            const onDrain = () => {
              frameStream.removeListener('error', onError);
              frameStream.removeListener('close', onClose);
              resolve();
            };
            const onError = (err: Error) => {
              frameStream.removeListener('drain', onDrain);
              frameStream.removeListener('close', onClose);
              reject(err);
            };
            const onClose = () => {
              frameStream.removeListener('drain', onDrain);
              frameStream.removeListener('error', onError);
              resolve();
            };
            frameStream.once('drain', onDrain);
            frameStream.once('error', onError);
            frameStream.once('close', onClose);
          });
        }

        const percent = Math.round(((frameIndex + 1) / actualTotalFrames) * 95);
        emitProgress({
          phase: 'capturing',
          currentFrame: frameIndex + 1,
          totalFrames: actualTotalFrames,
          percent
        });
      }

      frameStream.end();

      await browser.close();
      browser = null;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      emitProgress({ phase: 'error', currentFrame: 0, totalFrames, percent: 0, error: msg });
      videoStream.destroy(err as Error);
    } finally {
      clearTimeout(renderTimeout);
      invalidateRenderToken(token);
      if (browser) await browser.close();
    }
  })();

  return videoStream;
}
