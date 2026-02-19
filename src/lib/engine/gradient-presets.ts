/**
 * Gradient presets - beautiful pre-defined gradients for quick use
 * Organized by category for easy discovery
 */
import type { BackgroundValue } from '$lib/schemas/animation';

export interface GradientPreset {
  id: string;
  name: string;
  category: 'warm' | 'cool' | 'vibrant' | 'pastel' | 'dark' | 'neutral';
  value: BackgroundValue;
}

/**
 * All available gradient presets
 */
export const gradientPresets = [
  // ============================================
  // Warm gradients
  // ============================================
  {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    category: 'warm',
    value: {
      type: 'radial',
      shape: 'circle',
      size: 'farthest-corner',
      position: { x: 10, y: 20 },
      stops: [
        { color: '#fdf605', position: 0 },
        { color: '#f58b8b', position: 100 }
      ]
    }
  },
  {
    id: 'warm-flame',
    name: 'Warm Flame',
    category: 'warm',
    value: {
      type: 'linear',
      angle: 45,
      stops: [
        { color: '#ff9a9e', position: 0 },
        { color: '#fad0c4', position: 100 }
      ]
    }
  },
  {
    id: 'juicy-peach',
    name: 'Juicy Peach',
    category: 'warm',
    value: {
      type: 'linear',
      angle: 90,
      stops: [
        { color: '#ffecd2', position: 0 },
        { color: '#fcb69f', position: 100 }
      ]
    }
  },
  {
    id: 'mango-papaya',
    name: 'Mango Papaya',
    category: 'warm',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#ffe259', position: 0 },
        { color: '#ffa751', position: 100 }
      ]
    }
  },

  // ============================================
  // Cool gradients
  // ============================================
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    category: 'cool',
    value: {
      type: 'linear',
      angle: 99,
      stops: [
        { color: '#22aff5', position: 3 },
        { color: '#62f797', position: 98 }
      ]
    }
  },
  {
    id: 'winter-neva',
    name: 'Winter Neva',
    category: 'cool',
    value: {
      type: 'linear',
      angle: 120,
      stops: [
        { color: '#a1c4fd', position: 0 },
        { color: '#c2e9fb', position: 100 }
      ]
    }
  },
  {
    id: 'deep-sea',
    name: 'Deep Sea',
    category: 'cool',
    value: {
      type: 'linear',
      angle: 180,
      stops: [
        { color: '#2193b0', position: 0 },
        { color: '#6dd5ed', position: 100 }
      ]
    }
  },
  {
    id: 'aqua-splash',
    name: 'Aqua Splash',
    category: 'cool',
    value: {
      type: 'linear',
      angle: 45,
      stops: [
        { color: '#13547a', position: 0 },
        { color: '#80d0c7', position: 100 }
      ]
    }
  },

  // ============================================
  // Vibrant gradients
  // ============================================
  {
    id: 'electric-violet',
    name: 'Electric Violet',
    category: 'vibrant',
    value: {
      type: 'linear',
      angle: 180,
      stops: [
        { color: '#f915d7', position: 1 },
        { color: '#160062', position: 99 }
      ]
    }
  },
  {
    id: 'purple-haze',
    name: 'Purple Haze',
    category: 'vibrant',
    value: {
      type: 'linear',
      angle: 110,
      stops: [
        { color: '#c4f9ff', position: 11 },
        { color: '#eec5f6', position: 42 },
        { color: '#edb5fe', position: 72 },
        { color: '#7bb7fd', position: 100 }
      ]
    }
  },
  {
    id: 'neon-glow',
    name: 'Neon Glow',
    category: 'vibrant',
    value: {
      type: 'linear',
      angle: 45,
      stops: [
        { color: '#f953c6', position: 0 },
        { color: '#b91d73', position: 100 }
      ]
    }
  },
  {
    id: 'cosmic-fusion',
    name: 'Cosmic Fusion',
    category: 'vibrant',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#ff0844', position: 0 },
        { color: '#ffb199', position: 100 }
      ]
    }
  },
  {
    id: 'ultra-violet',
    name: 'Ultra Violet',
    category: 'vibrant',
    value: {
      type: 'linear',
      angle: 90,
      stops: [
        { color: '#654ea3', position: 0 },
        { color: '#eaafc8', position: 100 }
      ]
    }
  },

  // ============================================
  // Pastel gradients
  // ============================================
  {
    id: 'cotton-candy',
    name: 'Cotton Candy',
    category: 'pastel',
    value: {
      type: 'linear',
      angle: 103,
      stops: [
        { color: '#fce1d0', position: 30 },
        { color: '#ffadd6', position: 56 },
        { color: '#a2baf5', position: 82 }
      ]
    }
  },
  {
    id: 'soft-pink',
    name: 'Soft Pink',
    category: 'pastel',
    value: {
      type: 'linear',
      angle: 180,
      stops: [
        { color: '#fbc2eb', position: 0 },
        { color: '#a6c1ee', position: 100 }
      ]
    }
  },
  {
    id: 'lavender-dream',
    name: 'Lavender Dream',
    category: 'pastel',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#e0c3fc', position: 0 },
        { color: '#8ec5fc', position: 100 }
      ]
    }
  },
  {
    id: 'mint-fresh',
    name: 'Mint Fresh',
    category: 'pastel',
    value: {
      type: 'linear',
      angle: 90,
      stops: [
        { color: '#d4fc79', position: 0 },
        { color: '#96e6a1', position: 100 }
      ]
    }
  },
  {
    id: 'peach-blossom',
    name: 'Peach Blossom',
    category: 'pastel',
    value: {
      type: 'linear',
      angle: 45,
      stops: [
        { color: '#ffecd2', position: 0 },
        { color: '#fcb69f', position: 100 }
      ]
    }
  },

  // ============================================
  // Dark gradients
  // ============================================
  {
    id: 'midnight',
    name: 'Midnight',
    category: 'dark',
    value: {
      type: 'linear',
      angle: 180,
      stops: [
        { color: '#232526', position: 0 },
        { color: '#414345', position: 100 }
      ]
    }
  },
  {
    id: 'dark-ocean',
    name: 'Dark Ocean',
    category: 'dark',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#373B44', position: 0 },
        { color: '#4286f4', position: 100 }
      ]
    }
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    category: 'dark',
    value: {
      type: 'linear',
      angle: 90,
      stops: [
        { color: '#141E30', position: 0 },
        { color: '#243B55', position: 100 }
      ]
    }
  },
  {
    id: 'deep-space',
    name: 'Deep Space',
    category: 'dark',
    value: {
      type: 'linear',
      angle: 180,
      stops: [
        { color: '#000000', position: 0 },
        { color: '#434343', position: 100 }
      ]
    }
  },

  // ============================================
  // Neutral gradients
  // ============================================
  {
    id: 'silver-lake',
    name: 'Silver Lake',
    category: 'neutral',
    value: {
      type: 'linear',
      angle: 180,
      stops: [
        { color: '#bdc3c7', position: 0 },
        { color: '#2c3e50', position: 100 }
      ]
    }
  },
  {
    id: 'cloudy-day',
    name: 'Cloudy Day',
    category: 'neutral',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#ECE9E6', position: 0 },
        { color: '#FFFFFF', position: 100 }
      ]
    }
  },
  {
    id: 'metal-shine',
    name: 'Metal Shine',
    category: 'neutral',
    value: {
      type: 'linear',
      angle: 180,
      stops: [
        { color: '#d7d2cc', position: 0 },
        { color: '#304352', position: 100 }
      ]
    }
  }
] as const satisfies GradientPreset[];

/**
 * Get gradient presets by category
 */
export function getPresetsByCategory(category: GradientPreset['category']): GradientPreset[] {
  return gradientPresets.filter((p) => p.category === category);
}

/**
 * Get a gradient preset by ID
 */
export function getGradientPresetById(
  id: (typeof gradientPresets)[number]['id']
): GradientPreset | undefined {
  return gradientPresets.find((p) => p.id === id);
}

/**
 * Get all available categories
 */
export function getGradientCategories(): GradientPreset['category'][] {
  return ['warm', 'cool', 'vibrant', 'pastel', 'dark', 'neutral'];
}

/**
 * Default solid colors for quick access
 */
export const defaultSolidColors: string[] = [
  '#4a90e2', // Blue
  '#e24a4a', // Red
  '#4ae24a', // Green
  '#e2e24a', // Yellow
  '#e24ae2', // Magenta
  '#4ae2e2', // Cyan
  '#ffffff', // White
  '#000000', // Black
  '#888888', // Gray
  '#ff6b6b', // Coral
  '#4ecdc4', // Teal
  '#95e1d3', // Mint
  '#f38181', // Salmon
  '#aa96da', // Lavender
  '#fcbad3', // Pink
  '#ffffd2' // Cream
];
