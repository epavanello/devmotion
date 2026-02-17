<script module lang="ts">
  /* eslint-disable svelte/no-at-html-tags */
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';
  import { fieldRegistry } from '$lib/layers/properties/field-registry';
  import { Code2 } from '@lucide/svelte';
  import { sizeMiddleware } from '$lib/schemas/size';
  import AspectRatioToggle from '../properties/AspectRatioToggle.svelte';

  /**
   * Schema for HTML Layer custom properties
   * Allows custom HTML/CSS with variable interpolation
   */
  const schema = z.object({
    html: z
      .string()
      .default('<div class="container">Hello World</div>')
      .describe(
        'The HTML markup to render. Use standard HTML tags. Reference variables with {{varName}} syntax: {{var1}}–{{var5}} for text, {{num1}}–{{num3}} for numbers, {{color1}}/{{color2}} for colors, {{show1}}/{{show2}} for visibility (block/none). HTML is sanitized for security.'
      )
      .register(fieldRegistry, {
        widget: 'textarea',
        interpolationFamily: 'discrete',
        label: 'HTML'
      }),
    css: z
      .string()
      .default(
        `.container {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  font-family: 'Inter', sans-serif;
}`
      )
      .describe(
        'The CSS styles scoped to this layer. Selectors are automatically namespaced so they only affect this layer. Use {{varName}} for variable interpolation in CSS values too (e.g., color: {{color1}}).'
      )
      .register(fieldRegistry, {
        widget: 'textarea',
        interpolationFamily: 'discrete',
        label: 'CSS'
      }),
    width: z
      .number()
      .min(10)
      .max(5000)
      .default(400)
      .describe(
        'The width of the HTML container in pixels. Also accessible in HTML/CSS via {{width}}. Smoothly animatable.'
      )
      .register(fieldRegistry, {
        group: 'size',
        interpolationFamily: 'continuous',
        label: 'Width'
      }),
    height: z
      .number()
      .min(10)
      .max(5000)
      .default(200)
      .describe(
        'The height of the HTML container in pixels. Also accessible in HTML/CSS via {{height}}. Smoothly animatable.'
      )
      .register(fieldRegistry, {
        group: 'size',
        interpolationFamily: 'continuous',
        label: 'Height'
      }),
    var1: z
      .string()
      .default('')
      .describe(
        'Text variable injected into HTML/CSS via {{var1}}. Animatable with text interpolation (typewriter reveal). Use for dynamic labels, counters, or any text content.'
      )
      .register(fieldRegistry, { interpolationFamily: 'text', label: 'var1' }),
    var2: z
      .string()
      .default('')
      .describe(
        'Text variable injected into HTML/CSS via {{var2}}. Animatable with text interpolation. Use for secondary dynamic text content.'
      )
      .register(fieldRegistry, { interpolationFamily: 'text', label: 'var2' }),
    var3: z
      .string()
      .default('')
      .describe(
        'Text variable injected into HTML/CSS via {{var3}}. Animatable with text interpolation. Use for tertiary dynamic text content.'
      )
      .register(fieldRegistry, { interpolationFamily: 'text', label: 'var3' }),
    var4: z
      .string()
      .default('')
      .describe(
        'Text variable injected into HTML/CSS via {{var4}}. Animatable with text interpolation.'
      )
      .register(fieldRegistry, { interpolationFamily: 'text', label: 'var4' }),
    var5: z
      .string()
      .default('')
      .describe(
        'Text variable injected into HTML/CSS via {{var5}}. Animatable with text interpolation.'
      )
      .register(fieldRegistry, { interpolationFamily: 'text', label: 'var5' }),
    num1: z
      .number()
      .default(0)
      .describe(
        'Numeric variable injected into HTML/CSS via {{num1}}. Smoothly animatable with continuous interpolation. Use for counters, percentages, progress bars, or any animated numeric value.'
      )
      .register(fieldRegistry, { interpolationFamily: 'continuous', label: 'num1' }),
    num2: z
      .number()
      .default(0)
      .describe(
        'Numeric variable injected into HTML/CSS via {{num2}}. Smoothly animatable. Use for a secondary animated number.'
      )
      .register(fieldRegistry, { interpolationFamily: 'continuous', label: 'num2' }),
    num3: z
      .number()
      .default(0)
      .describe(
        'Numeric variable injected into HTML/CSS via {{num3}}. Smoothly animatable. Use for a third animated number.'
      )
      .register(fieldRegistry, { interpolationFamily: 'continuous', label: 'num3' }),
    color1: z
      .string()
      .default('#ffffff')
      .describe(
        'Color variable injected into HTML/CSS via {{color1}} as a hex string. Smoothly animatable between colors. Use for animated theme colors, highlights, or backgrounds in CSS.'
      )
      .register(fieldRegistry, { interpolationFamily: 'continuous', label: 'color1' }),
    color2: z
      .string()
      .default('#000000')
      .describe(
        'Color variable injected into HTML/CSS via {{color2}} as a hex string. Smoothly animatable between colors. Use for a secondary animated color.'
      )
      .register(fieldRegistry, { interpolationFamily: 'continuous', label: 'color2' }),
    show1: z
      .boolean()
      .default(true)
      .describe(
        'Boolean variable injected into HTML/CSS via {{show1}} as "block" (true) or "none" (false). Use for conditional CSS display to show/hide elements. Changes discretely.'
      )
      .register(fieldRegistry, { interpolationFamily: 'discrete', label: 'show1' }),
    show2: z
      .boolean()
      .default(true)
      .describe(
        'Boolean variable injected into HTML/CSS via {{show2}} as "block" (true) or "none" (false). Use for a secondary conditional element visibility. Changes discretely.'
      )
      .register(fieldRegistry, { interpolationFamily: 'discrete', label: 'show2' }),
    _aspectRatioLocked: z
      .boolean()
      .default(false)
      .describe('Internal property: whether aspect ratio is locked during resize')
      .register(fieldRegistry, { hidden: true }),
    _aspectRatio: z
      .number()
      .default(1)
      .describe('Internal property: stored aspect ratio value when locked')
      .register(fieldRegistry, { hidden: true })
  });

  export const meta = {
    category: 'code',
    schema,
    type: 'html',
    label: 'HTML/CSS',
    icon: Code2,
    description: 'Custom HTML/CSS content with variable interpolation for dynamic elements',

    propertyGroups: [
      { id: 'size', label: 'Size', widget: AspectRatioToggle },
      { id: 'variables', label: 'Variables' }
    ],

    middleware: sizeMiddleware
  } as const satisfies LayerMeta;

  type Props = z.infer<typeof schema>;
