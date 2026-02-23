/**
 * Project store using Svelte 5 runes
 * Manages project state and operations without persistence logic
 */
import { getPresetById } from '$lib/engine/presets';
import {
  type Project,
  type Keyframe,
  type ViewportSettings,
  type Transform,
  type LayerStyle
} from '$lib/types/animation';
import { nanoid } from 'nanoid';
import { SvelteSet } from 'svelte/reactivity';
import { getLayerTransform, getLayerStyle, getLayerProps } from '$lib/engine/layer-rendering';
import { tick } from 'svelte';
import type { TypedLayer } from '$lib/layers/typed-registry';
import {
  PROJECT_LAYER_ID,
  isProjectLayer,
  createVirtualProjectLayer
} from '$lib/layers/project-layer';
import { defaultLayerStyle, defaultTransform } from '$lib/schemas/base';
import { getDefaultProject } from '$lib/contexts/editor.svelte';

/**
 * Cached layer data for a single frame
 */
interface LayerFrameCache {
  transform: Transform;
  style: LayerStyle;
  customProps: Record<string, unknown>;
}

/**
 * Cache for all layers in a single frame
 */
export interface FrameCache {
  [layerId: string]: LayerFrameCache;
}

export class ProjectStore {
  #state = $state<Project>(undefined!);
  get state() {
    return this.#state;
  }

  selectedLayerId = $state<string | null>(null);
  isLoading = $state(false);
  isPlaying = $state(false);
  isRecording = $state(false);
  currentTime = $state(0);
  globalVolume = $state(100);
  selectedKeyframeIds = new SvelteSet<string>();

  // Frame cache for optimized recording
  frameCache = $state<Map<number, FrameCache> | null>(null);
  preparingProgress = $state(0);

  constructor(initialProject?: Project) {
    this.#state = initialProject ?? getDefaultProject();
    // Auto-select the project settings layer on creation
    this.selectedLayerId = PROJECT_LAYER_ID;
  }

  viewport = $state<ViewportSettings>({
    zoom: 1,
    pan: { x: 0, y: 0 },
    showGuides: true,
    snapToGrid: false
  });

  // ========================================
  // Group Helpers
  // ========================================

  /**
   * Get child layers of a group (layers whose parentId matches)
   */
  getChildLayers(groupId: string): TypedLayer[] {
    return this.state.layers.filter((l) => l.parentId === groupId);
  }

  /**
   * Get top-level layers (layers without a parentId)
   */
  getTopLevelLayers(): TypedLayer[] {
    return this.state.layers.filter((l) => !l.parentId);
  }

  /**
   * Get the parent group of a layer, if any
   */
  getParentGroup(layerId: string): TypedLayer | null {
    const layer = this.state.layers.find((l) => l.id === layerId);
    if (!layer?.parentId) return null;
    return this.state.layers.find((l) => l.id === layer.parentId) ?? null;
  }

  /**
   * Check if a layer is a group
   */
  isGroupLayer(layerId: string): boolean {
    const layer = this.state.layers.find((l) => l.id === layerId);
    return layer?.type === 'group';
  }

  // Layer operations
  addLayer(layer: TypedLayer) {
    this.state.layers = [...this.state.layers, layer];
  }

  removeLayer(layerId: string) {
    // Never allow removing the virtual project settings layer
    if (isProjectLayer(layerId)) return;

    const layer = this.state.layers.find((l) => l.id === layerId);

    // If removing a group, also remove all children
    if (layer?.type === 'group') {
      const childIds = this.getChildLayers(layerId).map((c) => c.id);
      for (const childId of childIds) {
        this.removeLayer(childId);
      }
    }

    // Assets are user-level and managed from the Assets panel.
    // No S3 cleanup on layer removal.

    this.state.layers = this.state.layers.filter((l) => l.id !== layerId);
    if (this.selectedLayerId === layerId) {
      this.selectedLayerId = null;
    }
  }

  updateLayer(layerId: string, updates: Partial<TypedLayer>) {
    this.state.layers = this.state.layers.map((layer) =>
      layer.id === layerId ? { ...layer, ...updates } : layer
    );
  }

