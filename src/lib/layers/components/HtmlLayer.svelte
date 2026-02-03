<script module lang="ts">
  /* eslint-disable svelte/no-at-html-tags */
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';
  import { fieldRegistry } from '../base';
  import { Code2 } from 'lucide-svelte';

  /**
   * Schema for HTML Layer custom properties
   * Allows custom HTML/CSS with variable interpolation
   */
  const schema = z.object({
    html: z
      .string()
      .default('<div class="container">Hello World</div>')
      .describe('HTML content - use {{varName}} for variable interpolation')
      .register(fieldRegistry, { widget: 'textarea' }),
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
      .describe('CSS styles (scoped to this layer)')
      .register(fieldRegistry, { widget: 'textarea' }),
    width: z.number().min(10).max(5000).default(400).describe('Container width (px)'),
    height: z.number().min(10).max(5000).default(200).describe('Container height (px)'),
    // Dynamic variables that can be interpolated and animated
    var1: z.string().default('').describe('Variable {{var1}} for interpolation'),
    var2: z.string().default('').describe('Variable {{var2}} for interpolation'),
    var3: z.string().default('').describe('Variable {{var3}} for interpolation'),
    var4: z.string().default('').describe('Variable {{var4}} for interpolation'),
    var5: z.string().default('').describe('Variable {{var5}} for interpolation'),
    // Numeric variables for animations
    num1: z.number().default(0).describe('Numeric variable {{num1}} for animations'),
    num2: z.number().default(0).describe('Numeric variable {{num2}} for animations'),
    num3: z.number().default(0).describe('Numeric variable {{num3}} for animations'),
    // Color variables
    color1: z.string().default('#ffffff').describe('Color variable {{color1}}'),
    color2: z.string().default('#000000').describe('Color variable {{color2}}'),
    // Boolean for conditional rendering
    show1: z.boolean().default(true).describe('Boolean {{show1}} for conditional display'),
    show2: z.boolean().default(true).describe('Boolean {{show2}} for conditional display')
  });

  export const meta: LayerMeta = {
    schema,
    type: 'html',
    label: 'HTML/CSS',
    icon: Code2,
    description: 'Custom HTML/CSS content with variable interpolation for dynamic elements'
  };

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
