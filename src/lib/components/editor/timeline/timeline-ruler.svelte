<script lang="ts">
  interface Props {
    pixelsPerSecond: number;
    duration: number;
  }

  let { pixelsPerSecond, duration }: Props = $props();

  const markers = $derived(() => {
    const marks = [];
    const totalSeconds = Math.ceil(duration);
    for (let i = 0; i <= totalSeconds; i++) {
      marks.push(i);
    }
    return marks;
  });
</script>

<div class="timeline-ruler relative flex h-8 bg-muted/30">
  <!-- Layer names spacer -->
  <div class="w-[200px] shrink-0 border-r"></div>

  <!-- Time markers -->
  <div class="relative flex-1">
    {#each markers() as second, index (index)}
      <div
        class="absolute h-full border-l border-muted-foreground/20"
        style="left: {second * pixelsPerSecond}px"
      >
        <span class="ml-1 text-xs text-muted-foreground">{second}s</span>
      </div>
    {/each}
  </div>
</div>
