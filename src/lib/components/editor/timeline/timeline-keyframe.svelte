<script lang="ts">
  import type { Keyframe } from '$lib/types/animation';
  import { projectStore } from '$lib/stores/project.svelte';
  import * as Tooltip from '$lib/components/ui/tooltip';

  interface Props {
    keyframes: Keyframe[];
    pixelsPerSecond: number;
    layerId: string;
  }

  let { keyframes, pixelsPerSecond, layerId }: Props = $props();

  const firstKeyframe = $derived(keyframes[0]);
  const position = $derived(firstKeyframe.time * pixelsPerSecond);

  function getPropertyLabel(property: string): string {
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
    if (labels[property]) return labels[property];

    // Handle props.* properties - show just the prop name capitalized
    if (property.startsWith('props.')) {
      const propName = property.slice(6);
      return propName.charAt(0).toUpperCase() + propName.slice(1);
    }

    return property;
  }

  function formatValue(value: number | string | boolean): string {
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    return value;
  }

  function handleClick(e: MouseEvent) {
    e.stopPropagation();
    projectStore.setCurrentTime(firstKeyframe.time);
  }

  function handleDelete(e: MouseEvent) {
    e.stopPropagation();
    const message =
      keyframes.length === 1
        ? 'Delete this keyframe?'
        : `Delete all ${keyframes.length} keyframes at this time?`;
    if (confirm(message)) {
      for (const keyframe of keyframes) {
        projectStore.removeKeyframe(layerId, keyframe.id);
      }
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
      <div class="font-semibold">
        Time: {firstKeyframe.time.toFixed(2)}s
      </div>
      {#if keyframes.length > 1}
        <div class="text-xs text-muted-foreground">
          {keyframes.length} keyframes
        </div>
      {/if}
      <div class="mt-2 space-y-2">
        {#each keyframes as keyframe (keyframe.id)}
          <div class="border-t pt-2 first:border-t-0 first:pt-0">
            <div class="font-semibold">{getPropertyLabel(keyframe.property)}</div>
            <div class="text-muted-foreground">
              Value: <span class="">{formatValue(keyframe.value)}</span>
            </div>
            <div class="text-muted-foreground">
              Easing: <span class="">{keyframe.easing.type}</span>
            </div>
          </div>
        {/each}
      </div>
      <div class="mt-2 border-t pt-1 text-muted-foreground">
        {keyframes.length === 1
          ? 'Right-click to delete'
          : `Right-click to delete all ${keyframes.length} keyframes`}
      </div>
    </div>
  </Tooltip.Content>
</Tooltip.Root>
