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
    recommended: true,
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
    recommended: true,
    costTier: 'low',
    pricing: {
      input: 0.2,
      output: 0.5
    }
  },
  'x-ai/grok-4': {
    id: 'x-ai/grok-4',
    name: 'Grok 4',
    provider: 'X AI',
    description: 'Excellent for creative and complex tasks with 256K context',
    recommended: true,
    costTier: 'medium',
    pricing: {
      input: 3,
      output: 15
    }
  },
  'google/gemini-3-pro-preview': {
    id: 'google/gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    provider: 'Google',
    description: 'Excellent for creative and complex tasks with 128K context',
    recommended: true,
    costTier: 'high',
    pricing: {
      input: 2,
      output: 12
    }
  }

  // // Claude 4.5 Sonnet - Great reasoning and creativity
  // 'anthropic/claude-sonnet-4.5': {
  //   id: 'anthropic/claude-sonnet-4.5',
  //   name: 'Claude Sonnet 4.5',
  //   provider: 'Anthropic',
  //   description: 'Excellent reasoning and creative capabilities',
  //   recommended: false,
  //   costTier: 'high',
  //   pricing: {
  //     input: 3.0,
  //     output: 15.0
  //   }
  // },

  // // GPT-5.1 - Strong all-rounder
  // 'openai/gpt-5.1': {
  //   id: 'openai/gpt-5.1',
  //   name: 'GPT-5.1',
  //   provider: 'OpenAI',
  //   description: 'Fast and capable multimodal model',
  //   costTier: 'medium',
  //   pricing: {
  //     input: 1.25,
  //     output: 10.0
  //   }
  // },

  // // Gemini 3 Pro - Good for structured output
  // 'google/gemini-3-pro-preview': {
  //   id: 'google/gemini-3-pro-preview',
  //   name: 'Gemini 3 Pro',
  //   provider: 'Google',
  //   description: 'Strong structured output and reasoning',
  //   costTier: 'high',
  //   pricing: {
  //     input: 2,
  //     output: 12
  //   }
  // }
} as const satisfies Record<string, AIModel>;

export type ModelId = keyof typeof AI_MODELS;

/**
 * Default model to use
 */
export const DEFAULT_MODEL_ID: ModelId = 'x-ai/grok-4.1-fast';

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
 * Get recommended models
 */
export function getRecommendedModels(): AIModel[] {
  return Object.values(AI_MODELS).filter((m) => m.recommended);
}
