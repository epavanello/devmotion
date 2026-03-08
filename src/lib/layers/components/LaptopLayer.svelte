<script module lang="ts">
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';
  import { Laptop } from '@lucide/svelte';
  import { fieldRegistry } from '$lib/layers/properties/field-registry';
  import { sizeMiddleware } from '$lib/schemas/size';
  import AspectRatioToggle from '../properties/AspectRatioToggle.svelte';

  const schema = z.object({
    url: z
      .string()
      .default('https://devmotion.app')
      .describe('The URL to display on the laptop screen'),
    width: z
      .number()
      .min(200)
      .max(2000)
      .default(800)
      .describe('Total width of the laptop in pixels')
      .register(fieldRegistry, {
        group: 'size',
        interpolationFamily: 'continuous',
        label: 'Width'
      }),
    height: z
      .number()
      .min(150)
      .max(1500)
      .default(500)
      .describe('Total height of the laptop screen panel in pixels')
      .register(fieldRegistry, {
        group: 'size',
        interpolationFamily: 'continuous',
        label: 'Height'
      }),
    _aspectRatioLocked: z
      .boolean()
      .default(false)
      .describe('Internal: whether aspect ratio is locked')
      .register(fieldRegistry, { hidden: true }),
    _aspectRatio: z
      .number()
      .default(1)
      .describe('Internal: stored aspect ratio')
      .register(fieldRegistry, { hidden: true }),
    openAngle: z
      .number()
      .min(0)
      .max(180)
      .default(110)
      .describe(
        'How far the screen lid is open, in degrees. 0 = closed, 90 = perpendicular, 180 = flat open'
      )
      .register(fieldRegistry, {
        interpolationFamily: 'continuous',
        label: 'Open Angle'
      }),
    baseColor: z
      .string()
      .default('#c0c0c0')
      .describe('Color of the laptop base/body')
      .register(fieldRegistry, { label: 'Base Color', widget: 'color' }),
    screenColor: z
      .string()
      .default('#2d2d2d')
      .describe('Color of the screen bezel/lid back')
      .register(fieldRegistry, { label: 'Screen Color', widget: 'color' })
  });

  export const meta = {
    category: 'code',
    schema,
    type: 'laptop',
    label: 'Laptop',
    icon: Laptop,
    description: 'A 3D laptop with adjustable screen angle and URL display',
    propertyGroups: [{ id: 'size', label: 'Size', widget: AspectRatioToggle }],
    middleware: sizeMiddleware
  } as const satisfies LayerMeta;

  type Props = z.infer<typeof schema>;
</script>

<script lang="ts">
  import type { WrappedLayerProps } from '../LayerWrapper.svelte';

  let {
    width,
    height,
    openAngle,
    url,
    baseColor,
    screenColor,
    isServerSideRendering
  }: WrappedLayerProps<Props> = $props();

  const baseDepth = $derived(Math.round(width / 1.6));
  const baseThickness = 8;
  const screenThickness = 5;
  const bezel = 12;
  const hingeRadius = 5;
</script>

