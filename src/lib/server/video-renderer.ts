import { chromium } from 'playwright';
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from 'stream';
import { generateRenderToken, invalidateRenderToken } from './render-token';

interface RenderConfig {
  projectId: string;
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

type ProgressCallback = (progress: RenderProgress) => void;

/**
 * Render a project to video using Playwright screenshots and FFmpeg
 * Calls onProgress with updates and returns the final video buffer
 */
export async function renderProjectToVideo(
  config: RenderConfig,
  onProgress?: ProgressCallback
): Promise<Buffer> {
  const { projectId, width, height, fps, duration, baseUrl } = config;
  const totalFrames = Math.ceil(fps * duration);

  // Generate render token
  const token = generateRenderToken(projectId);
  const renderUrl = `${baseUrl}/render/${projectId}?token=${token}`;

  let browser = null;
  let page = null;

  try {
    onProgress?.({
      phase: 'initializing',
      currentFrame: 0,
      totalFrames,
      percent: 0
    });

    // Launch browser
    browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1
    });

    // Navigate and wait for ready
    await page.goto(renderUrl, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__DEVMOTION__?.ready, { timeout: 30000 });
    await page.evaluate(() => window.__DEVMOTION__?.ready);

    // Get actual config from page
    const pageConfig = await page.evaluate(() => window.__DEVMOTION__?.getConfig());
    const actualFps = pageConfig?.fps || fps;
    const actualDuration = pageConfig?.duration || duration;
    const actualTotalFrames = Math.ceil(actualFps * actualDuration);

    onProgress?.({
      phase: 'capturing',
      currentFrame: 0,
      totalFrames: actualTotalFrames,
      percent: 0
    });

    // Capture frames
    const frames: Buffer[] = [];

    for (let frameIndex = 0; frameIndex < actualTotalFrames; frameIndex++) {
      if (page.isClosed()) {
        throw new Error('Page was closed during rendering');
      }

      const time = frameIndex / actualFps;

      // Seek to frame time
      await page.evaluate((t) => window.__DEVMOTION__?.seek(t), time);

      // Wait for render
      await new Promise((resolve) => setTimeout(resolve, 16));

      // Take screenshot
      const screenshot = await page.screenshot({
        type: 'png',
        clip: { x: 0, y: 0, width, height }
      });

      frames.push(screenshot);

      // Report progress (capturing is 0-80%)
      const percent = Math.round(((frameIndex + 1) / actualTotalFrames) * 80);
      onProgress?.({
        phase: 'capturing',
        currentFrame: frameIndex + 1,
        totalFrames: actualTotalFrames,
        percent
      });
    }

    // Close browser before encoding
    await page.close();
    page = null;
    await browser.close();
    browser = null;
    invalidateRenderToken(token);

    onProgress?.({
      phase: 'encoding',
      currentFrame: actualTotalFrames,
      totalFrames: actualTotalFrames,
      percent: 85
    });

    // Encode frames to video
    const videoBuffer = await encodeFramesToVideo(frames, actualFps, width, height);

    onProgress?.({
      phase: 'done',
      currentFrame: actualTotalFrames,
      totalFrames: actualTotalFrames,
      percent: 100
    });

    return videoBuffer;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    onProgress?.({
      phase: 'error',
      currentFrame: 0,
      totalFrames,
      percent: 0,
      error: errorMessage
    });
    throw err;
  } finally {
    invalidateRenderToken(token);
    try {
      if (page && !page.isClosed()) await page.close();
    } catch { /* ignore */ }
    try {
      if (browser?.isConnected()) await browser.close();
    } catch { /* ignore */ }
  }
}

/**
 * Encode frames to MP4 video using FFmpeg
 */
async function encodeFramesToVideo(
  frames: Buffer[],
  fps: number,
  width: number,
  height: number
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const frameStream = new PassThrough();
    const outputChunks: Buffer[] = [];

    const ffmpegCommand = ffmpeg()
      .input(frameStream)
      .inputFormat('image2pipe')
      .inputFPS(fps)
      .outputOptions([
        '-c:v libx264',
        '-preset fast',
        '-crf 18',
        '-pix_fmt yuv420p',
        `-s ${width}x${height}`,
        '-movflags +faststart+frag_keyframe+empty_moov'
      ])
      .format('mp4')
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        reject(err);
      });

    const outputStream = ffmpegCommand.pipe();
    outputStream.on('data', (chunk: Buffer) => {
      outputChunks.push(chunk);
    });
    outputStream.on('end', () => {
      resolve(Buffer.concat(outputChunks));
    });
    outputStream.on('error', reject);

    // Write all frames
    for (const frame of frames) {
      frameStream.write(frame);
    }
    frameStream.end();
  });
}
