import { building } from '$app/environment';
import { initQueue, shutdownQueue } from './queue';
import { startOnboardingEmailWorker, startFollowUpEmailWorker } from './workers/onboarding-email';

// Initialize pg-boss queue and workers on server startup
if (!building) {
  initQueue()
    .then(async () => {
      await startOnboardingEmailWorker();
      await startFollowUpEmailWorker();
    })
    .catch((error) => {
      console.error('Failed to initialize queue:', error);
    });

  // Graceful shutdown on process termination
  const shutdown = async () => {
    console.log('Shutting down gracefully...');
    await shutdownQueue();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
