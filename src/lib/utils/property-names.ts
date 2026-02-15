/**
 * Unified property naming conventions for the animation editor.
 *
 * This module provides a single source of truth for mapping between:
 * - Transform object keys (x, y, z, rotationX, rotationY, rotationZ, scaleX, scaleY)
 * - AnimatableProperty strings (position.x, position.y, position.z, rotation.x, etc.)
 * - Input IDs (transform.position.x, style.opacity, props.xxx)
 *
 * The naming convention:
 * - Transform: camelCase (x, y, z, rotationX, rotationY, rotationZ, scaleX, scaleY)
 * - AnimatableProperty: dot-notation with category prefix (position.x, rotation.x, scale.x, opacity)
 * - Input IDs: dot-notation with group prefix (transform.position.x, style.opacity, props.xxx)
 * - Props: prefix with 'props.' (props.fontSize, props.fill, etc.)
 */

import type { AnimatableProperty } from '$lib/schemas/animation';

// Re-export the type
export type { AnimatableProperty };

// ============================================
// Transform categories (used to derive both keys)
// ============================================

const TRANSFORM_CATEGORIES = {
  POSITION: 'position',
  ROTATION: 'rotation',
  SCALE: 'scale'
} as const;

// ============================================
// Transform object keys (used in Transform type)
// Derived from category + axis
// ============================================

export const TRANSFORM_KEYS = {
  X: 'x',
  Y: 'y',
  Z: 'z',
  ROTATION_X: 'rotationX',
  ROTATION_Y: 'rotationY',
  ROTATION_Z: 'rotationZ',
  SCALE_X: 'scaleX',
  SCALE_Y: 'scaleY'
} as const;

// ============================================
// AnimatableProperty constants (canonical form)
// Derived from category + axis
// ============================================

// Helper to build animatable property from category and axis
function buildAnimatableProperty(
  category: string,
  axis: string
): `position.${string}` | `rotation.${string}` | `scale.${string}` {
  return `${category}.${axis}` as `position.${string}` | `rotation.${string}` | `scale.${string}`;
}

// Generate all animatable properties from transform keys
function generateAnimatableProperties(): Record<string, AnimatableProperty> {
  const props: Record<string, AnimatableProperty> = {};

  // Position
  props[TRANSFORM_KEYS.X] = buildAnimatableProperty(TRANSFORM_CATEGORIES.POSITION, 'x');
  props[TRANSFORM_KEYS.Y] = buildAnimatableProperty(TRANSFORM_CATEGORIES.POSITION, 'y');
  props[TRANSFORM_KEYS.Z] = buildAnimatableProperty(TRANSFORM_CATEGORIES.POSITION, 'z');

  // Rotation
  props[TRANSFORM_KEYS.ROTATION_X] = buildAnimatableProperty(TRANSFORM_CATEGORIES.ROTATION, 'x');
  props[TRANSFORM_KEYS.ROTATION_Y] = buildAnimatableProperty(TRANSFORM_CATEGORIES.ROTATION, 'y');
  props[TRANSFORM_KEYS.ROTATION_Z] = buildAnimatableProperty(TRANSFORM_CATEGORIES.ROTATION, 'z');

  // Scale
  props[TRANSFORM_KEYS.SCALE_X] = buildAnimatableProperty(TRANSFORM_CATEGORIES.SCALE, 'x');
  props[TRANSFORM_KEYS.SCALE_Y] = buildAnimatableProperty(TRANSFORM_CATEGORIES.SCALE, 'y');

  // Style properties
  props['opacity'] = 'opacity';
  props['color'] = 'color';

  return props;
}

// Generate once at module load
const _animatableProps = generateAnimatableProperties();

// Export as constants (frozen)
export const ANIMATABLE_PROPERTIES = {
  POSITION_X: _animatableProps['x'],
  POSITION_Y: _animatableProps['y'],
  POSITION_Z: _animatableProps['z'],
  ROTATION_X: _animatableProps['rotationX'],
  ROTATION_Y: _animatableProps['rotationY'],
  ROTATION_Z: _animatableProps['rotationZ'],
  SCALE_X: _animatableProps['scaleX'],
  SCALE_Y: _animatableProps['scaleY'],
  OPACITY: 'opacity',
  COLOR: 'color'
} as const;

// ============================================
// Mapping: Transform key <-> AnimatableProperty
// ============================================

/**
 * Maps Transform object keys to AnimatableProperty strings
 */
