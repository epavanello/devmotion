<script lang="ts">
  import * as Select from '$lib/components/ui/select';
  import type {
    SelectBaseRootPropsWithoutHTML,
    Select as SelectPrimitive,
    SelectSingleRootPropsWithoutHTML
  } from 'bits-ui';

  let {
    value = $bindable(),
    options,
    root,
    trigger,
    content,
    group,
    item
  }: {
    value: string;
    options: {
      value: string;
      label: string;
    }[];
  } & {
    root?: Omit<
      SelectBaseRootPropsWithoutHTML & SelectSingleRootPropsWithoutHTML,
      'value' | 'type'
    >;
    trigger?: SelectPrimitive.TriggerProps;
    content?: SelectPrimitive.ContentProps;
    group?: SelectPrimitive.GroupProps;
    item?: SelectPrimitive.ItemProps;
  } = $props();
</script>

<Select.Root {...root} bind:value type="single">
  <Select.Trigger {...trigger}>
    {value}
  </Select.Trigger>

  <Select.Content {...content}>
    <Select.Group {...group}>
      {#each options as option (option.value)}
        <Select.Item value={option.value} {...item}>{option.label}</Select.Item>
      {/each}
    </Select.Group>
  </Select.Content>
</Select.Root>
