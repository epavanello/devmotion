<script lang="ts">
  import type { Keyframe } from '$lib/types/animation';
  import { projectStore } from '$lib/stores/project.svelte';
  import TooltipWrapper from '$lib/components/ui/tooltip/tooltip-wrapper.svelte';

  interface Props {
    keyframes: Keyframe[];
    pixelsPerSecond: number;
    layerId: string;
  }

  let { keyframes, pixelsPerSecond, layerId }: Props = $props();

  const firstKeyframe = $derived(keyframes[0]);
  const position = $derived(firstKeyframe.time * pixelsPerSecond);
  const isSelected = $derived(keyframes.some((kf) => projectStore.selectedKeyframeIds.has(kf.id)));

  let isDragging = $state(false);
  let startX = 0;

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

  function handleMouseDown(e: MouseEvent) {
    if (projectStore.isRecording) return;
    if (e.button !== 0) return; // Only left click

    e.stopPropagation();
    projectStore.setCurrentTime(firstKeyframe.time);

    const isAlreadySelected = keyframes.some((kf) => projectStore.selectedKeyframeIds.has(kf.id));

    if (!isAlreadySelected || e.shiftKey) {
      for (const kf of keyframes) {
        projectStore.toggleKeyframeSelection(kf.id, e.shiftKey);
      }
    }

    isDragging = true;
    startX = e.clientX;

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging) return;

    const deltaX = e.clientX - startX;
    const deltaTime = deltaX / pixelsPerSecond;

    // Shift all selected keyframes
    projectStore.shiftSelectedKeyframes(deltaTime);

    // Update start position for next frame to keep it relative
    startX = e.clientX;
  }

  function handleMouseUp() {
    isDragging = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      projectStore.setCurrentTime(firstKeyframe.time);
    }
  }

  function handleDelete(e: MouseEvent) {
    e.preventDefault();
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
</script>

<TooltipWrapper delayDuration={0}>
  {#snippet content()}
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
  {/snippet}
  <button
    class="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-sm border-2 transition-transform hover:scale-110 active:cursor-grabbing"
    class:bg-primary={isSelected}
    class:bg-muted-foreground={!isSelected}
    class:border-primary={isSelected}
    class:border-background={!isSelected}
    style="left: {position}px"
    onmousedown={handleMouseDown}
    onkeydown={handleKeyDown}
    oncontextmenu={handleDelete}
    aria-label="Keyframe at {firstKeyframe.time.toFixed(2)}s"
  >
  </button>
</TooltipWrapper>
