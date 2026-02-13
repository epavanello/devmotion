<script module lang="ts">
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';
  import { Type } from '@lucide/svelte';
  import { fieldRegistry } from '../base';
  import { googleFontValues } from '$lib/utils/fonts';
  import ApplyFont from '$lib/components/font/apply-font.svelte';
  import FontProperty from '../properties/FontProperty.svelte';

  /**
   * Schema for Text Layer custom properties
   */
  const schema = z.object({
    content: z
      .string()
      .default('New Text')
      .describe('Text content')
      .register(fieldRegistry, { interpolationFamily: 'text' }),
    fontSize: z
      .number()
      .min(8)
      .max(500)
      .default(48)
      .describe('Size (px)')
      .register(fieldRegistry, { group: 'typography', interpolationFamily: 'continuous' }),
    fontFamily: z
      .enum(googleFontValues)
      .optional()
      .describe('Font family')
      .register(fieldRegistry, {
        interpolationFamily: 'discrete',
        widget: 'custom',
        component: FontProperty
      }),
    fontWeight: z
      .enum(['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'])
      .default('normal')
      .describe('Weight')
      .register(fieldRegistry, { group: 'typography', interpolationFamily: 'discrete' }),
    color: z.string().default('#ffffff').describe('Color').register(fieldRegistry, {
      group: 'typography',
      interpolationFamily: 'continuous',
      widget: 'color'
    }),
    autoWidth: z
      .boolean()
      .default(true)
      .describe('Auto width')
      .register(fieldRegistry, { interpolationFamily: 'discrete' }),
    width: z
      .number()
      .min(10)
      .max(5000)
      .default(400)
      .describe('Size (px)')
      .register(fieldRegistry, { group: 'layout', interpolationFamily: 'continuous' }),
    textAlign: z
      .enum(['left', 'center', 'right'])
      .default('center')
      .describe('Alignment')
      .register(fieldRegistry, { interpolationFamily: 'discrete' })
  });

  export const meta = {
    category: 'text',
    schema,
    type: 'text',
    label: 'Text',
    icon: Type,
    description: 'Styled text with Google Fonts, customizable size, weight, color, and alignment',

    propertyGroups: [
      { id: 'typography', label: 'Typography' },
      { id: 'layout', label: 'Layout' }
    ]
  } as const satisfies LayerMeta;

  type Props = z.infer<typeof schema>;
</script>

<script lang="ts">
  let { content, fontSize, fontFamily, fontWeight, autoWidth, width, textAlign, color }: Props =
    $props();
</script>

<ApplyFont {fontFamily}>
  <div
    class="select-none"
    class:whitespace-nowrap={autoWidth}
    style:font-size="{fontSize}px"
    style:font-weight={fontWeight}
    style:color
    style:width={autoWidth ? 'auto' : `${width}px`}
    style:text-align={textAlign}
  >
    {content}
  </div>
</ApplyFont>
