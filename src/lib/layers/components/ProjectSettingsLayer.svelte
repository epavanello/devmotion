<script module lang="ts">
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';
  import { Settings } from '@lucide/svelte';
  import { fieldRegistry } from '$lib/layers/properties/field-registry';
  import { BackgroundValueSchema } from '$lib/schemas/background';
  import { googleFontValues } from '$lib/utils/fonts';
  import FontProperty from '../properties/FontProperty.svelte';
  import ResolutionPreset from '../properties/ResolutionPreset.svelte';

  /**
   * Schema for Project Settings layer custom properties.
   * These map directly to project-level fields (width, height, duration, background, fontFamily).
   */
  const schema = z.object({
    width: z
      .number()
      .min(100)
      .max(8192)
      .default(720)
      .describe('Width (px)')
      .register(fieldRegistry, { hidden: true, interpolationFamily: 'continuous' }),
    height: z
      .number()
      .min(100)
      .max(8192)
      .default(1280)
      .describe('Height (px)')
      .register(fieldRegistry, { hidden: true, interpolationFamily: 'continuous' }),
    duration: z
      .number()
      .min(1)
      .max(600)
      .default(5)
      .describe('Duration (s)')
      .register(fieldRegistry, { interpolationFamily: 'continuous' }),
    background: BackgroundValueSchema.optional()
      .describe('Background')
      .register(fieldRegistry, { widget: 'background', interpolationFamily: 'discrete' }),
    fontFamily: z
      .enum(googleFontValues)
      .optional()
      .default('Inter')
      .describe('Default Font')
      .register(fieldRegistry, {
        interpolationFamily: 'discrete',
        widget: 'custom',
        component: FontProperty
      })
  });

  export const meta = {
    category: 'ui',
    schema,
    type: 'project-settings',
    label: 'Project',
    icon: Settings,
    description: 'Project-level settings: resolution, duration, background, and default font',
    customPropertyComponents: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolutionPreset: { component: ResolutionPreset as any }
    }
  } as const satisfies LayerMeta;
</script>

<script lang="ts">
  // Project settings layer does not render visual content on the canvas.
  // Its properties are displayed in the properties panel and mapped
  // to the project store.
</script>

<!-- Empty: project-settings layer is virtual and not rendered on canvas -->
<div></div>
