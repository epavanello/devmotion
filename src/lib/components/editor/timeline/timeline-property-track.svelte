<script lang="ts">
  import type { TypedLayer } from '$lib/layers/typed-registry';
  import type { Keyframe } from '$lib/types/animation';
  import { getEditorState } from '$lib/contexts/editor.svelte';
  import { Circle } from '@lucide/svelte';
  import { onDestroy } from 'svelte';
  import { cn } from '$lib/utils';
  import { navigateToProperty } from '$lib/utils/property-navigation';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import * as Tooltip from '$lib/components/ui/tooltip';

  const editorState = $derived(getEditorState());
  const projectStore = $derived(editorState.project);

  interface Props {
    layer: TypedLayer;
    property: string;
    pixelsPerSecond: number;
    indent?: number;
  }

  let { layer, property, pixelsPerSecond, indent = 0 }: Props = $props();

  // Get all keyframes for this property
  const keyframes = $derived(
    layer.keyframes.filter((kf) => kf.property === property).sort((a, b) => a.time - b.time)
  );

  // Format property name for display
  const propertyLabel = $derived.by(() => {
    // Convert "position.x" to "Position X"
    const parts = property.split('.');
    if (parts.length === 2) {
      const [parent, child] = parts;
      return `${parent.charAt(0).toUpperCase() + parent.slice(1)} ${child.toUpperCase()}`;
    }
    return property.charAt(0).toUpperCase() + property.slice(1);
  });

  // Keyframe interaction state
  let draggedKeyframeId = $state<string | null>(null);
  let dragStartX = $state(0);
  let dragStartTime = $state(0);
  let hasDragged = $state(false);

  function handleKeyframeMouseDown(e: MouseEvent, keyframe: Keyframe) {
    if (projectStore.isRecording) return;
    if (e.button !== 0) return;

    e.stopPropagation();
    draggedKeyframeId = keyframe.id;
    dragStartX = e.clientX;
    dragStartTime = keyframe.time;
    hasDragged = false;

    // Select the layer if not already selected
    if (projectStore.selectedLayerId !== layer.id) {
      projectStore.selectedLayerId = layer.id;
    }

    // Select keyframe - if it's already selected and not shift-clicking, keep selection
    const isAlreadySelected = projectStore.selectedKeyframeIds.has(keyframe.id);
    if (!isAlreadySelected || e.shiftKey) {
      projectStore.toggleKeyframeSelection(keyframe.id, e.shiftKey);
    }

    window.addEventListener('mousemove', handleKeyframeDrag);
    window.addEventListener('mouseup', handleKeyframeMouseUp);
  }

  function handleKeyframeDrag(e: MouseEvent) {
    if (!draggedKeyframeId) return;

    const deltaX = e.clientX - dragStartX;
    const deltaTime = deltaX / pixelsPerSecond;

    // Mark as dragged if moved more than 2px
    if (Math.abs(deltaX) > 2) {
      hasDragged = true;
    }

    // If there are multiple selected keyframes, shift them all together
    if (projectStore.selectedKeyframeIds.size > 1) {
      projectStore.shiftSelectedKeyframes(deltaTime);
      dragStartX = e.clientX;
      // Update dragStartTime to track the dragged keyframe's new position
      const updatedKeyframe = keyframes.find((kf) => kf.id === draggedKeyframeId);
      if (updatedKeyframe) {
        dragStartTime = updatedKeyframe.time;
      }
    } else {
      // Single keyframe drag
      const newTime = Math.max(0, Math.min(projectStore.state.duration, dragStartTime + deltaTime));
      projectStore.updateKeyframe(layer.id, draggedKeyframeId, { time: newTime });
      dragStartX = e.clientX;
      dragStartTime = newTime;
    }
  }

  function handleKeyframeMouseUp() {
    // If it was a click (not drag), set current time and navigate to property
    if (!hasDragged && draggedKeyframeId) {
      const keyframe = keyframes.find((kf) => kf.id === draggedKeyframeId);
      if (keyframe) {
        projectStore.setCurrentTime(keyframe.time);
        navigateToProperty(property);
      }
    }

    draggedKeyframeId = null;
    hasDragged = false;
    window.removeEventListener('mousemove', handleKeyframeDrag);
    window.removeEventListener('mouseup', handleKeyframeMouseUp);
  }

  // State for delete confirmation
  let deleteDialogKeyframeId = $state<string | null>(null);

  function handleDeleteKeyframe(keyframeId: string) {
    projectStore.removeKeyframe(layer.id, keyframeId);
    deleteDialogKeyframeId = null;
  }

  onDestroy(() => {
    window.removeEventListener('mousemove', handleKeyframeDrag);
    window.removeEventListener('mouseup', handleKeyframeMouseUp);
  });

  // Check if any keyframe is selected
  const hasSelectedKeyframe = $derived(
    keyframes.some((kf) => projectStore.selectedKeyframeIds.has(kf.id))
  );
