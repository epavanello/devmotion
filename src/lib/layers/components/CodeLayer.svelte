<script module lang="ts">
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';
  import { Code } from 'lucide-svelte';

  /**
   * Schema for Code Layer custom properties
   * Perfect for showing code snippets in tech videos
   */
  const schema = z.object({
    code: z.string().default('const hello = "world";').describe('Code content'),
    language: z
      .enum(['javascript', 'typescript', 'python', 'html', 'css', 'json', 'bash', 'text'])
      .default('javascript')
      .describe('Programming language'),
    fontSize: z.number().min(10).max(36).default(16).describe('Font size (px)'),
    lineHeight: z.number().min(1).max(3).default(1.5).describe('Line height'),
    width: z.number().min(100).max(1200).default(500).describe('Container width (px)'),
    maxHeight: z.number().min(50).max(800).default(400).describe('Max height (px)'),
    backgroundColor: z.string().default('#1e1e1e').describe('Background color'),
    textColor: z.string().default('#d4d4d4').describe('Text color'),
    keywordColor: z.string().default('#569cd6').describe('Keyword color'),
    stringColor: z.string().default('#ce9178').describe('String color'),
    commentColor: z.string().default('#6a9955').describe('Comment color'),
    numberColor: z.string().default('#b5cea8').describe('Number color'),
    showLineNumbers: z.boolean().default(true).describe('Show line numbers'),
    lineNumberColor: z.string().default('#858585').describe('Line number color'),
    padding: z.number().min(8).max(40).default(20).describe('Padding (px)'),
    borderRadius: z.number().min(0).max(24).default(8).describe('Border radius (px)'),
    showHeader: z.boolean().default(true).describe('Show file header'),
    fileName: z.string().default('index.js').describe('File name in header'),
    headerColor: z.string().default('#2d2d2d').describe('Header background color')
  });

  export const meta: LayerMeta = {
    schema,
    type: 'code',
    label: 'Code Block',
    icon: Code
  };

  type Props = z.infer<typeof schema>;
</script>

<script lang="ts">
  let {
    code,
    language,
    fontSize,
    lineHeight,
    width,
    maxHeight,
    backgroundColor,
    textColor,
    keywordColor,
    stringColor,
    commentColor,
    numberColor,
    showLineNumbers,
    lineNumberColor,
    padding,
    borderRadius,
    showHeader,
    fileName,
    headerColor
  }: Props = $props();

  const lines = $derived(code.split('\n'));

  // Simple syntax highlighting patterns
  const keywords: Record<string, string[]> = {
    javascript: [
      'const',
      'let',
      'var',
      'function',
      'return',
      'if',
      'else',
      'for',
      'while',
      'class',
      'export',
      'import',
      'from',
      'async',
      'await',
      'new',
      'this',
      'true',
      'false',
      'null',
      'undefined'
    ],
    typescript: [
      'const',
      'let',
      'var',
      'function',
      'return',
      'if',
      'else',
      'for',
      'while',
      'class',
      'export',
      'import',
      'from',
      'async',
      'await',
      'new',
      'this',
      'true',
      'false',
      'null',
      'undefined',
      'type',
      'interface',
      'extends',
      'implements'
    ],
    python: [
      'def',
      'class',
      'return',
      'if',
      'else',
      'elif',
      'for',
      'while',
      'import',
      'from',
      'as',
      'True',
      'False',
      'None',
      'and',
      'or',
      'not',
      'in',
      'is',
      'try',
      'except',
      'with'
    ],
    html: ['html', 'head', 'body', 'div', 'span', 'p', 'a', 'img', 'script', 'style', 'link'],
    css: [
      'color',
      'background',
      'margin',
      'padding',
      'border',
      'font',
      'display',
      'flex',
      'grid',
      'position'
    ],
    json: [],
    bash: ['echo', 'cd', 'ls', 'mkdir', 'rm', 'cp', 'mv', 'cat', 'grep', 'npm', 'yarn', 'pnpm'],
    text: []
  };

  function highlightLine(line: string, lang: string): string {
    let highlighted = line
      // Escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Highlight strings
    highlighted = highlighted.replace(
      /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g,
      `<span style="color: ${stringColor}">$&</span>`
    );

    // Highlight comments
    highlighted = highlighted.replace(
      /(\/\/.*|#.*|\/\*[\s\S]*?\*\/)/g,
      `<span style="color: ${commentColor}">$&</span>`
    );

    // Highlight numbers
    highlighted = highlighted.replace(
      /\b(\d+\.?\d*)\b/g,
      `<span style="color: ${numberColor}">$1</span>`
    );

    // Highlight keywords
    const langKeywords = keywords[lang] || [];
    for (const keyword of langKeywords) {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
      highlighted = highlighted.replace(regex, `<span style="color: ${keywordColor}">$1</span>`);
    }

    return highlighted;
  }
</script>

<div
  class="overflow-hidden font-mono"
  style:width="{width}px"
  style:max-height="{maxHeight}px"
  style:background-color={backgroundColor}
  style:border-radius="{borderRadius}px"
>
  {#if showHeader}
    <div class="flex items-center gap-2 px-4 py-2" style:background-color={headerColor}>
      <div class="flex gap-1.5">
        <div class="h-3 w-3 rounded-full bg-red-500"></div>
        <div class="h-3 w-3 rounded-full bg-yellow-500"></div>
        <div class="h-3 w-3 rounded-full bg-green-500"></div>
      </div>
      <span class="ml-2 text-xs" style:color={lineNumberColor}>{fileName}</span>
    </div>
  {/if}

  <div
    class="overflow-auto"
    style:padding="{padding}px"
    style:font-size="{fontSize}px"
    style:line-height={lineHeight}
    style:color={textColor}
  >
    <table class="w-full border-collapse">
      <tbody>
        {#each lines as line, i (i)}
          <tr>
            {#if showLineNumbers}
              <td
                class="pr-4 text-right align-top select-none"
                style:color={lineNumberColor}
                style:min-width="2em"
              >
                {i + 1}
              </td>
            {/if}
            <td class="whitespace-pre">
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html highlightLine(line, language)}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
