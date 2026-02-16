import type { AnimatableProperty } from '$lib/schemas/animation';
import type { TypedLayer } from '$lib/layers/typed-registry';

/**
 * Common props passed to all property group components
 */
export type PropertyGroupProps = {
  layer: TypedLayer;
  currentValues: Pick<TypedLayer, 'transform' | 'style' | 'props'> | null;
  updateProperty: (
    propertyName: string,
    value: unknown,
    target: 'transform' | 'props' | 'style'
  ) => void;
  addKeyframe: (property: AnimatableProperty) => void;
};
