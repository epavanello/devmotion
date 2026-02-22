/**
 * AI Chat API Routes
 * Progressive tool-calling system for animation generation
 */
import { convertToModelMessages, ToolLoopAgent, type ModelMessage, type UIMessage } from 'ai';
import { error, isHttpError } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { z } from 'zod';
import { ProjectSchema } from '$lib/schemas/animation';
import { animationTools } from '$lib/ai/schemas';
import { buildSystemPrompt } from '$lib/ai/system-prompt';
import { getModel } from '$lib/ai/models';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { RequestHandler } from './$types';
import { canUserAccessAI, logAIUsage } from '$lib/server/services/ai-access';

/**
 * Request schema for AI generation
 */
const GenerateRequestSchema = z.object({
  project: ProjectSchema,
  modelId: z.string().describe('Model ID to use for generation'),
  messages: z.array(z.custom<UIMessage>())
});

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

/**
 * Maximum allowed size for image attachments (200KB)
 * Images should be heavily compressed client-side to ~100KB
 */
const MAX_IMAGE_SIZE = 200 * 1024;

/**
 * Create OpenRouter-compatible client
 */
function getOpenRouterClient(userId: string, projectId?: string) {
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }
  return createOpenRouter({
    apiKey,
    ...(env.HELINE_AUTH
      ? {
          baseURL: 'https://openrouter.helicone.ai/api/v1',
          headers: {
            'Helicone-Auth': `Bearer ${env.HELINE_AUTH}`,
            'Helicone-User-Id': userId,
            'Helicone-Property-Project': projectId ?? ''
          }
        }
      : {})
  });
}

/**
 * Log AI request and response to filesystem for debugging
 */
function logAIInteraction(data: {
  timestamp: string;
  modelId: string;
  modelName: string;
  systemPromptLength: number;
  userMessages: UIMessage[];
  toolCalls?: unknown[];
  responseMessages?: unknown[];
  requestData?: unknown;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
}) {
  try {
    const logsDir = join(process.cwd(), 'logs', 'ai-chat');

    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
    }

    const filename = `${data.timestamp.replace(/[:.]/g, '-')}.json`;
    const filepath = join(logsDir, filename);

    const logData = {
      timestamp: data.timestamp,
      model: {
        id: data.modelId,
        name: data.modelName
      },
      systemPrompt: {
        length: data.systemPromptLength
      },
      messages: data.userMessages.map((msg, idx) => {
        const content = JSON.stringify(msg);
        return {
          index: idx,
          role: msg.role,
          contentPreview: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
          fullMessage: msg
        };
      }),
      toolCalls: data.toolCalls?.length
        ? {
            count: data.toolCalls.length,
            calls: data.toolCalls
          }
        : undefined,
      response: data.responseMessages?.length
        ? {
            messageCount: data.responseMessages.length,
            messages: data.responseMessages
          }
        : undefined,
      usage: data.usage
    };

    writeFileSync(filepath, JSON.stringify(logData, null, 2), 'utf-8');

    console.log(`\n${'='.repeat(80)}`);
    console.log(`[AI Chat] ${data.timestamp}`);
    console.log(`${'='.repeat(80)}`);
    console.log(`Model: ${data.modelName} (${data.modelId})`);
    console.log(`System Prompt: ${data.systemPromptLength} chars`);
    console.log(`User Messages: ${data.userMessages.length}`);
    if (data.toolCalls?.length) {
      console.log(`Tool Calls: ${data.toolCalls.length}`);
    }
    if (data.usage) {
      console.log(
        `Tokens: ${data.usage.totalTokens || 'N/A'} (input: ${data.usage.inputTokens || 'N/A'}, output: ${data.usage.outputTokens || 'N/A'})`
      );
    }
    console.log(`Log file: ${filepath}`);
    console.log(`${'='.repeat(80)}\n`);
  } catch (err) {
    console.error('[AI] Failed to log interaction:', err);
  }
}

/**
 * Validate image sizes in messages
 */
function validateImageSizes(messages: UIMessage[]): void {
  for (const message of messages) {
    if (!message.parts) continue;

    for (const part of message.parts) {
      // Check for image data in the part
      if ('image' in part && typeof part.image === 'string') {
        // Extract base64 data and calculate size
        const base64Data = part.image.split(',')[1];
        if (base64Data) {
          const sizeInBytes = Math.floor((base64Data.length * 3) / 4);
          if (sizeInBytes > MAX_IMAGE_SIZE) {
            error(
              413,
              `Image size (${Math.round(sizeInBytes / 1024)}KB) exceeds maximum allowed size (${MAX_IMAGE_SIZE / 1024}KB)`
            );
          }
        }
      }
    }
  }
}

