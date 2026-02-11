<script lang="ts">
  import Input from '$lib/components/ui/input/input.svelte';
  import Textarea from '$lib/components/ui/textarea/textarea.svelte';
  import type { PropertyMetadata } from '$lib/layers/base';
  import type { TypedLayer } from '$lib/layers/typed-registry';
  import type { BackgroundValue } from '$lib/schemas/animation';
  import { projectStore } from '$lib/stores/project.svelte';
  import FileUpload from '../FileUpload.svelte';
  import BackgroundPicker from './background-picker.svelte';
  import ScrubInput from './scrub-input.svelte';

  const {
    metadata,
    value,
    layer,
    onUpdateProp
  }: {
    metadata: PropertyMetadata;
    value: unknown;
    layer: TypedLayer;
    onUpdateProp: (prop: string, value: unknown) => void;
  } = $props();
</script>

{#if metadata.meta?.widget === 'upload'}
  <!-- Special handling for media src properties with file upload -->
  <FileUpload
    value={typeof value === 'string' ? value : ''}
    currentFileName={typeof layer.props.fileName === 'string' ? layer.props.fileName : ''}
    mediaType={metadata.meta.mediaType}
    projectId={projectStore.dbProjectId ?? undefined}
    onUpload={(result) => {
      onUpdateProp(metadata.name, result.url);
      onUpdateProp('fileKey', result.key);
      // Set content duration if available
      if (result.duration !== undefined) {
        projectStore.updateLayer(layer.id, {
          contentDuration: result.duration
        });
        // Auto-set exit time based on content duration if layer has no exit time yet
        const enterTime = layer.enterTime ?? 0;
        projectStore.setLayerExitTime(layer.id, enterTime + result.duration);
      }
    }}
    onRemove={() => {
      onUpdateProp(metadata.name, '');
      onUpdateProp('fileKey', '');
      projectStore.updateLayer(layer.id, {
        contentDuration: 0,
        contentOffset: 0
      });
      // Reset exit time to match enter time (empty timeline)
      const enterTime = layer.enterTime ?? 0;
      projectStore.setLayerExitTime(layer.id, enterTime);
    }}
  />
{:else if metadata.type === 'number'}
  <ScrubInput
    id={metadata.name}
    value={typeof value === 'number' ? value : 0}
    min={metadata.min}
    max={metadata.max}
    step={metadata.step || 1}
    onchange={(v) => onUpdateProp(metadata.name, v)}
  />
{:else if metadata.type === 'boolean'}
  <label class="flex items-center gap-2">
    <input
      id={metadata.name}
      type="checkbox"
      checked={typeof value === 'boolean' ? value : false}
      onchange={(e) => onUpdateProp(metadata.name, e.currentTarget.checked)}
      class="h-4 w-4 rounded border-gray-300"
    />
    <span class="text-sm">Enable</span>
  </label>
{:else if metadata.type === 'select' && metadata.options}
  <select
    id={metadata.name}
    value={typeof value === 'string' || typeof value === 'number' ? value : ''}
    onchange={(e) => onUpdateProp(metadata.name, e.currentTarget.value)}
    class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
  >
    {#each metadata.options as option (option.value)}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>
{:else if metadata.meta?.widget === 'textarea'}
  <Textarea
    id={metadata.name}
    value={typeof value === 'string' ? value : ''}
    oninput={(e) => onUpdateProp(metadata.name, e.currentTarget.value)}
    spellcheck="false"
  />
{:else if metadata.meta?.widget === 'background'}
  <BackgroundPicker
    value={value as BackgroundValue}
    onchange={(newValue) => onUpdateProp(metadata.name, newValue)}
  />
{:else if metadata.meta?.widget === 'color'}
  <Input
    id={metadata.name}
    type="color"
    value={typeof value === 'string' ? value : '#000000'}
    oninput={(e) => onUpdateProp(metadata.name, e.currentTarget.value)}
    class="min-w-20 p-1"
  />
{:else if metadata.meta?.widget === 'custom'}
  {@const Component = metadata.meta.component}
  <Component {value} onChange={(newValue) => onUpdateProp(metadata.name, newValue)} {layer} />
{:else}
  <!-- Default to text input for strings and unknown types -->
  <Input
    id={metadata.name}
    type="text"
    value={typeof value === 'string' ? value : ''}
    oninput={(e) => onUpdateProp(metadata.name, e.currentTarget.value)}
    disabled={metadata.meta?.readOnly}
  />
{/if}
