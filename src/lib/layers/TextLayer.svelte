<script module lang="ts">
  import { z } from 'zod';

  /**
   * Schema for Text Layer custom properties
   */
  export const TextLayerPropsSchema = z.object({
    content: z.string().describe('Text content'),
    fontSize: z.number().min(8).max(500).describe('Font size (px)'),
    fontFamily: z.string().describe('Font family'),
    fontWeight: z
      .enum(['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'])
      .describe('Font weight'),
    textAlign: z.enum(['left', 'center', 'right']).describe('Text alignment'),
    color: z.string().describe('Text color')
  });

  export type TextLayerProps = z.infer<typeof TextLayerPropsSchema>;
</script>

<script lang="ts">
  let {
    content = 'New Text',
    fontSize = 48,
    fontFamily = 'Arial',
    fontWeight = 'normal',
    textAlign = 'center',
    color = '#ffffff'
  }: TextLayerProps = $props();
</script>

<div
  class="whitespace-nowrap select-none"
  style:font-size="{fontSize}px"
  style:font-family={fontFamily}
  style:font-weight={fontWeight}
  style:text-align={textAlign}
  style:color
>
  {content}
</div>
