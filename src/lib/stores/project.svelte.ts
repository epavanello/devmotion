/**
 * Global project store using Svelte 5 runes
 */
import { getPresetById } from '$lib/engine/presets';
import type { Project, Layer, Keyframe, ViewportSettings } from '$lib/types/animation';
import { nanoid } from 'nanoid';
import { watch } from 'runed';

const STORAGE_KEY = 'devmotion_store';
const DEBOUNCE_MS = 500;

class ProjectStore {
  project = $state<Project>(undefined!);
  #saveTimeout: ReturnType<typeof setTimeout> | null = null;
  #initialized = false;

  selectedLayerId = $state<string | null>(null);
  isPlaying = $state(false);
  isRecording = $state(false);
  currentTime = $state(0);

  // DB context state
  dbProjectId = $state<string | null>(null);
  isOwner = $state(true);
  canEdit = $state(true);
  isPublic = $state(false);
  isSaving = $state(false);

  constructor() {
    // Load first, before setting up the effect
    this.project = this.loadFromLocalStorage();
    this.#initialized = true;

    $effect.root(() => {
      watch(
        () => $state.snapshot(this.project),
        () => {
          // Skip saving during initial load
          if (!this.#initialized) return;

          // Debounced save
          if (this.#saveTimeout) {
            clearTimeout(this.#saveTimeout);
          }
          this.#saveTimeout = setTimeout(() => {
            this.saveToLocalStorage();
          }, DEBOUNCE_MS);
        }
      );
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
      layers: []
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

  get isDbProject(): boolean {
    return this.dbProjectId !== null;
  }

  setDbContext(projectId: string | null, isOwner: boolean, canEdit: boolean, isPublic: boolean) {
    this.dbProjectId = projectId;
    this.isOwner = isOwner;
    this.canEdit = canEdit;
    this.isPublic = isPublic;
  }

  resetToNew() {
    this.dbProjectId = null;
    this.isOwner = true;
    this.canEdit = true;
    this.isPublic = false;
    this.newProject();
  }

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

  /**
   * Apply an animation preset to a layer
   * @param layerId - ID of the layer to apply the preset to
   * @param presetId - ID of the preset to apply
   * @param startTime - Time to start the animation (defaults to current time)
   * @param duration - Duration of the animation in seconds
   */
  applyPreset(layerId: string, presetId: string, startTime?: number, duration: number = 1) {
    const layer = this.project.layers.find((l) => l.id === layerId);
    if (!layer) {
      console.warn(`Layer not found: ${layerId}`);
      return;
    }

    // Import preset function dynamically to avoid circular dependencies
    const preset = getPresetById(presetId);

    if (!preset) {
      console.warn(`Preset not found: ${presetId}`);
      return;
    }

    const actualStartTime = startTime ?? this.currentTime;

    // Apply each keyframe from the preset, scaling time
    for (const kf of preset.keyframes) {
      const scaledTime = actualStartTime + kf.time * duration;

      // Clamp to project duration
      const clampedTime = Math.max(0, Math.min(scaledTime, this.project.duration));

      // Get the base position from the layer's transform if it's a position property
      let value = kf.value;
      if (kf.property === 'position.x' && typeof kf.value === 'number') {
        value = layer.transform.x + kf.value;
      } else if (kf.property === 'position.y' && typeof kf.value === 'number') {
        value = layer.transform.y + kf.value;
      }

      this.addKeyframe(layerId, {
        id: nanoid(),
        time: clampedTime,
        property: kf.property,
        value,
        easing: kf.easing
      });
    }
  }

  // Timeline operations
  setCurrentTime(time: number) {
    this.currentTime = Math.max(0, Math.min(time, this.project.duration));
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
    this.project = this.getDefaultProject();
    this.currentTime = 0;
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
