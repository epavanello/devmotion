export const BRAND_COLORS = {
  blue: '#3b82f6',
  purple: '#9333ea',
  slate: {
    900: '#0f172a',
    950: '#020617'
  }
} as const;

export const BRAND_GRADIENTS = {
  logo: `linear-gradient(135deg, ${BRAND_COLORS.blue} 0%, ${BRAND_COLORS.purple} 100%)`,
  background: `radial-gradient(circle at center, ${BRAND_COLORS.slate[900]} 0%, ${BRAND_COLORS.slate[950]} 100%)`
} as const;
