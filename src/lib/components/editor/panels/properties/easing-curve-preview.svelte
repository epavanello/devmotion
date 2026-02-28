<script lang="ts">
  import type { ContinuousInterpolationStrategy } from '$lib/schemas/animation';
  import { getEasingFunction } from '$lib/engine/interpolation';

  const { strategy, progress }: { strategy: ContinuousInterpolationStrategy; progress: number } =
    $props();

  // Generate SVG path for the easing curve and calculate bounds
  const curveData = $derived.by(() => {
    const easingFn = getEasingFunction(strategy);
    const steps = 50; // Number of points to sample
    const values: number[] = [];

    // Sample the easing function to get all Y values
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      values.push(easingFn(t));
    }

    // Find min/max Y values to determine bounds (with some padding)
    const minY = Math.min(...values);
    const maxY = Math.max(...values);
    const padding = 0.1; // 10% padding
    const rangeY = maxY - minY;
    const paddedMinY = minY - rangeY * padding;
    const paddedMaxY = maxY + rangeY * padding;
    const paddedRangeY = paddedMaxY - paddedMinY;

    // Build points normalized to the padded range
    const points: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = t * 100; // X coordinate (time)
      // Normalize Y to 0-100 range based on padded min/max, then invert for SVG
      const normalizedY = ((values[i] - paddedMinY) / paddedRangeY) * 100;
      const y = 100 - normalizedY; // Inverted because SVG Y grows downward
      points.push([x, y]);
    }

    // Build SVG path
    const path = points
      .map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`))
      .join(' ');

    return { path, viewBox: '0 0 100 100', minY: paddedMinY, maxY: paddedMaxY };
  });

  // Current position on the easing curve (for the animated dot)
  const previewDot = $derived.by(() => {
    const easingFn = getEasingFunction(strategy);
    const rawY = easingFn(progress);

    // Normalize to the same range as the curve
    const { minY, maxY } = curveData;
    const normalizedY = ((rawY - minY) / (maxY - minY)) * 100;

    return {
      x: progress * 100,
      y: 100 - normalizedY // Inverted for SVG
    };
  });
</script>

<div
  class="sticky top-0 z-10 flex items-center justify-center border-b border-border bg-background p-4"
>
  <div class="relative h-20 w-20 overflow-hidden rounded border border-border">
    <!-- Easing curve visualization -->
    <svg class="h-full w-full" viewBox={curveData.viewBox} preserveAspectRatio="none">
      <!-- Grid lines at 0 and 1 normalized positions -->
      <line x1="0" y1="100" x2="100" y2="100" stroke="currentColor" opacity="0.1" />
      <line x1="0" y1="0" x2="100" y2="0" stroke="currentColor" opacity="0.1" />
      <line x1="0" y1="0" x2="0" y2="100" stroke="currentColor" opacity="0.1" />
      <line x1="100" y1="0" x2="100" y2="100" stroke="currentColor" opacity="0.1" />

      <!-- Easing curve -->
      <path
        d={curveData.path}
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        class="text-primary"
      />

      <!-- Animated dot -->
      <circle cx={previewDot.x} cy={previewDot.y} r="3" fill="currentColor" class="text-primary" />
    </svg>
  </div>
</div>
