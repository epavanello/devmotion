<script module lang="ts">
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';
  import { Folder } from '@lucide/svelte';

  export const FlexDirectionSchema = z
    .enum(['row', 'row-reverse', 'column', 'column-reverse'])
    .default('row')
    .describe('Main axis direction of the flex container');

  export const FlexWrapSchema = z
    .enum(['nowrap', 'wrap', 'wrap-reverse'])
    .default('nowrap')
    .describe('Whether flex items wrap onto multiple lines');

  export const JustifyContentSchema = z
    .enum(['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'])
    .default('flex-start')
    .describe('Alignment of flex items along the main axis');

  export const AlignItemsSchema = z
    .enum(['flex-start', 'flex-end', 'center', 'stretch', 'baseline'])
    .default('flex-start')
    .describe('Alignment of flex items along the cross axis');

  const schema = z.object({
    collapsed: z.boolean().default(false).describe('Whether the group is collapsed in the UI'),
    flexEnabled: z
      .boolean()
      .default(false)
      .describe('Enable flex layout to arrange child layers automatically'),
    flexDirection: FlexDirectionSchema,
    flexWrap: FlexWrapSchema,
    justifyContent: JustifyContentSchema,
    alignItems: AlignItemsSchema,
    gap: z.number().min(0).default(0).describe('Gap between flex items in pixels')
  });

  export const meta = {
    category: 'ui',
    schema,
    type: 'group',
    label: 'Folder',
    icon: Folder,
    description: 'A folder container that holds multiple child layers with linked transforms'
  } as const satisfies LayerMeta;
</script>

<script lang="ts">
  // Group layers don't render visual content themselves.
  // Children are rendered by layers-renderer.svelte inside the group's transform context.
</script>

<!-- Empty: group rendering is handled by layers-renderer -->
<div></div>
