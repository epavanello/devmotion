/**
 * Shared Google Fonts system used across the application
 * Provides centralized font definitions and utilities for DevMotion
 */

/**
 * Popular Google Fonts enum
 */
export const GOOGLE_FONTS = {
  Inter: 'Inter',
  Roboto: 'Roboto',
  Poppins: 'Poppins',
  Manrope: 'Manrope',
  OpenSans: 'Open Sans',
  Montserrat: 'Montserrat',
  Lato: 'Lato',
  PlayfairDisplay: 'Playfair Display',
  DMSans: 'DM Sans',
  Nunito: 'Nunito',
  Raleway: 'Raleway',
  Merriweather: 'Merriweather',
  SourceSans3: 'Source Sans 3',
  Oswald: 'Oswald',
  Ubuntu: 'Ubuntu',
  WorkSans: 'Work Sans',
  Quicksand: 'Quicksand',
  Mulish: 'Mulish',
  Barlow: 'Barlow',
  Outfit: 'Outfit'
} as const;

export type GoogleFont = (typeof GOOGLE_FONTS)[keyof typeof GOOGLE_FONTS];

export const googleFontValues = Object.values(GOOGLE_FONTS) as [GoogleFont, ...GoogleFont[]];

/**
 * Generate Google Fonts CSS URL for a given font family
 * Includes all weight variants (100-900) for maximum flexibility
 */
export function getGoogleFontUrl(fontFamily: GoogleFont): string {
  const encodedFamily = fontFamily.replace(/ /g, '+');
  return `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
}
