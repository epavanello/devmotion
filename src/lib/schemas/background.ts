/**
 * Background & gradient schemas — kept in a separate module so that layer
 * components (loaded by registry.ts) can import these without hitting the
 * circular dependency that animation.ts → registry.ts → ShapeLayer → animation.ts
 * would create.
 */
import { z } from 'zod';

// ============================================
// Schemas
// ============================================

/**
 * Color stop for gradients
 * @example { color: '#ff0000', position: 0 } - Red at start
 * @example { color: 'rgba(0,0,255,0.5)', position: 100 } - Semi-transparent blue at end
 */
export const ColorStopSchema = z.object({
  color: z.string().describe('Color value (hex, rgb, or rgba)'),
  position: z.number().min(0).max(100).describe('Position in percentage (0-100)')
});

/**
 * Background filters for visual effects
 */
export const BackgroundFiltersSchema = z
  .object({
    blur: z.number().min(0).max(50).optional().describe('Blur amount in pixels (0-50)'),
    brightness: z
      .number()
      .min(0)
      .max(2)
      .multipleOf(0.05)
      .optional()
      .describe('Brightness multiplier (0-2, 1 = normal)'),
    contrast: z
      .number()
      .min(0)
      .max(2)
      .multipleOf(0.05)
      .optional()
      .describe('Contrast multiplier (0-2, 1 = normal)'),
    saturate: z
      .number()
      .min(0)
      .max(2)
      .multipleOf(0.05)
      .optional()
      .describe('Saturation multiplier (0-2, 1 = normal)'),
    hueRotate: z
      .number()
      .min(0)
      .max(360)
      .multipleOf(5)
      .optional()
      .describe('Hue rotation in degrees (0-360)'),
    opacity: z.number().min(0).max(1).multipleOf(0.05).optional().describe('Opacity level (0-1)'),
    grain: z
      .number()
      .min(0)
      .max(1)
      .multipleOf(0.05)
      .optional()
      .describe('Noise/grain intensity (0-1)')
  })
  .optional();

/**
 * Solid color background
 * @example { type: 'solid', color: '#4a90e2' }
 */
export const SolidBackgroundSchema = z
  .string()
  .describe('Solid color value (hex format recommended)');

/**
 * Linear gradient background
 * Creates a gradient along a straight line at a specified angle.
 * @example {
 *   type: 'linear',
 *   angle: 90,
 *   stops: [
 *     { color: '#ff0000', position: 0 },
 *     { color: '#0000ff', position: 100 }
 *   ]
 * }
 */
export const LinearGradientSchema = z.object({
  type: z.literal('linear'),
  angle: z
    .number()
    .min(0)
    .max(360)
    .default(180)
    .describe('Angle in degrees (0 = top to bottom, 90 = left to right)'),
  stops: z.array(ColorStopSchema).min(2).describe('Color stops (minimum 2)'),
  filters: BackgroundFiltersSchema
});

/**
 * Radial gradient background
 * Creates a gradient radiating from a center point.
 * @example {
 *   type: 'radial',
 *   shape: 'circle',
 *   position: { x: 50, y: 50 },
 *   stops: [
 *     { color: '#ffffff', position: 0 },
 *     { color: '#000000', position: 100 }
 *   ]
 * }
 */
export const RadialGradientSchema = z.object({
  type: z.literal('radial'),
  shape: z.enum(['circle', 'ellipse']).default('circle').describe('Shape of the gradient'),
  size: z
    .enum(['closest-side', 'closest-corner', 'farthest-side', 'farthest-corner'])
    .default('farthest-corner')
    .describe('Size of the gradient'),
  position: z
    .object({
      x: z.number().min(0).max(100).default(50).describe('Center X position (%)'),
      y: z.number().min(0).max(100).default(50).describe('Center Y position (%)')
    })
    .default({ x: 50, y: 50 })
    .describe('Center position of the gradient'),
  stops: z.array(ColorStopSchema).min(2).describe('Color stops (minimum 2)'),
  filters: BackgroundFiltersSchema
});

/**
 * Conic gradient background
 * Creates a gradient with color transitions rotated around a center point.
 */
export const ConicGradientSchema = z.object({
  type: z.literal('conic'),
  angle: z.number().min(0).max(360).default(0).describe('Starting angle in degrees'),
  position: z
    .object({
      x: z.number().min(0).max(100).default(50).describe('Center X position (%)'),
      y: z.number().min(0).max(100).default(50).describe('Center Y position (%)')
    })
    .default({ x: 50, y: 50 })
    .describe('Center position of the gradient'),
  stops: z.array(ColorStopSchema).min(2).describe('Color stops (minimum 2)'),
  filters: BackgroundFiltersSchema
});

/**
 * Background value that supports solid colors and various gradient types.
 * Use this schema for any fill, background, or similar properties.
 */
export const BackgroundValueSchema = z.union([
  SolidBackgroundSchema,
  LinearGradientSchema,
  RadialGradientSchema,
  ConicGradientSchema
]);

// ============================================
// Types
// ============================================

export type BackgroundFilters = z.infer<typeof BackgroundFiltersSchema>;
export type ColorStop = z.infer<typeof ColorStopSchema>;
export type SolidBackground = z.infer<typeof SolidBackgroundSchema>;
export type LinearGradient = z.infer<typeof LinearGradientSchema>;
export type RadialGradient = z.infer<typeof RadialGradientSchema>;
export type ConicGradient = z.infer<typeof ConicGradientSchema>;

