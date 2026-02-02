import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
  type AnyPgColumn
} from 'drizzle-orm/pg-core';
import { user } from './auth';
import { type ProjectData } from '$lib/schemas/animation';

export const project = pgTable(
  'project',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    isPublic: boolean('is_public').default(false).notNull(),
    data: jsonb('data').notNull().$type<ProjectData>(),
    forkedFromId: text('forked_from_id').references((): AnyPgColumn => project.id, {
      onDelete: 'set null'
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull()
  },
  (table) => [
    index('project_user_id_idx').on(table.userId),
    index('project_is_public_idx').on(table.isPublic)
  ]
);
