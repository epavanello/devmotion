/**
 * AI Chat API Routes
 * Progressive tool-calling system for animation generation
 */
import { convertToModelMessages, ToolLoopAgent, type UIMessage } from 'ai';
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
 * Create OpenRouter-compatible client
 */
function getOpenRouterClient() {
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }
  return createOpenRouter({
    apiKey
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

    const openrouter = getOpenRouterClient();
    const systemPrompt = buildSystemPrompt(project);
    const model = getModel(modelId);

    console.log(`[AI] Using model: ${model.name} (${model.id})`);
    console.log(`[AI] System prompt length: ${systemPrompt.length} chars`);

    const agent = new ToolLoopAgent({
      model: openrouter(model.id),
      instructions: systemPrompt,
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

    const result = await agent.stream({
      messages: await convertToModelMessages(messages)
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
