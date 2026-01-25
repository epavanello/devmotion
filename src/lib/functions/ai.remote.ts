/**
 * AI Generation Remote Function
 * Handles AI-powered animation generation using Gemini via OpenRouter
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

/**
 * Request schema for AI generation
 */

const GenerateRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(2_000, 'Prompt too long'),
  project: ProjectSchema
});

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
  withErrorHandling(async ({ prompt, project }) => {
    const { locals } = getRequestEvent();

    // Optional: require authentication
    // Uncomment if you want to restrict AI generation to logged-in users
    if (!locals.user) {
      throw new Error('Authentication required');
    }

    const openrouter = getOpenRouterClient();
    const systemPrompt = buildSystemPrompt(project);

    console.log({ systemPrompt });

    const { output } = await generateText({
      model: openrouter('google/gemini-3-pro-preview'),
      output: Output.object({
        schema: AIResponseSchema
      }),
      system: systemPrompt,
      prompt: prompt
    });

    console.log('AI Output:', JSON.stringify(output, null, 2));

    return {
      message: output.message,
      operations: output.operations
    };
  })
);
