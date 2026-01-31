/**
 * AI Chat API Routes
 * Handles AI-powered animation generation using multiple models via OpenRouter
 */
import { convertToModelMessages, Output, streamText, type UIMessage } from 'ai';
import { error, isHttpError } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { z } from 'zod';
import { ProjectSchema } from '$lib/schemas/animation';
import { AIResponseSchema } from '$lib/ai/schemas';
import { buildSystemPrompt } from '$lib/ai/system-prompt';
import { getModel } from '$lib/ai/models';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { RequestHandler } from './$types';
import { testTool } from '$lib/components/ai/ai-chat.svelte';

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
  finalOutput?: unknown;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}) {
  try {
    const logsDir = join(process.cwd(), 'logs', 'ai-chat');

    // Create logs directory if it doesn't exist
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
    }

    // Create filename with timestamp
    const filename = `${data.timestamp.replace(/[:.]/g, '-')}.json`;
    const filepath = join(logsDir, filename);

    // Format log data for readability
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
      finalOutput: data.finalOutput,
      usage: data.usage
    };

    // Write log file
    writeFileSync(filepath, JSON.stringify(logData, null, 2), 'utf-8');

    // Console log with summary
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
        `Tokens: ${data.usage.totalTokens || 'N/A'} (prompt: ${data.usage.promptTokens || 'N/A'}, completion: ${data.usage.completionTokens || 'N/A'})`
      );
    }
    console.log(`Log file: ${filepath}`);
    console.log(`${'='.repeat(80)}\n`);
  } catch (error) {
    console.error('[AI] Failed to log interaction:', error);
  }
}

/**
 * POST /api/chat - Generate animation operations from a natural language prompt
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Optional: require authentication
    if (!locals.user) {
      error(401, 'Authentication required');
    }

    // Parse and validate request body
    const body = await request.json();
    const { project, modelId, messages } = GenerateRequestSchema.parse(body);

    const openrouter = getOpenRouterClient();
    const systemPrompt = buildSystemPrompt(project);

    // Get model configuration
    const model = getModel(modelId);

    console.log(`[AI] Using model: ${model.name} (${model.id})`);
    console.log(`[AI] System prompt length: ${systemPrompt.length} chars`);

    const result = streamText({
      model: openrouter(model.id),
      output: Output.object({
        schema: AIResponseSchema
      }),
      messages: [
        { role: 'system', content: systemPrompt },
        ...(await convertToModelMessages(messages))
      ],
      // Increase temperature for more creative output
      temperature: 0.7,
      // Timeout for long generations
      maxRetries: 2,
      tools: {
        testTool: testTool
      },
      onFinish(event) {
        // Log the complete interaction for debugging
        logAIInteraction({
          timestamp: new Date().toISOString(),
          modelId: model.id,
          modelName: model.name,
          systemPromptLength: systemPrompt.length,
          userMessages: messages,
          toolCalls: event.toolCalls,
          responseMessages: event.response.messages,
          requestData: event.request,
          finalOutput: undefined,
          usage: event.usage
        });
      }
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    if (isHttpError(err)) {
      throw err;
    }
    console.error('[AI] Error generating animation:', err);

    // Handle Zod validation errors
    if (err instanceof z.ZodError) {
      error(400, `Validation error: ${err.message}`);
    }

    error(500, err instanceof Error ? err.message : 'Failed to generate animation');
  }
};