export const TRANSFORM_KEY_TO_PROPERTY: Record<string, AnimatableProperty> = {
  [TRANSFORM_KEYS.X]: ANIMATABLE_PROPERTIES.POSITION_X,
  [TRANSFORM_KEYS.Y]: ANIMATABLE_PROPERTIES.POSITION_Y,
  [TRANSFORM_KEYS.Z]: ANIMATABLE_PROPERTIES.POSITION_Z,
  [TRANSFORM_KEYS.ROTATION_X]: ANIMATABLE_PROPERTIES.ROTATION_X,
  [TRANSFORM_KEYS.ROTATION_Y]: ANIMATABLE_PROPERTIES.ROTATION_Y,
  [TRANSFORM_KEYS.ROTATION_Z]: ANIMATABLE_PROPERTIES.ROTATION_Z,
  [TRANSFORM_KEYS.SCALE_X]: ANIMATABLE_PROPERTIES.SCALE_X,
  [TRANSFORM_KEYS.SCALE_Y]: ANIMATABLE_PROPERTIES.SCALE_Y
};

/**
 * Maps AnimatableProperty strings to Transform object keys
 */
export const PROPERTY_TO_TRANSFORM_KEY: Record<string, string> = {
  [ANIMATABLE_PROPERTIES.POSITION_X]: TRANSFORM_KEYS.X,
  [ANIMATABLE_PROPERTIES.POSITION_Y]: TRANSFORM_KEYS.Y,
  [ANIMATABLE_PROPERTIES.POSITION_Z]: TRANSFORM_KEYS.Z,
  [ANIMATABLE_PROPERTIES.ROTATION_X]: TRANSFORM_KEYS.ROTATION_X,
  [ANIMATABLE_PROPERTIES.ROTATION_Y]: TRANSFORM_KEYS.ROTATION_Y,
  [ANIMATABLE_PROPERTIES.ROTATION_Z]: TRANSFORM_KEYS.ROTATION_Z,
  [ANIMATABLE_PROPERTIES.SCALE_X]: TRANSFORM_KEYS.SCALE_X,
  [ANIMATABLE_PROPERTIES.SCALE_Y]: TRANSFORM_KEYS.SCALE_Y
};

// ============================================
// Input ID helpers
// ============================================

/**
 * Get input ID for a transform property
 */
export function getTransformInputId(property: AnimatableProperty): string {
  return `transform.${property}`;
}

/**
 * Get input ID for a style property
 */
export function getStyleInputId(property: string): string {
  return `style.${property}`;
}

/**
 * Get input ID for a props property
 */
export function getPropsInputId(property: string): string {
  return `props.${property}`;
}

// ============================================
// Property category detection
// ============================================

export type PropertyCategory = 'transform' | 'style' | 'props';

/**
 * Determine the category of an AnimatableProperty
 */
export function getPropertyCategory(property: AnimatableProperty): PropertyCategory {
  if (
    property.startsWith('position.') ||
    property.startsWith('rotation.') ||
    property.startsWith('scale.')
  ) {
    return 'transform';
  }
  if (property.startsWith('props.')) {
    return 'props';
  }
  return 'style'; // opacity, color, etc.
}

/**
 * Check if a property is a built-in transform property
 */
export function isTransformProperty(property: AnimatableProperty): boolean {
  return (
    property.startsWith('position.') ||
    property.startsWith('rotation.') ||
    property.startsWith('scale.')
  );
}

/**
 * Check if a property is a style property (opacity, color)
 */
export function isStyleProperty(property: AnimatableProperty): boolean {
  return property === 'opacity' || property === 'color';
}

/**
 * Check if a property is a custom props property
 */
export function isPropsProperty(property: AnimatableProperty): boolean {
  return property.startsWith('props.');
}

// ============================================
// Property name utilities
// ============================================

/**
 * Get the simple property name without category prefix
 * e.g., 'position.x' -> 'x', 'props.fontSize' -> 'fontSize'
 */
export function getPropertyBaseName(property: AnimatableProperty | string): string {
  if (property.startsWith('props.')) {
    return property.slice(6);
  }
  if (property.includes('.')) {
    return property.split('.').pop() ?? property;
  }
  return property;
}

/**
 * Convert Transform key to AnimatableProperty
 */
export function transformKeyToAnimatable(key: string): AnimatableProperty | undefined {
  return TRANSFORM_KEY_TO_PROPERTY[key];
}

/**
 * Convert AnimatableProperty to Transform key
 */
export function animatableToTransformKey(property: AnimatableProperty): string | undefined {
  return PROPERTY_TO_TRANSFORM_KEY[property];
}

/**
 * Create a props AnimatableProperty from a property name
 */
export function makePropsProperty(name: string): `props.${string}` {
  return `props.${name}`;
}