</script>

<script lang="ts">
  import DOMPurify from 'dompurify';

  let {
    html,
    css,
    width,
    height,
    var1,
    var2,
    var3,
    var4,
    var5,
    num1,
    num2,
    num3,
    color1,
    color2,
    show1,
    show2
  }: Props = $props();

  // Generate unique scope ID for CSS isolation
  const scopeId = `html-layer-${Math.random().toString(36).slice(2, 9)}`;

  /**
   * Interpolate variables in HTML content
   */
  function interpolateVariables(content: string): string {
    return content
      .replace(/\{\{var1\}\}/g, var1)
      .replace(/\{\{var2\}\}/g, var2)
      .replace(/\{\{var3\}\}/g, var3)
      .replace(/\{\{var4\}\}/g, var4)
      .replace(/\{\{var5\}\}/g, var5)
      .replace(/\{\{num1\}\}/g, String(num1))
      .replace(/\{\{num2\}\}/g, String(num2))
      .replace(/\{\{num3\}\}/g, String(num3))
      .replace(/\{\{color1\}\}/g, color1)
      .replace(/\{\{color2\}\}/g, color2)
      .replace(/\{\{show1\}\}/g, show1 ? 'block' : 'none')
      .replace(/\{\{show2\}\}/g, show2 ? 'block' : 'none')
      .replace(/\{\{width\}\}/g, String(width))
      .replace(/\{\{height\}\}/g, String(height));
  }

  /**
   * Scope CSS selectors to this layer
   */
  function scopeCSS(cssContent: string): string {
    // Add scope ID to all selectors
    return cssContent.replace(/([^{}]+)\{/g, (_match, selector) => {
      const scopedSelectors = selector
        .split(',')
        .map((s: string) => {
          s = s.trim();
          if (s.startsWith('@') || s.startsWith(':root')) return s;
          return `#${scopeId} ${s}`;
        })
        .join(', ');
      return `${scopedSelectors} {`;
    });
  }

  // Sanitize and process HTML
  const processedHtml = $derived.by(() => {
    const interpolated = interpolateVariables(html);
    // Sanitize HTML to prevent XSS
    return DOMPurify.sanitize(interpolated, {
      ALLOWED_TAGS: [
        'div',
        'span',
        'p',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'strong',
        'em',
        'b',
        'i',
        'u',
        'br',
        'hr',
        'ul',
        'ol',
        'li',
        'table',
        'tr',
        'td',
        'th',
        'thead',
        'tbody',
        'img',
        'svg',
        'path',
        'circle',
        'rect',
        'line',
        'polygon',
        'a',
        'button',
        'input',
        'label',
        'form',
        'header',
        'footer',
        'nav',
        'main',
        'section',
        'article',
        'aside',
        'figure',
        'figcaption',
        'blockquote',
        'pre',
        'code'
      ],
      ALLOWED_ATTR: [
        'class',
        'id',
        'style',
        'src',
        'alt',
        'href',
        'target',
        'width',
        'height',
        'viewBox',
        'd',
        'fill',
        'stroke',
        'stroke-width',
        'cx',
        'cy',
        'r',
        'x',
        'y',
        'x1',
        'y1',
        'x2',
        'y2',
        'points',
        'type',
        'value',
        'placeholder',
        'disabled',
        'readonly',
        'data-*',
        'aria-*',
        'role'
      ]
    });
  });

  // Process CSS with scoping and variable interpolation
  const processedCSS = $derived.by(() => {
    const interpolated = interpolateVariables(css);
    return scopeCSS(interpolated);
  });
</script>

<svelte:head>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html `${'<'}style>${processedCSS}</style>`}
</svelte:head>

<div id={scopeId} class="html-layer-container" style:width="{width}px" style:height="{height}px">
  {@html processedHtml}
</div>

<style>
  .html-layer-container {
    position: relative;
    overflow: visible;
  }
</style>