/**
 * Filter images from messages except the most recent user message with an image.
 * This keeps context lightweight while preserving the current image being discussed.
 */
function filterImagesFromOldMessages(messages: UIMessage[]): UIMessage[] {
  // Find the index of the last user message with an image
  let lastImageMessageIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user' && messages[i].parts?.some((p) => p.type === 'file')) {
      lastImageMessageIndex = i;
      break;
    }
  }

  // Filter images from all messages except the most recent one
  return messages.map((msg, idx) => {
    if (msg.role !== 'user' || idx === lastImageMessageIndex) {
      return msg;
    }

    // Remove images from this message and add note
    const hasImage = msg.parts?.some((p) => p.type === 'file');
    if (!hasImage) return msg;

    return {
      ...msg,
      parts: msg.parts?.map((part) =>
        part.type === 'file'
          ? { type: 'text', text: '(image removed to reduce context size)' }
          : part
      )
    };
  });
}

/**
 * POST /api/chat - Progressive animation generation with tool calls
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    if (!locals.user) {
      error(401, 'Authentication required');
    }

    // Check if user has AI access enabled
    const accessCheck = await canUserAccessAI(locals.user.id);
    if (!accessCheck.allowed) {
      error(403, accessCheck.reason || 'AI access not enabled');
    }

    const body = await request.json();
    const { project, modelId, messages } = GenerateRequestSchema.parse(body);

    // Validate image sizes
    validateImageSizes(messages);

    // Filter old images to keep context lightweight
    const filteredMessages = filterImagesFromOldMessages(messages);

    const openrouter = getOpenRouterClient(locals.user.email, project.id);
    // Static system prompt — no project state here so OpenRouter can cache it
    // across requests (automatic caching for Moonshot AI, OpenAI-compatible models).
    const systemPrompt = buildSystemPrompt(project);

    const model = getModel(modelId);

    console.log(`[AI] Using model: ${model.name} (${model.id})`);
    console.log(`[AI] System prompt length: ${systemPrompt.length} chars`);

    const agent = new ToolLoopAgent({
      model: openrouter(model.id, {
        reasoning: {
          effort: model.disableThinking ? 'none' : 'xhigh'
        }
      }),
      instructions: {
        role: 'system',
        content: systemPrompt,
        providerOptions: {
          openrouter: {
            cacheControl: {
              type: 'ephemeral'
            },
            sort: 'price'
          }
        }
      },
      tools: animationTools,
      async onFinish(event) {
        logAIInteraction({
          timestamp: new Date().toISOString(),
          modelId: model.id,
          modelName: model.name,
          systemPromptLength: systemPrompt.length,
          userMessages: messages,
          toolCalls: event.toolCalls,
          responseMessages: event.response.messages,
          requestData: event.request,
          usage: event.usage
        });

        // Track usage in database
        if (event.usage && locals.user) {
          await logAIUsage({
            userId: locals.user.id,
            modelId: model.id,
            promptTokens: event.usage.inputTokens || 0,
            completionTokens: event.usage.outputTokens || 0,
            metadata: {
              projectName: project.name,
              messageCount: messages.length,
              toolCallCount: event.toolCalls?.length || 0
            }
          });
        }
      }
    });

    function enableCacheControl(messages: ModelMessage[]) {
      return messages.map((message) => {
        if (typeof message.content !== 'string') {
          return message;
        }
        // Shallow-merge into existing providerOptions so other provider keys
        // (e.g. sort, reasoning) are preserved alongside the cacheControl entry.
        return {
          ...message,
          providerOptions: {
            ...message.providerOptions,
            openrouter: {
              ...(message.providerOptions?.openrouter as Record<string, unknown> | undefined),
              cacheControl: { type: 'ephemeral' /* ttl: '1h' */ }
            }
          }
        };
      });
    }

    const result = await agent.stream({
      messages: [
        ...enableCacheControl([...(await convertToModelMessages(filteredMessages))]),
        {
          role: 'system',
          content: JSON.stringify(project)
        }
      ]
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    if (isHttpError(err)) {
      throw err;
    }
    console.error('[AI] Error generating animation:', err);

    if (err instanceof z.ZodError) {
      error(400, `Validation error: ${err.message}`);
    }

    error(500, err instanceof Error ? err.message : 'Failed to generate animation');
  }
};
