/**
 * Editor context for managing project state and persistence
 */
import { ProjectStore } from '$lib/stores/project.svelte';
import { ProjectSchema, type Project } from '$lib/types/animation';
import { createContext } from 'svelte';
import { watch } from 'runed';
import { nanoid } from 'nanoid';
import { getGradientPresetById } from '$lib/engine/gradient-presets';

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
      return ProjectSchema.parse(JSON.parse(stored));
    }
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    console.error('Failed to load project from localStorage:', error);
  }

  return null;
}

function saveToLocalStorage(project: Project) {
  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  } catch (error) {
    console.error('Failed to save project to localStorage:', error);
  }
}

export function getDefaultProject(): Project {
  return {
    id: nanoid(),
    name: 'Untitled Project',
    width: 1280,
    height: 720,
    duration: 5,
    fps: 30,
    background: getGradientPresetById('mint-fresh')?.value,
    layers: [
      {
        id: 'qjiccyAeGZ5GzZgQcdhQH',
        name: 'Intro',
        visible: true,
        locked: false,
        type: 'text',
        transform: {
          position: {
            x: 0,
            y: 0,
            z: 0
          },
          rotation: {
            x: 0,
            y: 0,
            z: 0
          },
          scale: {
            x: 1,
            y: 1
          },
          anchor: 'center'
        },
        style: {
          opacity: 1,
          blur: 0,
          brightness: 1,
          contrast: 1,
          saturate: 1,
          dropShadowX: 0,
          dropShadowY: 8,
          dropShadowBlur: 24,
          dropShadowColor: 'rgba(0, 0, 0, 0.15)'
        },
        keyframes: [
          {
            id: 'AeK8s913yNF-XN-z9JmKD',
            time: 0,
            property: 'props.content',
            value: '',
            interpolation: {
              family: 'text',
              strategy: 'word-reveal',
              separator: ' '
            }
          },
          {
            id: 'toegtpgCtiKu38wCuIdio',
            time: 1.7216319918916565,
            property: 'props.content',
            value: 'Welcome to DevMotion!',
            interpolation: {
              family: 'text',
              strategy: 'char-reveal'
            }
          }
        ],
        props: {
          color: '#ffffff',
          width: 680,
          content: 'Welcome to DevMotion',
          fontSize: 60,
          autoWidth: false,
          scaleFrom: 4.79,
          textAlign: 'left',
          blurAmount: 10,
          fontFamily: 'Inter',
          fontWeight: '800',
          lineHeight: 1.4,
          letterSpacing: -2,
          slideDistance: 73,
          transitionEasing: 'ease-out-back',
          transitionEffects: ['fade', 'scale', 'blur', 'slide-left', 'slide-up'],
          transitionDuration: 500,
          transitionColorFrom: '#7dff7f'
        },
        enterTime: 0,
        exitTime: 5
      }
    ],
    fontFamily: 'Poppins'
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
      localStorage.removeItem(STORAGE_KEY);
    }
  });

  // Watch for project changes and auto-save to localStorage
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  let initialized = false;

  $effect.root(() => {
    watch(
      () => $state.snapshot(projectStore.state),
      () => {
        console.log($state.snapshot(projectStore.state));
        // Skip saving during initial load
        if (!initialized) {
          initialized = true;
          return;
        }

        if (projectStore.isLoading) {
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
