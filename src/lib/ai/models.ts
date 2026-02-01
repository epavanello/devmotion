/**
 * AI Model Configuration
 * Supports multiple models via OpenRouter for optimal video generation
 */

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  /** Recommended for complex creative tasks */
  recommended?: boolean;
  /** Supports structured output (JSON mode) */
  structuredOutput: boolean;
  /** Max context window */
  contextWindow: number;
  /** Cost tier: 'low' | 'medium' | 'high' */
  costTier: 'low' | 'medium' | 'high';
}

/**
 * Available AI models for video generation
 * All accessible via OpenRouter
 */
export const AI_MODELS: Record<string, AIModel> = {
  // Kimi K2.5 - Excellent for creative tasks, long context
  'moonshotai/kimi-k2.5': {
    id: 'moonshotai/kimi-k2.5',
    name: 'Kimi K2.5',
    provider: 'Moonshot AI',
    description: 'Excellent for creative and complex tasks with 128K context',
    recommended: true,
    structuredOutput: true,
    contextWindow: 128000,
    costTier: 'medium'
  },

  // Claude 4.5 Sonnet - Great reasoning and creativity
  'anthropic/claude-sonnet-4.5': {
    id: 'anthropic/claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    description: 'Excellent reasoning and creative capabilities',
    recommended: true,
    structuredOutput: true,
    contextWindow: 200000,
    costTier: 'medium'
  },

  // GPT-5.1 - Strong all-rounder
  'openai/gpt-5.1': {
    id: 'openai/gpt-5.1',
    name: 'GPT-5.1',
    provider: 'OpenAI',
    description: 'Fast and capable multimodal model',
    structuredOutput: true,
    contextWindow: 128000,
    costTier: 'medium'
  },

  // Gemini 3 Pro - Good for structured output
  'google/gemini-3-pro-preview': {
    id: 'google/gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    provider: 'Google',
    description: 'Strong structured output and reasoning',
    structuredOutput: true,
    contextWindow: 1000000,
    costTier: 'medium'
  }
} as const;

/**
 * Default model to use
 */
export const DEFAULT_MODEL_ID = 'moonshotai/kimi-k2.5';

/**
 * Get model by ID with fallback to default
 */
export function getModel(modelId?: string): AIModel {
  if (modelId && AI_MODELS[modelId]) {
    return AI_MODELS[modelId];
  }
  return AI_MODELS[DEFAULT_MODEL_ID];
}

/**
 * Get all available models sorted by recommendation
 */
export function getAvailableModels(): AIModel[] {
  return Object.values(AI_MODELS).sort((a, b) => {
    // Recommended first
    if (a.recommended && !b.recommended) return -1;
    if (!a.recommended && b.recommended) return 1;
    // Then by cost tier
    const costOrder = { low: 0, medium: 1, high: 2 };
    return costOrder[a.costTier] - costOrder[b.costTier];
  });
}

/**
 * Get recommended models
 */
export function getRecommendedModels(): AIModel[] {
  return Object.values(AI_MODELS).filter((m) => m.recommended);
}
