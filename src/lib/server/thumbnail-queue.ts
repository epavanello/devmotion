/**
 * In-memory queue for background thumbnail generation
 */
import { generateThumbnail } from './thumbnail-generator';
import { PUBLIC_BASE_URL } from '$env/static/public';

interface ThumbnailJob {
  projectId: string;
  projectData: {
    width: number;
    height: number;
    fps: number;
    duration: number;
  };
  addedAt: Date;
}

class ThumbnailQueue {
  private queue: ThumbnailJob[] = [];
  private processing = false;
  private maxConcurrent = 1;

  enqueue(job: ThumbnailJob) {
    this.queue.push(job);
    console.log(`[ThumbnailQueue] Enqueued job for project ${job.projectId}`);
    this.processQueue();
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) continue;

      try {
        console.log(`[ThumbnailQueue] Processing thumbnail for project ${job.projectId}`);
        const baseUrl = PUBLIC_BASE_URL;

        await generateThumbnail({
          projectId: job.projectId,
          projectData: job.projectData,
          baseUrl
        });

        console.log(`[ThumbnailQueue] Successfully generated thumbnail for ${job.projectId}`);
      } catch (err) {
        console.error(`[ThumbnailQueue] Failed to generate thumbnail for ${job.projectId}:`, err);
      }
    }

    this.processing = false;
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  isProcessing(): boolean {
    return this.processing;
  }
}

export const thumbnailQueue = new ThumbnailQueue();
