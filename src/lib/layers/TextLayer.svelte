<script module lang="ts">
  import { z } from 'zod';

  /**
   * Schema for Text Layer custom properties
   */
  export const TextLayerPropsSchema = z.object({
    content: z.string().default('New Text').describe('Text content'),
    fontSize: z.number().min(8).max(500).default(48).describe('Font size (px)'),
    fontFamily: z.string().default('Arial').describe('Font family'),
    fontWeight: z
      .enum(['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'])
      .default('normal')
      .describe('Font weight'),
    autoWidth: z.boolean().default(true).describe('Auto width'),
    width: z.number().min(10).max(5000).default(400).describe('Width (px)'),
    textAlign: z
      .enum(['left', 'center', 'right'])
      .default('center')
      .describe('Text alignment'),
    color: z.string().default('#ffffff').describe('Text color')
  });

  export type TextLayerProps = z.infer<typeof TextLayerPropsSchema>;
</script>

<script lang="ts">
  let {
    content,
    fontSize,
    fontFamily,
    fontWeight,
    autoWidth,
    width,
    textAlign,
    color
  }: TextLayerProps = $props();
</script>

<div
  class="select-none"
  class:whitespace-nowrap={autoWidth}
  style:font-size="{fontSize}px"
  style:font-family={fontFamily}
  style:font-weight={fontWeight}
  style:color
  style:width={autoWidth ? 'auto' : `${width}px`}
  style:text-align={textAlign}
>
  {content}
</div>
