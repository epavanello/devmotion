<script lang="ts">
  import type { TypedLayer } from '$lib/layers/typed-registry';
  import Button from '$lib/components/ui/button/button.svelte';
  import ScrubInput from '$lib/components/editor/panels/scrub-input.svelte';
  import { Trash2 } from '@lucide/svelte';
  import * as ButtonGroup from '$lib/components/ui/button-group';
  import * as InputGroup from '$lib/components/ui/input-group';

  type CaptionWord = {
    word: string;
    start: number;
    end: number;
  };

  let {
    value,
    onChange,
    layer: _layer
  }: { value: unknown; onChange: (value: unknown) => void; layer: TypedLayer } = $props();

  // Ensure value is an array of caption words
  let words = $derived(Array.isArray(value) ? (value as CaptionWord[]) : []);

  function updateWord(index: number, updates: Partial<CaptionWord>) {
    const newWords = [...words];
    newWords[index] = { ...newWords[index], ...updates };
    onChange(newWords);
  }

  function deleteWord(index: number) {
    const newWords = words.filter((_, i) => i !== index);
    onChange(newWords);
  }

  // Get min/max constraints for a word's timeline based on siblings
  function getTimeConstraints(index: number, field: 'start' | 'end') {
    const prevWord = index > 0 ? words[index - 1] : null;
    const nextWord = index < words.length - 1 ? words[index + 1] : null;
    const currentWord = words[index];

    if (field === 'start') {
      return {
        min: prevWord ? prevWord.end : 0,
        max: currentWord.end - 0.01
      };
    } else {
      // field === 'end'
      return {
        min: currentWord.start + 0.01,
        max: nextWord ? nextWord.start : undefined
      };
    }
  }
</script>

<div class="space-y-2">
  {#if words.length > 0}
    {#each words as word, index (index)}
      {@const startConstraints = getTimeConstraints(index, 'start')}
      {@const endConstraints = getTimeConstraints(index, 'end')}
      <!-- Word text -->
      <ButtonGroup.Root>
        <!-- Start time -->
        <InputGroup.Root>
          <InputGroup.Input
            value={word.word}
            oninput={(e) => updateWord(index, { word: e.currentTarget.value })}
            placeholder="Word"
            class="h-8 text-sm"
          />
        </InputGroup.Root>

        <ScrubInput
          id="start-{index}"
          value={word.start}
          step={0.01}
          min={startConstraints.min}
          max={startConstraints.max}
          onchange={(v) => updateWord(index, { start: v })}
        />
        <ScrubInput
          id="end-{index}"
          value={word.end}
          step={0.01}
          min={endConstraints.min}
          max={endConstraints.max}
          onchange={(v) => updateWord(index, { end: v })}
        />
        <!-- Delete button -->
        <Button
          variant="outline"
          size="icon"
          onclick={() => deleteWord(index)}
          title="Delete word"
          icon={Trash2}
        />
      </ButtonGroup.Root>
    {/each}
  {:else}
    <div class="rounded border border-dashed p-4 text-center text-sm text-muted-foreground">
      No captions yet. Generate them using AI or add words manually.
    </div>
  {/if}
</div>
