import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1';

import * as authSchema from './schema/auth';
import * as veoSchema from './schema/veo';

const schema = { ...authSchema, ...veoSchema };

export type Database = DrizzleD1Database<typeof schema>;

export function createDatabase(binding: D1Database) {
  return drizzle(binding, { schema });
}
