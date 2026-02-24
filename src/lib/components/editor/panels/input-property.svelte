<script lang="ts">
  import Input from '$lib/components/ui/input/input.svelte';
  import Textarea from '$lib/components/ui/textarea/textarea.svelte';
  import type { PropertyMetadata } from '$lib/layers/base';
  import type { TypedLayer } from '$lib/layers/typed-registry';
  import type { BackgroundValue } from '$lib/schemas/animation';
  import { getEditorState } from '$lib/contexts/editor.svelte';
  import FileUpload from '../FileUpload.svelte';
  import BackgroundPicker from './background-picker.svelte';
  import ScrubInput from './scrub-input.svelte';
  import { ColorPicker } from '$lib/components/ui/color-picker';
  import { prepareMediaLayerData, applyMediaLayerData } from '$lib/utils/media';

  const editorState = $derived(getEditorState());
  const projectStore = $derived(editorState.project);

  const {
    metadata,
    value,
    layer,
    onUpdateProp,
    targetPath = 'props'
  }: {
    metadata: PropertyMetadata;
    value: unknown;
    layer: TypedLayer;
    onUpdateProp: (prop: string, value: unknown) => void;
    /** The path prefix for the property (e.g., 'props' or 'style') */
    targetPath?: 'transform' | 'props' | 'style';
  } = $props();
</script>

{#if metadata.meta?.widget === 'upload'}
  <!-- Special handling for media src properties with file upload -->
  <FileUpload
    value={typeof value === 'string' ? value : ''}
    currentFileName={typeof layer.props.fileName === 'string' ? layer.props.fileName : ''}
    mediaType={metadata.meta.mediaType}
    projectId={editorState.dbProjectId ?? undefined}
    onUpload={(result) => {
      if (metadata.meta?.widget !== 'upload') {
        return;
      }
      onUpdateProp(metadata.name, result.url);
      onUpdateProp('fileKey', result.key);

      // Handle Lummi attribution if present
      if ('attribution' in result && result.attribution) {
        onUpdateProp('attribution', result.attribution);
      }

      const mediaType = metadata.meta.mediaType;

      // Use centralized media layer data handling
      const mediaResult = prepareMediaLayerData({
        duration: result.duration ?? undefined,
        mediaType,
        currentTime: layer.enterTime ?? 0,
        projectDuration: projectStore.state.duration,
        name: result.fileName
      });

      // Apply media layer data (handles duration, exit time, and project extension)
      applyMediaLayerData(projectStore, layer.id, mediaResult);
    }}
  />
{:else if metadata.meta?.widget === 'textarea'}
  <Textarea
    id={`${targetPath}.${metadata.name}`}
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
  <ColorPicker
    value={typeof value === 'string' ? value : '#000000'}
    onchange={(newValue) => onUpdateProp(metadata.name, newValue || 'transparent')}
    optional={metadata.optional}
  />
{:else if metadata.meta?.widget === 'custom'}
  {@const Component = metadata.meta.component}
  <Component {value} onChange={(newValue) => onUpdateProp(metadata.name, newValue)} {layer} />
{:else if metadata.type === 'number'}
  <ScrubInput
    id={`${targetPath}.${metadata.name}`}
    value={typeof value === 'number' ? value : 0}
    min={metadata.min}
    max={metadata.max}
    step={metadata.step || 1}
    onchange={(v) => onUpdateProp(metadata.name, v)}
  />
{:else if metadata.type === 'boolean'}
  <label class="flex items-center gap-2">
    <input
      id={`${targetPath}.${metadata.name}`}
      type="checkbox"
      checked={typeof value === 'boolean' ? value : false}
      onchange={(e) => onUpdateProp(metadata.name, e.currentTarget.checked)}
      class="h-4 w-4 rounded border-gray-300"
    />
    <span class="text-sm">Enable</span>
  </label>
{:else if metadata.type === 'select' && metadata.options}
  <select
    id={`${targetPath}.${metadata.name}`}
    value={typeof value === 'string' || typeof value === 'number' ? value : ''}
    onchange={(e) => onUpdateProp(metadata.name, e.currentTarget.value)}
    class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
  >
    {#each metadata.options as option (option.value)}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>
{:else}
  <!-- Default to text input for strings and unknown types -->
  <Input
    id={`${targetPath}.${metadata.name}`}
    type="text"
    value={typeof value === 'string' ? value : ''}
    oninput={(e) => onUpdateProp(metadata.name, e.currentTarget.value)}
    disabled={metadata.meta?.readOnly}
  />
{/if}
