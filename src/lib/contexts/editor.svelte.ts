/**
 * Editor context for managing project state and persistence
 */
import { ProjectStore } from '$lib/stores/project.svelte';
import type { Project } from '$lib/types/animation';
import { createContext } from 'svelte';
import { watch } from 'runed';
import { nanoid } from 'nanoid';

const STORAGE_KEY = 'devmotion_store';
const DEBOUNCE_MS = 500;

export type EditorContext = {
  project: ProjectStore;
  dbProjectId: string | null;
  isOwner: boolean;
  canEdit: boolean;
  isPublic: boolean;
  isMcp: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  setDbContext: (
    projectId: string | null,
    isOwner: boolean,
    canEdit: boolean,
    isPublic: boolean
  ) => void;
  markAsSaved: () => void;
  resetToNew: () => void;
};

function loadFromLocalStorage(): Project | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load project from localStorage:', error);
  }

  return null;
}

function saveToLocalStorage(project: Project) {
  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    console.log('Project saved to localStorage');
  } catch (error) {
    console.error('Failed to save project to localStorage:', error);
  }
}

export function getDefaultProject(): Project {
  return {
    id: nanoid(),
    name: 'Untitled Project',
    width: 720,
    height: 1280,
    duration: 5,
    fps: 30,
    background: '#000000',
    layers: []
  };
}

// Create context
const [getEditorState, setEditorState] = createContext<EditorContext>();

export { getEditorState };

/**
 * Initialize the editor context with localStorage persistence
 * Call this once at the app root
 */
export function initializeEditorContext() {
  // Load initial project from localStorage or create new
  const initialProject = loadFromLocalStorage() ?? getDefaultProject();
  const projectStore = new ProjectStore(initialProject);

  const editorContext: EditorContext = $state({
    project: projectStore,
    dbProjectId: null,
    isOwner: true,
    canEdit: true,
    isPublic: false,
    isMcp: false,
    isSaving: false,
    hasUnsavedChanges: false,
    setDbContext: (
      projectId: string | null,
      isOwner: boolean,
      canEdit: boolean,
      isPublic: boolean
    ) => {
      editorContext.dbProjectId = projectId;
      editorContext.isOwner = isOwner;
      editorContext.canEdit = canEdit;
      editorContext.isPublic = isPublic;

      // Clear localStorage when switching to a database project
      if (projectId && typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    },
    markAsSaved: () => {
      editorContext.hasUnsavedChanges = false;
    },
    resetToNew: () => {
      editorContext.dbProjectId = null;
      editorContext.isOwner = true;
      editorContext.canEdit = true;
      editorContext.isPublic = false;
      editorContext.isMcp = false;
      editorContext.hasUnsavedChanges = false;
      projectStore.loadProject(getDefaultProject());
    }
  });

  // Watch for project changes and auto-save to localStorage
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  let initialized = false;

  $effect.root(() => {
    watch(
      () => $state.snapshot(projectStore.state),
      () => {
        // Skip saving during initial load
        if (!initialized) {
          initialized = true;
          return;
        }

        // Mark as having unsaved changes
        editorContext.hasUnsavedChanges = true;

        // Only save to localStorage if this is NOT a database project
        if (editorContext.dbProjectId === null) {
          // Debounced save
          if (saveTimeout) {
            clearTimeout(saveTimeout);
          }
          saveTimeout = setTimeout(() => {
            saveToLocalStorage(projectStore.state);
          }, DEBOUNCE_MS);
        }
      }
    );
  });

  // Set the context
  setEditorState(editorContext);

  return editorContext;
}
