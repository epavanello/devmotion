import { fieldRegistry } from '$lib/layers/base';
import type { PropertyMiddleware } from '$lib/layers/registry';
import { z } from 'zod';

/**
 * Creates a size schema with custom default dimensions
 */
export function createSizeSchema(defaultWidth = 200, defaultHeight = 200) {
  return z.object({
    width: z
      .number()
      .min(1)
      .max(2000)
      .default(defaultWidth)
      .describe('Width (px)')
      .register(fieldRegistry, { group: 'size', interpolationFamily: 'continuous' }),
    height: z
      .number()
      .min(1)
      .max(2000)
      .default(defaultHeight)
      .describe('Height (px)')
      .register(fieldRegistry, { group: 'size', interpolationFamily: 'continuous' })
  });
}

/**
 * Basic size schema with width and height (default 200x200)
 * Can be extended with aspect ratio locking by using SizeWithAspectRatioSchema
 */
export const SizeSchema = createSizeSchema();

/**
 * Creates a size schema with aspect ratio locking support and custom default dimensions
 */
export function createSizeWithAspectRatioSchema(defaultWidth = 200, defaultHeight = 200) {
  return createSizeSchema(defaultWidth, defaultHeight).extend({
    _aspectRatioLocked: z
      .boolean()
      .default(false)
      .describe('Aspect ratio locked')
      .register(fieldRegistry, { hidden: true }),
    _aspectRatio: z
      .number()
      .default(1)
      .describe('Aspect ratio value')
      .register(fieldRegistry, { hidden: true })
  });
}

/**
 * Size schema with aspect ratio locking support (default 200x200)
 * Includes hidden fields for aspect ratio state
 */
export const SizeWithAspectRatioSchema = createSizeWithAspectRatioSchema();

/**
 * Middleware for handling aspect ratio locked size updates
 * Automatically adjusts height when width changes (and vice versa) when aspect ratio is locked
 */
export const sizeMiddleware: PropertyMiddleware = (propName, value, currentValues) => {
  const updates: Record<string, unknown> = { [propName]: value };
  const props = currentValues.props;

  if (props._aspectRatioLocked && (propName === 'width' || propName === 'height')) {
    const ratio = (props._aspectRatio as number) || 1;
    if (propName === 'width') {
      updates.height = (value as number) / ratio;
    } else {
      updates.width = (value as number) * ratio;
    }
  }

  return updates;
};

/**
 * Middleware for handling scale proportion locked updates
 * Automatically adjusts scaleY when scaleX changes (and vice versa) when proportions are locked
 */
export const scaleMiddleware: PropertyMiddleware = (propName, value, currentValues) => {
  const updates: Record<string, unknown> = {};
  const props = currentValues.props;

  // Handle nested property names (scale.x, scale.y)
  if (props._scaleLocked && (propName === 'scale.x' || propName === 'scale.y')) {
    const ratio = (props._scaleRatio as number) || 1;
    if (propName === 'scale.x') {
      updates['scale.x'] = value;
      updates['scale.y'] = parseFloat(((value as number) / ratio).toFixed(2));
    } else {
      updates['scale.x'] = parseFloat(((value as number) * ratio).toFixed(2));
      updates['scale.y'] = value;
    }
  } else {
    updates[propName] = value;
  }

  return updates;
};
