import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { PRIVATE_DATABASE_URL } from '$env/static/private';

if (!PRIVATE_DATABASE_URL) {
  throw new Error('PRIVATE_DATABASE_URL is not set');
}

const client = postgres(PRIVATE_DATABASE_URL);

export const db = drizzle(client, { schema });
