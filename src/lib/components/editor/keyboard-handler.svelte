<script lang="ts">
  import { onMount } from 'svelte';
  import { getEditorState } from '$lib/contexts/editor.svelte';
  import { createLayer } from '$lib/engine/layer-factory';
  import { confirmDialogStore } from '$lib/stores/confirm-dialog.svelte';

  const editorState = $derived(getEditorState());
  const projectStore = $derived(editorState.project);

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

      // Delete - Remove selected keyframes or layer
      if (e.code === 'Delete' || e.code === 'Backspace') {
        e.preventDefault();

        // Priority 1: Delete selected keyframes if any
        if (projectStore.selectedKeyframeIds.size > 0) {
          const count = projectStore.selectedKeyframeIds.size;
          const title = count === 1 ? 'Delete Keyframe' : 'Delete Keyframes';
          const description =
            count === 1
              ? 'Delete selected keyframe? This action cannot be undone.'
              : `Delete ${count} selected keyframes? This action cannot be undone.`;

          confirmDialogStore
            .confirm({
              title,
              description,
              confirmLabel: 'Delete',
              variant: 'destructive'
            })
            .then((confirmed) => {
              if (confirmed) {
                // Get all layer IDs and their keyframes to delete
                const keyframesToDelete = new Map<string, string[]>();

                for (const layer of projectStore.state.layers) {
                  for (const kf of layer.keyframes) {
                    if (projectStore.selectedKeyframeIds.has(kf.id)) {
                      if (!keyframesToDelete.has(layer.id)) {
                        keyframesToDelete.set(layer.id, []);
                      }
                      keyframesToDelete.get(layer.id)!.push(kf.id);
                    }
                  }
                }

                // Delete all selected keyframes
                for (const [layerId, keyframeIds] of keyframesToDelete) {
                  for (const keyframeId of keyframeIds) {
                    projectStore.removeKeyframe(layerId, keyframeId);
                  }
                }

                // Clear selection after deletion
                projectStore.clearKeyframeSelection();
              }
            });
        }
        // Priority 2: Delete selected layer if no keyframes are selected
        else if (projectStore.selectedLayerId) {
          confirmDialogStore
            .confirm({
              title: 'Delete Layer',
              description: 'Delete selected layer? This action cannot be undone.',
              confirmLabel: 'Delete',
              variant: 'destructive'
            })
            .then((confirmed) => {
              if (confirmed) {
                projectStore.removeLayer(projectStore.selectedLayerId!);
              }
            });
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
        projectStore.selectLayer(layer.id);
      }

      // R - Add rectangle
      if (e.key === 'r' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const layer = createLayer('shape');
        projectStore.addLayer(layer);
        projectStore.selectLayer(layer.id);
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
