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
  stops: z.array(ColorStopSchema).min(2).describe('Color stops (minimum 2)')
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
  stops: z.array(ColorStopSchema).min(2).describe('Color stops (minimum 2)')
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
  stops: z.array(ColorStopSchema).min(2).describe('Color stops (minimum 2)')
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
 * Convert a BackgroundValue to a CSS background / background-image string
 */
export function backgroundValueToCSS(value: BackgroundValue): string {
  if (isSolid(value)) {
    return value;
  }

  if (value.type === 'linear') {
    const stops = value.stops.map((s) => `${s.color} ${s.position}%`).join(', ');
    return `linear-gradient(${value.angle}deg, ${stops})`;
  }

  if (value.type === 'radial') {
    const stops = value.stops.map((s) => `${s.color} ${s.position}%`).join(', ');
    const pos = `${value.position.x}% ${value.position.y}%`;
    return `radial-gradient(${value.shape} ${value.size} at ${pos}, ${stops})`;
  }

  if (value.type === 'conic') {
    const stops = value.stops.map((s) => `${s.color} ${s.position}%`).join(', ');
    const pos = `${value.position.x}% ${value.position.y}%`;
    return `conic-gradient(from ${value.angle}deg at ${pos}, ${stops})`;
  }

  return '#000000';
}

/**
 * Get style properties for a background value
 */
export function getStyleProperties(value: BackgroundValue) {
  return {
    backgroundImage: getBackgroundImage(value),
    backgroundColor: getBackgroundColor(value)
  };
}

export function getBackgroundColor(value: BackgroundValue) {
  if (isSolid(value)) {
    return value;
  }

  return 'transparent';
}

export function getBackgroundImage(value: BackgroundValue) {
  if (isSolid(value)) {
    return 'none';
  }

  return backgroundValueToCSS(value);
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
