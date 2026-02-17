<script lang="ts">
  import ColorPicker from 'svelte-awesome-color-picker';
  import type { ComponentProps } from 'svelte';
  import { colord } from 'colord';
  import Input from '../input/input.svelte';
  import * as Popover from '$lib/components/ui/popover';

  type Props = {
    value: string;
    onchange: (value: string) => void;
    optional?: boolean;
    class?: string;
    inputClass?: string;
    showInput?: boolean;
  } & Omit<ComponentProps<typeof ColorPicker>, 'onInput' | 'hex' | 'value' | 'nullable'>;

  let { value = $bindable(), optional, onchange, ...restProps }: Props = $props();

  // Calculate contrasting text color (black or white) based on background
  const textColor = $derived.by(() => {
    if (!value) return '#000000';
    try {
      const color = colord(value);
      // Use brightness calculation (WCAG-based): > 0.5 is light, <= 0.5 is dark
      const brightness = color.brightness();
      return brightness > 0.5 ? '#000000' : '#ffffff';
    } catch {
      return '#000000';
    }
  });
</script>

<Popover.Root>
  <Popover.Trigger>
    <Input {value} readonly class="w-20" style="background-color: {value}; color: {textColor};" />
  </Popover.Trigger>
  <Popover.Content
    class="w-auto p-0 [&_.color-picker_.wrapper]:m-0! [&_.color-picker_.wrapper]:border-0!"
    align="end"
    side="left"
  >
    <ColorPicker
      hex={value}
      onInput={(color) => onchange(color.hex ?? '')}
      isAlpha
      isDialog={false}
      nullable={optional}
      {...restProps}
    />
  </Popover.Content>
</Popover.Root>