export type GradientBackground = LinearGradient | RadialGradient | ConicGradient;
export type BackgroundValue = SolidBackground | GradientBackground;

// ============================================
// Helpers
// ============================================

/** Check if a background value is a gradient */
export function isGradient(value: BackgroundValue): value is GradientBackground {
  return !isSolid(value);
}

/** Check if a background value is a solid color */
export function isSolid(value: BackgroundValue): value is SolidBackground {
  return typeof value === 'string' || typeof value === 'undefined';
}

/**
 * Generate a noise/grain SVG data URL
 */
function generateGrainSVG(intensity: number): string {
  // Create a noise pattern with varying intensity
  const size = 200;
  const baseOpacity = intensity * 0.3; // Max 30% opacity

  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${0.6 + intensity * 0.2}' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='${baseOpacity}'/%3E%3C/svg%3E`;
}

/**
 * Build CSS filter string from BackgroundFilters
 */
export function buildFilterCSS(filters?: BackgroundFilters): string {
  if (!filters) return '';

  const parts: string[] = [];

  if (filters.blur !== undefined && filters.blur > 0) {
    parts.push(`blur(${filters.blur}px)`);
  }
  if (filters.brightness !== undefined && filters.brightness !== 1) {
    parts.push(`brightness(${filters.brightness})`);
  }
  if (filters.contrast !== undefined && filters.contrast !== 1) {
    parts.push(`contrast(${filters.contrast})`);
  }
  if (filters.saturate !== undefined && filters.saturate !== 1) {
    parts.push(`saturate(${filters.saturate})`);
  }
  if (filters.hueRotate !== undefined && filters.hueRotate > 0) {
    parts.push(`hue-rotate(${filters.hueRotate}deg)`);
  }
  if (filters.opacity !== undefined && filters.opacity !== 1) {
    parts.push(`opacity(${filters.opacity})`);
  }

  return parts.length > 0 ? parts.join(' ') : '';
}

/**
 * Convert a BackgroundValue to a CSS background / background-image string
 */
export function backgroundValueToCSS(
  value: BackgroundValue,
  options?: { radialSize?: 'closest-side' | 'closest-corner' | 'farthest-side' | 'farthest-corner' }
): string {
  if (isSolid(value)) {
    return value;
  }

  let gradientCSS = '';

  if (value.type === 'linear') {
    const stops = value.stops.map((s) => `${s.color} ${s.position}%`).join(', ');
    gradientCSS = `linear-gradient(${value.angle}deg, ${stops})`;
  } else if (value.type === 'radial') {
    const stops = value.stops.map((s) => `${s.color} ${s.position}%`).join(', ');
    const pos = `${value.position.x}% ${value.position.y}%`;
    const size = options?.radialSize ?? value.size;
    gradientCSS = `radial-gradient(${value.shape} ${size} at ${pos}, ${stops})`;
  } else if (value.type === 'conic') {
    const stops = value.stops.map((s) => `${s.color} ${s.position}%`).join(', ');
    const pos = `${value.position.x}% ${value.position.y}%`;
    gradientCSS = `conic-gradient(from ${value.angle}deg at ${pos}, ${stops})`;
  } else {
    return '#000000';
  }

  // Add grain overlay if specified
  if (value.filters?.grain && value.filters.grain > 0) {
    const grainURL = generateGrainSVG(value.filters.grain);
    return `url("${grainURL}"), ${gradientCSS}`;
  }

  return gradientCSS;
}

/**
 * Get style properties for a background value
 */
export function getStyleProperties(
  value: BackgroundValue | undefined,
  options?: { radialSize?: 'closest-side' | 'closest-corner' | 'farthest-side' | 'farthest-corner' }
) {
  const filters = value && !isSolid(value) ? value.filters : undefined;
  const filterCSS = buildFilterCSS(filters);

  return {
    backgroundImage: getBackgroundImage(value, options),
    backgroundColor: getBackgroundColor(value),
    filter: filterCSS || undefined
  };
}

export function getBackgroundColor(value?: BackgroundValue) {
  if (!value) {
    return undefined;
  }

  if (isSolid(value)) {
    return value;
  }

  return 'transparent';
}

export function getBackgroundImage(
  value?: BackgroundValue,
  options?: { radialSize?: 'closest-side' | 'closest-corner' | 'farthest-side' | 'farthest-corner' }
) {
  if (!value) {
    return undefined;
  }

  if (isSolid(value)) {
    return 'none';
  }

  return backgroundValueToCSS(value, options);
}

/** Create a solid background value */
export function solidBackground(color: string): SolidBackground {
  return color;
}

/** Create a linear gradient background value */
export function linearGradient(
  angle: number,
  stops: Array<{ color: string; position: number }>
): LinearGradient {
  return { type: 'linear', angle, stops };
}

/** Create a radial gradient background value */
export function radialGradient(
  stops: Array<{ color: string; position: number }>,
  options?: {
    shape?: 'circle' | 'ellipse';
    size?: 'closest-side' | 'closest-corner' | 'farthest-side' | 'farthest-corner';
    position?: { x: number; y: number };
  }
): RadialGradient {
  return {
    type: 'radial',
    shape: options?.shape ?? 'circle',
    size: options?.size ?? 'farthest-corner',
    position: options?.position ?? { x: 50, y: 50 },
    stops
  };
}
