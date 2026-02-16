/**
 * Unified property naming conventions for the animation editor.
 *
 * This module provides a single source of truth for mapping between:
 * - Transform object keys (nested: rotation.x, scale.x)
 * - AnimatableProperty strings (position.x, rotation.x, scale.x)
 * - Input IDs (transform.position.x, style.opacity, props.xxx)
 *
 * The naming convention:
 * - Transform: nested object (rotation: {x, y, z}, scale: {x, y})
 * - AnimatableProperty: dot-notation with category prefix (position.x, rotation.x, scale.x, opacity)
 * - Input IDs: dot-notation with group prefix (transform.position.x, style.opacity, props.xxx)
 * - Props: prefix with 'props.' (props.fontSize, props.fill, etc.)
 */

import type { AnimatableProperty } from '$lib/schemas/animation';

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
