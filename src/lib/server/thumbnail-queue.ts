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
  private timers = new Map<string, NodeJS.Timeout>();
  private jobs = new Map<string, ThumbnailJob>();
  private readonly DEBOUNCE_DELAY = 120000; // 2 minutes in milliseconds

  enqueue(job: ThumbnailJob) {
    const existingTimer = this.timers.get(job.projectId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      console.log(`[ThumbnailQueue] Cancelled previous timer for project ${job.projectId}`);
    }

    this.jobs.set(job.projectId, job);

    const timer = setTimeout(() => {
      this.processJob(job.projectId);
    }, this.DEBOUNCE_DELAY);

    this.timers.set(job.projectId, timer);
    console.log(
      `[ThumbnailQueue] Scheduled thumbnail generation for project ${job.projectId} in 2 minutes`
    );
  }

  private async processJob(projectId: string) {
    const job = this.jobs.get(projectId);
    if (!job) return;

    this.timers.delete(projectId);
    this.jobs.delete(projectId);

    try {
      console.log(`[ThumbnailQueue] Processing thumbnail for project ${projectId}`);
      const baseUrl = PUBLIC_BASE_URL;

      await generateThumbnail({
        projectId: job.projectId,
        projectData: job.projectData,
        baseUrl
      });

      console.log(`[ThumbnailQueue] Successfully generated thumbnail for ${projectId}`);
    } catch (err) {
      console.error(`[ThumbnailQueue] Failed to generate thumbnail for ${projectId}:`, err);
    }
  }

  getQueueLength(): number {
    return this.jobs.size;
  }

  isProcessing(): boolean {
    return this.timers.size > 0;
  }
}

export const thumbnailQueue = new ThumbnailQueue();
