<script lang="ts">
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { projectStore } from '$lib/stores/project.svelte';
  import { getAnimatedTransform, getAnimatedStyle } from '$lib/engine/interpolation';
  import CanvasControls from './canvas-controls.svelte';
  import { CanvasInteractionManager } from './canvas-interactions';

  let canvasContainer: HTMLDivElement;
  let renderer: THREE.WebGLRenderer;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let animationFrameId: number;
  let layerObjects = new Map<string, THREE.Object3D>();
  let interactionManager: CanvasInteractionManager | null = null;

  onMount(() => {
    initThreeJS();
    updateScene();
    animate();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      interactionManager?.destroy();
      renderer?.dispose();
    };
  });

  function initThreeJS() {
    const width = canvasContainer.clientWidth;
    const height = canvasContainer.clientHeight;

    // Setup renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor(projectStore.project.backgroundColor, 1);
    canvasContainer.appendChild(renderer.domElement);

    // Setup scene
    scene = new THREE.Scene();

    // Setup camera - using perspective camera for proper depth perception
    const aspect = width / height;
    const fov = 50; // Field of view in degrees
    camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 10000);
    camera.position.z = 1000; // Move camera far enough to see the scene

    // Add grid
    updateGrid();

    // Setup interactions
    interactionManager = new CanvasInteractionManager(renderer.domElement, camera, scene);

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      const width = canvasContainer.clientWidth;
      const height = canvasContainer.clientHeight;
      renderer.setSize(width, height);

      const aspect = width / height;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    });
    resizeObserver.observe(canvasContainer);
  }

  function updateGrid() {
    // Remove existing grid
    const existingGrid = scene.getObjectByName('grid');
    if (existingGrid) {
      scene.remove(existingGrid);
    }

    if (!projectStore.viewport.showGrid) return;

    const gridHelper = new THREE.GridHelper(
      projectStore.project.width,
      projectStore.project.width / projectStore.viewport.gridSize,
      0x444444,
      0x222222
    );
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.z = -1; // Position grid slightly behind objects (Z=0)
    gridHelper.name = 'grid';
    scene.add(gridHelper);
  }

  function updateScene() {
    // Update grid visibility
    updateGrid();

    // Remove all selection outlines from previous renders
    const selections = scene.children.filter((child) => child.name === 'selection');
    selections.forEach((selection) => scene.remove(selection));

    // Clear old objects
    layerObjects.forEach((obj) => {
      scene.remove(obj);
    });
    layerObjects.clear();

    // Create objects for each layer
    projectStore.project.layers.forEach((layer) => {
      if (!layer.visible) return;

      let object: THREE.Object3D | null = null;

      // Get animated values
      const animatedTransform = getAnimatedTransform(
        layer.keyframes,
        projectStore.project.currentTime
      );
      const animatedStyle = getAnimatedStyle(layer.keyframes, projectStore.project.currentTime);

      const transform = {
        position: {
          x: animatedTransform.position.x ?? layer.transform.position.x,
          y: animatedTransform.position.y ?? layer.transform.position.y,
          z: animatedTransform.position.z ?? layer.transform.position.z
        },
        rotation: {
          x: animatedTransform.rotation.x ?? layer.transform.rotation.x,
          y: animatedTransform.rotation.y ?? layer.transform.rotation.y,
          z: animatedTransform.rotation.z ?? layer.transform.rotation.z
        },
        scale: {
          x: animatedTransform.scale.x ?? layer.transform.scale.x,
          y: animatedTransform.scale.y ?? layer.transform.scale.y,
          z: animatedTransform.scale.z ?? layer.transform.scale.z
        }
      };

      const opacity = animatedStyle.opacity ?? layer.style.opacity;
      const color = animatedStyle.color ?? layer.style.color;

      if (layer.type === 'text' && layer.textData) {
        object = createTextObject(layer.textData.content, color, opacity);
      } else if (layer.type === 'shape' && layer.shapeData) {
        object = createShapeObject(layer.shapeData, color, opacity);
      } else if (layer.type === 'image' && layer.imageData) {
        object = createImageObject(layer.imageData, opacity);
      }

      if (object) {
        // Note: Y is NOT inverted here - we use the value as-is
        // Three.js Y-up coordinate system matches our logical coordinate system
        object.position.set(transform.position.x, transform.position.y, transform.position.z);
        object.rotation.set(transform.rotation.x, transform.rotation.y, transform.rotation.z);
        object.scale.set(transform.scale.x, transform.scale.y, transform.scale.z);
        object.userData.layerId = layer.id;

        // Highlight selected layer
        if (layer.id === projectStore.selectedLayerId) {
          addSelectionOutline(object);
        }

        scene.add(object);
        layerObjects.set(layer.id, object);
      }
    });
  }

  function createTextObject(text: string, color: string, opacity: number): THREE.Object3D {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 1024;
    canvas.height = 256;

    // Clear canvas with transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw text
    ctx.fillStyle = color;
    ctx.font = 'bold 96px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    // Use PlaneGeometry instead of Sprite for consistent behavior with shapes
    const geometry = new THREE.PlaneGeometry(400, 100);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);

    return mesh;
  }

  function createShapeObject(
    shapeData: { shapeType: string; width: number; height: number; radius?: number },
    color: string,
    opacity: number
  ): THREE.Object3D {
    let geometry: THREE.BufferGeometry;

    switch (shapeData.shapeType) {
      case 'rectangle':
        geometry = new THREE.PlaneGeometry(shapeData.width, shapeData.height);
        break;
      case 'circle':
        geometry = new THREE.CircleGeometry(shapeData.radius || 100, 32);
        break;
      case 'triangle':
        geometry = new THREE.CircleGeometry(shapeData.radius || 100, 3);
        break;
      default:
        geometry = new THREE.PlaneGeometry(shapeData.width, shapeData.height);
    }

    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity,
      side: THREE.DoubleSide
    });

    return new THREE.Mesh(geometry, material);
  }

  function createImageObject(
    imageData: { src: string; width: number; height: number },
    opacity: number
  ): THREE.Object3D {
    const texture = new THREE.TextureLoader().load(imageData.src);

    // Use PlaneGeometry for consistent behavior with other layers
    const geometry = new THREE.PlaneGeometry(imageData.width, imageData.height);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);

    return mesh;
  }

  function addSelectionOutline(object: THREE.Object3D) {
    const bbox = new THREE.Box3().setFromObject(object);
    const size = bbox.getSize(new THREE.Vector3());

    const geometry = new THREE.EdgesGeometry(new THREE.PlaneGeometry(size.x * 1.1, size.y * 1.1));
    const material = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 });
    const edges = new THREE.LineSegments(geometry, material);

    edges.position.copy(object.position);
    edges.name = 'selection';
    scene.add(edges);
  }

  function animate() {
    animationFrameId = requestAnimationFrame(animate);

    // Update camera based on viewport
    camera.position.x = projectStore.viewport.pan.x;
    camera.position.y = -projectStore.viewport.pan.y;

    // Adjust camera distance based on zoom (closer = more zoomed in)
    const baseDistance = 1000;
    camera.position.z = baseDistance / projectStore.viewport.zoom;

    // Update scene if playing
    if (projectStore.isPlaying) {
      const deltaTime = 1 / projectStore.project.fps;
      const newTime = projectStore.project.currentTime + deltaTime;

      if (newTime >= projectStore.project.duration) {
        projectStore.setCurrentTime(0);
      } else {
        projectStore.setCurrentTime(newTime);
      }

      updateScene();
    }

    renderer.render(scene, camera);
  }

  // Reactive updates
  $effect(() => {
    if (renderer) {
      updateScene();
    }
  });

  $effect(() => {
    if (scene) {
      updateGrid();
    }
  });
</script>

<div class="relative h-full w-full bg-background">
  <div bind:this={canvasContainer} class="h-full w-full"></div>
  <CanvasControls />
</div>
