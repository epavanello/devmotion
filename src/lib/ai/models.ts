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
  'moonshotai/kimi-k2': {
    id: 'moonshotai/kimi-k2',
    name: 'Kimi K2.5',
    provider: 'Moonshot AI',
    description: 'Excellent for creative and complex tasks with 128K context',
    recommended: true,
    structuredOutput: true,
    contextWindow: 128000,
    costTier: 'medium'
  },

  // Claude 3.5 Sonnet - Great reasoning and creativity
  'anthropic/claude-sonnet-4': {
    id: 'anthropic/claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'Anthropic',
    description: 'Excellent reasoning and creative capabilities',
    recommended: true,
    structuredOutput: true,
    contextWindow: 200000,
    costTier: 'medium'
  },

  // GPT-4o - Strong all-rounder
  'openai/gpt-4o': {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Fast and capable multimodal model',
    structuredOutput: true,
    contextWindow: 128000,
    costTier: 'medium'
  },

  // GPT-4.1 - Latest OpenAI
  'openai/gpt-4.1': {
    id: 'openai/gpt-4.1',
    name: 'GPT-4.1',
    provider: 'OpenAI',
    description: 'Latest GPT model with improved capabilities',
    structuredOutput: true,
    contextWindow: 128000,
    costTier: 'high'
  },

  // Gemini 2.5 Pro - Good for structured output
  'google/gemini-2.5-pro-preview': {
    id: 'google/gemini-2.5-pro-preview',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    description: 'Strong structured output and reasoning',
    structuredOutput: true,
    contextWindow: 1000000,
    costTier: 'medium'
  },

  // DeepSeek V3 - Cost effective, good quality
  'deepseek/deepseek-chat-v3-0324': {
    id: 'deepseek/deepseek-chat-v3-0324',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    description: 'Cost-effective with strong capabilities',
    structuredOutput: true,
    contextWindow: 64000,
    costTier: 'low'
  },

  // Qwen 2.5 72B - Good for creative tasks
  'qwen/qwen-2.5-72b-instruct': {
    id: 'qwen/qwen-2.5-72b-instruct',
    name: 'Qwen 2.5 72B',
    provider: 'Alibaba',
    description: 'Strong multilingual and creative capabilities',
    structuredOutput: true,
    contextWindow: 32000,
    costTier: 'low'
  },

  // Llama 3.3 70B - Open source option
  'meta-llama/llama-3.3-70b-instruct': {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    provider: 'Meta',
    description: 'Open source, good general capabilities',
    structuredOutput: true,
    contextWindow: 128000,
    costTier: 'low'
  }
} as const;

/**
 * Default model to use
 */
export const DEFAULT_MODEL_ID = 'moonshotai/kimi-k2';

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
