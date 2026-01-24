/**
 * Global project store using Svelte 5 runes
 */
import type { Project, Layer, Keyframe, ViewportSettings } from '$lib/types/animation';
import { nanoid } from 'nanoid';

const STORAGE_KEY = 'devmotion_store';
const DEBOUNCE_MS = 500;

class ProjectStore {
  project = $state<Project>(undefined!);
  #saveTimeout: ReturnType<typeof setTimeout> | null = null;
  #initialized = false;

  constructor() {
    // Load first, before setting up the effect
    this.project = this.loadFromLocalStorage();
    this.#initialized = true;

    $effect.root(() => {
      $effect(() => {
        // Access all nested properties via JSON.stringify to create deep dependencies
        void JSON.stringify(this.project);

        // Skip saving during initial load
        if (!this.#initialized) return;

        // Debounced save
        if (this.#saveTimeout) {
          clearTimeout(this.#saveTimeout);
        }
        this.#saveTimeout = setTimeout(() => {
          this.saveToLocalStorage();
        }, DEBOUNCE_MS);
      });
    });
  }

  private loadFromLocalStorage(): Project {
    if (typeof localStorage === 'undefined') {
      return this.getDefaultProject();
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed;
      }
    } catch (error) {
      console.error('Failed to load project from localStorage:', error);
    }

    return this.getDefaultProject();
  }

  private getDefaultProject(): Project {
    return {
      id: nanoid(),
      name: 'Untitled Project',
      width: 720,
      height: 1280,
      duration: 5,
      fps: 30,
      backgroundColor: '#000000',
      layers: [],
      currentTime: 0
    };
  }

  private saveToLocalStorage() {
    if (typeof localStorage === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.project));
      console.log('Project saved to localStorage');
    } catch (error) {
      console.error('Failed to save project to localStorage:', error);
    }
  }

  viewport = $state<ViewportSettings>({
    zoom: 1,
    pan: { x: 0, y: 0 },
    showGuides: true,
    snapToGrid: false
  });

  selectedLayerId = $state<string | null>(null);
  isPlaying = $state(false);
  isRecording = $state(false);

  // Layer operations
  addLayer(layer: Layer) {
    this.project.layers = [...this.project.layers, layer];
  }

  removeLayer(layerId: string) {
    this.project.layers = this.project.layers.filter((l) => l.id !== layerId);
    if (this.selectedLayerId === layerId) {
      this.selectedLayerId = null;
    }
  }

  updateLayer(layerId: string, updates: Partial<Layer>) {
    this.project.layers = this.project.layers.map((layer) =>
      layer.id === layerId ? { ...layer, ...updates } : layer
    );
  }

  reorderLayers(fromIndex: number, toIndex: number) {
    const layers = [...this.project.layers];
    const [movedLayer] = layers.splice(fromIndex, 1);
    layers.splice(toIndex, 0, movedLayer);
    this.project.layers = layers;
  }

  // Keyframe operations
  addKeyframe(layerId: string, keyframe: Keyframe) {
    this.project.layers = this.project.layers.map((layer) => {
      if (layer.id === layerId) {
        return {
          ...layer,
          keyframes: [...layer.keyframes, keyframe].sort((a, b) => a.time - b.time)
        };
      }
      return layer;
    });
  }

  removeKeyframe(layerId: string, keyframeId: string) {
    this.project.layers = this.project.layers.map((layer) => {
      if (layer.id === layerId) {
        return {
          ...layer,
          keyframes: layer.keyframes.filter((k) => k.id !== keyframeId)
        };
      }
      return layer;
    });
  }

  updateKeyframe(layerId: string, keyframeId: string, updates: Partial<Keyframe>) {
    this.project.layers = this.project.layers.map((layer) => {
      if (layer.id === layerId) {
        return {
          ...layer,
          keyframes: layer.keyframes.map((k) => (k.id === keyframeId ? { ...k, ...updates } : k))
        };
      }
      return layer;
    });
  }

  // Timeline operations
  setCurrentTime(time: number) {
    this.project.currentTime = Math.max(0, Math.min(time, this.project.duration));
  }

  play() {
    this.isPlaying = true;
  }

  pause() {
    this.isPlaying = false;
  }

  // Viewport operations
  setZoom(zoom: number) {
    this.viewport.zoom = Math.max(0.1, Math.min(zoom, 10));
  }

  setPan(x: number, y: number) {
    this.viewport.pan = { x, y };
  }

  toggleGuides() {
    this.viewport.showGuides = !this.viewport.showGuides;
  }

  toggleSnapToGrid() {
    this.viewport.snapToGrid = !this.viewport.snapToGrid;
  }

  // Project operations
  loadProject(project: Project) {
    this.project = project;
    this.selectedLayerId = null;
    this.isPlaying = false;
  }

  newProject() {
    this.project = {
      id: nanoid(),
      name: 'Untitled Project',
      width: 1920,
      height: 1080,
      duration: 10,
      fps: 30,
      backgroundColor: '#000000',
      layers: [],
      currentTime: 0
    };
    this.selectedLayerId = null;
    this.isPlaying = false;
  }

  exportToJSON(): string {
    return JSON.stringify(this.project, null, 2);
  }

  importFromJSON(json: string) {
    try {
      const project = JSON.parse(json);
      this.loadProject(project);
    } catch (error) {
      console.error('Failed to import project:', error);
    }
  }

  get selectedLayer(): Layer | null {
    if (!this.selectedLayerId) return null;
    return this.project.layers.find((l) => l.id === this.selectedLayerId) || null;
  }
}

export const projectStore = new ProjectStore();
