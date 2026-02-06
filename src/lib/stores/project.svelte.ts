/**
 * Global project store using Svelte 5 runes
 */
import { getPresetById } from '$lib/engine/presets';
import type { Project, Layer, Keyframe, ViewportSettings, Transform } from '$lib/types/animation';
import { nanoid } from 'nanoid';
import { watch } from 'runed';
import { SvelteSet } from 'svelte/reactivity';
import { getLayerTransform, getLayerStyle, getLayerProps } from '$lib/engine/layer-rendering';

const STORAGE_KEY = 'devmotion_store';
const DEBOUNCE_MS = 500;

/**
 * Cached layer data for a single frame
 */
interface LayerFrameCache {
  transform: Transform;
  style: {
    opacity: number;
  };
  customProps: Record<string, unknown>;
}

/**
 * Cache for all layers in a single frame
 */
interface FrameCache {
  [layerId: string]: LayerFrameCache;
}

class ProjectStore {
  project = $state<Project>(undefined!);
  #saveTimeout: ReturnType<typeof setTimeout> | null = null;
  #initialized = false;

  selectedLayerId = $state<string | null>(null);
  isPlaying = $state(false);
  isRecording = $state(false);
  currentTime = $state(0);
  selectedKeyframeIds = new SvelteSet<string>();

  // Frame cache for optimized recording
  frameCache = $state<Map<number, FrameCache> | null>(null);
  preparingProgress = $state(0);

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
      background: '#000000',
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

