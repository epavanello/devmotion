<script module lang="ts">
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';
  import { Square } from '@lucide/svelte';
  import { BackgroundValueSchema, getStyleProperties } from '$lib/schemas/background';
  import { fieldRegistry } from '$lib/layers/properties/field-registry';
  import AspectRatioToggle from '../properties/AspectRatioToggle.svelte';
  import { SizeWithAspectRatioSchema, sizeMiddleware } from '$lib/schemas/size';

  /**
   * Schema for Shape Layer custom properties
   *
   * The `background` property accepts either a solid color or a gradient:
   * - Solid: { type: 'solid', color: '#4a90e2' }
   * - Linear gradient: { type: 'linear', angle: 90, stops: [...] }
   * - Radial gradient: { type: 'radial', shape: 'circle', position: {...}, stops: [...] }
   * - Conic gradient: { type: 'conic', angle: 0, position: {...}, stops: [...] }
   */
  const schema = SizeWithAspectRatioSchema.extend({
    shapeType: z
      .enum(['rectangle', 'ellipse', 'circle', 'triangle', 'polygon'])
      .default('rectangle')
      .describe(
        'The geometric shape type to render. Rectangle = four-sided, Ellipse = oval using width/height, Circle = perfect circle using radius, Triangle = three-pointed, Polygon = multi-sided using sides count. Changes discretely.'
      )
      .register(fieldRegistry, { interpolationFamily: 'discrete', label: 'Shape' }),

    background: BackgroundValueSchema.optional()
      .default('#4a90e2')
      .describe(
        'The fill background of the shape. Supports solid colors (e.g., #4a90e2) or complex gradients (linear, radial, conic with multiple color stops). Changes discretely between different gradient configurations.'
      )
      .register(fieldRegistry, {
        widget: 'background',
        interpolationFamily: 'discrete',
        label: 'Fill'
      }),
    stroke: z
      .string()
      .default('#000000')
      .describe(
        'The outline/border color in hexadecimal format. Draws a line around the shape perimeter. Smoothly animatable for color transitions.'
      )
      .register(fieldRegistry, {
        group: 'stroke',
        interpolationFamily: 'continuous',
        widget: 'color',
        label: 'Stroke'
      }),
    strokeWidth: z
      .number()
      .min(0)
      .max(50)
      .default(2)
      .describe(
        'The thickness of the stroke/outline in pixels. 0 = no stroke, higher values = thicker border. Smoothly animatable.'
      )
      .register(fieldRegistry, {
        group: 'stroke',
        interpolationFamily: 'continuous',
        label: 'Width'
      }),
    borderRadius: z
      .number()
      .min(0)
      .max(500)
      .default(0)
      .optional()
      .describe(
        'The corner radius for rectangles in pixels. 0 = sharp corners, higher values = more rounded. Only applies to rectangle shapes. Smoothly animatable.'
      )
      .register(fieldRegistry, { interpolationFamily: 'continuous', label: 'Corner Radius' }),
    radius: z
      .number()
      .min(0)
      .max(1000)
      .default(100)
      .optional()
      .describe(
        'The radius for circle and polygon shapes in pixels. Determines the size from center to edge. Smoothly animatable for scaling effects.'
      )
      .register(fieldRegistry, { interpolationFamily: 'continuous', label: 'Radius' }),
    sides: z
      .number()
      .min(3)
      .max(12)
      .default(6)
      .optional()
      .describe(
        'The number of sides for polygon shapes. 3 = triangle, 4 = diamond, 6 = hexagon, etc. Can use quantized interpolation (snaps to integers) or continuous (morphs smoothly).'
      )
      .register(fieldRegistry, {
        interpolationFamily: ['quantized', 'continuous'],
        label: 'Sides'
      })
  });

  export const meta = {
    category: 'shape',
    schema,
    type: 'shape',
    label: 'Shape',
    icon: Square,
    description:
      'Geometric shapes (rectangle, ellipse, circle, triangle, polygon) with background and stroke',

    propertyGroups: [
      { id: 'size', label: 'Size', widget: AspectRatioToggle },
      { id: 'stroke', label: 'Stroke' }
    ],

    middleware: sizeMiddleware
  } as const satisfies LayerMeta;

  type Props = z.infer<typeof schema>;
</script>

<script lang="ts">
  let {
    shapeType,
    width,
    height,
    background,
    stroke,
    strokeWidth,
    borderRadius = 0,
    radius = 100,
    sides = 6
  }: Props = $props();

  /**
   * Generate clip-path for triangle
   */
  function getTriangleClipPath(): string {
    return 'polygon(50% 0%, 0% 100%, 100% 100%)';
  }

  /**
   * Generate clip-path for polygon
   */
  function getPolygonClipPath(sides: number): string {
    const points: string[] = [];
    const angleStep = (2 * Math.PI) / sides;

    for (let i = 0; i < sides; i++) {
      const angle = i * angleStep - Math.PI / 2; // Start from top
      const x = 50 + 50 * Math.cos(angle);
      const y = 50 + 50 * Math.sin(angle);
      points.push(`${x}% ${y}%`);
    }

    return `polygon(${points.join(', ')})`;
  }

  const shapeStyles = $derived.by(() => {
    const base = {
      ...getStyleProperties(background),
      border: `${strokeWidth}px solid ${stroke}`
    };

    switch (shapeType) {
      case 'rectangle':
        return {
          ...base,
          width: `${width}px`,
          height: `${height}px`,
          borderRadius: borderRadius > 0 ? `${borderRadius}px` : undefined
        };

      case 'ellipse':
        return {
          ...base,
          width: `${width}px`,
          height: `${height}px`,
          borderRadius: '50%'
        };

      case 'circle':
        return {
          ...base,
          width: `${radius * 2}px`,
          height: `${radius * 2}px`,
          borderRadius: '50%'
        };

      case 'triangle':
        return {
          ...base,
          width: `${width}px`,
          height: `${height}px`,
          clipPath: getTriangleClipPath()
        };

      case 'polygon':
        return {
          ...base,
          width: `${radius * 2}px`,
          height: `${radius * 2}px`,
          clipPath: getPolygonClipPath(sides)
        };

      default:
        return base;
    }
  });
</script>

<div
  style:width={'width' in shapeStyles ? shapeStyles.width : undefined}
  style:height={'height' in shapeStyles ? shapeStyles.height : undefined}
  style:background-color={shapeStyles.backgroundColor}
  style:background-image={shapeStyles.backgroundImage}
  style:border={shapeStyles.border}
  style:border-radius={'borderRadius' in shapeStyles ? shapeStyles.borderRadius : undefined}
  style:clip-path={'clipPath' in shapeStyles ? shapeStyles.clipPath : undefined}
></div>
