<script module lang="ts">
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';
  import { Group } from '@lucide/svelte';

  const schema = z.object({
    collapsed: z.boolean().default(false).describe('Whether the group is collapsed in the UI')
  });

  export const meta = {
    category: 'ui',
    schema,
    type: 'group',
    label: 'Group',
    icon: Group,
    description: 'A group container that holds multiple child layers with linked transforms'
  } as const satisfies LayerMeta;
</script>

<script lang="ts">
  // Group layers don't render visual content themselves.
  // Children are rendered by layers-renderer.svelte inside the group's transform context.
</script>

<!-- Empty: group rendering is handled by layers-renderer -->
<div></div>