<!-- 3D laptop container -->
<div class="laptop-container" style:width="{width}px" style:height="{height + baseDepth}px">
  <!-- ====== SHADOW on surface ====== -->
  <div
    class="laptop-shadow"
    style:width="{width * 0.9}px"
    style:height="{baseDepth * 0.4}px"
    style:bottom="-{baseDepth * 0.08}px"
    style:left="{width * 0.05}px"
  ></div>

  <!-- ====== BASE (keyboard deck) ====== -->
  <div
    class="base"
    style:width="{width}px"
    style:height="{baseDepth}px"
    style:bottom="0"
    style:--base-color={baseColor}
    style:--base-thickness="{baseThickness}px"
  >
    <!-- Top face (keyboard surface) -->
    <div class="base-top" style:background={baseColor}>
      <!-- Speaker grille -->
      <div class="speaker-grille"></div>
      <!-- Keyboard with key rows -->
      <div class="keyboard-area">
        <div class="key-row" style:height="17%"></div>
        <div class="key-row" style:height="17%"></div>
        <div class="key-row" style:height="17%"></div>
        <div class="key-row" style:height="17%"></div>
        <div class="key-row key-row-bottom" style:height="14%"></div>
      </div>
      <!-- Trackpad -->
      <div class="trackpad"></div>
    </div>
    <!-- Bottom face -->
    <div class="base-bottom" style:background={baseColor}>
      <!-- Rubber feet -->
      <div class="foot foot-tl"></div>
      <div class="foot foot-tr"></div>
      <div class="foot foot-bl"></div>
      <div class="foot foot-br"></div>
    </div>
    <!-- Front edge (tapered / thinner lip) -->
    <div class="base-front" style:background={baseColor}></div>
    <!-- Back edge -->
    <div class="base-back" style:background={baseColor}></div>
    <!-- Left edge -->
    <div class="base-side base-left" style:background={baseColor}></div>
    <!-- Right edge -->
    <div class="base-side base-right" style:background={baseColor}></div>
  </div>

  <!-- ====== HINGE CYLINDER ====== -->
  <div
    class="hinge"
    style:width="{width * 0.85}px"
    style:bottom="{baseDepth - hingeRadius}px"
    style:left="{width * 0.075}px"
    style:height="{hingeRadius * 2}px"
    style:background={baseColor}
  ></div>

  <!-- ====== SCREEN LID ====== -->
  <div
    class="lid-hinge"
    style:width="{width}px"
    style:bottom="{baseDepth}px"
    style:--open-angle={openAngle}
  >
    <div
      class="lid"
      style:width="{width}px"
      style:height="{height}px"
      style:--screen-color={screenColor}
      style:--screen-thickness="{screenThickness}px"
    >
      <!-- Front face (screen side) -->
      <div class="lid-front">
        <div class="screen-bezel" style:padding="{bezel}px" style:padding-top="{bezel + 6}px">
          <!-- Camera notch -->
          <div class="camera" style:top="{bezel * 0.35}px">
            <div class="camera-lens"></div>
          </div>
          {#if url && !isServerSideRendering}
            <iframe
              src={url}
              title="Laptop screen content"
              class="screen-iframe"
              sandbox="allow-same-origin allow-scripts allow-forms"
            ></iframe>
          {:else}
            <div class="screen-placeholder">
              <span class="placeholder-text">{url || 'Enter URL'}</span>
            </div>
          {/if}
          <!-- Glass reflection overlay -->
          <div class="screen-glare"></div>
        </div>
      </div>
      <!-- Back face (lid exterior) -->
      <div class="lid-back" style:background={screenColor}>
        <!-- Logo on lid back -->
        <div class="lid-logo"></div>
      </div>
      <!-- Top edge -->
      <div class="lid-edge lid-top-edge" style:background={screenColor}></div>
      <!-- Bottom edge (near hinge) -->
      <div class="lid-edge lid-bottom-edge" style:background={screenColor}></div>
      <!-- Left edge -->
      <div class="lid-side lid-left-side" style:background={screenColor}></div>
      <!-- Right edge -->
      <div class="lid-side lid-right-side" style:background={screenColor}></div>
    </div>
  </div>
</div>

<style>
  .laptop-container {
    position: relative;
    transform-style: preserve-3d;
    transform: rotateX(10deg);
  }

  /* ==================== SHADOW ==================== */
  .laptop-shadow {
    position: absolute;
    border-radius: 50%;
    background: radial-gradient(ellipse, rgba(0, 0, 0, 0.25) 0%, transparent 70%);
    pointer-events: none;
    filter: blur(8px);
  }

  /* ==================== BASE ==================== */
  .base {
    position: absolute;
    left: 0;
    transform-style: preserve-3d;
  }

  .base-top {
    position: absolute;
    inset: 0;
    border-radius: 6px 6px 2px 2px;
    transform: translateZ(var(--base-thickness));
    box-shadow:
      inset 0 1px 3px rgba(255, 255, 255, 0.35),
      inset 0 -1px 2px rgba(0, 0, 0, 0.08);
  }

  .base-bottom {
    position: absolute;
    inset: 0;
    border-radius: 6px;
    filter: brightness(0.65);
  }

  .base-front {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: var(--base-thickness);
    transform-origin: bottom center;
    transform: rotateX(-90deg);
    border-radius: 0 0 3px 3px;
    filter: brightness(0.82);
    background: linear-gradient(
      to bottom,
      var(--base-color) 0%,
      color-mix(in srgb, var(--base-color) 85%, black) 100%
    ) !important;
  }

  .base-back {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: var(--base-thickness);
    transform-origin: top center;
    transform: rotateX(90deg);
    filter: brightness(0.75);
  }

  .base-side {
    position: absolute;
    top: 0;
    width: var(--base-thickness);
    height: 100%;
    filter: brightness(0.78);
  }

  .base-left {
    left: 0;
    transform-origin: left center;
    transform: rotateY(-90deg);
  }

  .base-right {
    right: 0;
    transform-origin: right center;
    transform: rotateY(90deg);
  }

  /* Speaker grille (above keyboard) */
  .speaker-grille {
    position: absolute;
    top: 3%;
    left: 15%;
    right: 15%;
    height: 3%;
    background: repeating-linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.15) 0px,
      rgba(0, 0, 0, 0.15) 1px,
      transparent 1px,
      transparent 3px
    );
    border-radius: 1px;
  }

  /* Keyboard with individual key rows */
  .keyboard-area {
    position: absolute;
    top: 9%;
    left: 5%;
    right: 5%;
    height: 56%;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 2px;
  }

  .key-row {
    flex: none;
    background: repeating-linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.1) 0px,
      rgba(0, 0, 0, 0.1) 6%,
      rgba(0, 0, 0, 0.02) 6%,
      rgba(0, 0, 0, 0.02) 6.8%
    );
    border-radius: 1px;
    box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.08);
  }

  .key-row-bottom {
    /* Space bar row — wider center key */
    background:
      linear-gradient(
        90deg,
        transparent 0%,
        transparent 25%,
        rgba(0, 0, 0, 0.08) 25%,
        rgba(0, 0, 0, 0.08) 75%,
        transparent 75%,
        transparent 100%
      ),
      repeating-linear-gradient(
        90deg,
        rgba(0, 0, 0, 0.1) 0px,
        rgba(0, 0, 0, 0.1) 8%,
        rgba(0, 0, 0, 0.02) 8%,
        rgba(0, 0, 0, 0.02) 9%
      );
  }

  .trackpad {
    position: absolute;
    bottom: 8%;
    left: 50%;
    transform: translateX(-50%);
    width: 30%;
    height: 24%;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.04) 0%, rgba(0, 0, 0, 0.02) 100%);
    border-radius: 8px;
    box-shadow:
      inset 0 0 0 0.5px rgba(0, 0, 0, 0.15),
      inset 0 1px 2px rgba(0, 0, 0, 0.06),
      0 0.5px 0 rgba(255, 255, 255, 0.2);
  }

  /* Rubber feet on bottom */
  .foot {
    position: absolute;
    width: 8%;
    height: 4%;
    background: rgba(0, 0, 0, 0.35);
    border-radius: 2px;
  }

  .foot-tl {
    top: 8%;
    left: 6%;
  }

  .foot-tr {
    top: 8%;
    right: 6%;
  }

  .foot-bl {
    bottom: 8%;
    left: 6%;
  }

  .foot-br {
    bottom: 8%;
    right: 6%;
  }

  /* ==================== HINGE ==================== */
  .hinge {
    position: absolute;
    transform-style: preserve-3d;
    transform: translateZ(4px);
    border-radius: 50% / 50%;
    filter: brightness(0.7);
    box-shadow:
      inset 0 1px 2px rgba(255, 255, 255, 0.15),
      inset 0 -1px 1px rgba(0, 0, 0, 0.3);
    z-index: 1;
  }

  /* ==================== SCREEN LID ==================== */
  .lid-hinge {
    position: absolute;
    left: 0;
    height: 0;
    transform-style: preserve-3d;
    transform: translateZ(8px);
  }

  .lid {
    position: absolute;
    bottom: 0;
    left: 0;
    transform-style: preserve-3d;
    transform-origin: bottom center;
    transform: rotateX(calc(var(--open-angle) * -1deg));
  }

  .lid-front {
    position: absolute;
    inset: 0;
    background: #111;
    border-radius: 6px 6px 0 0;
    transform: translateZ(var(--screen-thickness));
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.04);
    overflow: hidden;
  }

  .lid-back {
    position: absolute;
    inset: 0;
    border-radius: 6px 6px 0 0;
    box-shadow:
      inset 0 1px 4px rgba(255, 255, 255, 0.12),
      inset 0 -1px 2px rgba(0, 0, 0, 0.25);
  }

  /* Logo on lid back (centered glowing circle) */
  .lid-logo {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 28px;
    height: 28px;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.4) 0%,
      rgba(255, 255, 255, 0.15) 50%,
      transparent 70%
    );
    box-shadow: 0 0 12px 2px rgba(255, 255, 255, 0.1);
  }

  .lid-edge {
    position: absolute;
    left: 0;
    width: 100%;
    height: var(--screen-thickness);
  }

  .lid-top-edge {
    top: 0;
    transform-origin: top center;
    transform: rotateX(90deg);
    border-radius: 6px 6px 0 0;
    filter: brightness(0.82);
  }

  .lid-bottom-edge {
    bottom: 0;
    transform-origin: bottom center;
    transform: rotateX(-90deg);
    filter: brightness(0.88);
  }

  .lid-side {
    position: absolute;
    top: 0;
    width: var(--screen-thickness);
    height: 100%;
    filter: brightness(0.82);
  }

  .lid-left-side {
    left: 0;
    transform-origin: left center;
    transform: rotateY(-90deg);
  }

  .lid-right-side {
    right: 0;
    transform-origin: right center;
    transform: rotateY(90deg);
  }

  /* Screen content area */
  .screen-bezel {
    position: absolute;
    inset: 0;
    display: flex;
    border-radius: 6px 6px 0 0;
    overflow: hidden;
  }

  /* Camera dot */
  .camera {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .camera-lens {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: radial-gradient(circle, #1a1a2e 40%, #0a0a0a 100%);
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.08),
      0 0 3px 1px rgba(0, 100, 255, 0.08);
  }

  /* Glass reflection overlay */
  .screen-glare {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 1;
    background: linear-gradient(
      125deg,
      rgba(255, 255, 255, 0.06) 0%,
      rgba(255, 255, 255, 0.02) 30%,
      transparent 50%
    );
    border-radius: 2px;
  }

  .screen-iframe {
    flex: 1;
    border: none;
    border-radius: 3px;
    pointer-events: none;
    background: #000;
  }

  .screen-placeholder {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border-radius: 3px;
    box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.3);
  }

  .placeholder-text {
    color: rgba(255, 255, 255, 0.25);
    font-size: 14px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-weight: 500;
    letter-spacing: 0.5px;
  }
</style>
