<script lang="ts">
  import type { Keyframe } from '$lib/types/animation';
  import { getEditorState } from '$lib/contexts/editor.svelte';
  import * as Popover from '$lib/components/ui/popover';
  import { Button } from '$lib/components/ui/button';
  import { Clock, Trash2 } from '@lucide/svelte';
  import KeyframeCard from '../keyframe-card.svelte';

  const editorState = $derived(getEditorState());
  const projectStore = $derived(editorState.project);

  interface Props {
    keyframes: Keyframe[];
    pixelsPerSecond: number;
    layerId: string;
  }

  let { keyframes, pixelsPerSecond, layerId }: Props = $props();

  const layer = $derived(projectStore.state.layers.find((l) => l.id === layerId));
  const layerType = $derived(layer?.type ?? 'rectangle');
  const firstKeyframe = $derived(keyframes[0]);
  const position = $derived(firstKeyframe.time * pixelsPerSecond);
  const isSelected = $derived(keyframes.some((kf) => projectStore.selectedKeyframeIds.has(kf.id)));

  let isDragging = $state(false);
  let startX = 0;

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

  function handleDeleteAll() {
    for (const keyframe of keyframes) {
      projectStore.removeKeyframe(layerId, keyframe.id);
    }
  }

  let popoverOpen = $state(false);
</script>

<Popover.Root bind:open={popoverOpen}>
  <Popover.Trigger>
    {#snippet child({ props })}
      <div
        {...props}
        class="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-sm border-2 transition-transform hover:scale-110 active:cursor-grabbing"
        class:bg-primary={isSelected}
        class:bg-muted-foreground={!isSelected}
        class:border-primary={isSelected}
        class:border-background={!isSelected}
        style="left: {position}px"
        onmousedown={handleMouseDown}
        onkeydown={handleKeyDown}
        oncontextmenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        aria-label="Keyframe at {firstKeyframe.time.toFixed(2)}s"
      ></div>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content side="top" class="w-80">
    <div class="space-y-3">
      <!-- Header -->
      <div class="flex items-center justify-between border-b pb-2">
        <div class="flex items-center gap-2">
          <Clock class="h-4 w-4 text-muted-foreground" />
          <span class="text-sm font-semibold">{firstKeyframe.time.toFixed(2)}s</span>
        </div>
        {#if keyframes.length > 1}
          <div class="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
            {keyframes.length} properties
          </div>
        {/if}
      </div>

      <!-- Keyframe Cards -->
      <div class="space-y-2">
        {#each keyframes as keyframe (keyframe.id)}
          <KeyframeCard
            {keyframe}
            {layerId}
            {layerType}
            readonlyTime
            onGoToPropertyClick={() => (popoverOpen = false)}
          />
        {/each}
      </div>

      <!-- Delete All Button -->
      {#if keyframes.length > 1}
        <div class="border-t pt-2">
          <Popover.Root>
            <Popover.Trigger>
              {#snippet child({ props })}
                <Button variant="destructive" size="sm" class="w-full" {...props}>
                  <Trash2 class="mr-2 h-3.5 w-3.5" />
                  Delete All ({keyframes.length})
                </Button>
              {/snippet}
            </Popover.Trigger>
            <Popover.Content class="w-72" align="center" side="top">
              <div class="space-y-2">
                <h4 class="leading-none font-medium">Delete All Keyframes</h4>
                <p class="text-sm text-muted-foreground">
                  Delete all {keyframes.length} keyframes at {firstKeyframe.time.toFixed(2)}s? This
                  cannot be undone.
                </p>
                <div class="flex justify-end gap-2 pt-2">
                  <Popover.Close>
                    {#snippet child({ props })}
                      <Button variant="outline" size="sm" {...props}>Cancel</Button>
                    {/snippet}
                  </Popover.Close>
                  <Popover.Close>
                    {#snippet child({ props })}
                      <Button variant="destructive" size="sm" {...props} onclick={handleDeleteAll}>
                        Delete All
                      </Button>
                    {/snippet}
                  </Popover.Close>
                </div>
              </div>
            </Popover.Content>
          </Popover.Root>
        </div>
      {/if}
    </div>
  </Popover.Content>
</Popover.Root>
