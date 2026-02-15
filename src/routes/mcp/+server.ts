/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * MCP Server for DevMotion Animation Tools
 *
 * This server exposes animation creation tools via the Model Context Protocol (MCP).
 * It provides a free tier where:
 * - Users use their own LLM (e.g., Claude via MCP client)
 * - Projects are stored in our database (anonymous, public by default)
 * - Video generation/preview is provided free
 *
 * Architecture:
 * - Shares mutation logic with the web app via `$lib/ai/mutations.ts`
 * - Projects are stored in PostgreSQL with nullable userId (anonymous projects)
 * - Each tool call modifies the project data and saves it back to DB
 *
 * Layer References:
 * - Use actual layer IDs (returned from create_layer tools) or layer names
 * - "layer_N" references (layer_0, layer_1) are NOT supported in MCP (stateless)
 * - Use get_project to inspect current project state and layer IDs
 */
import { z } from 'zod';
import { createMcpHandler } from '@vercel/mcp-adapter';
import { animationTools, isLayerCreationTool, getLayerTypeFromToolName } from '$lib/ai/schemas.js';
import { db } from '$lib/server/db';
import { project } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import {
  mutateCreateLayer,
  mutateAnimateLayer,
  mutateEditLayer,
  mutateRemoveLayer,
  mutateConfigureProject,
  mutateGroupLayers,
  mutateUngroupLayers,
  mutateUpdateKeyframe,
  mutateRemoveKeyframe,
  type MutationContext
} from '$lib/ai/mutations';
import { PUBLIC_BASE_URL } from '$env/static/public';
import type { ProjectData } from '$lib/schemas/animation';
import type { Entries } from 'type-fest';

// Default project template
const DEFAULT_PROJECT = {
  width: 720,
  height: 1280,
  duration: 5,
  fps: 30,
  background: '#000000',
  layers: []
};

