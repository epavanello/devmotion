<script lang="ts">
  import { onMount } from 'svelte';
  import { projectStore } from '$lib/stores/project.svelte';
  import { createLayer } from '$lib/engine/layer-factory';

  onMount(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Space - Play/Pause
      if (e.code === 'Space') {
        e.preventDefault();
        if (projectStore.isPlaying) {
          projectStore.pause();
        } else {
          projectStore.play();
        }
      }

      // Delete - Remove selected layer
      if ((e.code === 'Delete' || e.code === 'Backspace') && projectStore.selectedLayerId) {
        e.preventDefault();
        if (confirm('Delete selected layer?')) {
          projectStore.removeLayer(projectStore.selectedLayerId);
        }
      }

      // Cmd/Ctrl + S - Save to cloud
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('devmotion:save'));
      }

      // Cmd/Ctrl + N - New project
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('devmotion:new-project'));
      }

      // Cmd/Ctrl + G - Toggle grid
      if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
        e.preventDefault();
        projectStore.toggleSnapToGrid();
      }

      // T - Add text layer
      if (e.key === 't' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const layer = createLayer('text');
        projectStore.addLayer(layer);
        projectStore.selectedLayerId = layer.id;
      }

      // R - Add rectangle
      if (e.key === 'r' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const layer = createLayer('shape');
        projectStore.addLayer(layer);
        projectStore.selectedLayerId = layer.id;
      }

      // Home - Go to start
      if (e.code === 'Home') {
        e.preventDefault();
        projectStore.setCurrentTime(0);
      }

      // End - Go to end
      if (e.code === 'End') {
        e.preventDefault();
        projectStore.setCurrentTime(projectStore.state.duration);
      }

      // Arrow Left - Step backward
      if (e.code === 'ArrowLeft' && !projectStore.isPlaying) {
        e.preventDefault();
        const newTime = projectStore.currentTime - 1 / projectStore.state.fps;
        projectStore.setCurrentTime(Math.max(0, newTime));
      }

      // Arrow Right - Step forward
      if (e.code === 'ArrowRight' && !projectStore.isPlaying) {
        e.preventDefault();
        const newTime = projectStore.currentTime + 1 / projectStore.state.fps;
        projectStore.setCurrentTime(Math.min(newTime, projectStore.state.duration));
      }

      // + / = - Zoom in
      if ((e.key === '+' || e.key === '=') && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        projectStore.setZoom(projectStore.viewport.zoom * 0.9);
      }

      // - - Zoom out
      if (e.key === '-' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        projectStore.setZoom(projectStore.viewport.zoom * 1.1);
      }

      // 0 - Reset zoom
      if (e.key === '0' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        projectStore.setZoom(1);
        projectStore.setPan(0, 0);
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });
</script>
