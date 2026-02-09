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

interface AudioTrackInfo {
  src: string;
  enterTime: number;
  mediaStartTime: number;
  mediaEndTime: number;
  volume: number;
}

/**
 * Convert a URL to a format that FFmpeg can use.
 * If the URL is a local proxy endpoint (/api/upload/...), convert it to a presigned S3 URL.
 */
async function resolveMediaUrl(url: string): Promise<string> {
  // If it's a local API proxy URL, extract the key and get a presigned URL
  if (url.startsWith('/api/upload/')) {
    const encodedKey = url.replace('/api/upload/', '');
    const key = decodeURIComponent(encodedKey);
    console.log('Converting proxy URL to presigned URL:', { url, key });
    return await getSignedFileUrl(key, 7200); // 2 hours expiry for long renders
  }
  // Otherwise, return the URL as-is (it's already a public URL)
  return url;
}

/**
 * Extract audio tracks from project data (video and audio layers)
 */
function extractAudioTracks(projectData: ProjectData): AudioTrackInfo[] {
  const tracks: AudioTrackInfo[] = [];

  for (const layer of projectData.layers) {
    if ((layer.type === 'video' || layer.type === 'audio') && layer.props.src) {
      if ((layer.props.muted as boolean) ?? false) continue;

      const enterTime = layer.enterTime ?? 0;
      const exitTime = layer.exitTime ?? projectData.duration;
      const contentOffset = layer.contentOffset ?? 0;
      const layerDuration = exitTime - enterTime;

      tracks.push({
        src: layer.props.src as string,
        enterTime,
        mediaStartTime: contentOffset,
        mediaEndTime: contentOffset + layerDuration,
        volume: (layer.props.volume as number) ?? 1
      });
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
    let browser: Browser | null = null;
    let page: Page | null = null;
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
        headless: process.env.NODE_ENV === 'production',
        args: launchArgs
      });

      page = await browser.newPage({
        viewport: { width, height },
        deviceScaleFactor: 1
      });

      await page.goto(renderUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForFunction(() => window.__DEVMOTION__?.ready, { timeout: 30_000 });

      const pageConfig = await page.evaluate(() => window.__DEVMOTION__?.getConfig());
      const actualFps = pageConfig?.fps || fps;
      const actualDuration = pageConfig?.duration || duration;
      const actualTotalFrames = Math.ceil(actualFps * actualDuration);

      // Resolve audio track URLs (convert proxy URLs to presigned URLs)
      // Also sanitize URLs to ensure FFmpeg compatibility (remove emojis, etc.)
      const resolvedAudioTracks = await Promise.all(
        audioTracks.map(async (track) => {
          const resolvedUrl = await resolveMediaUrl(track.src);
          const sanitizedUrl = sanitizeForFFmpeg(resolvedUrl);
          return {
            ...track,
            src: sanitizedUrl
          };
        })
      );

      // Initialize FFmpeg
      const frameStream = new PassThrough();

      ffmpegCommand = ffmpeg().input(frameStream).inputFormat('image2pipe').inputFPS(actualFps);

      // Add audio tracks as additional inputs (no input-level seeking)
      for (const track of resolvedAudioTracks) {
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
      if (resolvedAudioTracks.length > 0) {
        const filterParts: string[] = [];
        const audioInputs: string[] = [];

        resolvedAudioTracks.forEach((track, i) => {
          const inputIndex = i + 1; // 0 is the video frame stream
          const delay = Math.round(track.enterTime * 1000); // ms

          // atrim extracts the correct portion, asetpts=N/SR rebuilds PTS from scratch
          let filter = `[${inputIndex}:a]`;
          filter += `atrim=start=${track.mediaStartTime}:end=${track.mediaEndTime},`;
          filter += 'asetpts=N/SR,';

          if (delay > 0) {
            filter += `adelay=${delay}|${delay},`;
          }

          filter += `volume=${track.volume}[a${i}]`;

          filterParts.push(filter);
          audioInputs.push(`[a${i}]`);
        });

        // Mix all audio tracks together and trim to video duration
        if (audioInputs.length > 0) {
          filterParts.push(
            `${audioInputs.join('')}amix=inputs=${audioInputs.length}:duration=longest,atrim=duration=${actualDuration}[aout]`
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
      let isAborting = false;

      const cleanup = async () => {
        if (isAborting) return;
        isAborting = true;

        console.log('Cleaning up render resources');

        // Kill FFmpeg first
        if (ffmpegCommand) {
          try {
            ffmpegCommand.kill('SIGKILL');
          } catch (err) {
            console.error('Error killing FFmpeg:', err);
          }
        }

        // Close frame stream
        if (!frameStream.destroyed) {
          frameStream.destroy();
        }

        // Close page
        if (page && !page.isClosed()) {
          try {
            await page.close();
          } catch (err) {
            console.error('Error closing page:', err);
          }
        }

        // Close browser
        if (browser) {
          try {
            await browser.close();
            browser = null;
          } catch (err) {
            console.error('Error closing browser:', err);
          }
        }
      };

      videoStream.on('close', () => {
        clientDisconnected = true;
        cleanup();
      });
      videoStream.on('error', () => {
        clientDisconnected = true;
        cleanup();
      });

      // Capture frames and pipe to FFmpeg
      for (let frameIndex = 0; frameIndex < actualTotalFrames; frameIndex++) {
        if (clientDisconnected || videoStream.destroyed || frameStream.destroyed || isAborting) {
          console.log('Stopping render: client disconnected or stream destroyed');
          await cleanup();
          return;
        }

        const time = frameIndex / actualFps;
        await page.evaluate((t: number) => window.__DEVMOTION__?.seek(t), time);

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

      if (page && !page.isClosed()) {
        await page.close();
        page = null;
      }

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
