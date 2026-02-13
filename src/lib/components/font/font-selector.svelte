<script lang="ts">
  import { googleFontValues } from '$lib/utils/fonts';
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
</script>

<Select.Root bind:value type="single" onValueChange={(v) => onChange?.(v as GoogleFont)}>
  <Select.Trigger class="min-w-40" {...props}>
    <ApplyFont fontFamily={value}>
      {value || 'Select font'}
    </ApplyFont>
  </Select.Trigger>

  <Select.Content>
    <Select.Group>
      {#each googleFontValues as font (font)}
        <Select.Item value={font} label={font}>
          <ApplyFont fontFamily={font}>
            {font}
          </ApplyFont>
        </Select.Item>
      {/each}
    </Select.Group>
  </Select.Content>
</Select.Root>
