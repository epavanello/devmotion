import { command, getRequestEvent, query } from '$app/server';
import { db } from '$lib/server/db';
import { project } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { withErrorHandling } from '.';
import { nanoid } from 'nanoid';
import { invalid } from '@sveltejs/kit';
import { projectDataSchema } from '$lib/schemas/animation';

export const saveProject = command(
  z.object({
    id: z.string().optional(),
    data: projectDataSchema
  }),
  withErrorHandling(async ({ id, data }) => {
    const { locals } = getRequestEvent();
    if (!locals.user) {
      invalid('Not authenticated');
    }

    const projectId = id || nanoid();

    if (id) {
      const existing = await db.query.project.findFirst({
        where: and(eq(project.id, id), eq(project.userId, locals.user.id))
      });
      if (!existing) {
        invalid('Project not found or access denied');
      }
      await db
        .update(project)
        .set({ data, name: data.name, updatedAt: new Date() })
        .where(eq(project.id, id));
    } else {
      await db.insert(project).values({
        id: projectId,
        userId: locals.user.id,
        name: data.name,
        isPublic: false,
        data
      });
    }

    return { id: projectId };
  })
);

export const getProject = query(z.object({ id: z.string() }), async ({ id }) => {
  const { locals } = getRequestEvent();
  const result = await db.query.project.findFirst({
    where: eq(project.id, id)
  });

  if (!result) {
    return { error: 'not_found' as const };
  }

  const isOwner = locals.user?.id === result.userId;

  if (!result.isPublic && !isOwner) {
    return { error: 'access_denied' as const };
  }

  return {
    project: result,
    isOwner,
    canEdit: isOwner
  };
});

export const getUserProjects = query(async () => {
  const { locals } = getRequestEvent();
  if (!locals.user) {
    return [];
  }

  return db.query.project.findMany({
    where: eq(project.userId, locals.user.id),
    orderBy: [desc(project.updatedAt)],
    columns: {
      id: true,
      name: true,
      isPublic: true,
      updatedAt: true
    }
  });
});

export const toggleVisibility = command(
  z.object({ id: z.string() }),
  withErrorHandling(async ({ id }) => {
    const { locals } = getRequestEvent();
    if (!locals.user) {
      throw new Error('Not authenticated');
    }

    const existing = await db.query.project.findFirst({
      where: and(eq(project.id, id), eq(project.userId, locals.user.id))
    });

    if (!existing) {
      throw new Error('Project not found or access denied');
    }

    await db.update(project).set({ isPublic: !existing.isPublic }).where(eq(project.id, id));

    return { isPublic: !existing.isPublic };
  })
);

export const forkProject = command(
  z.object({ id: z.string() }),
  withErrorHandling(async ({ id }) => {
    const { locals } = getRequestEvent();
    if (!locals.user) {
      throw new Error('Not authenticated');
    }

    const original = await db.query.project.findFirst({
      where: eq(project.id, id)
    });

    if (!original) {
      throw new Error('Project not found');
    }

    if (!original.isPublic && original.userId !== locals.user.id) {
      throw new Error('Cannot fork private project');
    }

    const newId = nanoid();
    const originalData = original.data;
    const newName = `${original.name} (fork)`;

    await db.insert(project).values({
      id: newId,
      userId: locals.user.id,
      name: newName,
      isPublic: false,
      data: { ...originalData, name: newName },
      forkedFromId: id
    });

    return { id: newId };
  })
);

export const deleteProject = command(
  z.object({ id: z.string() }),
  withErrorHandling(async ({ id }) => {
    const { locals } = getRequestEvent();
    if (!locals.user) {
      throw new Error('Not authenticated');
    }

    await db.delete(project).where(and(eq(project.id, id), eq(project.userId, locals.user.id)));

    return { success: true };
  })
);
