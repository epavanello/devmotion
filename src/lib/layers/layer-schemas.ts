/**
 * Layer schemas - separated from components to avoid circular dependencies
 * Import and use these schemas in your layer components
 */

import { fieldRegistry } from './base';

// Re-export so layers can import from here
export { fieldRegistry };

/**
 * Placeholder - each layer should define and export its own schema here
 * This file will be populated by moving schemas from layer components
 *
 * Example structure:
 * export const audioLayerSchema = z.object({ ... });
 * export const videoLayerSchema = z.object({ ... });
 */

// For now, we'll use a simpler approach - keep manual types in typed-registry
