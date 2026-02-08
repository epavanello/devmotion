<script lang="ts">
  import * as InputGroup from '$lib/components/ui/input-group';
  import { GripVertical } from '@lucide/svelte';
  import { cn } from '$lib/utils';

  interface Props {
    id?: string;
    value: number;
    step?: number;
    min?: number;
    max?: number;
    onchange: (value: number) => void;
  }

  let { id, value, step = 1, min, max, onchange }: Props = $props();

  let isDragging = $state(false);
  let startX = $state(0);
  let startValue = $state(0);
  let inputElement = $state<HTMLInputElement | null>(null);
  let isFocused = $state(false);

  // Display value: show full precision when focused, max 2 decimals otherwise
  const displayValue = $derived.by(() => {
    if (isFocused) return value;
    // Round to max 2 decimal places for display
    return Math.round(value * 100) / 100;
  });

  function clampValue(val: number): number {
    let result = val;
    if (min !== undefined) result = Math.max(min, result);
    if (max !== undefined) result = Math.min(max, result);
    return result;
  }

  function roundValue(val: number): number {
    const precision = step < 1 ? Math.ceil(-Math.log10(step)) + 1 : 1;
    return Math.round(val * Math.pow(10, precision)) / Math.pow(10, precision);
  }

  function handleMouseDown(e: MouseEvent) {
    e.preventDefault();
    isDragging = true;
    startX = e.clientX;
    startValue = value;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging) return;

    const deltaX = e.clientX - startX;

    let multiplier = 1;
    if (e.shiftKey) {
      multiplier = 0.1;
    } else if (e.altKey) {
      multiplier = 10;
    }

    const sensitivity = 0.5;
    const change = deltaX * sensitivity * step * multiplier;
    const newValue = clampValue(roundValue(startValue + change));

    onchange(newValue);
  }

  function handleMouseUp() {
    isDragging = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  function handleInput(e: Event) {
    const target = e.currentTarget as HTMLInputElement;
    const newValue = parseFloat(target.value);
    if (!isNaN(newValue)) {
      onchange(clampValue(newValue));
    }
  }
</script>

<InputGroup.Root>
  <InputGroup.Addon>
    <button
      type="button"
      tabindex={-1}
      class={cn(
        'flex h-full cursor-ew-resize items-center pr-0.5 pl-1 opacity-40 transition-opacity hover:opacity-80',
        {
          'text-primary opacity-100': isDragging
        }
      )}
      onmousedown={handleMouseDown}
      title="Drag to adjust. Shift=fine, Alt=coarse"
    >
      <GripVertical class="size-3" />
    </button>
  </InputGroup.Addon>

  <InputGroup.Input
    bind:ref={inputElement}
    {id}
    type="number"
    value={displayValue}
    oninput={handleInput}
    onfocus={() => (isFocused = true)}
    onblur={() => (isFocused = false)}
    class="number-input-no-spin pr-0! pl-1!"
  />
</InputGroup.Root>
