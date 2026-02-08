import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
  integer,
  type AnyPgColumn
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './auth';
import { type ProjectData } from '$lib/schemas/animation';

export const project = pgTable(
  'project',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    isPublic: boolean('is_public').default(false).notNull(),
    isMcp: boolean('is_mcp').default(false).notNull(),
    views: integer('views').default(0).notNull(),
    data: jsonb('data').notNull().$type<ProjectData>(),
    thumbnailUrl: text('thumbnail_url'),
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
    index('project_is_public_idx').on(table.isPublic),
    index('project_views_idx').on(table.views)
  ]
);

export const projectRelations = relations(project, ({ one, many }) => ({
  user: one(user, {
    fields: [project.userId],
    references: [user.id]
  }),
  assets: many(asset)
}));

/**
 * Asset table - stores uploaded files (images, videos, audio) linked to projects
 */
export const asset = pgTable(
  'asset',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => project.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    storageKey: text('storage_key').notNull(),
    url: text('url').notNull(),
    originalName: text('original_name').notNull(),
    mimeType: text('mime_type').notNull(),
    mediaType: text('media_type').notNull(), // 'image', 'video', or 'audio'
    size: integer('size').notNull(), // File size in bytes
    createdAt: timestamp('created_at').defaultNow().notNull()
  },
  (table) => [
    index('asset_project_id_idx').on(table.projectId),
    index('asset_user_id_idx').on(table.userId)
  ]
);

export const assetRelations = relations(asset, ({ one }) => ({
  project: one(project, {
    fields: [asset.projectId],
    references: [project.id]
  }),
  user: one(user, {
    fields: [asset.userId],
    references: [user.id]
  })
}));
