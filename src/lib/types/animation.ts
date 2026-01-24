/**
 * Core types for the animation editor
 */
import type { LayerType } from '$lib/layers/registry';

// Re-export LayerType for convenience
export type { LayerType };

export type EasingType = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier';

export interface CubicBezierPoints {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Easing {
  type: EasingType;
  bezier?: CubicBezierPoints;
}

/**
 * Built-in animatable properties for transform and style
 */
export type BuiltInAnimatableProperty =
  | 'position.x'
  | 'position.y'
  | 'position.z'
  | 'scale.x'
  | 'scale.y'
  | 'scale.z'
  | 'rotation.x'
  | 'rotation.y'
  | 'rotation.z'
  | 'opacity'
  | 'color';

/**
 * Dynamic props property (e.g., props.fontSize, props.fill)
 */
export type PropsAnimatableProperty = `props.${string}`;

/**
 * All animatable properties - built-in or dynamic props
 */
export type AnimatableProperty = BuiltInAnimatableProperty | PropsAnimatableProperty;

/**
 * Interpolation type for a property
 * - 'number': Linear interpolation between numeric values
 * - 'color': Color interpolation in RGB space
 * - 'discrete': Jump to new value (no interpolation)
 */
export type InterpolationType = 'number' | 'color' | 'discrete';

export interface Keyframe {
  id: string;
  time: number; // in seconds
  property: AnimatableProperty;
  value: number | string | boolean;
  easing: Easing;
}

/**
 * Transform properties using flat structure (aligned with BaseTransform in layers/base.ts)
 */
export interface Transform {
  x: number;
  y: number;
  z: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
}

/**
 * Base style properties shared by all layers
 */
export interface LayerStyle {
  opacity: number;
}

/**
 * Generic Layer - component-based architecture
 * Props are defined and validated by each layer component's Zod schema
 */
export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  transform: Transform;
  style: LayerStyle;
  visible: boolean;
  locked: boolean;
  keyframes: Keyframe[];
  /**
   * Layer-specific properties validated by the component's Zod schema.
   * Use getLayerSchema(layer.type) from registry to get the schema for validation.
   */
  props: Record<string, unknown>;
}

export interface Project {
  id: string;
  name: string;
  width: number; // canvas width
  height: number; // canvas height
  duration: number; // in seconds
  fps: number;
  backgroundColor: string;
  layers: Layer[];
  currentTime: number;
}

export interface ViewportSettings {
  zoom: number;
  pan: { x: number; y: number };
  showGuides: boolean;
  snapToGrid: boolean;
}

export interface AnimationPreset {
  id: string;
  name: string;
  keyframes: Omit<Keyframe, 'id'>[];
}

export interface ExportSettings {
  format: 'mp4' | 'webm' | 'json';
  quality: 'low' | 'medium' | 'high';
  fps: number;
  width: number;
  height: number;
}
