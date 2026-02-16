<script lang="ts">
  import { Select } from '$lib/components/ui/select';
  import { Label } from '$lib/components/ui/label';
  import InputWrapper from '$lib/components/editor/panels/input-wrapper.svelte';
  import ScrubInput from '$lib/components/editor/panels/scrub-input.svelte';
  import type { TypedLayer } from '$lib/layers/typed-registry';

  const commonResolutions = [
    { label: 'Full HD (1920x1080)', width: 1920, height: 1080 },
    { label: 'HD (1280x720)', width: 1280, height: 720 },
    { label: '4K (3840x2160)', width: 3840, height: 2160 },
    { label: 'Square (1080x1080)', width: 1080, height: 1080 },
    { label: 'Mobile (720x1280)', width: 720, height: 1280 },
    { label: 'Custom', width: 0, height: 0 }
  ];

  let {
    layer,
    onUpdateProp
  }: {
    layer: TypedLayer;
    onUpdateProp: (propertyName: string, value: unknown) => void;
    addKeyframe?: (property: string) => void;
  } = $props();

  // Track the current selection - starts from layer props but can be overridden
  let isCustom = $state(false);

  let selectedResolution = $derived.by(() => {
    const width = layer.props.width as number;
    const height = layer.props.height as number;
    if (width === undefined || height === undefined) return 'custom';

    // If user explicitly selected custom, keep showing custom
    if (isCustom) return 'custom';

    const res = commonResolutions.find((r) => r.width === width && r.height === height);
    return res ? `${res.width}x${res.height}` : 'custom';
  });

  function handleResolutionChange(value: string) {
    if (value === 'custom') {
      // User selected custom - show the input fields
      isCustom = true;
    } else {
      // User selected a preset
      isCustom = false;
      const res = commonResolutions.find((r) => `${r.width}x${r.height}` === value);
      if (res) {
        onUpdateProp('width', res.width);
        onUpdateProp('height', res.height);
      }
    }
  }
</script>

<div class="space-y-2">
  <Label for="resolution" class="text-[10px] text-muted-foreground">Resolution</Label>
  <Select
    trigger={{ id: 'resolution' }}
    root={{
      onValueChange: handleResolutionChange
    }}
    value={selectedResolution}
    options={commonResolutions.map((res) => ({
      value: res.label === 'Custom' ? 'custom' : `${res.width}x${res.height}`,
      label: res.label
    }))}
  />

  {#if selectedResolution === 'custom'}
    <div class="grid grid-cols-2 gap-2">
      <InputWrapper for="width" label="Width">
        <ScrubInput
          id="width"
          value={layer.props.width as number}
          min={100}
          max={8192}
          step={1}
          onchange={(val) => onUpdateProp('width', val)}
        />
      </InputWrapper>
      <InputWrapper for="height" label="Height">
        <ScrubInput
          id="height"
          value={layer.props.height as number}
          min={100}
          max={8192}
          step={1}
          onchange={(val) => onUpdateProp('height', val)}
        />
      </InputWrapper>
    </div>
  {/if}
</div>
