import type { AnimatableProperty } from '$lib/types/animation';
import {
  getPropertyCategory,
  getTransformInputId,
  getStyleInputId
} from '$lib/utils/property-names';

/**
 * Navigate to a property input in the properties panel
 * Expands groups if needed and scrolls to the input
 */
export function navigateToProperty(property: AnimatableProperty) {
  const inputId = getInputIdFromProperty(property);

  const input = document.getElementById(inputId) as HTMLElement | null;
  if (input) {
    // Expand the group if it's collapsed
    const groupToggle = input
      .closest('.properties-group-content[data-open="false"]')
      ?.querySelector<HTMLButtonElement>('.properties-group-header');

    if (groupToggle) {
      groupToggle.click();
    }

    // Scroll to the input and focus it
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      (input as HTMLInputElement)?.focus?.();
      (input as HTMLInputElement)?.select?.();
    }, 500);
  }
}

function getInputIdFromProperty(property: AnimatableProperty): string {
  const category = getPropertyCategory(property);

  if (category === 'transform') {
    return getTransformInputId(property);
  }
  if (category === 'style') {
    return getStyleInputId(property);
  }
  if (property.startsWith('props.')) {
    return property;
  }

  return property;
}
