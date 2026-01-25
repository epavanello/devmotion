<script lang="ts">
  import EditorLayout from '$lib/components/editor/editor-layout.svelte';
  import { projectStore } from '$lib/stores/project.svelte';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  onMount(() => {
    const projectData = data.project.data;

    projectStore.loadProject({
      id: data.project.id,
      name: projectData.name,
      width: projectData.width,
      height: projectData.height,
      duration: projectData.duration,
      fps: projectData.fps,
      backgroundColor: projectData.backgroundColor,
      layers: projectData.layers,
      currentTime: projectData.currentTime
    });

    projectStore.setDbContext(data.project.id, data.isOwner, data.canEdit, data.project.isPublic);
  });
</script>

<svelte:head>
  {#if data.project.data.name}
    <title>DevMotion - {data.project.data.name}</title>
  {/if}
</svelte:head>

<EditorLayout
  projectId={data.project.id}
  isOwner={data.isOwner}
  canEdit={data.canEdit}
  isPublic={data.project.isPublic}
/>
