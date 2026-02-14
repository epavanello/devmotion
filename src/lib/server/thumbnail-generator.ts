/**
 * Generate low-resolution GIF thumbnails for video previews
 * Uses Playwright for frame capture and FFmpeg for GIF encoding
 */
import { chromium } from 'playwright';
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from 'stream';
import { generateRenderToken, invalidateRenderToken } from './render-token';
import { uploadFile } from './storage';
import { db } from './db';
import { project } from './db/schema';
import { eq } from 'drizzle-orm';

interface ThumbnailConfig {
  projectId: string;
  projectData: {
    width: number;
    height: number;
    fps: number;
    duration: number;
  };
  baseUrl: string;
}

const THUMBNAIL_WIDTH = 320;
const THUMBNAIL_FPS = 10;
const MAX_DURATION = 5;

/**
 * Generate a low-res GIF thumbnail for a project
 * Samples at 1 FPS with fixed thumbnail resolution
 */
export async function generateThumbnail(config: ThumbnailConfig): Promise<string> {
  const { projectId, projectData, baseUrl } = config;

  const aspectRatio = projectData.width / projectData.height;
  const thumbnailHeight = Math.round(THUMBNAIL_WIDTH / aspectRatio);

  const duration = Math.min(projectData.duration, MAX_DURATION);
  const totalFrames = Math.ceil(THUMBNAIL_FPS * duration);

  const token = generateRenderToken(projectId);
  const renderUrl = `${baseUrl}/render/${projectId}?token=${token}`;

  let browser = null;

  try {
    const launchArgs = ['--disable-gpu', '--disable-dev-shm-usage', '--disable-setuid-sandbox'];

    if (process.env.PLAYWRIGHT_ALLOW_INSECURE_FLAGS === 'true') {
      launchArgs.push('--no-sandbox', '--disable-web-security');
    }

    browser = await chromium.launch({
      headless: true,
      args: launchArgs
    });

    const page = await browser.newPage({
      viewport: { width: projectData.width, height: projectData.height },
      deviceScaleFactor: 1
    });

    await page.goto(renderUrl, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__DEVMOTION__?.ready, { timeout: 60_000 });

    const frameStream = new PassThrough();
    const gifBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];

      ffmpeg()
        .input(frameStream)
        .inputFormat('image2pipe')
        .inputFPS(THUMBNAIL_FPS)
        .outputOptions([
          '-vf',
          `scale=${THUMBNAIL_WIDTH}:${thumbnailHeight}:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3`,
          '-loop',
          '0'
        ])
        .format('gif')
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(err);
        })
        .on('end', () => {
          resolve(Buffer.concat(chunks));
        })
        .pipe()
        .on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

      (async () => {
        for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
          const time = frameIndex / THUMBNAIL_FPS;
          await page.evaluate((t) => window.__DEVMOTION__?.seek(t), time);
          await new Promise((resolve) => setTimeout(resolve, 100));

          const screenshot = await page.screenshot({
            type: 'png',
            clip: { x: 0, y: 0, width: projectData.width, height: projectData.height }
          });

          frameStream.write(screenshot);
        }
        frameStream.end();
      })().catch(reject);
    });

    await browser.close();
    invalidateRenderToken(token);

    const result = await uploadFile(
      gifBuffer,
      `${projectId}-thumbnail.gif`,
      'image/gif',
      'image',
      projectId
    );

    await db.update(project).set({ thumbnailUrl: result.url }).where(eq(project.id, projectId));

    return result.url;
  } catch (err) {
    if (browser) await browser.close();
    invalidateRenderToken(token);
    console.error(`Failed to generate thumbnail for project ${projectId}:`, err);
    throw err;
  }
}
