<script lang="ts">
  import { Select } from '$lib/components/ui/select';
  import { Label } from '$lib/components/ui/label';
  import InputWrapper from '$lib/components/editor/panels/input-wrapper.svelte';
  import ScrubInput from '$lib/components/editor/panels/scrub-input.svelte';
  import type { TypedLayer } from '$lib/layers/typed-registry';
  import { getUser } from '$lib/functions/auth.remote';
  import { getPlan, type PlanTier } from '$lib/config/plans';
  import { Lock } from '@lucide/svelte';

  type Resolution = {
    label: string;
    width: number;
    height: number;
    pixels: number;
    minTier: PlanTier;
  };

  const commonResolutions: Resolution[] = [
    { label: 'HD (1280x720)', width: 1280, height: 720, pixels: 1280 * 720, minTier: 'free' },
    {
      label: 'Full HD (1920x1080)',
      width: 1920,
      height: 1080,
      pixels: 1920 * 1080,
      minTier: 'creator'
    },
    {
      label: '4K (3840x2160)',
      width: 3840,
      height: 2160,
      pixels: 3840 * 2160,
      minTier: 'pro'
    },
    {
      label: 'Square (1080x1080)',
      width: 1080,
      height: 1080,
      pixels: 1080 * 1080,
      minTier: 'creator'
    },
    { label: 'Mobile (720x1280)', width: 720, height: 1280, pixels: 720 * 1280, minTier: 'free' }
  ];

  let {
    layer,
    onUpdateProp
  }: {
    layer: TypedLayer;
    onUpdateProp: (propertyName: string, value: unknown) => void;
    addKeyframe?: (property: string) => void;
  } = $props();

  const user = $derived(getUser());
  const userTier = $derived<PlanTier>(user.current?.tier || 'free');
  const userPlan = $derived(getPlan(userTier));
  const maxResolution = $derived(userPlan.limits.maxExportResolution);

  // Get max dimensions based on plan
  const maxDimensions = $derived.by(() => {
    switch (maxResolution) {
      case '720p':
        return { width: 1280, height: 720, pixels: 1280 * 720 };
      case '1080p':
        return { width: 1920, height: 1080, pixels: 1920 * 1080 };
      case '4k':
        return { width: 3840, height: 2160, pixels: 3840 * 2160 };
    }
  });

  // Check if a resolution is allowed for current plan
  function isResolutionAllowed(res: Resolution): boolean {
    return res.pixels <= maxDimensions.pixels;
  }

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
    } else if (value.startsWith('locked:')) {
      // User clicked a locked resolution - do nothing (or show upgrade modal)
      return;
    } else {
      // User selected a preset
      isCustom = false;
      const res = commonResolutions.find((r) => `${r.width}x${r.height}` === value);
      if (res && isResolutionAllowed(res)) {
        onUpdateProp('width', res.width);
        onUpdateProp('height', res.height);
      }
    }
  }

  function getTierLabel(tier: PlanTier): string {
    return getPlan(tier).name;
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
    options={[
      ...commonResolutions.map((res) => {
        const allowed = isResolutionAllowed(res);
        return {
          value: allowed ? `${res.width}x${res.height}` : `locked:${res.width}x${res.height}`,
          label: allowed ? res.label : `${res.label} (${getTierLabel(res.minTier)}+)`,
          disabled: !allowed
        };
      }),
      {
        value: 'custom',
        label: 'Custom',
        disabled: false
      }
    ]}
  />

  {#if selectedResolution === 'custom'}
    <div class="grid grid-cols-2 gap-2">
      <InputWrapper for="width" label="Width">
        <ScrubInput
          id="width"
          value={layer.props.width as number}
          min={100}
          max={maxDimensions.width}
          step={1}
          onchange={(val) => onUpdateProp('width', val)}
        />
      </InputWrapper>
      <InputWrapper for="height" label="Height">
        <ScrubInput
          id="height"
          value={layer.props.height as number}
          min={100}
          max={maxDimensions.height}
          step={1}
          onchange={(val) => onUpdateProp('height', val)}
        />
      </InputWrapper>
    </div>
    <div class="text-xs text-muted-foreground">
      Max for {userPlan.name}: {maxDimensions.width}x{maxDimensions.height}
    </div>
  {/if}

  {#if maxResolution !== '4k'}
    <div class="flex items-start gap-2 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
      <Lock class="mt-0.5 h-3 w-3 shrink-0" />
      <div>
        Higher resolutions available with {maxResolution === '720p' ? 'Creator' : 'Pro'} plan
      </div>
    </div>
  {/if}
</div>
