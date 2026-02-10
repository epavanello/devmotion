import { fieldRegistry } from '$lib/layers/base';
import { z } from 'zod';

/**
 * Basic size schema with width and height
 * Can be extended with aspect ratio locking by using SizeWithAspectRatioSchema
 */
export const SizeSchema = z.object({
  width: z
    .number()
    .min(1)
    .max(2000)
    .default(200)
    .describe('Width (px)')
    .register(fieldRegistry, { group: 'size', interpolationFamily: 'continuous' }),
  height: z
    .number()
    .min(1)
    .max(2000)
    .default(200)
    .describe('Height (px)')
    .register(fieldRegistry, { group: 'size', interpolationFamily: 'continuous' })
});

/**
 * Size schema with aspect ratio locking support
 * Includes hidden fields for aspect ratio state
 */
export const SizeWithAspectRatioSchema = SizeSchema.extend({
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

/**
 * Middleware for handling aspect ratio locked size updates
 * Automatically adjusts height when width changes (and vice versa) when aspect ratio is locked
 */
export function sizeMiddleware(
  propName: string,
  value: unknown,
  currentValues: { props: Record<string, unknown> }
): Record<string, unknown> {
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
}
