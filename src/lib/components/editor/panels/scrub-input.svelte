<script lang="ts">
  import * as InputGroup from '$lib/components/ui/input-group';
  import { GripVertical } from '@lucide/svelte';
  import { cn } from '$lib/utils';
  import type { Snippet } from 'svelte';

  type Props = {
    id?: string;
    value: number;
    step?: number;
    min?: number;
    max?: number;
    disabled?: boolean;
    onchange?: (value: number) => void;
    class?: string;
    postFix?: string | Snippet;
  };

  let {
    id,
    value = $bindable(),
    step = 1,
    min,
    max,
    disabled = false,
    onchange,
    class: className,
    postFix
  }: Props = $props();

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
    if (disabled) return;
    e.preventDefault();
    startDrag(e.clientX);
  }

  function handleTouchStart(e: TouchEvent) {
    if (disabled) return;
    e.preventDefault();
    // Only handle single touch
    if (e.touches.length === 1) {
      startDrag(e.touches[0].clientX);
    }
  }

  function startDrag(clientX: number) {
    isDragging = true;
    startX = clientX;
    startValue = value;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging || disabled) return;
    updateValue(e.clientX, e.shiftKey, e.altKey);
  }

  function handleTouchMove(e: TouchEvent) {
    if (!isDragging || disabled) return;
    e.preventDefault();
    // Only handle single touch
    if (e.touches.length === 1) {
      updateValue(e.touches[0].clientX, e.shiftKey, e.altKey);
    }
  }

  function updateValue(clientX: number, shiftKey: boolean, altKey: boolean) {
    if (disabled) return;
    const deltaX = clientX - startX;

    let multiplier = 1;
    if (shiftKey) {
      multiplier = 0.1;
    } else if (altKey) {
      multiplier = 10;
    }

    const sensitivity = 0.5;
    const change = deltaX * sensitivity * step * multiplier;
    const newValue = clampValue(roundValue(startValue + change));

    value = newValue;
    onchange?.(newValue);
  }

  function handleMouseUp() {
    endDrag();
  }

  function handleTouchEnd() {
    endDrag();
  }

  function endDrag() {
    isDragging = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    document.removeEventListener('touchcancel', handleTouchEnd);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  function handleInput(e: Event) {
    const target = e.currentTarget as HTMLInputElement;
    const newValue = parseFloat(target.value);
    if (!isNaN(newValue)) {
      value = clampValue(newValue);
      onchange?.(newValue);
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
      ontouchstart={handleTouchStart}
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
    {disabled}
    oninput={handleInput}
    onfocus={() => (isFocused = true)}
    onblur={() => (isFocused = false)}
    class={cn('number-input-no-spin pr-0! pl-1!', className)}
    prefix="%"
  />
  {#if postFix}
    <InputGroup.Addon align="inline-end">
      {#if typeof postFix === 'string'}
        {postFix}
      {:else}
        {@render postFix()}
      {/if}
    </InputGroup.Addon>
  {/if}
</InputGroup.Root>
