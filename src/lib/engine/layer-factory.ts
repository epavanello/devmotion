/**
 * Generic layer factory using the component registry
 */
import { nanoid } from 'nanoid';
import type { Layer, LayerType, Keyframe, Easing } from '$lib/types/animation';
import { getLayerDefinition } from '$lib/layers/registry';
import { extractDefaultValues } from '$lib/layers/base';

/**
 * Default easing for initial keyframes
 */
const defaultEasing: Easing = { type: 'ease-in-out' };

/**
 * Create a new layer of the specified type
 * @param type - The layer type from the registry
 * @param propsOverrides - Optional props to override defaults
 * @param position - Initial position {x, y}
 */
export function createLayer(
  type: LayerType,
  propsOverrides: Record<string, unknown> = {},
  position: { x?: number; y?: number } = {}
): Layer {
  const { x = 0, y = 0 } = position;
  const definition = getLayerDefinition(type);

  // Extract default values from the Zod schema
  const defaultProps = extractDefaultValues(definition.customPropsSchema);

  // Create initial keyframes for position properties
  const initialKeyframes: Keyframe[] = [
    {
      id: nanoid(),
      time: 0,
      property: 'position.x',
      value: x,
      easing: defaultEasing
    },
    {
      id: nanoid(),
      time: 0,
      property: 'position.y',
      value: y,
      easing: defaultEasing
    }
  ];

  return {
    id: nanoid(),
    name: `${definition.displayName} Layer`,
    type,
    transform: {
      x,
      y,
      z: 0,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1,
      anchor: 'center'
    },
    style: {
      opacity: 1
    },
    visible: true,
    locked: false,
    keyframes: initialKeyframes,
    props: {
      ...defaultProps,
      ...propsOverrides
    }
  };
}

// ============================================
// Convenience functions for common layer types
// ============================================

/**
 * Create a text layer
 */
export function createTextLayer(
  content: string = 'New Text',
  options: {
    x?: number;
    y?: number;
    fontSize?: number;
    color?: string;
    fontWeight?: string;
    fontFamily?: string;
  } = {}
): Layer {
  const {
    x = 0,
    y = 0,
    fontSize = 48,
    color = '#ffffff',
    fontWeight = 'normal',
    fontFamily = 'Inter'
  } = options;
  return createLayer('text', { content, fontSize, color, fontWeight, fontFamily }, { x, y });
}

/**
 * Create a shape layer
 */
export function createShapeLayer(
  shapeType: 'rectangle' | 'circle' | 'triangle' | 'polygon' = 'rectangle',
  options: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fill?: string;
  } = {}
): Layer {
  const { x = 0, y = 0, width = 200, height = 200, fill = '#4a90e2' } = options;
  return createLayer('shape', { shapeType, width, height, fill }, { x, y });
}

/**
 * Create an icon layer
 */
export function createIconLayer(
  icon: string = 'star',
  options: {
    x?: number;
    y?: number;
    size?: number;
    color?: string;
    backgroundColor?: string;
    backgroundRadius?: number;
    backgroundPadding?: number;
  } = {}
): Layer {
  const {
    x = 0,
    y = 0,
    size = 64,
    color = '#ffffff',
    backgroundColor = 'transparent',
    backgroundRadius = 0,
    backgroundPadding = 0
  } = options;
  return createLayer(
    'icon',
    { icon, size, color, backgroundColor, backgroundRadius, backgroundPadding },
    { x, y }
  );
}

/**
 * Create a button layer
 */
export function createButtonLayer(
  text: string = 'Click me',
  options: {
    x?: number;
    y?: number;
    backgroundColor?: string;
    textColor?: string;
    width?: number;
    height?: number;
    borderRadius?: number;
  } = {}
): Layer {
  const {
    x = 0,
    y = 0,
    backgroundColor = '#3b82f6',
    textColor = '#ffffff',
    width = 160,
    height = 48,
    borderRadius = 8
  } = options;
  return createLayer(
    'button',
    { text, backgroundColor, textColor, width, height, borderRadius },
    { x, y }
  );
}

/**
 * Create a progress layer
 */
export function createProgressLayer(
  progress: number = 75,
  options: {
    x?: number;
    y?: number;
    width?: number;
    progressColor?: string;
    backgroundColor?: string;
  } = {}
): Layer {
  const {
    x = 0,
    y = 0,
    width = 300,
    progressColor = '#3b82f6',
    backgroundColor = '#333333'
  } = options;
  return createLayer('progress', { progress, width, progressColor, backgroundColor }, { x, y });
}

/**
 * Create a divider layer
 */
export function createDividerLayer(
  options: {
    x?: number;
    y?: number;
    length?: number;
    thickness?: number;
    color?: string;
    orientation?: 'horizontal' | 'vertical';
  } = {}
): Layer {
  const {
    x = 0,
    y = 0,
    length = 200,
    thickness = 2,
    color = '#ffffff',
    orientation = 'horizontal'
  } = options;
  return createLayer('divider', { length, thickness, color, orientation }, { x, y });
}

/**
 * Create a terminal layer
 */
export function createTerminalLayer(
  content: string = '$ Welcome to terminal',
  options: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    title?: string;
  } = {}
): Layer {
  const { x = 0, y = 0, width = 600, height = 400, title = 'Terminal' } = options;
  return createLayer('terminal', { content, width, height, title }, { x, y });
}

/**
 * Create a code layer
 */
export function createCodeLayer(
  code: string = 'const hello = "world";',
  options: {
    x?: number;
    y?: number;
    width?: number;
    language?: string;
    fileName?: string;
  } = {}
): Layer {
  const { x = 0, y = 0, width = 500, language = 'javascript', fileName = 'index.js' } = options;
  return createLayer('code', { code, width, language, fileName }, { x, y });
}

/**
 * Create a phone mockup layer
 */
export function createPhoneLayer(
  url: string = 'https://example.com',
  options: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  } = {}
): Layer {
  const { x = 0, y = 0, width = 375, height = 667 } = options;
  return createLayer('phone', { url, width, height }, { x, y });
}

/**
 * Create a browser mockup layer
 */
export function createBrowserLayer(
  url: string = 'https://example.com',
  options: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  } = {}
): Layer {
  const { x = 0, y = 0, width = 800, height = 500 } = options;
  return createLayer('browser', { url, width, height }, { x, y });
}

/**
 * Create a mouse cursor layer
 */
export function createMouseLayer(
  options: {
    x?: number;
    y?: number;
    pointerType?: 'arrow' | 'pointer' | 'hand' | 'crosshair' | 'text';
    color?: string;
  } = {}
): Layer {
  const { x = 0, y = 0, pointerType = 'arrow', color = '#ffffff' } = options;
  return createLayer('mouse', { pointerType, color }, { x, y });
}
