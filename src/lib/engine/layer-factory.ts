/**
 * Factory functions for creating layers
 */
import { nanoid } from 'nanoid';
import type { Layer, LayerType, ShapeType } from '$lib/types/animation';

export function createTextLayer(x = 0, y = 0): Layer {
  return {
    id: nanoid(),
    name: 'Text Layer',
    type: 'text',
    transform: {
      position: { x, y, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    },
    style: {
      opacity: 1,
      color: '#ffffff'
    },
    visible: true,
    locked: false,
    keyframes: [],
    textData: {
      content: 'New Text',
      fontSize: 48,
      fontFamily: 'Arial',
      fontWeight: 'normal',
      textAlign: 'center'
    }
  };
}

export function createShapeLayer(shapeType: ShapeType, x = 0, y = 0): Layer {
  const baseLayer: Layer = {
    id: nanoid(),
    name: `${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} Layer`,
    type: 'shape',
    transform: {
      position: { x, y, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    },
    style: {
      opacity: 1,
      color: '#4a90e2',
      fill: '#4a90e2',
      stroke: '#ffffff',
      strokeWidth: 2
    },
    visible: true,
    locked: false,
    keyframes: [],
    shapeData: {
      shapeType,
      width: 200,
      height: 200
    }
  };

  if (shapeType === 'circle') {
    baseLayer.shapeData!.radius = 100;
  } else if (shapeType === 'polygon') {
    baseLayer.shapeData!.sides = 6;
    baseLayer.shapeData!.radius = 100;
  }

  return baseLayer;
}

export function createImageLayer(src: string, x = 0, y = 0): Layer {
  return {
    id: nanoid(),
    name: 'Image Layer',
    type: 'image',
    transform: {
      position: { x, y, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    },
    style: {
      opacity: 1,
      color: '#ffffff'
    },
    visible: true,
    locked: false,
    keyframes: [],
    imageData: {
      src,
      width: 400,
      height: 300
    }
  };
}
