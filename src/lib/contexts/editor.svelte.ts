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
            id: 'Ss42V1gv8S3dbcsDi_U2f',
            time: 0,
            property: 'opacity',
            value: 0,
            interpolation: {
              family: 'continuous',
              strategy: 'ease-out'
            }
          },
          {
            id: 'oiCZlfa03aiJ4uJte8dv5',
            time: 0,
            property: 'blur',
            value: 12,
            interpolation: {
              family: 'continuous',
              strategy: 'ease-out'
            }
          },
          {
            id: 'jLeS2ink97_bp2T95cj8a',
            time: 0,
            property: 'position.y',
            value: 30,
            interpolation: {
              family: 'continuous',
              strategy: 'ease-out'
            }
          },
          {
            id: '9uLBgWrTNFUKqqa-pBIz_',
            time: 0,
            property: 'scale.x',
            value: 1.08,
            interpolation: {
              family: 'continuous',
              strategy: 'ease-out'
            }
          },
          {
            id: 'BK3KLBIQzQp0casl-IInP',
            time: 0,
            property: 'scale.y',
            value: 1.08,
            interpolation: {
              family: 'continuous',
              strategy: 'ease-out'
            }
          },
          {
            id: '4pGlkj1gzzn5YiiNa5MQO',
            time: 0,
            property: 'props.content',
            value: 'Welcome',
            interpolation: {
              family: 'text',
              strategy: 'char-reveal'
            }
          },
          {
            id: 'Mo5Pf3AvtnhFwT7EnmMQe',
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
            id: 'dZ2kKVrLcrxp6yZ5FlqWb',
            time: 1.5,
            property: 'opacity',
            value: 1,
            interpolation: {
              family: 'continuous',
              strategy: 'linear'
            }
          },
          {
            id: 'vF_xldAVs_EszHKRJyDg7',
            time: 1.5,
            property: 'blur',
            value: 0,
            interpolation: {
              family: 'continuous',
              strategy: 'linear'
            }
          },
          {
            id: 'ryaEU6a6CwF-E5ZxrFJZG',
            time: 2,
            property: 'position.y',
            value: 0,
            interpolation: {
              family: 'continuous',
              strategy: 'linear'
            }
          },
          {
            id: 'toegtpgCtiKu38wCuIdio',
            time: 2.6800000000000046,
            property: 'props.content',
            value: 'Welcome to DevMotion!',
            interpolation: {
              family: 'text',
              strategy: 'char-reveal'
            }
          },
          {
            id: 'z-2XgYZecDZoZ4Maki0U1',
            time: 4,
            property: 'scale.x',
            value: 1,
            interpolation: {
              family: 'continuous',
              strategy: 'linear'
            }
          },
          {
            id: '1AsiNouYycg7Vkr4J5O2c',
            time: 4,
            property: 'scale.y',
            value: 1,
            interpolation: {
              family: 'continuous',
              strategy: 'linear'
            }
          }
        ],
        props: {
          color: '#ffffff',
          width: 400,
          content: 'Welcome to DevMotion',
          fontSize: 72,
          autoWidth: true,
          scaleFrom: 4.79,
          textAlign: 'center',
          blurAmount: 10,
          fontFamily: 'Inter',
          fontWeight: '800',
          lineHeight: 1.4,
          letterSpacing: -2,
          slideDistance: 73,
          transitionEasing: 'ease-in-back',
          transitionEffects: ['fade', 'scale', 'blur', 'slide-left', 'slide-up'],
          transitionDuration: 306.8,
          transitionColorFrom: '#ffa200'
        },
        enterTime: 0,
        exitTime: 4
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
