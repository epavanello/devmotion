import { chromium, type Browser, type Page } from 'playwright';
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough, Readable } from 'stream';
import { EventEmitter } from 'events';
import { generateRenderToken, invalidateRenderToken } from './render-token';
import { getSignedFileUrl } from './storage';
import { sanitizeForFFmpeg } from './utils/filename-sanitizer';
import type { ProjectData } from '$lib/schemas/animation';

interface RenderConfig {
  projectId: string;
  renderId: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  baseUrl: string;
  projectData?: ProjectData;
}

export interface RenderProgress {
  phase: 'initializing' | 'capturing' | 'encoding' | 'done' | 'error';
  currentFrame: number;
  totalFrames: number;
  percent: number;
  error?: string;
}

export const renderEmitter = new EventEmitter();

/**
 * Convert local upload URLs to presigned S3 URLs
 */
async function resolveMediaUrl(url: string): Promise<string> {
  if (url.startsWith('/api/upload/')) {
    const key = decodeURIComponent(url.replace('/api/upload/', ''));
    return await getSignedFileUrl(key, 7200);
  }
  return url;
}

/**
 * Extract audio tracks from project layers
 */
function getAudioTracks(projectData: ProjectData) {
  const tracks = [];

  for (const layer of projectData.layers) {
    if ((layer.type === 'video' || layer.type === 'audio') && layer.props.src) {
      if ((layer.props.muted as boolean) ?? false) continue;

      const enterTime = layer.enterTime ?? 0;
      const exitTime = layer.exitTime ?? projectData.duration;
      const contentOffset = layer.contentOffset ?? 0;
      const layerDuration = exitTime - enterTime;
      const contentDuration = layer.contentDuration;

      let mediaDuration = layerDuration;
      if (contentDuration && contentDuration > 0) {
        mediaDuration = Math.min(layerDuration, contentDuration - contentOffset);
      }

      tracks.push({
        src: layer.props.src as string,
        enterTime,
        mediaStartTime: contentOffset,
        mediaDuration,
        volume: (layer.props.volume as number) ?? 1
      });
    }
  }

  return tracks;
}

