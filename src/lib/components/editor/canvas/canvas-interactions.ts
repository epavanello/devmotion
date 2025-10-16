/**
 * Canvas interaction utilities
 */
import * as THREE from 'three';
import { projectStore } from '$lib/stores/project.svelte';
import { getAnimatedTransform } from '$lib/engine/interpolation';
import { nanoid } from 'nanoid';

export class CanvasInteractionManager {
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private isDragging = false;
  private dragStart = new THREE.Vector2();
  private selectedObject: THREE.Object3D | null = null;
  private isPanning = false;
  private panStart = new THREE.Vector2();

  constructor(
    private canvas: HTMLCanvasElement,
    private camera: THREE.Camera,
    private scene: THREE.Scene
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('wheel', this.onWheel.bind(this));
  }

  private updateMousePosition(event: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private getIntersectedObject(): THREE.Object3D | null {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    for (const intersect of intersects) {
      if (intersect.object.userData.layerId) {
        return intersect.object;
      }
    }

    return null;
  }

  private onMouseDown(event: MouseEvent) {
    this.updateMousePosition(event);

    // Middle mouse or space+drag for panning
    if (event.button === 1 || (event.button === 0 && event.shiftKey)) {
      this.isPanning = true;
      this.panStart.set(event.clientX, event.clientY);
      event.preventDefault();
      return;
    }

    const intersected = this.getIntersectedObject();

    if (intersected && intersected.userData.layerId) {
      // Select layer
      const layerId = intersected.userData.layerId;
      const layer = projectStore.project.layers.find((l) => l.id === layerId);

      if (layer && !layer.locked) {
        projectStore.selectedLayerId = layerId;
        this.selectedObject = intersected;
        this.isDragging = true;
        this.dragStart.set(this.mouse.x, this.mouse.y);

        // Pause playback when starting to drag
        if (projectStore.isPlaying) {
          projectStore.pause();
        }
      }
    } else {
      // Deselect
      projectStore.selectedLayerId = null;
      this.selectedObject = null;
    }
  }

  private onMouseMove(event: MouseEvent) {
    this.updateMousePosition(event);

    // Handle panning
    if (this.isPanning) {
      const deltaX = event.clientX - this.panStart.x;
      const deltaY = event.clientY - this.panStart.y;

      const currentPan = projectStore.viewport.pan;
      projectStore.setPan(currentPan.x + deltaX, currentPan.y + deltaY);

      this.panStart.set(event.clientX, event.clientY);
      return;
    }

    // Handle dragging
    if (this.isDragging && this.selectedObject) {
      const layerId = this.selectedObject.userData.layerId;
      const layer = projectStore.project.layers.find((l) => l.id === layerId);

      if (layer) {
        // Calculate movement in world space
        const rect = this.canvas.getBoundingClientRect();
        const movementX =
          (event.movementX / rect.width) *
          2 *
          (projectStore.project.width / 2) *
          projectStore.viewport.zoom;
        // Note: Y is inverted because screen Y goes down but Three.js Y goes up
        const movementY =
          (-event.movementY / rect.height) *
          2 *
          (projectStore.project.height / 2) *
          projectStore.viewport.zoom;

        const currentTime = projectStore.project.currentTime;

        // Check if there are ANY keyframes for position.x or position.y
        const hasXKeyframes = layer.keyframes.some((k) => k.property === 'position.x');
        const hasYKeyframes = layer.keyframes.some((k) => k.property === 'position.y');

        // Get current animated values using the interpolation engine
        const animatedTransform = getAnimatedTransform(layer.keyframes, currentTime);
        const currentX = animatedTransform.position.x ?? layer.transform.position.x;
        const currentY = animatedTransform.position.y ?? layer.transform.position.y;

        // Find keyframes at exact current time
        const xKeyframeAtTime = layer.keyframes.find(
          (k) => k.property === 'position.x' && k.time === currentTime
        );
        const yKeyframeAtTime = layer.keyframes.find(
          (k) => k.property === 'position.y' && k.time === currentTime
        );

        // Handle X movement
        if (hasXKeyframes) {
          // Property is animated - work with keyframes
          if (xKeyframeAtTime) {
            // Update existing keyframe at current time
            projectStore.updateKeyframe(layerId, xKeyframeAtTime.id, {
              value: (xKeyframeAtTime.value as number) + movementX
            });
          } else {
            // Create new keyframe at current time with current animated value
            projectStore.addKeyframe(layerId, {
              id: nanoid(),
              time: currentTime,
              property: 'position.x',
              value: currentX + movementX,
              easing: { type: 'linear' }
            });
          }
        }

        // Handle Y movement
        if (hasYKeyframes) {
          // Property is animated - work with keyframes
          if (yKeyframeAtTime) {
            // Update existing keyframe at current time
            projectStore.updateKeyframe(layerId, yKeyframeAtTime.id, {
              value: (yKeyframeAtTime.value as number) + movementY
            });
          } else {
            // Create new keyframe at current time with current animated value
            projectStore.addKeyframe(layerId, {
              id: nanoid(),
              time: currentTime,
              property: 'position.y',
              value: currentY + movementY,
              easing: { type: 'linear' }
            });
          }
        }

        // Update base transform if either property is not animated
        if (!hasXKeyframes || !hasYKeyframes) {
          const newTransform = {
            ...layer.transform,
            position: {
              ...layer.transform.position,
              x: hasXKeyframes
                ? layer.transform.position.x
                : layer.transform.position.x + movementX,
              y: hasYKeyframes ? layer.transform.position.y : layer.transform.position.y + movementY
            }
          };
          projectStore.updateLayer(layerId, { transform: newTransform });
        }
      }
    }

    // Update cursor
    const intersected = this.getIntersectedObject();
    if (intersected && intersected.userData.layerId) {
      const layer = projectStore.project.layers.find((l) => l.id === intersected.userData.layerId);
      this.canvas.style.cursor = layer?.locked ? 'not-allowed' : 'move';
    } else {
      this.canvas.style.cursor = 'default';
    }
  }

  private onMouseUp() {
    this.isDragging = false;
    this.isPanning = false;
    this.selectedObject = null;
  }

  private onWheel(event: WheelEvent) {
    event.preventDefault();

    // Zoom with scroll wheel
    const delta = event.deltaY > 0 ? 1.1 : 0.9;
    projectStore.setZoom(projectStore.viewport.zoom * delta);
  }

  public destroy() {
    this.canvas.removeEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.removeEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.removeEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.removeEventListener('wheel', this.onWheel.bind(this));
  }
}
