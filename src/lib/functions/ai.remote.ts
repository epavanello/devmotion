/**
 * AI Generation Remote Function
 * Handles AI-powered animation generation using multiple models via OpenRouter
 */
import { command, getRequestEvent } from '$app/server';
import { z } from 'zod';
import { withErrorHandling } from '.';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText, Output } from 'ai';
import { AIResponseSchema } from '$lib/ai/schemas';
import { buildSystemPrompt } from '$lib/ai/system-prompt';
import { env } from '$env/dynamic/private';
import { ProjectSchema } from '$lib/schemas/animation';
import { getModel, DEFAULT_MODEL_ID, AI_MODELS } from '$lib/ai/models';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Request schema for AI generation
 */
const GenerateRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(4_000, 'Prompt too long'),
  project: ProjectSchema,
  modelId: z.string().optional().describe('Model ID to use for generation')
});

/**
 * Log AI request and response to filesystem for debugging
 */
function logAIInteraction(data: {
  timestamp: string;
  prompt: string;
  project: z.infer<typeof ProjectSchema>;
  modelId: string;
  systemPromptLength: number;
  request: unknown;
  output: z.infer<typeof AIResponseSchema>;
}) {
  try {
    const logsDir = join(process.cwd(), 'logs', 'ai-requests');

    // Create logs directory if it doesn't exist
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
    }

    // Create filename with timestamp
    const filename = `${data.timestamp.replace(/[:.]/g, '-')}.json`;
    const filepath = join(logsDir, filename);

    // Write log file
    writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[AI] Logged interaction to: ${filepath}`);
  } catch (error) {
    console.error('[AI] Failed to log interaction:', error);
  }
}

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
 * Generate animation operations from a natural language prompt
 */
export const generateAnimation = command(
  GenerateRequestSchema,
  withErrorHandling(async ({ prompt, project, modelId }) => {
    const { locals } = getRequestEvent();

    // Optional: require authentication
    if (!locals.user) {
      throw new Error('Authentication required');
    }

    const openrouter = getOpenRouterClient();
    const systemPrompt = buildSystemPrompt(project);

    // Get model configuration
    const selectedModelId = modelId || env.AI_MODEL_ID || DEFAULT_MODEL_ID;
    const model = getModel(selectedModelId);

    console.log(`[AI] Using model: ${model.name} (${model.id})`);
    console.log(`[AI] System prompt length: ${systemPrompt.length} chars`);

    const { output, request } = await generateText({
      model: openrouter(model.id),
      output: Output.object({
        schema: AIResponseSchema
      }),
      system: systemPrompt,
      prompt: prompt,
      // Increase temperature for more creative output
      temperature: 0.7,
      // Timeout for long generations
      maxRetries: 2
    });

    // Log the interaction to filesystem for debugging
    const timestamp = new Date().toISOString();
    logAIInteraction({
      timestamp,
      prompt,
      project,
      modelId: selectedModelId,
      systemPromptLength: systemPrompt.length,
      request: request.body,
      output
    });

    return {
      message: output.message,
      operations: output.operations,
      modelUsed: model.name
    };
  })
);

/**
 * Get available AI models
 */
export const getAvailableAIModels = command(
  z.object({}),
  withErrorHandling(async () => {
    return {
      models: Object.values(AI_MODELS),
      defaultModelId: env.AI_MODEL_ID || DEFAULT_MODEL_ID
    };
  })
);
