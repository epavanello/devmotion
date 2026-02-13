import { replaceState } from '$app/navigation';
import { resolve } from '$app/paths';
import { getEditorState, type EditorContext } from '$lib/contexts/editor.svelte';
import { getUser } from '$lib/functions/auth.remote';
import { getUserProjects, saveProject } from '$lib/functions/projects.remote';

class UIStore {
  showLoginPrompt = $state(false);
  promptAction = $state('this action');

  async requireLogin(action: string, fn: () => void | Promise<void>) {
    const user = await getUser();
    if (user) {
      await fn();
    } else {
      this.promptAction = action;
      this.showLoginPrompt = true;
    }
  }

  async requireCreateProject(editorState: EditorContext, fn: () => void | Promise<void>) {
    const projectId = editorState.dbProjectId;
    if (projectId) {
      await fn();
    } else {
      if (confirm(`You need to create a project to proceed. Would you like to create one now?`)) {
        await this.doSaveToCloud(editorState);
        await fn();
      }
    }
  }

  async doSaveToCloud(editorState: EditorContext) {
    const projectId = editorState.dbProjectId;
    const result = await saveProject({
      id: projectId || undefined,
      data: editorState.project.state
    });
    getUserProjects().refresh();
    if (result.success && result.data.id) {
      editorState.markAsSaved();
      if (!projectId) {
        replaceState(resolve(`/p/${result.data.id}`), {});
        editorState.setDbContext(result.data.id, true, true, false);
      }
    }
  }
}

export const uiStore = new UIStore();
