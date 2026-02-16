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
    'ease-in-out': 'Ease In-Out',
    // Quad
    'ease-in-quad': 'Ease In (Quad)',
    'ease-out-quad': 'Ease Out (Quad)',
    'ease-in-out-quad': 'Ease In-Out (Quad)',
    // Cubic
    'ease-in-cubic': 'Ease In (Cubic)',
    'ease-out-cubic': 'Ease Out (Cubic)',
    'ease-in-out-cubic': 'Ease In-Out (Cubic)',
    // Quart
    'ease-in-quart': 'Ease In (Quart)',
    'ease-out-quart': 'Ease Out (Quart)',
    'ease-in-out-quart': 'Ease In-Out (Quart)',
    // Quint
    'ease-in-quint': 'Ease In (Quint)',
    'ease-out-quint': 'Ease Out (Quint)',
    'ease-in-out-quint': 'Ease In-Out (Quint)',
    // Sine
    'ease-in-sine': 'Ease In (Sine)',
    'ease-out-sine': 'Ease Out (Sine)',
    'ease-in-out-sine': 'Ease In-Out (Sine)',
    // Expo
    'ease-in-expo': 'Ease In (Expo)',
    'ease-out-expo': 'Ease Out (Expo)',
    'ease-in-out-expo': 'Ease In-Out (Expo)',
    // Circ
    'ease-in-circ': 'Ease In (Circ)',
    'ease-out-circ': 'Ease Out (Circ)',
    'ease-in-out-circ': 'Ease In-Out (Circ)',
    // Back
    'ease-in-back': 'Ease In (Back)',
    'ease-out-back': 'Ease Out (Back)',
    'ease-in-out-back': 'Ease In-Out (Back)',
    // Bounce
    'ease-in-bounce': 'Ease In (Bounce)',
    'ease-out-bounce': 'Ease Out (Bounce)',
    'ease-in-out-bounce': 'Ease In-Out (Bounce)',
    // Elastic
    'ease-in-elastic': 'Ease In (Elastic)',
    'ease-out-elastic': 'Ease Out (Elastic)',
    'ease-in-out-elastic': 'Ease In-Out (Elastic)'
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
