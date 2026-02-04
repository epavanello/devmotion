import { chromium } from 'playwright';
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough, Readable } from 'stream';
import { EventEmitter } from 'events';
import { generateRenderToken, invalidateRenderToken } from './render-token';

interface RenderConfig {
  projectId: string;
  renderId: string; // Unique ID for this specific render session
  width: number;
  height: number;
  fps: number;
  duration: number;
  baseUrl: string;
}

export interface RenderProgress {
  phase: 'initializing' | 'capturing' | 'encoding' | 'done' | 'error';
  currentFrame: number;
  totalFrames: number;
  percent: number;
  error?: string;
}

// Global emitter for render progress
export const renderEmitter = new EventEmitter();

/**
 * Render a project to video using Playwright screenshots and FFmpeg.
 * Returns a Readable stream that will yield the MP4 data.
 */
export async function renderProjectToVideoStream(config: RenderConfig): Promise<Readable> {
  const { projectId, renderId, width, height, fps, duration, baseUrl } = config;
  const totalFrames = Math.ceil(fps * duration);

  const videoStream = new PassThrough();
  const token = generateRenderToken(projectId);
  const renderUrl = `${baseUrl}/render/${projectId}?token=${token}`;

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

      ffmpegCommand = ffmpeg()
        .input(frameStream)
        .inputFormat('image2pipe')
        .inputFPS(actualFps)
        .outputOptions([
          '-c:v libx264',
          '-preset ultrafast', // Ultrafast for streaming efficiency
          '-crf 18',
          '-pix_fmt yuv420p',
          `-s ${width}x${height}`,
          '-movflags +faststart+frag_keyframe+empty_moov'
        ])
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
