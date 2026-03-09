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
  // Pastel gradients - soft and dreamy
  // ============================================
  {
    id: 'unicorn-dream',
    name: 'Unicorn Dream',
    category: 'pastel',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#faf5ff', position: 0 },
        { color: '#ff9a9e', position: 25 },
        { color: '#fecfef', position: 50 },
        { color: '#a18cd1', position: 75 },
        { color: '#667eea', position: 100 }
      ]
    }
  },
  {
    id: 'candy-shop',
    name: 'Candy Shop',
    category: 'pastel',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#f5f3ff', position: 0 },
        { color: '#667eea', position: 25 },
        { color: '#764ba2', position: 50 },
        { color: '#f093fb', position: 75 },
        { color: '#ff6b9d', position: 100 }
      ]
    }
  },
  {
    id: 'ocean-sky',
    name: 'Ocean Sky',
    category: 'pastel',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#f0f9ff', position: 0 },
        { color: '#f093fb', position: 25 },
        { color: '#f5576c', position: 50 },
        { color: '#4facfe', position: 75 },
        { color: '#00f2fe', position: 100 }
      ]
    }
  },
  {
    id: 'mint-lime',
    name: 'Mint Lime',
    category: 'pastel',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#f0fff4', position: 0 },
        { color: '#4facfe', position: 25 },
        { color: '#00f2fe', position: 50 },
        { color: '#43e97b', position: 75 },
        { color: '#fee140', position: 100 }
      ]
    }
  },
  {
    id: 'spring-green',
    name: 'Spring Green',
    category: 'pastel',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#f6ffed', position: 0 },
        { color: '#43e97b', position: 25 },
        { color: '#38f9d7', position: 50 },
        { color: '#667eea', position: 75 },
        { color: '#a18cd1', position: 100 }
      ]
    }
  },
  {
    id: 'peach-sunset',
    name: 'Peach Sunset',
    category: 'pastel',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#fff7ed', position: 0 },
        { color: '#fa709a', position: 25 },
        { color: '#fee140', position: 50 },
        { color: '#ff9a9e', position: 75 },
        { color: '#ffd1ff', position: 100 }
      ]
    }
  },
  {
    id: 'blush-pink',
    name: 'Blush Pink',
    category: 'pastel',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#fef7ff', position: 0 },
        { color: '#a8edea', position: 25 },
        { color: '#fed6e3', position: 50 },
        { color: '#ffecd2', position: 75 },
        { color: '#fcb69f', position: 100 }
      ]
    }
  },
  {
    id: 'coral-reef',
    name: 'Coral Reef',
    category: 'pastel',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#fff8f1', position: 0 },
        { color: '#ffecd2', position: 25 },
        { color: '#fcb69f', position: 50 },
        { color: '#fad0c4', position: 75 },
        { color: '#f093fb', position: 100 }
      ]
    }
  },
  {
    id: 'lemon-sky',
    name: 'Lemon Sky',
    category: 'pastel',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#fefce8', position: 0 },
        { color: '#4facfe', position: 25 },
        { color: '#f5576c', position: 50 },
        { color: '#fcb69f', position: 75 },
        { color: '#ffd1ff', position: 100 }
      ]
    }
  },
  {
    id: 'lavender-mist',
    name: 'Lavender Mist',
    category: 'pastel',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#fefce8', position: 0 },
        { color: '#f6d6ff', position: 25 },
        { color: '#d0f4de', position: 50 },
        { color: '#fff1c1', position: 75 },
        { color: '#ffd6e0', position: 100 }
      ]
    }
  },
  {
    id: 'baby-blue',
    name: 'Baby Blue',
    category: 'pastel',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#f0f9ff', position: 0 },
        { color: '#a0c4ff', position: 25 },
        { color: '#bdb2ff', position: 50 },
        { color: '#ffc6ff', position: 75 },
        { color: '#caffbf', position: 100 }
      ]
    }
  },
  {
    id: 'lilac-dream',
    name: 'Lilac Dream',
    category: 'pastel',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#f0fdfa', position: 0 },
        { color: '#e0c3fc', position: 25 },
        { color: '#8ecae6', position: 50 },
        { color: '#bde0fe', position: 75 },
        { color: '#ffe6e6', position: 100 }
      ]
    }
  },
  {
    id: 'peachy-cream',
    name: 'Peachy Cream',
    category: 'pastel',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#fef7f0', position: 0 },
        { color: '#f9f9c5', position: 25 },
        { color: '#f7c8e0', position: 50 },
        { color: '#c1f7d3', position: 75 },
        { color: '#c1c8e4', position: 100 }
      ]
    }
  },
  {
    id: 'soft-rainbow',
    name: 'Soft Rainbow',
    category: 'pastel',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#fef2f2', position: 0 },
        { color: '#e2f0cb', position: 25 },
        { color: '#b5ead7', position: 50 },
        { color: '#ffb7b2', position: 75 },
        { color: '#ffdac1', position: 100 }
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

  // ============================================
  // Vibrant gradients - bold and energetic
  // ============================================
  {
    id: 'fire-passion',
    name: 'Fire Passion',
    category: 'vibrant',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#fef2f2', position: 0 },
        { color: '#ff6b6b', position: 25 },
        { color: '#ff8e53', position: 50 },
        { color: '#ff6b9d', position: 75 },
        { color: '#c44569', position: 100 }
      ]
    }
  },
  {
    id: 'ocean-wave',
    name: 'Ocean Wave',
    category: 'vibrant',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#ecfeff', position: 0 },
        { color: '#4ecdc4', position: 25 },
        { color: '#44a08d', position: 50 },
        { color: '#96ceb4', position: 75 },
        { color: '#55a3ff', position: 100 }
      ]
    }
  },
  {
    id: 'purple-power',
    name: 'Purple Power',
    category: 'vibrant',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#faf5ff', position: 0 },
        { color: '#a29bfe', position: 25 },
        { color: '#6c5ce7', position: 50 },
        { color: '#fd79a8', position: 75 },
        { color: '#e84393', position: 100 }
      ]
    }
  },
  {
    id: 'teal-blast',
    name: 'Teal Blast',
    category: 'vibrant',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#f0fdfa', position: 0 },
        { color: '#00d2d3', position: 25 },
        { color: '#01a3a4', position: 50 },
        { color: '#00b894', position: 75 },
        { color: '#55efc4', position: 100 }
      ]
    }
  },
  {
    id: 'hot-sunset',
    name: 'Hot Sunset',
    category: 'vibrant',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#fef2f2', position: 0 },
        { color: '#fd79a8', position: 25 },
        { color: '#fdcb6e', position: 50 },
        { color: '#e17055', position: 75 },
        { color: '#d63031', position: 100 }
      ]
    }
  },
  {
    id: 'electric-blue',
    name: 'Electric Blue',
    category: 'vibrant',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#eff6ff', position: 0 },
        { color: '#74b9ff', position: 25 },
        { color: '#0984e3', position: 50 },
        { color: '#6c5ce7', position: 75 },
        { color: '#a29bfe', position: 100 }
      ]
    }
  },
  {
    id: 'mint-ocean',
    name: 'Mint Ocean',
    category: 'vibrant',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#f0fdfa', position: 0 },
        { color: '#00b894', position: 25 },
        { color: '#00cec9', position: 50 },
        { color: '#74b9ff', position: 75 },
        { color: '#0984e3', position: 100 }
      ]
    }
  },
  {
    id: 'sunset-fire',
    name: 'Sunset Fire',
    category: 'vibrant',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#fff7ed', position: 0 },
        { color: '#e17055', position: 25 },
        { color: '#d63031', position: 50 },
        { color: '#fd79a8', position: 75 },
        { color: '#e84393', position: 100 }
      ]
    }
  },
  {
    id: 'violet-burst',
    name: 'Violet Burst',
    category: 'vibrant',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#faf5ff', position: 0 },
        { color: '#6c5ce7', position: 25 },
        { color: '#a29bfe', position: 50 },
        { color: '#fd79a8', position: 75 },
        { color: '#ff7675', position: 100 }
      ]
    }
  },
  {
    id: 'tropical-heat',
    name: 'Tropical Heat',
    category: 'vibrant',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#fffbeb', position: 0 },
        { color: '#ff7675', position: 25 },
        { color: '#fd79a8', position: 50 },
        { color: '#fdcb6e', position: 75 },
        { color: '#ffeaa7', position: 100 }
      ]
    }
  },
  {
    id: 'neon-violet',
    name: 'Neon Violet',
    category: 'vibrant',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#f0f9ff', position: 0 },
        { color: '#55a3ff', position: 25 },
        { color: '#74b9ff', position: 50 },
        { color: '#a29bfe', position: 75 },
        { color: '#dda8dd', position: 100 }
      ]
    }
  },

  // ============================================
  // Dark gradients - moody and sophisticated
  // ============================================
  {
    id: 'dark-ember',
    name: 'Dark Ember',
    category: 'dark',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#1a2026', position: 0 },
        { color: '#872816', position: 50 },
        { color: '#c4710b', position: 100 }
      ]
    }
  },
  {
    id: 'deep-teal',
    name: 'Deep Teal',
    category: 'dark',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#011f26', position: 0 },
        { color: '#4a8c8c', position: 50 },
        { color: '#fab062', position: 100 }
      ]
    }
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    category: 'dark',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#141421', position: 0 },
        { color: '#547c8c', position: 50 },
        { color: '#d6907c', position: 100 }
      ]
    }
  },
  {
    id: 'dark-navy',
    name: 'Dark Navy',
    category: 'dark',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#11192d', position: 0 },
        { color: '#283b8c', position: 50 },
        { color: '#58d8db', position: 100 }
      ]
    }
  },
  {
    id: 'midnight-indigo',
    name: 'Midnight Indigo',
    category: 'dark',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#120a2d', position: 0 },
        { color: '#164782', position: 50 },
        { color: '#e2a359', position: 100 }
      ]
    }
  },

  // ============================================
  // Warm gradients - cozy and inviting
  // ============================================
  {
    id: 'autumn-warmth',
    name: 'Autumn Warmth',
    category: 'warm',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#dac7be', position: 0 },
        { color: '#f7e7ce', position: 25 },
        { color: '#e9c46a', position: 50 },
        { color: '#f4a261', position: 75 },
        { color: '#e76f51', position: 100 }
      ]
    }
  },
  {
    id: 'sunrise-glow',
    name: 'Sunrise Glow',
    category: 'warm',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#4f5d75', position: 0 },
        { color: '#bfc0c0', position: 33 },
        { color: '#ffffff', position: 67 },
        { color: '#ffd166', position: 100 }
      ]
    }
  },
  {
    id: 'terracotta',
    name: 'Terracotta',
    category: 'warm',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#a0756c', position: 0 },
        { color: '#f4f3ee', position: 25 },
        { color: '#e9c46a', position: 50 },
        { color: '#f4a261', position: 75 },
        { color: '#e76f51', position: 100 }
      ]
    }
  },
  {
    id: 'coastal-blue',
    name: 'Coastal Blue',
    category: 'warm',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#6b8e8e', position: 0 },
        { color: '#f7f9fc', position: 25 },
        { color: '#a8dadc', position: 50 },
        { color: '#457b9d', position: 75 },
        { color: '#1d3557', position: 100 }
      ]
    }
  },
  {
    id: 'plum-wine',
    name: 'Plum Wine',
    category: 'warm',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#8d7b8b', position: 0 },
        { color: '#f8f4f9', position: 25 },
        { color: '#dda0dd', position: 50 },
        { color: '#ba68c8', position: 75 },
        { color: '#8e24aa', position: 100 }
      ]
    }
  },

  // ============================================
  // Cool gradients - fresh and calming
  // ============================================
  {
    id: 'ocean-mist',
    name: 'Ocean Mist',
    category: 'cool',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#fff2ef', position: 0 },
        { color: '#ffdbba', position: 33 },
        { color: '#f7a5a5', position: 67 },
        { color: '#5d688a', position: 100 }
      ]
    }
  },
  {
    id: 'arctic-sky',
    name: 'Arctic Sky',
    category: 'cool',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#b8cced', position: 0 },
        { color: '#f6e7e4', position: 33 },
        { color: '#fbf4f9', position: 67 },
        { color: '#f6e4f2', position: 100 }
      ]
    }
  },
  {
    id: 'rose-blush',
    name: 'Rose Blush',
    category: 'cool',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#ffecc0', position: 0 },
        { color: '#ffc29b', position: 33 },
        { color: '#f39f9f', position: 67 },
        { color: '#b95e82', position: 100 }
      ]
    }
  },
  {
    id: 'violet-pink',
    name: 'Violet Pink',
    category: 'cool',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#fed2e2', position: 0 },
        { color: '#c68efd', position: 33 },
        { color: '#e9a5f1', position: 67 },
        { color: '#8f87f1', position: 100 }
      ]
    }
  },

  // ============================================
  // Neutral gradients - elegant and balanced
  // ============================================
  {
    id: 'silver-mist',
    name: 'Silver Mist',
    category: 'neutral',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#bcb6ff', position: 0 },
        { color: '#b8e1ff', position: 33 },
        { color: '#a9fff7', position: 67 },
        { color: '#94fbab', position: 100 }
      ]
    }
  },
  {
    id: 'glacier-blue',
    name: 'Glacier Blue',
    category: 'neutral',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#cae5ff', position: 0 },
        { color: '#acedff', position: 25 },
        { color: '#89bbfe', position: 50 },
        { color: '#6f8ab7', position: 75 },
        { color: '#615d6c', position: 100 }
      ]
    }
  },
  {
    id: 'lavender-sky',
    name: 'Lavender Sky',
    category: 'neutral',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#9381ff', position: 0 },
        { color: '#b8b8ff', position: 25 },
        { color: '#f8f7ff', position: 50 },
        { color: '#ffeedd', position: 75 },
        { color: '#ffd8be', position: 100 }
      ]
    }
  },
  {
    id: 'rustic-autumn',
    name: 'Rustic Autumn',
    category: 'neutral',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#780116', position: 0 },
        { color: '#f7b538', position: 25 },
        { color: '#db7c26', position: 50 },
        { color: '#d8572a', position: 75 },
        { color: '#c32f27', position: 100 }
      ]
    }
  },
  {
    id: 'steel-blue',
    name: 'Steel Blue',
    category: 'neutral',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#0d1321', position: 0 },
        { color: '#1d2d44', position: 33 },
        { color: '#3e5c76', position: 67 },
        { color: '#748cab', position: 100 }
      ]
    }
  },
  {
    id: 'sunset-coral',
    name: 'Sunset Coral',
    category: 'neutral',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#fefeff', position: 0 },
        { color: '#d6efff', position: 25 },
        { color: '#fed18c', position: 50 },
        { color: '#fed99b', position: 75 },
        { color: '#fe654f', position: 100 }
      ]
    }
  },
  {
    id: 'sage-garden',
    name: 'Sage Garden',
    category: 'neutral',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#b8d8ba', position: 0 },
        { color: '#d9dbbc', position: 33 },
        { color: '#fcddbc', position: 67 },
        { color: '#ef959d', position: 100 }
      ]
    }
  },
  {
    id: 'moody-night',
    name: 'Moody Night',
    category: 'neutral',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#151e3f', position: 0 },
        { color: '#030027', position: 25 },
        { color: '#f2f3d9', position: 50 },
        { color: '#dc9e82', position: 75 },
        { color: '#c16e70', position: 100 }
      ]
    }
  },
  {
    id: 'graphite-stone',
    name: 'Graphite Stone',
    category: 'neutral',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#14110f', position: 0 },
        { color: '#34312d', position: 25 },
        { color: '#7e7f83', position: 50 },
        { color: '#d9c5b2', position: 75 },
        { color: '#f3f3f4', position: 100 }
      ]
    }
  },
  {
    id: 'pink-teal',
    name: 'Pink Teal',
    category: 'neutral',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#d12383', position: 0 },
        { color: '#de4d86', position: 25 },
        { color: '#f29ca3', position: 50 },
        { color: '#f7cacd', position: 75 },
        { color: '#84e6f8', position: 100 }
      ]
    }
  },
  {
    id: 'teal-beige',
    name: 'Teal Beige',
    category: 'neutral',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#0892a5', position: 0 },
        { color: '#06908f', position: 25 },
        { color: '#0ca4a5', position: 50 },
        { color: '#dbb68f', position: 75 },
        { color: '#dbbaa9', position: 100 }
      ]
    }
  },
  {
    id: 'forest-mint',
    name: 'Forest Mint',
    category: 'neutral',
    value: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#d7fff1', position: 0 },
        { color: '#aafcb8', position: 25 },
        { color: '#8cd790', position: 50 },
        { color: '#77af9c', position: 75 },
        { color: '#285943', position: 100 }
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