  reorderLayers(fromIndex: number, toIndex: number) {
    const layers = [...this.state.layers];
    const [movedLayer] = layers.splice(fromIndex, 1);
    layers.splice(toIndex, 0, movedLayer);
    this.state.layers = layers;
  }

  // ========================================
  // Group Operations
  // ========================================

  /**
   * Create a group from the given layer IDs.
   * The group is inserted at the position of the first selected layer.
   * Children are re-parented under the group and their order is preserved.
   */
  createGroup(childIds: string[]): string | null {
    if (childIds.length < 2) return null;

    // Validate all layers exist and are not already in a group
    const children = childIds
      .map((id) => this.state.layers.find((l) => l.id === id))
      .filter((l): l is TypedLayer => !!l && !l.parentId && l.type !== 'group');
    if (children.length < 2) return null;

    const groupId = nanoid();

    // Find earliest position among children for insertion
    const indices = children.map((c) => this.state.layers.indexOf(c)).sort((a, b) => a - b);
    const insertIndex = indices[0];

    // Create the group layer
    const groupLayer: TypedLayer<'group'> = {
      id: groupId,
      name: 'Group',
      type: 'group',
      transform: defaultTransform(),
      style: defaultLayerStyle(),
      visible: true,
      locked: false,
      keyframes: [],
      props: { collapsed: false }
    };

    // Set parentId on children
    const childIdSet = new SvelteSet(childIds);
    let layers = this.state.layers.map((l) =>
      childIdSet.has(l.id) ? { ...l, parentId: groupId } : l
    );

    // Remove children from their current positions and collect them
    const childLayers = layers.filter((l) => childIdSet.has(l.id));
    layers = layers.filter((l) => !childIdSet.has(l.id));

    // Insert group at the earliest child position, then children right after
    layers.splice(insertIndex, 0, groupLayer, ...childLayers);

    this.state.layers = layers;
    this.selectedLayerId = groupId;
    return groupId;
  }

  /**
   * Dissolve a group, keeping children as top-level layers.
   * Applies group transform offsets to children so they maintain their world position.
   */
  ungroupLayers(groupId: string) {
    const group = this.state.layers.find((l) => l.id === groupId);
    if (!group || group.type !== 'group') return;

    const gt = group.transform;
    const gs = group.style;

    // Remove parentId from children and bake group transform into them
    this.state.layers = this.state.layers
      .map((layer) => {
        if (layer.parentId === groupId) {
          return {
            ...layer,
            parentId: undefined,
            transform: {
              ...layer.transform,
              position: {
                x: layer.transform.position.x + gt.position.x,
                y: layer.transform.position.y + gt.position.y,
                z: layer.transform.position.z + gt.position.z
              },
              rotation: {
                x: layer.transform.rotation.x + gt.rotation.x,
                y: layer.transform.rotation.y + gt.rotation.y,
                z: layer.transform.rotation.z + gt.rotation.z
              },
              scale: {
                x: layer.transform.scale.x * gt.scale.x,
                y: layer.transform.scale.y * gt.scale.y
              }
            },
            style: {
              ...layer.style,
              opacity: layer.style.opacity * gs.opacity
            }
          };
        }
        return layer;
      })
      .filter((l) => l.id !== groupId);

    if (this.selectedLayerId === groupId) {
      this.selectedLayerId = null;
    }
  }

  /**
   * Add an existing layer to a group
   */
  addLayerToGroup(layerId: string, groupId: string) {
    const layer = this.state.layers.find((l) => l.id === layerId);
    const group = this.state.layers.find((l) => l.id === groupId);
    if (!layer || !group || group.type !== 'group') return;
    if (layer.parentId === groupId) return; // already in this group
    if (layer.type === 'group') return; // don't nest groups

    // Set parentId and move layer in array to be right after group's children
    const layers = this.state.layers.map((l) =>
      l.id === layerId ? { ...l, parentId: groupId } : l
    );

    const layerIndex = layers.findIndex((l) => l.id === layerId);
    const movedLayer = layers.splice(layerIndex, 1)[0];

    // Find the last child of the group (or the group itself)
    const groupIndex = layers.findIndex((l) => l.id === groupId);
    let insertAfter = groupIndex;
    for (let i = groupIndex + 1; i < layers.length; i++) {
      if (layers[i].parentId === groupId) {
        insertAfter = i;
      } else {
        break;
      }
    }

    layers.splice(insertAfter + 1, 0, movedLayer);
    this.state.layers = layers;
  }

