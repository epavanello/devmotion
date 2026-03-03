<script lang="ts">
  import { Play, Pause, Volume2, VolumeX, Maximize2 } from '@lucide/svelte';

  let {
    isPlaying = $bindable(false),
    currentTime = $bindable(0),
    duration = 0,
    globalVolume = $bindable(100),
    canvasContainer,
    onPlayPause,
    onTimeChange,
    onVolumeChange
  }: {
    isPlaying?: boolean;
    currentTime?: number;
    duration?: number;
    globalVolume?: number;
    canvasContainer?: HTMLDivElement;
    onPlayPause?: () => void;
    onTimeChange?: (time: number) => void;
    onVolumeChange?: (volume: number) => void;
  } = $props();

  let isDraggingTimeline = $state(false);
  let timelineElement: HTMLElement | null = null;
  let wasPlayingBeforeScrub = $state(false);

  function handleTimelineClick(event: MouseEvent) {
    if (!timelineElement) return;
    const rect = timelineElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    const clampedTime = Math.max(0, Math.min(duration, newTime));

    currentTime = clampedTime;
    onTimeChange?.(clampedTime);
  }

  function startTimelineDrag(event: MouseEvent) {
    event.preventDefault();
    isDraggingTimeline = true;

    // Remember if we were playing and pause
    wasPlayingBeforeScrub = isPlaying;
    if (isPlaying) {
      isPlaying = false;
      onPlayPause?.();
    }

    handleTimelineClick(event);
  }

  function handleTimelineDrag(event: MouseEvent) {
    if (!isDraggingTimeline) return;
    handleTimelineClick(event);
  }

  function stopTimelineDrag() {
    isDraggingTimeline = false;

    // Restore playing state if it was playing before
    if (wasPlayingBeforeScrub) {
      isPlaying = true;
      onPlayPause?.();
      wasPlayingBeforeScrub = false;
    }
  }

  $effect(() => {
    if (isDraggingTimeline) {
      window.addEventListener('mousemove', handleTimelineDrag);
      window.addEventListener('mouseup', stopTimelineDrag);

      return () => {
        window.removeEventListener('mousemove', handleTimelineDrag);
        window.removeEventListener('mouseup', stopTimelineDrag);
      };
    }
  });

  function togglePlayback() {
    isPlaying = !isPlaying;
    onPlayPause?.();
  }

  function toggleFullscreen() {
    if (!canvasContainer) return;
    if (!document.fullscreenElement) {
      canvasContainer.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  function toggleMute() {
    const newVolume = globalVolume > 0 ? 0 : 100;
    globalVolume = newVolume;
    onVolumeChange?.(newVolume);
  }

  function handleVolumeInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const newVolume = Number(target.value);
    globalVolume = newVolume;
    onVolumeChange?.(newVolume);
  }

  const timelineProgress = $derived((currentTime / duration) * 100);

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
</script>

<!-- Integrated Player Controls - Floating attached to viewport -->
<div
  class="absolute inset-x-0 bottom-0 flex flex-col gap-3 rounded-b-2xl bg-linear-to-t from-black/40 to-transparent p-6 opacity-0 transition-opacity duration-200 group-hover/viewport:opacity-100 [@media(hover:none)]:opacity-100"
>
  <!-- Timeline progress bar with larger hit area -->
  <div
    bind:this={timelineElement}
    class="group/timeline relative -mx-2 cursor-pointer px-2 py-2"
    onmousedown={startTimelineDrag}
    role="slider"
    tabindex="0"
    aria-label="Timeline"
    aria-valuemin="0"
    aria-valuemax={duration}
    aria-valuenow={currentTime}
  >
    <!-- Visual timeline bar -->
    <div class="relative h-1.5 rounded-full bg-white/10">
      <!-- Progress fill -->
      <div
        class="absolute inset-y-0 left-0 rounded-full bg-white/90"
        style:width="{timelineProgress}%"
      ></div>

      <!-- Playhead indicator -->
      <div
        class="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg transition-transform group-hover/timeline:scale-125"
        style:left="{timelineProgress}%"
      ></div>
    </div>
  </div>

  <!-- Main controls bar -->
  <div class="flex items-center gap-3 rounded-lg text-white">
    <!-- Play/Pause button -->
    <button
      onclick={togglePlayback}
      class="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-white/20"
    >
      {#if isPlaying}
        <Pause class="size-5" />
      {:else}
        <Play class="size-5" />
      {/if}
    </button>

    <!-- Volume control (expandable) -->
    <div class="group/volume flex items-center gap-2">
      <button
        class="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-white/20"
        onclick={toggleMute}
      >
        {#if globalVolume === 0}
          <VolumeX class="size-5" />
        {:else}
          <Volume2 class="size-5" />
        {/if}
      </button>

      <div
        class="flex w-0 items-center gap-2 overflow-hidden transition-all group-hover/volume:w-[calc-size(auto,size)]"
      >
        <input
          type="range"
          min="0"
          max="100"
          value={globalVolume}
          oninput={handleVolumeInput}
          class="h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/30"
        />
        <span class="min-w-8 text-xs font-medium">{Math.round(globalVolume)}%</span>
      </div>
    </div>

    <!-- Time display -->
    <span class="font-mono text-sm tabular-nums">
      {formatTime(currentTime)} / {formatTime(duration)}
    </span>

    <!-- Spacer -->
    <div class="flex-1"></div>

    <!-- Fullscreen button -->
    <button
      onclick={toggleFullscreen}
      class="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-white/20"
    >
      <Maximize2 class="size-5" />
    </button>
  </div>
</div>