const handler = createMcpHandler(
  (server) => {
    // Tool: create_project
    server.registerTool(
      'create_project',
      {
        description:
          'Create a new empty animation project. Returns the project ID and preview URL.',
        inputSchema: z.object({
          name: z.string().default('Untitled Project').describe('Name of the project'),
          width: z.number().default(720),
          height: z.number().default(1280)
        })
      },
      async ({ name, width, height }) => {
        const id = nanoid();

        // Create anonymous public project (userId is null for MCP-created projects)
        const data: ProjectData = {
          ...DEFAULT_PROJECT,
          fontFamily: 'Inter',
          name,
          width,
          height
        };

        await db.insert(project).values({
          id,
          name,
          isPublic: true,
          isMcp: true,
          userId: null,
          data,
          updatedAt: new Date()
        });

        const previewUrl = `${PUBLIC_BASE_URL}/p/${id}`;

        return {
          content: [
            {
              type: 'text',
              text: `Project created!\nID: ${id}\nPreview: ${previewUrl}\n\nUse the project ID in subsequent tool calls to add layers and animations.`
            }
          ]
        };
      }
    );

    // Tool: get_project
    server.registerTool(
      'get_project',
      {
        description:
          'Retrieve project information and current state. Use this to inspect layers, animations, and project settings.',
        inputSchema: z.object({
          projectId: z.string().describe('The Project ID to retrieve')
        })
      },
      async ({ projectId }) => {
        const dbProject = await db.query.project.findFirst({
          where: eq(project.id, projectId)
        });

        if (!dbProject) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Project not found: ${projectId}` }]
          };
        }

        const projectData = dbProject.data as ProjectData;
        const previewUrl = `${PUBLIC_BASE_URL}/p/${projectId}`;

        // Build a human-readable summary
        const summary = [
          `Project: ${dbProject.name}`,
          `ID: ${projectId}`,
          `Dimensions: ${projectData.width}x${projectData.height}`,
          `Duration: ${projectData.duration}s at ${projectData.fps} FPS`,
          `Background: ${projectData.background}`,
          `Layers: ${projectData.layers.length}`,
          `Preview: ${previewUrl}`,
          '',
          'Layers:'
        ];

        projectData.layers.forEach((layer, index) => {
          summary.push(
            `  ${index + 1}. ${layer.name} (${layer.type}) - ID: ${layer.id} - ${layer.keyframes.length} keyframes`
          );
        });

        return {
          content: [
            {
              type: 'text',
              text: summary.join('\n') + '\n\n' + JSON.stringify(projectData, null, 2)
            }
          ]
        };
      }
    );

    // Wrap shared animation tools
    const toolEntries = Object.entries(animationTools) as Entries<typeof animationTools>;

    for (const [name, toolDef] of toolEntries) {
      // Extract original Zod schema
      const originalSchema = toolDef.inputSchema as z.ZodObject;

      // Extend with projectId
      const extendedSchema = originalSchema.extend({
        projectId: z.string().describe('The Project ID to modify. Obtained from create_project.')
      });

      server.registerTool(
        name,
        {
          description: toolDef.description,
          inputSchema: extendedSchema
        },
        async (input) => {
          const { projectId, ...toolInput } = input as { projectId: string } & Record<
            string,
            unknown
          >;

          // Fetch project
          const dbProject = await db.query.project.findFirst({
            where: eq(project.id, projectId)
          });

          if (!dbProject) {
            return {
              isError: true,
              content: [{ type: 'text', text: `Project not found: ${projectId}` }]
            };
          }

          const projectData = dbProject.data;

          // Prepare mutation context
          // NOTE: layer_N references (e.g., "layer_0") only work within a single LLM conversation
          // For MCP (stateless), users should refer to layers by actual ID or name
          const ctx: MutationContext = {
            project: projectData
          };

          let result: any;

          // Dispatch to appropriate mutation function
          if (isLayerCreationTool(name)) {
            const type = getLayerTypeFromToolName(name);
            if (!type) {
              return {
                isError: true,
                content: [{ type: 'text', text: `Unknown layer type for tool: ${name}` }]
              };
            }

            result = mutateCreateLayer(ctx, { ...toolInput, type } as any);
          } else {
            switch (name) {
              case 'animate_layer':
                result = mutateAnimateLayer(ctx, toolInput as any);
                break;
              case 'edit_layer':
                result = mutateEditLayer(ctx, toolInput as any);
                break;
              case 'update_keyframe':
                result = mutateUpdateKeyframe(ctx, toolInput as any);
                break;
              case 'remove_keyframe':
                result = mutateRemoveKeyframe(ctx, toolInput as any);
                break;
              case 'remove_layer':
                result = mutateRemoveLayer(ctx, toolInput as any);
                break;
              case 'group_layers':
                result = mutateGroupLayers(ctx, toolInput as any);
                break;
              case 'ungroup_layers':
                result = mutateUngroupLayers(ctx, toolInput as any);
                break;
              case 'configure_project':
                result = mutateConfigureProject(ctx, toolInput as any);
                break;
              default:
                return {
                  isError: true,
                  content: [{ type: 'text', text: `Unknown tool: ${name}` }]
                };
            }
          }

          // Handle result (mutations return either direct result or wrapped in { output })
          const output = result.output || result;
          const success = output.success ?? false;

          if (!success) {
            const errorMsg = output.error || output.message || 'Operation failed';
            return {
              isError: true,
              content: [{ type: 'text', text: errorMsg }]
            };
          }

          // Save updated project back to DB
          await db
            .update(project)
            .set({
              data: projectData,
              updatedAt: new Date()
            })
            .where(eq(project.id, projectId));

          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }]
          };
        }
      );
    }
  },
  {},
  {
    maxDuration: 60,
    streamableHttpEndpoint: '/mcp',
    verboseLogs: true
  }
);

export const GET = async ({ request }) => {
  return handler(request);
};

export const POST = async ({ request }) => {
  return handler(request);
};