export async function renderProjectToVideoStream(config: RenderConfig): Promise<Readable> {
  const { projectId, renderId, width, height, fps, duration, baseUrl, projectData } = config;
  const totalFrames = Math.ceil(fps * duration);

  const videoStream = new PassThrough();
  const token = generateRenderToken(projectId);
  const renderUrl = `${baseUrl}/render/${projectId}?token=${token}`;

  const audioTracks = projectData ? getAudioTracks(projectData) : [];

  const emitProgress = (progress: RenderProgress) => {
    renderEmitter.emit(`progress:${renderId}`, progress);
  };

  (async () => {
    let browser: Browser | null = null;
    let page: Page | null = null;
    let ffmpegCommand: ffmpeg.FfmpegCommand | null = null;

    const renderTimeout = setTimeout(
      () => {
        emitProgress({
          phase: 'error',
          currentFrame: 0,
          totalFrames,
          percent: 0,
          error: 'Render timeout exceeded'
        });
        videoStream.destroy(new Error('Render timeout'));
      },
      10 * 60 * 1000
    );

    try {
      emitProgress({ phase: 'initializing', currentFrame: 0, totalFrames, percent: 0 });

      const args = ['--disable-gpu', '--disable-dev-shm-usage', '--disable-setuid-sandbox'];
      if (process.env.PLAYWRIGHT_ALLOW_INSECURE_FLAGS === 'true') {
        args.push('--no-sandbox', '--disable-web-security');
      }

      browser = await chromium.launch({
        headless: true,
        args
      });

      page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
      await page.goto(renderUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForFunction(() => window.__DEVMOTION__?.ready, { timeout: 30_000 });

      const pageConfig = await page.evaluate(() => window.__DEVMOTION__?.getConfig());
      const actualFps = pageConfig?.fps || fps;
      const actualDuration = pageConfig?.duration || duration;
      const actualTotalFrames = Math.ceil(actualFps * actualDuration);

      // Resolve audio URLs
      const resolvedTracks = await Promise.all(
        audioTracks.map(async (track) => ({
          ...track,
          src: sanitizeForFFmpeg(await resolveMediaUrl(track.src))
        }))
      );

      const frameStream = new PassThrough();
      ffmpegCommand = ffmpeg().input(frameStream).inputFormat('image2pipe').inputFPS(actualFps);

      const outputOptions = [
        '-c:v libx264',
        '-preset ultrafast',
        '-crf 18',
        '-pix_fmt yuv420p',
        `-s ${width}x${height}`,
        '-movflags +faststart+frag_keyframe+empty_moov'
      ];

      // Add audio processing for MP4 files
      if (resolvedTracks.length > 0) {
        for (const track of resolvedTracks) {
          ffmpegCommand = ffmpegCommand.input(track.src);
        }

        const filterParts: string[] = [];
        const audioInputs: string[] = [];

        resolvedTracks.forEach((track, i) => {
          const inputIndex = i + 1;
          const delayMs = Math.round(track.enterTime * 1000);

          let filter = `[${inputIndex}:a]`;

          if (track.mediaDuration) {
            filter += `atrim=start=${track.mediaStartTime}:duration=${track.mediaDuration},`;
          }
          filter += 'asetpts=PTS-STARTPTS,';
          if (delayMs > 0) filter += `adelay=${delayMs}|${delayMs},`;
          filter += `volume=${track.volume}[a${i}]`;

          filterParts.push(filter);
          audioInputs.push(`[a${i}]`);
        });

        const finalFilter = `${audioInputs.join('')}amix=inputs=${audioInputs.length}:duration=longest,atrim=duration=${actualDuration}[aout]`;
        filterParts.push(finalFilter);

        outputOptions.push('-filter_complex', filterParts.join(';'));
        outputOptions.push('-map', '0:v', '-map', '[aout]');
        outputOptions.push('-c:a', 'aac', '-b:a', '192k');
      }

      ffmpegCommand = ffmpegCommand
        .outputOptions(outputOptions)
        .format('mp4')
        .on('error', (err) => {
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

      let isAborting = false;

      const cleanup = async () => {
        if (isAborting) return;
        isAborting = true;

        if (ffmpegCommand) {
          try {
            ffmpegCommand.kill('SIGKILL');
          } catch {
            // ignore
          }
        }
        if (!frameStream.destroyed) frameStream.destroy();
        if (page && !page.isClosed()) await page.close();
        if (browser) {
          await browser.close();
          browser = null;
        }
      };

      videoStream.on('close', cleanup);
      videoStream.on('error', cleanup);

      // Capture frames
      for (let frameIndex = 0; frameIndex < actualTotalFrames; frameIndex++) {
        if (videoStream.destroyed || frameStream.destroyed || isAborting) {
          await cleanup();
          return;
        }

        const time = frameIndex / actualFps;
        await page.evaluate((t) => window.__DEVMOTION__?.seekAndWait?.(t), time);

        const screenshot = await page.screenshot({
          type: 'png',
          clip: { x: 0, y: 0, width, height }
        });

        if (!frameStream.write(screenshot)) {
          await new Promise<void>((resolve) => {
            frameStream.once('drain', resolve);
            frameStream.once('close', resolve);
          });
        }

        emitProgress({
          phase: 'capturing',
          currentFrame: frameIndex + 1,
          totalFrames: actualTotalFrames,
          percent: Math.round(((frameIndex + 1) / actualTotalFrames) * 95)
        });
      }

      frameStream.end();
      if (page) {
        await page.close();
        page = null;
      }
      if (browser) {
        await browser.close();
        browser = null;
      }
    } catch (err) {
      emitProgress({
        phase: 'error',
        currentFrame: 0,
        totalFrames,
        percent: 0,
        error: err instanceof Error ? err.message : String(err)
      });
      videoStream.destroy(err instanceof Error ? err : new Error(String(err)));
    } finally {
      clearTimeout(renderTimeout);
      invalidateRenderToken(token);
      if (browser) await browser.close();
    }
  })();

  return videoStream;
}
