import { defineConfig } from 'drizzle-kit';

if (!process.env.PRIVATE_DATABASE_URL) throw new Error('PRIVATE_DATABASE_URL is not set');

export default defineConfig({
  schema: './src/lib/server/db/schema',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.PRIVATE_DATABASE_URL },
  verbose: true,
  strict: true
});