  async removeLayer(layerId: string) {
    // Find the layer to check if it has uploaded files to clean up
    const layer = this.project.layers.find((l) => l.id === layerId);

    // Clean up uploaded files if the layer has a fileKey
    if (layer && layer.props.fileKey && typeof layer.props.fileKey === 'string') {
      try {
        await fetch(`/api/upload/${encodeURIComponent(layer.props.fileKey as string)}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.warn('Failed to delete file from storage:', err);
        // Continue with layer deletion even if file cleanup fails
      }
    }

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
          keyframes: layer.keyframes
            .map((k) => (k.id === keyframeId ? { ...k, ...updates } : k))
            .sort((a, b) => a.time - b.time)
        };
      }
      return layer;
    });
  }

  toggleKeyframeSelection(keyframeId: string, multi: boolean = false) {
    if (!multi) {
      if (this.selectedKeyframeIds.has(keyframeId) && this.selectedKeyframeIds.size === 1) {
        this.selectedKeyframeIds.clear();
      } else {
        this.selectedKeyframeIds.clear();
        this.selectedKeyframeIds.add(keyframeId);
      }
    } else {
      if (this.selectedKeyframeIds.has(keyframeId)) {
        this.selectedKeyframeIds.delete(keyframeId);
      } else {
        this.selectedKeyframeIds.add(keyframeId);
      }
    }
  }

  clearKeyframeSelection() {
    this.selectedKeyframeIds.clear();
  }

  selectKeyframesInArea(startTime: number, endTime: number, layerIds?: Set<string>) {
    this.selectedKeyframeIds.clear();
    const start = Math.min(startTime, endTime);
    const end = Math.max(startTime, endTime);

    for (const layer of this.project.layers) {
      if (layerIds && !layerIds.has(layer.id)) continue;

      for (const kf of layer.keyframes) {
        if (kf.time >= start && kf.time <= end) {
          this.selectedKeyframeIds.add(kf.id);
        }
      }
    }
  }

  shiftSelectedKeyframes(deltaTime: number) {
    if (this.selectedKeyframeIds.size === 0) return;

    this.project.layers = this.project.layers.map((layer) => {
      const layerKeyframes = layer.keyframes.map((kf) => {
        if (this.selectedKeyframeIds.has(kf.id)) {
          const newTime = Math.max(0, Math.min(this.project.duration, kf.time + deltaTime));
          return { ...kf, time: newTime };
        }
        return kf;
      });

      return {
        ...layer,
        keyframes: layerKeyframes.sort((a, b) => a.time - b.time)
      };
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

  // ========================================
  // Enter/Exit Time Operations
  // ========================================

  /**
   * Set the enter time for a layer (when it becomes visible)
   */
  setLayerEnterTime(layerId: string, enterTime: number) {
    this.project.layers = this.project.layers.map((layer) => {
      if (layer.id === layerId) {
        const exitTime = layer.exitTime ?? this.project.duration;
        const clampedEnterTime = Math.max(0, Math.min(enterTime, this.project.duration));
        // Ensure enter time is before exit time
        const validEnterTime = Math.min(clampedEnterTime, exitTime - 0.1);
        return { ...layer, enterTime: validEnterTime };
      }
      return layer;
    });
  }

  /**
   * Set the exit time for a layer (when it becomes hidden)
   */
  setLayerExitTime(layerId: string, exitTime: number) {
    this.project.layers = this.project.layers.map((layer) => {
      if (layer.id === layerId) {
        const enterTime = layer.enterTime ?? 0;
        const clampedExitTime = Math.max(0, Math.min(exitTime, this.project.duration));
        // Ensure exit time is after enter time
        const validExitTime = Math.max(clampedExitTime, enterTime + 0.1);
        return { ...layer, exitTime: validExitTime };
      }
      return layer;
    });
  }

  /**
   * Set both enter and exit times for a layer
   */
  setLayerTimeRange(layerId: string, enterTime: number, exitTime: number) {
    this.project.layers = this.project.layers.map((layer) => {
      if (layer.id === layerId) {
        const clampedEnterTime = Math.max(0, Math.min(enterTime, this.project.duration));
        const clampedExitTime = Math.max(0, Math.min(exitTime, this.project.duration));
        // Ensure exit time is after enter time
        const validExitTime = Math.max(clampedExitTime, clampedEnterTime + 0.1);
        return {
          ...layer,
          enterTime: clampedEnterTime,
          exitTime: validExitTime
        };
      }
      return layer;
    });
  }

  // ========================================
  // Media Layer Operations (Split/Crop/Resize)
  // ========================================

  /**
   * Split a media layer (video/audio) at the current time
   * Creates two layers from one, each with appropriate time ranges
   */
  splitLayer(layerId: string, splitTime?: number) {
    const layer = this.project.layers.find((l) => l.id === layerId);
    if (!layer) return;

    const time = splitTime ?? this.currentTime;
    const enterTime = layer.enterTime ?? 0;
    const exitTime = layer.exitTime ?? this.project.duration;

    // Don't split if time is outside the layer's range
    if (time <= enterTime || time >= exitTime) return;

    // For media layers, adjust mediaStartTime/mediaEndTime too
    const isMediaLayer = layer.type === 'video' || layer.type === 'audio';
    const mediaStartTime = (layer.props.mediaStartTime as number) ?? 0;
    const mediaEndTime = (layer.props.mediaEndTime as number) ?? 0;
    const mediaDuration = exitTime - enterTime;
    const splitRatio = (time - enterTime) / mediaDuration;

    // Create the second half as a new layer
    const secondHalf: Layer = {
      ...JSON.parse(JSON.stringify(layer)),
      id: nanoid(),
      name: `${layer.name} (2)`,
      enterTime: time,
      exitTime: exitTime,
      keyframes: layer.keyframes.filter((k) => k.time > time).map((k) => ({ ...k }))
    };

    if (isMediaLayer && mediaDuration > 0) {
      const splitMediaTime =
        mediaStartTime +
        (mediaEndTime > 0
          ? (mediaEndTime - mediaStartTime) * splitRatio
          : mediaDuration * splitRatio);
      secondHalf.props = {
        ...secondHalf.props,
        mediaStartTime: splitMediaTime
      };
    }

    // Update the first half (original layer)
    this.project.layers = this.project.layers.map((l) => {
      if (l.id === layerId) {
        const updated = {
          ...l,
          exitTime: time,
          keyframes: l.keyframes.filter((k) => k.time <= time)
        };
        if (isMediaLayer && mediaEndTime > 0 && mediaDuration > 0) {
          const splitMediaTime = mediaStartTime + (mediaEndTime - mediaStartTime) * splitRatio;
          updated.props = { ...updated.props, mediaEndTime: splitMediaTime };
        }
        return updated;
      }
      return l;
    });

    // Add the second half after the original
    const insertIndex = this.project.layers.findIndex((l) => l.id === layerId) + 1;
    const layers = [...this.project.layers];
    layers.splice(insertIndex, 0, secondHalf);
    this.project.layers = layers;
  }

  /**
   * Trim/crop a media layer's source time range
   */
  trimMediaLayer(layerId: string, mediaStartTime: number, mediaEndTime: number) {
    this.project.layers = this.project.layers.map((layer) => {
      if (layer.id === layerId && (layer.type === 'video' || layer.type === 'audio')) {
        return {
          ...layer,
          props: {
            ...layer.props,
            mediaStartTime: Math.max(0, mediaStartTime),
            mediaEndTime: mediaEndTime > 0 ? mediaEndTime : 0
          }
        };
      }
      return layer;
    });
  }

  /**
   * Check if a layer is visible at the current time based on enter/exit times
   */
  isLayerVisibleAtTime(layerId: string, time?: number): boolean {
    const layer = this.project.layers.find((l) => l.id === layerId);
    if (!layer) return false;
    const t = time ?? this.currentTime;
    const enterTime = layer.enterTime ?? 0;
    const exitTime = layer.exitTime ?? this.project.duration;
    return t >= enterTime && t <= exitTime;
  }

  /**
   * Pre-calculate all frames for optimized recording
   * Uses the same rendering functions as canvas for consistency
   * @returns Promise that resolves when preparation is complete
   */
  async prepareRecording(): Promise<void> {
    const totalFrames = Math.ceil(this.project.fps * this.project.duration);
    this.frameCache = new Map();
    this.preparingProgress = 0;

    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      const time = frameIndex / this.project.fps;
      const frameData: FrameCache = {};

      // Pre-calculate values for all layers using shared rendering functions
      for (const layer of this.project.layers) {
        frameData[layer.id] = {
          transform: getLayerTransform(layer, time),
          style: getLayerStyle(layer, time),
          customProps: getLayerProps(layer, time)
        };
      }

      this.frameCache.set(frameIndex, frameData);

      // Update progress
      this.preparingProgress = ((frameIndex + 1) / totalFrames) * 100;

      // Yield to UI every 10 frames to prevent blocking
      if (frameIndex % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    this.preparingProgress = 100;
  }

  /**
   * Clear the frame cache and free memory
   */
  clearFrameCache(): void {
    this.frameCache = null;
    this.preparingProgress = 0;
  }

  /**
   * Get cached frame data for a specific time
   * @param time Current time in seconds
   * @returns Cached frame data or null if not cached
   */
  getCachedFrame(time: number): FrameCache | null {
    if (!this.frameCache) return null;
    const frameIndex = Math.floor(time * this.project.fps);
    return this.frameCache.get(frameIndex) ?? null;
  }
}

export const projectStore = new ProjectStore();