  /**
   * Remove a layer from its parent group (keeps the layer in the project).
   * Applies the group transform so the layer maintains its world position.
   * If the group would have fewer than 2 children, the group is dissolved.
   */
  removeLayerFromGroup(layerId: string) {
    const layer = this.state.layers.find((l) => l.id === layerId);
    if (!layer?.parentId) return;

    const groupId = layer.parentId;
    const group = this.state.layers.find((l) => l.id === groupId);

    const gt = group?.transform;
    const gs = group?.style;

    this.state.layers = this.state.layers.map((l) => {
      if (l.id === layerId) {
        const updated: TypedLayer = { ...l, parentId: undefined };
        if (gt) {
          updated.transform = {
            ...l.transform,
            position: {
              x: l.transform.position.x + gt.position.x,
              y: l.transform.position.y + gt.position.y,
              z: l.transform.position.z + gt.position.z
            },
            rotation: {
              x: l.transform.rotation.x + gt.rotation.x,
              y: l.transform.rotation.y + gt.rotation.y,
              z: l.transform.rotation.z + gt.rotation.z
            },
            scale: {
              x: l.transform.scale.x * gt.scale.x,
              y: l.transform.scale.y * gt.scale.y
            }
          };
        }
        if (gs) {
          updated.style = {
            ...l.style,
            opacity: l.style.opacity * gs.opacity
          };
        }
        return updated;
      }
      return l;
    });

    // If group has fewer than 2 children, dissolve it
    const remaining = this.state.layers.filter((l) => l.parentId === groupId);
    if (remaining.length < 2 && group) {
      this.ungroupLayers(groupId);
    }
  }

  /**
   * Shift the time range of all children in a group by a delta.
   * Used when moving a group bar in the timeline.
   */
  shiftGroupChildrenTime(groupId: string, deltaTime: number) {
    this.state.layers = this.state.layers.map((layer) => {
      if (layer.parentId !== groupId) return layer;

      const oldEnter = layer.enterTime ?? 0;
      const oldExit = layer.exitTime ?? this.state.duration;
      const newEnter = Math.max(0, Math.min(oldEnter + deltaTime, this.state.duration));
      const newExit = Math.max(newEnter + 0.1, Math.min(oldExit + deltaTime, this.state.duration));

      const shiftedKeyframes = layer.keyframes
        .map((kf) => ({
          ...kf,
          time: Math.max(0, Math.min(this.state.duration, kf.time + deltaTime))
        }))
        .sort((a, b) => a.time - b.time);

      return {
        ...layer,
        enterTime: newEnter,
        exitTime: newExit,
        keyframes: shiftedKeyframes
      };
    });
  }

