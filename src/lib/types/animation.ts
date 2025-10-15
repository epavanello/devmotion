/**
 * Core types for the animation editor
 */

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

export type AnimatableProperty =
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

export interface Keyframe {
  id: string;
  time: number; // in seconds
  property: AnimatableProperty;
  value: number | string;
  easing: Easing;
}

export type LayerType = 'text' | 'shape' | 'image';

export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'polygon';

export interface Transform {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

export interface LayerStyle {
  opacity: number;
  color: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface TextLayerData {
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  textAlign: 'left' | 'center' | 'right';
}

export interface ShapeLayerData {
  shapeType: ShapeType;
  width: number;
  height: number;
  radius?: number;
  sides?: number;
}

export interface ImageLayerData {
  src: string;
  width: number;
  height: number;
}

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  transform: Transform;
  style: LayerStyle;
  visible: boolean;
  locked: boolean;
  keyframes: Keyframe[];
  // Type-specific data
  textData?: TextLayerData;
  shapeData?: ShapeLayerData;
  imageData?: ImageLayerData;
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
  showGrid: boolean;
  showGuides: boolean;
  snapToGrid: boolean;
  gridSize: number;
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
