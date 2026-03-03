<script lang="ts">
  import { fontCategoriesArray } from '$lib/utils/fonts';
  import type { GoogleFont } from '$lib/utils/fonts';
  import ApplyFont from './apply-font.svelte';
  import * as Select from '$lib/components/ui/select/index.js';
  import type { WithoutChild } from '$lib/utils';
  import { Select as SelectPrimitive } from 'bits-ui';

  let {
    value = $bindable(),
    onChange,
    ...props
  }: {
    value: GoogleFont;
    onChange?: (value: GoogleFont) => void;
  } & WithoutChild<SelectPrimitive.TriggerProps> = $props();

  // Store original value for hover preview reset
  let originalValue = $state(value);
  let isOpen = $state(false);
  let previewValue = $state<GoogleFont | null>(null);

  // Computed current display value (original, preview, or selected)
  const displayValue = $derived(previewValue || value);

  function handleOpenChange(open: boolean) {
    isOpen = open;

    if (open) {
      // Store the original value when opening
      originalValue = value;
      previewValue = null;
    } else {
      // Reset to original if closed without selection
      if (previewValue !== null) {
        value = originalValue;
        onChange?.(originalValue);
      }
      previewValue = null;
    }
  }

  function handleValueChange(newValue: GoogleFont) {
    // Actual selection - commit the value
    value = newValue;
    originalValue = newValue;
    previewValue = null;
    onChange?.(newValue);
  }

  function handleFontHover(font: GoogleFont) {
    if (!isOpen) return;

    // Preview the font on hover
    previewValue = font;
    value = font;
    onChange?.(font);
  }

  function handleFontLeave() {
    if (!isOpen) return;

    // Reset to original value when leaving hover
    previewValue = null;
    value = originalValue;
    onChange?.(originalValue);
  }
</script>

<Select.Root
  bind:value
  type="single"
  onValueChange={(value) => handleValueChange(value as GoogleFont)}
  onOpenChange={handleOpenChange}
>
  <Select.Trigger class="min-w-40" {...props}>
    <ApplyFont fontFamily={displayValue}>
      {displayValue || 'Select font'}
    </ApplyFont>
  </Select.Trigger>

  <Select.Content class="max-h-[400px]">
    {#each fontCategoriesArray as category (category.label)}
      <Select.Group>
        <Select.Label>{category.label}</Select.Label>
        {#each category.fonts as font (font)}
          <Select.Item
            value={font}
            label={font}
            class="font-item"
            onmouseenter={() => handleFontHover(font)}
            onmouseleave={handleFontLeave}
          >
            <ApplyFont fontFamily={font}>
              {font}
            </ApplyFont>
          </Select.Item>
        {/each}
      </Select.Group>
    {/each}
  </Select.Content>
</Select.Root>