  // Keyframe operations
  addKeyframe(layerId: string, keyframe: Keyframe) {
    this.state.layers = this.state.layers.map((layer) => {
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
    this.state.layers = this.state.layers.map((layer) => {
      if (layer.id === layerId) {
        return {
          ...layer,
          keyframes: layer.keyframes.filter((k) => k.id !== keyframeId)
        };
      }
      return layer;
    });
  }

  /**
   * Remove all keyframes for a specific property on a layer
   * @param layerId - ID of the layer
   * @param property - The property name to remove keyframes for
   */
  removeKeyframesByProperty(layerId: string, property: string) {
    this.state.layers = this.state.layers.map((layer) => {
      if (layer.id === layerId) {
        return {
          ...layer,
          keyframes: layer.keyframes.filter((k) => k.property !== property)
        };
      }
      return layer;
    });
  }

  updateKeyframe(layerId: string, keyframeId: string, updates: Partial<Keyframe>) {
    this.state.layers = this.state.layers.map((layer) => {
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

    for (const layer of this.state.layers) {
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

    this.state.layers = this.state.layers.map((layer) => {
      const layerKeyframes = layer.keyframes.map((kf) => {
        if (this.selectedKeyframeIds.has(kf.id)) {
          const newTime = Math.max(0, Math.min(this.state.duration, kf.time + deltaTime));
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
    const layer = this.state.layers.find((l) => l.id === layerId);
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
      const clampedTime = Math.max(0, Math.min(scaledTime, this.state.duration));

      // Get the base position from the layer's transform if it's a position property
      let value = kf.value;
      if (kf.property === 'position.x' && typeof kf.value === 'number') {
        value = layer.transform.position.x + kf.value;
      } else if (kf.property === 'position.y' && typeof kf.value === 'number') {
        value = layer.transform.position.y + kf.value;
      }

      this.addKeyframe(layerId, {
        id: nanoid(),
        time: clampedTime,
        property: kf.property,
        value,
        interpolation: kf.interpolation
      });
    }
  }

  // Timeline operations
  setCurrentTime(time: number) {
    this.currentTime = Math.max(0, Math.min(time, this.state.duration));
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
  updateProject(updates: Partial<Project>) {
    this.#state = { ...this.#state, ...updates };
  }

  async loadProject(project: Project) {
    this.isLoading = true;
    this.#state = project;
    await tick();
    this.selectedLayerId = PROJECT_LAYER_ID;

    this.isPlaying = false;
    this.isLoading = false;
  }

  exportToJSON(): string {
    return JSON.stringify(this.state, null, 2);
  }

  importFromJSON(json: string) {
    try {
      const project = JSON.parse(json);
      this.loadProject(project);
    } catch (error) {
      console.error('Failed to import project:', error);
    }
  }

  get selectedLayer(): TypedLayer | null {
    if (!this.selectedLayerId) return null;
    if (isProjectLayer(this.selectedLayerId)) {
      return createVirtualProjectLayer(this.state);
    }
    return this.state.layers.find((l) => l.id === this.selectedLayerId) || null;
  }

  // ========================================
  // Enter/Exit Time Operations
  // ========================================

  /**
   * Set the enter time for a layer (when it becomes visible)
   * For media layers (video/audio), also adjusts contentOffset to shift the content.
   * When contentOffset reaches 0, shifts exitTime to maintain visible duration (sliding mode).
   */
  setLayerEnterTime(layerId: string, enterTime: number) {
    this.state.layers = this.state.layers.map((layer) => {
      if (layer.id !== layerId) return layer;

      const oldEnterTime = layer.enterTime ?? 0;
      const oldExitTime = layer.exitTime ?? this.state.duration;
      const isMediaLayer = layer.type === 'video' || layer.type === 'audio';

      // For media layers with content duration, adjust content offset
      if (isMediaLayer && layer.contentDuration !== undefined) {
        const contentDuration = layer.contentDuration;
        const currentContentOffset = layer.contentOffset ?? 0;
        const enterTimeDelta = enterTime - oldEnterTime;

        // Calculate desired content offset
        let newContentOffset = currentContentOffset + enterTimeDelta;

        // If dragging left (decreasing enterTime) and contentOffset would go below 0
        if (enterTimeDelta < 0 && newContentOffset < 0) {
          // Slide mode: maintain visible duration and shift exit time
          const remainingDelta = newContentOffset; // negative value
          newContentOffset = 0;

          const validEnterTime = Math.max(0, enterTime);
          let newExitTime = oldExitTime + remainingDelta; // shift exit left by remaining delta

          // Ensure exit time stays valid
          newExitTime = Math.max(validEnterTime + 0.1, Math.min(newExitTime, this.state.duration));

          // Ensure visible duration doesn't exceed content duration
          if (newExitTime - validEnterTime > contentDuration) {
            newExitTime = validEnterTime + contentDuration;
          }

          return {
            ...layer,
            enterTime: validEnterTime,
            exitTime: newExitTime,
            contentOffset: 0
          };
        }

        // Normal mode: clamp content offset and adjust enter time
        newContentOffset = Math.max(0, Math.min(newContentOffset, contentDuration - 0.01));

        // Calculate actual enter time based on content offset constraints
        const actualDelta = newContentOffset - currentContentOffset;
        let validEnterTime = oldEnterTime + actualDelta;

        // Ensure enter time is within bounds and before exit time
        validEnterTime = Math.max(
          0,
          Math.min(validEnterTime, oldExitTime - 0.1, this.state.duration)
        );

        // Ensure visible duration doesn't exceed available content
        const visibleDuration = oldExitTime - validEnterTime;
        const availableContent = contentDuration - newContentOffset;
        if (visibleDuration > availableContent) {
          validEnterTime = oldExitTime - availableContent;
        }

        return {
          ...layer,
          enterTime: validEnterTime,
          exitTime: oldExitTime,
          contentOffset: newContentOffset
        };
      }

      // For non-media layers, use simple logic
      const clampedEnterTime = Math.max(0, Math.min(enterTime, this.state.duration));
      const validEnterTime = Math.min(clampedEnterTime, oldExitTime - 0.1);
      return { ...layer, enterTime: validEnterTime };
    });
  }

  /**
   * Set the exit time for a layer (when it becomes hidden)
   * For media layers (video/audio), respects contentDuration constraints
   */
  setLayerExitTime(layerId: string, exitTime: number) {
    this.state.layers = this.state.layers.map((layer) => {
      if (layer.id !== layerId) return layer;

      const enterTime = layer.enterTime ?? 0;
      const isMediaLayer = layer.type === 'video' || layer.type === 'audio';

      // Calculate max exit time for media layers
      let maxExitTime = this.state.duration;
      if (isMediaLayer && layer.contentDuration !== undefined) {
        const contentOffset = layer.contentOffset ?? 0;
        const availableContent = layer.contentDuration - contentOffset;
        maxExitTime = Math.min(this.state.duration, enterTime + availableContent);
      }

      // Clamp and validate exit time
      const clampedExitTime = Math.max(0, Math.min(exitTime, maxExitTime));
      const validExitTime = Math.max(clampedExitTime, enterTime + 0.1);

      return { ...layer, exitTime: validExitTime };
    });
  }

  /**
   * Set both enter and exit times for a layer (e.g., when dragging the bar)
   * For media layers, this maintains the content offset while moving the time range
   * @param shiftKeyframes If true, shift all keyframes by the time delta (default: false)
   */
  setLayerTimeRange(layerId: string, enterTime: number, exitTime: number, shiftKeyframes = false) {
    // For group layers, also shift all children by the same time delta
    const targetLayer = this.state.layers.find((l) => l.id === layerId);
    if (targetLayer?.type === 'group') {
      const oldGroupEnter = targetLayer.enterTime ?? 0;
      const clampedEnter = Math.max(0, Math.min(enterTime, this.state.duration));
      const delta = clampedEnter - oldGroupEnter;
      if (delta !== 0) {
        this.shiftGroupChildrenTime(layerId, delta);
      }
    }

    this.state.layers = this.state.layers.map((layer) => {
      if (layer.id !== layerId) return layer;

      const oldEnterTime = layer.enterTime ?? 0;
      const isMediaLayer = layer.type === 'video' || layer.type === 'audio';
      const duration = exitTime - enterTime;

      // For media layers, respect content duration
      if (isMediaLayer && layer.contentDuration !== undefined) {
        const contentOffset = layer.contentOffset ?? 0;
        const availableContent = layer.contentDuration - contentOffset;
        const maxDuration = Math.min(duration, availableContent);

        let clampedEnterTime = Math.max(0, Math.min(enterTime, this.state.duration));
        let clampedExitTime = clampedEnterTime + maxDuration;

        // Ensure exit time doesn't exceed project duration
        if (clampedExitTime > this.state.duration) {
          clampedExitTime = this.state.duration;
          clampedEnterTime = Math.max(0, clampedExitTime - maxDuration);
        }

        // Shift keyframes if requested
        const timeDelta = shiftKeyframes ? clampedEnterTime - oldEnterTime : 0;
        const shiftedKeyframes =
          timeDelta !== 0
            ? layer.keyframes
                .map((kf) => ({
                  ...kf,
                  time: Math.max(0, Math.min(this.state.duration, kf.time + timeDelta))
                }))
                .sort((a, b) => a.time - b.time)
            : layer.keyframes;

        return {
          ...layer,
          enterTime: clampedEnterTime,
          exitTime: Math.max(clampedExitTime, clampedEnterTime + 0.1),
          keyframes: shiftedKeyframes
        };
      }

      // For non-media layers, use simple logic
      const clampedEnterTime = Math.max(0, Math.min(enterTime, this.state.duration));
      const clampedExitTime = Math.max(0, Math.min(exitTime, this.state.duration));
      const validExitTime = Math.max(clampedExitTime, clampedEnterTime + 0.1);

      // Shift keyframes if requested
      const timeDelta = shiftKeyframes ? clampedEnterTime - oldEnterTime : 0;
      const shiftedKeyframes =
        timeDelta !== 0
          ? layer.keyframes
              .map((kf) => ({
                ...kf,
                time: Math.max(0, Math.min(this.state.duration, kf.time + timeDelta))
              }))
              .sort((a, b) => a.time - b.time)
          : layer.keyframes;

      return {
        ...layer,
        enterTime: clampedEnterTime,
        exitTime: validExitTime,
        keyframes: shiftedKeyframes
      };
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
    const layer = this.state.layers.find((l) => l.id === layerId);
    if (!layer) return;

    const time = splitTime ?? this.currentTime;
    const enterTime = layer.enterTime ?? 0;
    const exitTime = layer.exitTime ?? this.state.duration;

    // Don't split if time is outside the layer's range
    if (time <= enterTime || time >= exitTime) return;

    // Calculate how much content was played before the split
    const playedDuration = time - enterTime;
    const contentOffset = layer.contentOffset ?? 0;

    // Create the second half as a new layer
    const secondHalf: TypedLayer = {
      ...JSON.parse(JSON.stringify(layer)),
      id: nanoid(),
      name: `${layer.name} (2)`,
      enterTime: time,
      exitTime: exitTime,
      // Shift content offset by the amount already played
      contentOffset: contentOffset + playedDuration,
      keyframes: layer.keyframes.filter((k) => k.time > time).map((k) => ({ ...k }))
    };

    // Update the first half (original layer) - keep same contentOffset, just trim exit time
    this.state.layers = this.state.layers.map((l) => {
      if (l.id === layerId) {
        return {
          ...l,
          exitTime: time,
          keyframes: l.keyframes.filter((k) => k.time <= time)
        };
      }
      return l;
    });

    // Add the second half after the original
    const insertIndex = this.state.layers.findIndex((l) => l.id === layerId) + 1;
    const layers = [...this.state.layers];
    layers.splice(insertIndex, 0, secondHalf);
    this.state.layers = layers;
  }

  /**
   * Trim/crop a media layer's source time range
   */
  trimMediaLayer(layerId: string, mediaStartTime: number, mediaEndTime: number) {
    this.state.layers = this.state.layers.map((layer) => {
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
    const layer = this.state.layers.find((l) => l.id === layerId);
    if (!layer) return false;
    const t = time ?? this.currentTime;
    const enterTime = layer.enterTime ?? 0;
    const exitTime = layer.exitTime ?? this.state.duration;
    return t >= enterTime && t <= exitTime;
  }

  /**
   * Pre-calculate all frames for optimized recording
   * Uses the same rendering functions as canvas for consistency
   * @returns Promise that resolves when preparation is complete
   */
  async prepareRecording(): Promise<void> {
    const totalFrames = Math.ceil(this.state.fps * this.state.duration);
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    this.frameCache = new Map();
    this.preparingProgress = 0;

    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      const time = frameIndex / this.state.fps;
      const frameData: FrameCache = {};

      // Pre-calculate values for all layers using shared rendering functions
      for (const layer of this.state.layers) {
        frameData[layer.id] = {
          transform: getLayerTransform(layer, time, this.state.duration),
          style: getLayerStyle(layer, time, this.state.duration),
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
    const frameIndex = Math.floor(time * this.state.fps);
    return this.frameCache.get(frameIndex) ?? null;
  }
}
