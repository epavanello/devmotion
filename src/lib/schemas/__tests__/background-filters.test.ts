import { describe, it, expect } from 'vitest';
import {
  BackgroundFiltersSchema,
  LinearGradientSchema,
  RadialGradientSchema,
  ConicGradientSchema,
  buildFilterCSS,
  backgroundValueToCSS,
  type BackgroundFilters
} from '../background';

describe('Background Filters', () => {
  describe('BackgroundFiltersSchema', () => {
    it('validates valid filter values', () => {
      const validFilters: BackgroundFilters = {
        blur: 10,
        brightness: 1.2,
        contrast: 1.1,
        saturate: 0.8,
        hueRotate: 45,
        opacity: 0.9,
        grain: 0.5
      };

      const result = BackgroundFiltersSchema.safeParse(validFilters);
      expect(result.success).toBe(true);
    });

    it('accepts undefined', () => {
      const result = BackgroundFiltersSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it('accepts partial filters', () => {
      const partialFilters = {
        blur: 5,
        brightness: 1.3
      };

      const result = BackgroundFiltersSchema.safeParse(partialFilters);
      expect(result.success).toBe(true);
    });

    it('rejects out-of-range values', () => {
      const invalidFilters = {
        blur: -5 // Should be min 0
      };

      const result = BackgroundFiltersSchema.safeParse(invalidFilters);
      expect(result.success).toBe(false);
    });
  });

  describe('buildFilterCSS', () => {
    it('returns empty string for undefined filters', () => {
      const css = buildFilterCSS(undefined);
      expect(css).toBe('');
    });

    it('returns empty string for empty object', () => {
      const css = buildFilterCSS({});
      expect(css).toBe('');
    });

    it('builds correct CSS for single filter', () => {
      const css = buildFilterCSS({ blur: 10 });
      expect(css).toBe('blur(10px)');
    });

    it('builds correct CSS for multiple filters', () => {
      const css = buildFilterCSS({
        blur: 5,
        brightness: 1.2,
        contrast: 1.1,
        saturate: 0.9
      });
      expect(css).toContain('blur(5px)');
      expect(css).toContain('brightness(1.2)');
      expect(css).toContain('contrast(1.1)');
      expect(css).toContain('saturate(0.9)');
    });

    it('includes hue-rotate with degrees', () => {
      const css = buildFilterCSS({ hueRotate: 90 });
      expect(css).toBe('hue-rotate(90deg)');
    });

    it('skips default values', () => {
      const css = buildFilterCSS({
        brightness: 1, // Default
        contrast: 1, // Default
        blur: 0, // Default
        saturate: 2 // Non-default
      });
      expect(css).toBe('saturate(2)');
    });
  });

  describe('Gradient schemas with filters', () => {
    it('validates linear gradient with filters', () => {
      const gradient = {
        type: 'linear' as const,
        angle: 45,
        stops: [
          { color: '#ff0000', position: 0 },
          { color: '#0000ff', position: 100 }
        ],
        filters: {
          blur: 5,
          brightness: 1.2
        }
      };

      const result = LinearGradientSchema.safeParse(gradient);
      expect(result.success).toBe(true);
    });

    it('validates radial gradient with filters', () => {
      const gradient = {
        type: 'radial' as const,
        shape: 'circle' as const,
        size: 'farthest-corner' as const,
        position: { x: 50, y: 50 },
        stops: [
          { color: '#ffffff', position: 0 },
          { color: '#000000', position: 100 }
        ],
        filters: {
          saturate: 0.5,
          grain: 0.3
        }
      };

      const result = RadialGradientSchema.safeParse(gradient);
      expect(result.success).toBe(true);
    });

    it('validates conic gradient with filters', () => {
      const gradient = {
        type: 'conic' as const,
        angle: 0,
        position: { x: 50, y: 50 },
        stops: [
          { color: '#ff0000', position: 0 },
          { color: '#00ff00', position: 50 },
          { color: '#0000ff', position: 100 }
        ],
        filters: {
          hueRotate: 180,
          opacity: 0.8
        }
      };

      const result = ConicGradientSchema.safeParse(gradient);
      expect(result.success).toBe(true);
    });
  });

  describe('backgroundValueToCSS with grain', () => {
    it('includes grain SVG for linear gradient', () => {
      const gradient = {
        type: 'linear' as const,
        angle: 90,
        stops: [
          { color: '#ff0000', position: 0 },
          { color: '#0000ff', position: 100 }
        ],
        filters: {
          grain: 0.5
        }
      };

      const css = backgroundValueToCSS(gradient);
      expect(css).toContain('url("data:image/svg+xml');
      expect(css).toContain('linear-gradient(90deg');
    });

    it('does not include grain when grain is 0', () => {
      const gradient = {
        type: 'linear' as const,
        angle: 90,
        stops: [
          { color: '#ff0000', position: 0 },
          { color: '#0000ff', position: 100 }
        ],
        filters: {
          grain: 0
        }
      };

      const css = backgroundValueToCSS(gradient);
      expect(css).not.toContain('url("data:image/svg+xml');
      expect(css).toContain('linear-gradient(90deg');
    });

    it('does not include grain when filters is undefined', () => {
      const gradient = {
        type: 'linear' as const,
        angle: 90,
        stops: [
          { color: '#ff0000', position: 0 },
          { color: '#0000ff', position: 100 }
        ]
      };

      const css = backgroundValueToCSS(gradient);
      expect(css).not.toContain('url("data:image/svg+xml');
    });
  });
});
