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
 * Check if a media file has an audio stream
 */
function hasAudioStream(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(src, (err, data) => {
      if (err) {
        resolve(false);
        return;
      }
      resolve(data.streams.some((s) => s.codec_type === 'audio'));
    });
  });
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
  const tag = `[render:${renderId.slice(0, 8)}]`;
  const log = (...args: unknown[]) => console.log(tag, ...args);

  const videoStream = new PassThrough();
  const token = generateRenderToken(projectId);
  const renderUrl = `${baseUrl}/render/${projectId}?token=${token}`;
  log('Starting render', { projectId, width, height, fps, duration, totalFrames });

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

      log('Launching browser...');
      browser = await chromium.launch({
        headless: process.env.NODE_ENV === 'production',
        args
      });
      log('Browser launched');

      page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
      log('Page created, navigating to', renderUrl);
      await page.goto(renderUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      log('Page loaded, waiting for __DEVMOTION__.ready...');
      await page.waitForFunction(() => window.__DEVMOTION__?.ready, { timeout: 30_000 });
      log('Page ready');

      const pageConfig = await page.evaluate(() => window.__DEVMOTION__?.getConfig());
      const actualFps = pageConfig?.fps || fps;
      const actualDuration = pageConfig?.duration || duration;
      const actualTotalFrames = Math.ceil(actualFps * actualDuration);

      // Resolve audio URLs and filter out tracks without audio streams
      const resolvedTracksAll = await Promise.all(
        audioTracks.map(async (track) => ({
          ...track,
          src: sanitizeForFFmpeg(await resolveMediaUrl(track.src))
        }))
      );
      const probeResults = await Promise.all(
        resolvedTracksAll.map((track) => hasAudioStream(track.src))
      );
      const resolvedTracks = resolvedTracksAll.filter((_, i) => {
        if (!probeResults[i]) {
          log(`Skipping track ${i} (no audio stream): ${resolvedTracksAll[i].src.slice(0, 100)}`);
        }
        return probeResults[i];
      });

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

      log('Configuring ffmpeg, audio tracks:', resolvedTracks.length);
      if (resolvedTracks.length > 0) {
        for (const [i, t] of resolvedTracks.entries()) {
          log(`  Track ${i}: enterTime=${t.enterTime} offset=${t.mediaStartTime} dur=${t.mediaDuration} vol=${t.volume} src=${t.src.slice(0, 100)}`);
        }
        const fcIdx = outputOptions.indexOf('-filter_complex');
        if (fcIdx >= 0) log('Filter complex:', outputOptions[fcIdx + 1]);
      }
      ffmpegCommand = ffmpegCommand
        .outputOptions(outputOptions)
        .format('mp4')
        .on('start', (cmd) => {
          log('FFmpeg spawned:', cmd);
        })
        .on('stderr', (line) => {
          log('FFmpeg stderr:', line);
        })
        .on('error', (err) => {
          log('FFmpeg error:', err.message);
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
          log('FFmpeg finished encoding');
          emitProgress({
            phase: 'done',
            currentFrame: actualTotalFrames,
            totalFrames: actualTotalFrames,
            percent: 100
          });
        });

      ffmpegCommand.pipe(videoStream);
      log('FFmpeg pipeline started');
      emitProgress({
        phase: 'capturing',
        currentFrame: 0,
        totalFrames: actualTotalFrames,
        percent: 0
      });

      let isAborting = false;

      const cleanup = async (reason: string) => {
        log(`cleanup() called, reason: ${reason}, isAborting: ${isAborting}`);
        if (isAborting) {
          log('cleanup() skipped - already aborting');
          return;
        }
        isAborting = true;

        if (ffmpegCommand) {
          try {
            log('Killing ffmpeg...');
            ffmpegCommand.kill('SIGKILL');
          } catch {
            // ignore
          }
        }
        if (!frameStream.destroyed) {
          log('Destroying frameStream');
          frameStream.destroy();
        }

        // Close page first, then browser - avoid protocol errors
        try {
          if (page && !page.isClosed()) {
            log('Closing page...');
            await page.close();
            page = null;
            log('Page closed');
          } else {
            log('Page already closed or null');
          }
        } catch (err) {
          log('Error closing page:', err);
        }

        try {
          if (browser) {
            log('Closing browser...');
            await browser.close();
            browser = null;
            log('Browser closed');
          } else {
            log('Browser already null');
          }
        } catch (err) {
          log('Error closing browser:', err);
        }
      };

      const onStreamClose = () => cleanup('videoStream:close');
      const onStreamError = (err: Error) => {
        log('videoStream error event:', err);
        cleanup('videoStream:error');
      };
      videoStream.once('close', onStreamClose);
      videoStream.once('error', onStreamError);

      // Capture frames
      log(`Starting frame capture: ${actualTotalFrames} frames at ${actualFps}fps`);
      for (let frameIndex = 0; frameIndex < actualTotalFrames; frameIndex++) {
        if (videoStream.destroyed || frameStream.destroyed || isAborting) {
          await cleanup('frame-loop:abort-check');
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

      log('All frames captured, ending frameStream');
      frameStream.end();

      // Remove cleanup listeners to prevent double cleanup from videoStream events
      log('Removing videoStream cleanup listeners');
      videoStream.off('close', onStreamClose);
      videoStream.off('error', onStreamError);

      // Wait for ffmpeg to finish writing before closing browser resources.
      // Without this, the videoStream 'close' event can race with the code below,
      // causing both cleanup() and this block to close the browser simultaneously.
      log('Waiting for ffmpeg/videoStream to finish...', {
        destroyed: videoStream.destroyed,
        writableFinished: videoStream.writableFinished
      });
      await new Promise<void>((resolve) => {
        if (videoStream.destroyed || videoStream.writableFinished) {
          log('videoStream already done, resolving immediately');
          resolve();
        } else {
          videoStream.once('finish', () => {
            log('videoStream finish event');
            resolve();
          });
          videoStream.once('close', () => {
            log('videoStream close event (during wait)');
            resolve();
          });
          videoStream.once('error', (err) => {
            log('videoStream error event (during wait):', err);
            resolve();
          });
        }
      });

      // Now safe to close browser resources - ffmpeg is done
      log('FFmpeg done, proceeding to cleanup');
      await cleanup('render-complete');
    } catch (err) {
      log('Caught error in render:', err);
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
      log('Finally block, browser still open:', !!browser);

      // Final cleanup - only close if not already closed
      try {
        if (browser) {
          log('Finally: closing browser');
          await browser.close();
        }
      } catch {
        // Already closed or disposed
      }
      log('Render fully done');
    }
  })();

  return videoStream;
}
