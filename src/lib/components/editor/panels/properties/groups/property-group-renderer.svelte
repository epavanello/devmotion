<script lang="ts">
  import { Label } from '$lib/components/ui/label';
  import InputsWrapper from '../../inputs-wrapper.svelte';
  import InputWrapper from '../../input-wrapper.svelte';
  import InputProperty from '../../input-property.svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import type { AnimatableProperty } from '$lib/schemas/animation';
  import type { PropertyGroupProps } from './types';
  import type { CustomPropertyComponents, PropertyGroup } from '$lib/layers/registry';
  import type { PropertyMetadata } from '$lib/layers/base';

  interface PropertyGroupRendererProps extends PropertyGroupProps {
    /** Extracted property metadata from Zod schema */
    propertyMetadata: PropertyMetadata[];
    /** Property groups (optional) */
    propertyGroups?: PropertyGroup[];
    /** Target path for property updates ('props' | 'style' | 'transform') */
    targetPath: 'props' | 'style' | 'transform';
    /** Whether to show keyframe controls (disabled for project settings) */
    showKeyframes?: boolean;
    /** Optional custom property components */
    customPropertyComponents?: CustomPropertyComponents;
  }

  const {
    layer,
    currentValues,
    updateProperty,
    addKeyframe,
    propertyMetadata,
    propertyGroups = [],
    targetPath,
    showKeyframes = true,
    customPropertyComponents = {}
  }: PropertyGroupRendererProps = $props();

  // Pre-compute property rendering layout: groups + ungrouped fields
  const propertyLayout = $derived.by(() => {
    if (!propertyMetadata.length) return { items: [] };
    const renderedGroupIds = new SvelteSet<string>();
    const items: Array<
      | { kind: 'field'; field: (typeof propertyMetadata)[number] }
      | {
          kind: 'group';
          group: (typeof propertyGroups)[number];
          fields: typeof propertyMetadata;
        }
    > = [];

    for (const meta of propertyMetadata) {
      if (meta.meta?.hidden) continue;
      const groupId = meta.meta?.group;
      if (groupId) {
        if (renderedGroupIds.has(groupId)) continue;
        renderedGroupIds.add(groupId);
        const group = propertyGroups.find((g) => g.id === groupId);
        if (group) {
          const groupFields = propertyMetadata.filter((m) => m.meta?.group === groupId);
          items.push({ kind: 'group', group, fields: groupFields });
          continue;
        }
      }
      items.push({ kind: 'field', field: meta });
    }
    return { items };
  });

  // Helper to get current value from the target path
  const getCurrentValue = (fieldName: string) => {
    const target = currentValues?.[targetPath];
    return (target as Record<string, unknown>)?.[fieldName];
  };

  const customComponents = $derived.by(() => {
    if (!customPropertyComponents) return [];
    return Object.entries(customPropertyComponents);
  });
</script>

{#each propertyLayout.items as item (item.kind === 'group' ? `group:${item.group.id}` : `field:${item.field.name}`)}
  {#if item.kind === 'group'}
    <InputsWrapper
      fields={item.fields.map((field) => ({
        for: `${targetPath}.${field.name}`,
        labels: field.description || field.name,
        ...(showKeyframes
          ? {
              property: `${targetPath}.${field.name}` as AnimatableProperty,
              addKeyframe,
              hasKeyframes: layer.keyframes.some(
                (k) => k.property === `${targetPath}.${field.name}`
              )
            }
          : {
              property: undefined,
              addKeyframe: undefined,
              hasKeyframes: false
            })
      }))}
    >
      {#snippet prefix()}
        <Label class="text-xs text-muted-foreground">{item.group.label}</Label>
        {#if item.group.widget && currentValues}
          {@const groupValues = Object.fromEntries(
            item.fields.map((f) => [f.name, getCurrentValue(f.name)])
          )}
          {@const Widget = item.group.widget}
          <Widget
            {layer}
            groupId={item.group.id}
            currentValues={groupValues}
            onUpdate={(prop, val) => updateProperty(prop, val, targetPath)}
          />
        {/if}
      {/snippet}

      {#each item.fields as field (field.name)}
        <InputProperty
          metadata={field}
          value={getCurrentValue(field.name)}
          onUpdateProp={(name, v) => updateProperty(name, v, targetPath)}
          {layer}
          {targetPath}
        />
      {/each}
    </InputsWrapper>
  {:else}
    <InputWrapper
      for={`${targetPath}.${item.field.name}`}
      label={item.field.description || item.field.name}
      {...showKeyframes
        ? { property: `${targetPath}.${item.field.name}`, addKeyframe }
        : { property: undefined, addKeyframe: undefined }}
    >
      <InputProperty
        metadata={item.field}
        value={getCurrentValue(item.field.name)}
        onUpdateProp={(name, v) => updateProperty(name, v, targetPath)}
        {layer}
        {targetPath}
      />
    </InputWrapper>
  {/if}
{/each}
{#each customComponents as [name, { component: CustomPropertyComponent }] (name)}
  <CustomPropertyComponent
    {layer}
    onUpdateProp={(name, v) => updateProperty(name, v, targetPath)}
    {addKeyframe}
  />
{/each}
