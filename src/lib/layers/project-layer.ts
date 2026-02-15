/**
 * Constants and helpers for the virtual project settings layer.
 *
 * The project layer is a special "virtual" layer that does not exist in the
 * project's `layers[]` array.  Instead it is synthesized from top-level project
 * fields (name, width, height, duration, background, fontFamily) and displayed
 * in the layers panel and properties panel like any other layer.
 */
import type { TypedLayer } from './typed-registry';
import type { Project } from '$lib/schemas/animation';

/** Well-known layer ID for the project settings layer */
export const PROJECT_LAYER_ID = '__project__';

/** Layer type string used in the registry */
export const PROJECT_LAYER_TYPE = 'project-settings';

/** Check whether a layer ID refers to the project settings layer */
export function isProjectLayer(layerId: string | null | undefined): boolean {
  return layerId === PROJECT_LAYER_ID;
}

/**
 * Synthesize a virtual layer object from the current project state.
 * This allows the properties panel to treat it like any other layer.
 */
export function createVirtualProjectLayer(project: Project): TypedLayer {
  return {
    id: PROJECT_LAYER_ID,
    name: project.name,
    type: PROJECT_LAYER_TYPE,
    transform: {
      x: 0,
      y: 0,
      z: 0,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      scaleX: 1,
      scaleY: 1,
      anchor: 'center'
    },
    style: { opacity: 1 },
    visible: true,
    locked: false,
    keyframes: [],
    props: {
      width: project.width,
      height: project.height,
      duration: project.duration,
      background: project.background,
      fontFamily: project.fontFamily
    }
  };
}

/**
 * Map props from the virtual project layer back to Project-level fields.
 */
export function mapProjectLayerPropsToProject(
  props: Record<string, unknown>
): Partial<Project> {
  const updates: Partial<Project> = {};
  if ('width' in props) updates.width = props.width as number;
  if ('height' in props) updates.height = props.height as number;
  if ('duration' in props) updates.duration = props.duration as number;
  if ('background' in props) updates.background = props.background as Project['background'];
  if ('fontFamily' in props) updates.fontFamily = props.fontFamily as Project['fontFamily'];
  return updates;
}
