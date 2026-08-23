import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: ['./src/shared/lib/db/schema/auth.ts', './src/shared/lib/db/schema/veo.ts'],
  out: './migrations',
});
