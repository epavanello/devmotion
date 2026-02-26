<script lang="ts">
  import SeoHead from '$lib/components/seo-head.svelte';
  import JsonLd from '$lib/components/json-ld.svelte';
  import EditorLayout from '$lib/components/editor/editor-layout.svelte';
  import { PUBLIC_BASE_URL } from '$env/static/public';
  import type { PageData } from './$types';
  import { getEditorState } from '$lib/contexts/editor.svelte';
  import { ProjectSchema } from '$lib/types/animation';
  import { toast } from 'svelte-sonner';
  import { watch } from 'runed';
  import { Loader2 } from '@lucide/svelte';

  let { data }: { data: PageData } = $props();

  const editorState = $derived(getEditorState());

  const baseUrl = PUBLIC_BASE_URL;
  const projectName = $derived(editorState.project.state.name || 'Untitled Project');
  const projectDescription = $derived(
    `${projectName} - Motion graphics created with DevMotion. Professional animation editor for the web, powered by AI.`
  );
  const projectUrl = $derived(`${baseUrl}/p/${data.project.id}`);
  const ogImage = $derived(`${baseUrl}/p/${data.project.id}/og.png`);

  // Load project data when route changes
  watch(
    () => data,
    () => {
      try {
        const projectData = ProjectSchema.omit({ id: true }).parse(data.project.data);

        editorState.project.loadProject({
          id: data.project.id,
          name: projectData.name,
          width: projectData.width,
          height: projectData.height,
          duration: projectData.duration,
          fps: projectData.fps,
          background: projectData.background,
          layers: projectData.layers,
          fontFamily: projectData.fontFamily
        });
        editorState.markAsSaved();

        editorState.setDbContext(
          data.project.id,
          data.isOwner,
          data.canEdit,
          data.project.isPublic
        );

        editorState.isMcp = data.project.isMcp;
      } catch (error) {
        console.error('Failed to load project data:', error);
        toast.error('Failed to load project data');
      }
    }
  );
</script>

<SeoHead
  title="{projectName} - Animation by {data.project.user?.name || 'Community'} | DevMotion"
  description={projectDescription}
  image="/p/{data.project.id}/og.png"
  type="article"
  canonical={projectUrl}
  author={data.project.user?.name || 'Anonymous Creator'}
  publishedTime={data.project.createdAt.toISOString()}
  modifiedTime={data.project.updatedAt.toISOString()}
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

<!-- SEO: H1 for project page (visually hidden but accessible to search engines) -->
<h1 class="sr-only">{projectName} - Animation by {data.project.user?.name || 'Community'}</h1>

<svelte:boundary>
  {#snippet pending()}
    <div class="flex h-screen items-center justify-center">
      <Loader2 class="animate-spin" />
    </div>
  {/snippet}
  <EditorLayout />
</svelte:boundary>
