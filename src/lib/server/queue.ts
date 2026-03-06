import { PgBoss } from 'pg-boss';
import { PRIVATE_DATABASE_URL } from '$env/static/private';

let boss: PgBoss | null = null;

/**
 * Initialize pg-boss queue system
 * Should be called once during server startup
 */
export async function initQueue() {
  if (boss) {
    return boss;
  }

  boss = new PgBoss({
    connectionString: PRIVATE_DATABASE_URL,
    schema: 'pgboss',
    // Automatically create schema and tables
    migrate: true,
    // Monitor and maintain the queue
    monitorIntervalSeconds: 60
  });

  boss.on('error', (error) => {
    console.error('pg-boss error:', error);
  });

  await boss.start();
  console.log('✓ pg-boss queue initialized');

  return boss;
}

/**
 * Get the pg-boss instance
 * Throws if queue hasn't been initialized
 */
export function getQueue(): PgBoss {
  if (!boss) {
    throw new Error('Queue not initialized. Call initQueue() first.');
  }
  return boss;
}

/**
 * Gracefully shutdown the queue
 */
export async function shutdownQueue() {
  if (boss) {
    await boss.stop();
    boss = null;
    console.log('✓ pg-boss queue stopped');
  }
}
