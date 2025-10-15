/**
 * Canvas interaction utilities
 */
import * as THREE from 'three';
import { projectStore } from '$lib/stores/project.svelte';

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
        const movementY =
          -((event.movementY / rect.height) * 2) *
          (projectStore.project.height / 2) *
          projectStore.viewport.zoom;

        const newTransform = {
          ...layer.transform,
          position: {
            x: layer.transform.position.x + movementX,
            y: layer.transform.position.y + movementY,
            z: layer.transform.position.z
          }
        };

        projectStore.updateLayer(layerId, { transform: newTransform });
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
