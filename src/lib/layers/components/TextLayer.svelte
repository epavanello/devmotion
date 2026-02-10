<script module lang="ts">
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';
  import { Type } from '@lucide/svelte';
  import { fieldRegistry } from '../base';

  /**
   * Popular Google Fonts enum
   */
  const GoogleFonts = {
    Inter: 'Inter',
    Roboto: 'Roboto',
    Poppins: 'Poppins',
    Manrope: 'Manrope',
    OpenSans: 'Open Sans',
    Montserrat: 'Montserrat',
    Lato: 'Lato',
    PlayfairDisplay: 'Playfair Display',
    DMSans: 'DM Sans',
    Nunito: 'Nunito',
    Raleway: 'Raleway',
    Merriweather: 'Merriweather',
    SourceSans3: 'Source Sans 3',
    Oswald: 'Oswald',
    Ubuntu: 'Ubuntu',
    WorkSans: 'Work Sans',
    Quicksand: 'Quicksand',
    Mulish: 'Mulish',
    Barlow: 'Barlow',
    Outfit: 'Outfit'
  } as const;

  export type GoogleFont = (typeof GoogleFonts)[keyof typeof GoogleFonts];

  export const googleFontValues = Object.values(GoogleFonts) as [GoogleFont, ...GoogleFont[]];

  /**
   * Generate Google Fonts CSS URL for a given font family
   */
  export function getGoogleFontUrl(fontFamily: GoogleFont): string {
    const encodedFamily = fontFamily.replace(/ /g, '+');
    return `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
  }

  /**
   * Schema for Text Layer custom properties
   */
  const schema = z.object({
    content: z.string().default('New Text').describe('Text content').register(fieldRegistry, {
      interpolationFamily: 'text'
    }),
    fontSize: z.number().min(8).max(500).default(48).describe('Font size (px)'),
    fontFamily: z.enum(googleFontValues).default('Inter').describe('Font family'),
    fontWeight: z
      .enum(['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'])
      .default('normal')
      .describe('Font weight'),
    autoWidth: z.boolean().default(true).describe('Auto width'),
    width: z.number().min(10).max(5000).default(400).describe('Width (px)'),
    textAlign: z.enum(['left', 'center', 'right']).default('center').describe('Text alignment'),
    color: z.string().default('#ffffff').describe('Text color')
  });

  export const meta: LayerMeta = {
    schema,
    type: 'text',
    label: 'Text',
    icon: Type,
    description: 'Styled text with Google Fonts, customizable size, weight, color, and alignment'
  };

  type Props = z.infer<typeof schema>;
</script>

<script lang="ts">
  let { content, fontSize, fontFamily, fontWeight, autoWidth, width, textAlign, color }: Props =
    $props();

  const fontUrl = $derived(getGoogleFontUrl(fontFamily as GoogleFont));
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link rel="stylesheet" href={fontUrl} />
</svelte:head>

<div
  class="select-none"
  class:whitespace-nowrap={autoWidth}
  style:font-size="{fontSize}px"
  style:font-family="'{fontFamily}', sans-serif"
  style:font-weight={fontWeight}
  style:color
  style:width={autoWidth ? 'auto' : `${width}px`}
  style:text-align={textAlign}
>
  {content}
</div>