</script>

<div class="flex items-stretch border-t border-muted/30 transition-colors hover:bg-muted/10">
  <!-- Property header -->
  <div
    data-property-header
    class="flex w-60 shrink-0 items-center gap-1.5 border-r bg-background/80 px-2 py-1"
    style:padding-left="{8 + indent * 16}px"
  >
    <!-- Keyframe indicator -->
    <div class="flex h-4 w-4 shrink-0 items-center justify-center">
      <Circle
        class={cn('h-2.5 w-2.5', {
          'fill-primary text-primary': hasSelectedKeyframe,
          'text-muted-foreground': !hasSelectedKeyframe
        })}
      />
    </div>

    <!-- Property name -->
    <span class="flex-1 truncate text-xs text-muted-foreground">{propertyLabel}</span>

    <!-- Keyframe count -->
    <span class="text-[10px] text-muted-foreground/60">{keyframes.length}</span>
  </div>

  <!-- Property timeline with keyframes -->
  <div class="relative h-8 flex-1">
    <!-- Keyframe dots -->
    {#each keyframes as keyframe (keyframe.id)}
      {@const position = keyframe.time * pixelsPerSecond}
      {@const isActive = Math.abs(keyframe.time - projectStore.currentTime) < 0.01}
      {@const isSelected = projectStore.selectedKeyframeIds.has(keyframe.id)}
      <Tooltip.Provider>
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger>
            {#snippet child({ props })}
              <button
                {...props}
                data-keyframe
                data-keyframe-id={keyframe.id}
                class={cn(
                  'absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-[3px] transition-transform hover:scale-125 active:scale-110',
                  {
                    'bg-primary/50': isActive,
                    'bg-primary': isSelected,
                    'outline-1': isSelected || isActive,
                    'outline-primary/80': isSelected || isActive,
                    'outline-offset-2': isSelected || isActive,
                    'bg-muted-foreground': !isSelected && !isActive,
                    'shadow-sm': isSelected || isActive
                  }
                )}
                style:left="{position}px"
                onmousedown={(e) => handleKeyframeMouseDown(e, keyframe)}
                oncontextmenu={(e) => {
                  e.preventDefault();
                  deleteDialogKeyframeId = keyframe.id;
                }}
                aria-label="Keyframe at {keyframe.time.toFixed(2)}s"
              ></button>
            {/snippet}
          </Tooltip.Trigger>
          <Tooltip.Content side="top" align="center" class="text-[10px]">
            {keyframe.time.toFixed(2)}s
            {#if typeof keyframe.value === 'number'}
              <br />
              <span class="text-muted-foreground">{keyframe.value.toFixed(2)}</span>
            {/if}
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>
    {/each}

    <!-- Connection lines between keyframes -->
    {#if keyframes.length > 1}
      {#each keyframes.slice(0, -1) as keyframe, i (keyframe.id)}
        {@const nextKeyframe = keyframes[i + 1]}
        {@const startPos = keyframe.time * pixelsPerSecond}
        {@const endPos = nextKeyframe.time * pixelsPerSecond}
        {@const width = endPos - startPos}

        <div
          class="absolute top-1/2 h-px bg-muted-foreground/20"
          style:left="{startPos}px"
          style:width="{width}px"
        ></div>
      {/each}
    {/if}
  </div>
</div>

<!-- Delete confirmation dialog -->
<AlertDialog.Root
  open={deleteDialogKeyframeId !== null}
  onOpenChange={(open) => {
    if (!open) deleteDialogKeyframeId = null;
  }}
>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Delete Keyframe</AlertDialog.Title>
      <AlertDialog.Description>
        {#if deleteDialogKeyframeId}
          {@const kf = keyframes.find((k) => k.id === deleteDialogKeyframeId)}
          {#if kf}
            Delete keyframe at {kf.time.toFixed(2)}s? This action cannot be undone.
          {/if}
        {/if}
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action
        onclick={() => {
          if (deleteDialogKeyframeId) {
            handleDeleteKeyframe(deleteDialogKeyframeId);
          }
        }}
      >
        Delete
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
