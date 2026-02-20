/**
 * AI Model Configuration
 * Supports multiple models via OpenRouter for optimal video generation
 */

import type { LiteralUnion } from 'type-fest';

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  /** Recommended for complex creative tasks */
  recommended?: boolean;
  /** Cost tier: 'low' | 'medium' | 'high' */
  costTier: 'low' | 'medium' | 'high';
  /** Disable thinking */
  disableThinking?: boolean;
  /** Pricing per 1M tokens (in USD) */
  pricing: {
    input: number;
    output: number;
  };
}

/**
 * Available AI models for video generation
 * All accessible via OpenRouter
 */
export const AI_MODELS = {
  'minimax/minimax-m2.5': {
    id: 'minimax/minimax-m2.5',
    name: 'Minimax M2.5',
    provider: 'Minimax',
    description: 'Excellent for creative and complex tasks with 128K context',
    recommended: false,
    costTier: 'low',
    pricing: {
      input: 0.3,
      output: 1.2
    }
  },
  // // Kimi K2.5 - Excellent for creative tasks, long context
  'moonshotai/kimi-k2.5': {
    id: 'moonshotai/kimi-k2.5',
    name: 'Kimi K2.5',
    provider: 'Moonshot AI',
    description: 'Excellent for creative and complex tasks with 128K context',
    recommended: true,
    costTier: 'low',
    pricing: {
      input: 0.5,
      output: 2.8
    }
  },
  'x-ai/grok-4.1-fast': {
    id: 'x-ai/grok-4.1-fast',
    name: 'Grok 4.1 Fast',
    provider: 'X AI',
    description: 'Excellent for creative and complex tasks with 128K context',
    recommended: false,
    costTier: 'low',
    pricing: {
      input: 0.2,
      output: 0.5
    }
  },
  'google/gemini-3.1-pro-preview': {
    id: 'google/gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    provider: 'Google',
    description: 'Excellent for creative and complex tasks with 128K context',
    recommended: false,
    costTier: 'high',
    pricing: {
      input: 2,
      output: 12
    }
  }
  // 'x-ai/grok-4': {
  //   id: 'x-ai/grok-4',
  //   name: 'Grok 4',
  //   provider: 'X AI',
  //   description: 'Excellent for creative and complex tasks with 256K context',
  //   recommended: false,
  //   costTier: 'medium',
  //   pricing: {
  //     input: 3,
  //     output: 15
  //   }
  // },
  // 'anthropic/claude-sonnet-4.6': {
  //   id: 'anthropic/claude-sonnet-4.6',
  //   name: 'Claude Sonnet 4.6',
  //   provider: 'Anthropic',
  //   description: 'Excellent for creative and complex tasks with 1M context',
  //   recommended: false,
  //   costTier: 'high',
  //   pricing: {
  //     input: 3,
  //     output: 15
  //   }
  // },
  // 'openai/gpt-5.2': {
  //   id: 'openai/gpt-5.2',
  //   name: 'GPT-5.2',
  //   provider: 'OpenAI',
  //   description: 'Excellent for creative and complex tasks with 128K context',
  //   recommended: false,
  //   costTier: 'high',
  //   pricing: {
  //     input: 1.75,
  //     output: 14
  //   }
  // }
  // NOT GOOD
  // 'qwen/qwen3-max-thinking': {
  //   id: 'qwen/qwen3-max-thinking',
  //   name: 'Qwen 3 Max Thinking',
  //   provider: 'Qwen',
  //   description: 'Excellent for creative and complex tasks with 128K context',
  //   recommended: false,
  //   costTier: 'high',
  //   pricing: {
  //     input: 1.2,
  //     output: 6
  //   }
  // },
  // 'qwen/qwen3.5-397b-a17b': {
  //   id: 'qwen/qwen3.5-397b-a17b',
  //   name: 'Qwen 3.5 397B A17B',
  //   provider: 'Qwen',
  //   description: 'Excellent for creative and complex tasks with 128K context',
  //   recommended: false,
  //   costTier: 'high',
  //   pricing: {
  //     input: 0.15,
  //     output: 1
  //   }
  // }
  // 'deepseek/deepseek-v3.2': {
  //   id: 'deepseek/deepseek-v3.2',
  //   name: 'DeepSeek V3.2',
  //   provider: 'DeepSeek',
  //   description: 'Excellent for creative and complex tasks with 128K context',
  //   recommended: false,
  //   costTier: 'high',
  //   pricing: {
  //     input: 0.26,
  //     output: 0.38
  //   }
  // }
} as const satisfies Record<string, AIModel>;

export type ModelId = keyof typeof AI_MODELS;

/**
 * Get model by ID with fallback to default
 */
export function getModel(modelId?: LiteralUnion<ModelId, string>): AIModel {
  if (modelId && AI_MODELS[modelId as ModelId]) {
    return AI_MODELS[modelId as ModelId];
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
 * Default model to use
 */
export const DEFAULT_MODEL_ID: ModelId =
  (getRecommendedModels().find((m) => m.recommended)?.id as ModelId) || 'x-ai/grok-4.1-fast';

/**
 * Get recommended models
 */
export function getRecommendedModels(): AIModel[] {
  return Object.values(AI_MODELS).filter((m) => m.recommended);
}
