<script module lang="ts">
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';
  import { Code } from '@lucide/svelte';

  /**
   * Schema for Code Layer custom properties
   * Perfect for showing code snippets in tech videos
   */
  const schema = z.object({
    code: z
      .string()
      .default('const hello = "world";')
      .describe(
        'The source code content to display with syntax highlighting. Write multi-line code using newlines. Supports all languages defined by the language property.'
      ),
    language: z
      .enum(['javascript', 'typescript', 'python', 'html', 'css', 'json', 'bash', 'text'])
      .default('javascript')
      .describe(
        'The programming language for syntax highlighting. Determines which keywords, strings, and comments are colored. Use "text" for plain text with no highlighting.'
      ),
    fontSize: z
      .number()
      .min(10)
      .max(36)
      .default(16)
      .describe(
        'The font size of the code text in pixels. Larger values improve readability for presentations. Uses a monospace font.'
      ),
    lineHeight: z
      .number()
      .min(1)
      .max(3)
      .default(1.5)
      .describe(
        'The vertical spacing between code lines as a multiplier. 1.0 = compact, 1.5 = comfortable, 2.0 = spacious. Affects readability.'
      ),
    width: z
      .number()
      .min(100)
      .max(1200)
      .default(500)
      .describe(
        'The total width of the code editor window in pixels. Should be wide enough to fit the longest line without horizontal scrolling.'
      ),
    maxHeight: z
      .number()
      .min(50)
      .max(800)
      .default(400)
      .describe(
        'The maximum height of the code content area in pixels. Content beyond this height is scrollable but not visible in the static render.'
      ),
    backgroundColor: z
      .string()
      .default('#1e1e1e')
      .describe(
        'The background color of the code editor body in hexadecimal. Default is VS Code dark theme (#1e1e1e). Use lighter colors for light themes.'
      ),
    textColor: z
      .string()
      .default('#d4d4d4')
      .describe(
        'The default text color for code that does not match any syntax rule in hexadecimal. Should contrast with the background color.'
      ),
    keywordColor: z
      .string()
      .default('#569cd6')
      .describe(
        'The color for language keywords (const, let, function, if, class, etc.) in hexadecimal. Default is VS Code blue (#569cd6).'
      ),
    stringColor: z
      .string()
      .default('#ce9178')
      .describe(
        'The color for string literals (quoted text) in hexadecimal. Default is VS Code orange-brown (#ce9178).'
      ),
    commentColor: z
      .string()
      .default('#6a9955')
      .describe(
        'The color for code comments (// line comments, /* block comments */, # python comments) in hexadecimal. Default is VS Code green (#6a9955).'
      ),
    numberColor: z
      .string()
      .default('#b5cea8')
      .describe(
        'The color for numeric literals (integers, floats) in hexadecimal. Default is VS Code light green (#b5cea8).'
      ),
    showLineNumbers: z
      .boolean()
      .default(true)
      .describe(
        'Whether to display line numbers in a gutter on the left side of the code. Useful for referencing specific lines in presentations.'
      ),
    lineNumberColor: z
      .string()
      .default('#858585')
      .describe(
        'The color of the line number text in the gutter in hexadecimal. Should be subtle/dimmed relative to code content.'
      ),
    padding: z
      .number()
      .min(8)
      .max(40)
      .default(20)
      .describe(
        'The inner padding around the code content in pixels. More padding = more breathing room around the code.'
      ),
    borderRadius: z
      .number()
      .min(0)
      .max(24)
      .default(8)
      .describe(
        'The corner radius of the code editor window in pixels. 0 = sharp corners, higher = more rounded. Matches typical code editor window styles.'
      ),
    showHeader: z
      .boolean()
      .default(true)
      .describe(
        'Whether to show the editor window header bar with traffic light buttons and file name. Mimics a real code editor window chrome.'
      ),
    fileName: z
      .string()
      .default('index.js')
      .describe(
        'The file name displayed in the header bar of the code editor window. Should match the language (e.g., "script.py" for python, "styles.css" for css).'
      ),
    headerColor: z
      .string()
      .default('#2d2d2d')
      .describe(
        'The background color of the header/title bar of the code editor window in hexadecimal. Should be slightly different from the body background.'
      )
  });

  export const meta = {
    category: 'code',
    schema,
    type: 'code',
    label: 'Code Block',
    icon: Code,
    description:
      'Code editor window with syntax highlighting for multiple languages and line numbers'
  } as const satisfies LayerMeta;

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
