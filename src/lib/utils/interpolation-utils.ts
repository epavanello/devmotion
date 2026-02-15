import type { AnimatableProperty, Interpolation, InterpolationFamily } from '$lib/types/animation';
import { extractPropertyMetadata } from '$lib/layers/base';
import { getLayerSchema } from '$lib/layers/registry';

/**
 * Type-safe interpolation labels - maps each family to its available strategies
 */
export type InterpolationLabels = {
  [F in Interpolation['family']]: {
    [K in Extract<Interpolation, { family: F }>['strategy']]: string;
  };
};

export const interpolationLabels = {
  continuous: {
    linear: 'Linear',
    'ease-in': 'Ease In',
    'ease-out': 'Ease Out',
    'ease-in-out': 'Ease In-Out'
  },
  discrete: {
    'step-end': 'Step End',
    'step-start': 'Step Start',
    'step-mid': 'Step Mid'
  },
  quantized: {
    integer: 'Integer',
    'snap-grid': 'Snap Grid'
  },
  text: {
    'char-reveal': 'Char Reveal',
    'word-reveal': 'Word Reveal'
  }
} as const satisfies InterpolationLabels;

/**
 * Get supported interpolation families for a property based on layer schema
 */
export function getSupportedInterpolationFamilies(
  layerType: string,
  property: AnimatableProperty
): InterpolationFamily[] {
  // Extract property name from animatable property (e.g., "props.fontSize" -> "fontSize")
  const propertyName = property.includes('.') ? property.split('.').pop()! : property;

  // Get layer schema and extract metadata
  const schema = getLayerSchema(layerType);
  const metadata = extractPropertyMetadata(schema);

  // Find metadata for this property
  const fieldMeta = metadata.find((m) => m.name === propertyName);

  if (!fieldMeta) {
    // Default for built-in properties (position, scale, rotation, opacity)
    return ['continuous'];
  }

  // Return supported families from metadata
  const families = fieldMeta.interpolationFamily;
  if (Array.isArray(families)) {
    return families;
  }
  return [families];
}

/**
 * Get available strategy options for a set of interpolation families
 */
export function getStrategyOptionsForFamilies(
  families: InterpolationFamily[]
): Array<{ family: InterpolationFamily; strategy: string; label: string }> {
  const options: Array<{ family: InterpolationFamily; strategy: string; label: string }> = [];

  for (const family of families) {
    const familyLabels = interpolationLabels[family];
    for (const [strategy, label] of Object.entries(familyLabels)) {
      options.push({ family, strategy, label });
    }
  }

  return options;
}

/**
 * Get default interpolation for a property based on layer schema
 */
export function getDefaultInterpolationForProperty(
  layerType: string,
  property: AnimatableProperty
): Interpolation {
  const families = getSupportedInterpolationFamilies(layerType, property);
  const primaryFamily = families[0];

  // Return default strategy for the primary family
  switch (primaryFamily) {
    case 'continuous':
      return { family: 'continuous', strategy: 'ease-in-out' };
    case 'discrete':
      return { family: 'discrete', strategy: 'step-end' };
    case 'quantized':
      return { family: 'quantized', strategy: 'integer' };
    case 'text':
      return { family: 'text', strategy: 'char-reveal' };
    default:
      return { family: 'continuous', strategy: 'ease-in-out' };
  }
}

/**
 * Check if an interpolation is valid for a property based on layer schema
 */
export function isInterpolationValid(
  layerType: string,
  property: AnimatableProperty,
  interpolation: Interpolation
): boolean {
  const supportedFamilies = getSupportedInterpolationFamilies(layerType, property);
  return supportedFamilies.includes(interpolation.family);
}
