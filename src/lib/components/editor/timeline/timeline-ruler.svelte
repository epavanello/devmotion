<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Plus, Maximize2, Minimize2 } from '@lucide/svelte';
  import AddLayer from '../panels/add-layer-dropdown.svelte';

  interface Props {
    pixelsPerSecond: number;
    duration: number;
    allExpanded: boolean;
    onToggleAll?: () => void;
  }

  let { pixelsPerSecond, duration, allExpanded, onToggleAll }: Props = $props();

  // Calculate appropriate sub-divisions based on zoom level
  const timeScale = $derived.by(() => {
    const pps = pixelsPerSecond;

    // Determine major/minor divisions based on pixels per second
    if (pps >= 400) {
      // Very zoomed in: show 0.1s increments
      return { major: 0.5, minor: 0.1, sub: 0.02, format: (t: number) => `${t.toFixed(1)}s` };
    } else if (pps >= 200) {
      // Zoomed in: show 0.2s increments
      return { major: 1, minor: 0.2, sub: 0.1, format: (t: number) => `${t.toFixed(1)}s` };
    } else if (pps >= 70) {
      // Zoomed out: show 1s increments
      return { major: 1, minor: 0.5, sub: 0.1, format: (t: number) => `${t}s` };
    } else {
      // Very zoomed out: show 5s increments
      return { major: 5, minor: 5, sub: 1, format: (t: number) => `${t}s` };
    }
  });

  const majorMarks = $derived.by(() => {
    const marks = [];
    const step = timeScale.major;
    for (let i = 0; i <= duration; i += step) {
      marks.push(i);
    }
    return marks;
  });

  const minorMarks = $derived.by(() => {
    const marks = [];
    const step = timeScale.minor;
    for (let i = 0; i <= duration; i += step) {
      // Skip if it's a major mark
      if (i % timeScale.major === 0) continue;
      marks.push(i);
    }
    return marks;
  });

  const subMarks = $derived.by(() => {
    const marks = [];
    const step = timeScale.sub;
    for (let i = 0; i <= duration; i += step) {
      // Skip if it's a major or minor mark
      if (i % timeScale.minor === 0) continue;
      marks.push(i);
    }
    return marks;
  });
</script>

<div class="timeline-ruler relative flex h-10 bg-muted/20">
  <!-- Layer names header with controls -->
  <div
    class="sticky left-0 z-10 flex w-60 shrink-0 items-center justify-between border-r bg-background px-2"
  >
    <span class="text-xs font-medium text-muted-foreground">LAYERS</span>

    <div class="flex items-center gap-0.5">
      <!-- Toggle Expand/Collapse All -->
      <Button
        variant="ghost"
        size="icon-xs"
        icon={allExpanded ? Minimize2 : Maximize2}
        onclick={onToggleAll}
        title={allExpanded ? 'Collapse all layers and properties' : 'Expand all layers and properties'}
      />

      <!-- Add Layer -->
      <AddLayer>
        {#snippet child({ props })}
          <Button variant="ghost" size="sm" class="h-7 w-7 p-0" icon={Plus} {...props} />
        {/snippet}
      </AddLayer>
    </div>
  </div>

  <!-- Time markers -->
  <div class="relative flex-1 bg-muted/10">
    <!-- Sub marks (thinnest) -->
    {#each subMarks as time (time)}
      <div
        class="absolute bottom-0 h-2 border-l border-muted-foreground/10"
        style="left: {time * pixelsPerSecond}px"
      ></div>
    {/each}

    <!-- Minor marks -->
    {#each minorMarks as time (time)}
      <div
        class="absolute bottom-0 h-3 border-l border-muted-foreground/20"
        style="left: {time * pixelsPerSecond}px"
      ></div>
    {/each}

    <!-- Major marks with labels -->
    {#each majorMarks as time (time)}
      {@const position = time * pixelsPerSecond}
      {@const labelWidth = 30}
      {@const isNearEnd = position > duration * pixelsPerSecond - labelWidth}
      <div class="absolute h-full border-l border-muted-foreground/30" style="left: {position}px">
        <span
          class="absolute top-1 text-[10px] font-medium text-muted-foreground"
          style={isNearEnd ? 'right: 1px' : 'left: 1px'}
        >
          {timeScale.format(time)}
        </span>
      </div>
    {/each}
  </div>
</div>
