<script lang="ts">
  import SeoHead from '$lib/components/seo-head.svelte';
  import JsonLd from '$lib/components/json-ld.svelte';
  import EditorLayout from '$lib/components/editor/editor-layout.svelte';
  import { projectStore } from '$lib/stores/project.svelte';
  import { onMount } from 'svelte';
  import { PUBLIC_BASE_URL } from '$env/static/public';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const baseUrl = PUBLIC_BASE_URL;
  const projectName = $derived(data.project.data.name || 'Untitled Project');
  const projectDescription = $derived(
    `${projectName} - Animated video created with DevMotion. Design with manual controls or use AI-powered suggestions.`
  );
  const projectUrl = $derived(`${baseUrl}/p/${data.project.id}`);
  const ogImage = $derived(`${baseUrl}/p/${data.project.id}/og.png`);

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
      layers: projectData.layers
    });

    projectStore.setDbContext(data.project.id, data.isOwner, data.canEdit, data.project.isPublic);
  });
</script>

<SeoHead
  title="DevMotion - {projectName}"
  description={projectDescription}
  image="/p/{data.project.id}/og.png"
/>

<!-- JSON-LD for specific project -->
<JsonLd
  item={{
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: projectName,
    description: projectDescription,
    url: projectUrl,
    thumbnailUrl: ogImage,
    uploadDate: data.project.createdAt.toISOString(),
    author: {
      '@type': 'Person',
      name: data.project.user?.name || 'Anonymous'
    },
    creator: {
      '@type': 'Organization',
      name: 'DevMotion',
      url: baseUrl
    },
    publisher: {
      '@type': 'Organization',
      name: 'DevMotion',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/favicon.svg`
      }
    },
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: { '@type': 'WatchAction' },
      userInteractionCount: data.project.views || 0
    }
  }}
/>

<JsonLd
  item={{
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Projects',
        item: `${baseUrl}/gallery`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: projectName,
        item: projectUrl
      }
    ]
  }}
/>

<EditorLayout
  projectId={data.project.id}
  isOwner={data.isOwner}
  canEdit={data.canEdit}
  isPublic={data.project.isPublic}
  isMcp={data.project.isMcp}
/>
