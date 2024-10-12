import type { Config } from 'drizzle-kit';
import { config } from './src/database/client';

export default {
  dialect: 'sqlite',
  schema: './src/database/schema/*',
  out: './drizzle',
  driver: 'turso',
  dbCredentials: config,
} satisfies Config;
