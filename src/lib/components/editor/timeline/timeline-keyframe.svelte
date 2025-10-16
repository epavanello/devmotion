<script lang="ts">
  import type { Keyframe } from '$lib/types/animation';
  import { projectStore } from '$lib/stores/project.svelte';
  import * as Tooltip from '$lib/components/ui/tooltip';

  interface Props {
    keyframe: Keyframe;
    pixelsPerSecond: number;
    layerId: string;
  }

  let { keyframe, pixelsPerSecond, layerId }: Props = $props();

  const position = $derived(keyframe.time * pixelsPerSecond);

  const formattedValue = $derived(() => {
    if (typeof keyframe.value === 'number') {
      return keyframe.value.toFixed(2);
    }
    return keyframe.value;
  });

  const propertyLabel = $derived(() => {
    const labels: Record<string, string> = {
      'position.x': 'Position X',
      'position.y': 'Position Y',
      'position.z': 'Position Z',
      'rotation.x': 'Rotation X',
      'rotation.y': 'Rotation Y',
      'rotation.z': 'Rotation Z',
      'scale.x': 'Scale X',
      'scale.y': 'Scale Y',
      'scale.z': 'Scale Z',
      opacity: 'Opacity',
      color: 'Color'
    };
    return labels[keyframe.property] || keyframe.property;
  });

  function handleClick(e: MouseEvent) {
    e.stopPropagation();
    projectStore.setCurrentTime(keyframe.time);
  }

  function handleDelete(e: MouseEvent) {
    e.stopPropagation();
    if (confirm('Delete this keyframe?')) {
      projectStore.removeKeyframe(layerId, keyframe.id);
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e as unknown as MouseEvent);
    }
  }
</script>

<Tooltip.Root delayDuration={0}>
  <Tooltip.Trigger
    class="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2
    cursor-pointer rounded-sm bg-primary transition-transform hover:scale-125"
    style="left: {position}px"
    onclick={handleClick}
    onkeydown={handleKeyDown}
    oncontextmenu={handleDelete}
  />
  <Tooltip.Content>
    <div class="space-y-1 text-xs">
      <div class="font-semibold">{propertyLabel()}</div>
      <div class="text-muted">
        Time: <span class="">{keyframe.time.toFixed(2)}s</span>
      </div>
      <div class="text-muted">
        Value: <span class="">{formattedValue()}</span>
      </div>
      <div class="text-muted">
        Easing: <span class="">{keyframe.easing.type}</span>
      </div>
      <div class="mt-2 border-t pt-1 text-muted">Right-click to delete</div>
    </div>
  </Tooltip.Content>
</Tooltip.Root>
