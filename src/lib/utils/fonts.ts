/**
 * Shared Google Fonts system used across the application
 * Provides centralized font definitions and utilities for DevMotion
 */

/**
 * Google Fonts organized by category - single source of truth
 */
export const GOOGLE_FONTS_BY_CATEGORY = {
  'Sans-Serif': {
    Inter: 'Inter',
    Roboto: 'Roboto',
    Poppins: 'Poppins',
    Manrope: 'Manrope',
    OpenSans: 'Open Sans',
    Montserrat: 'Montserrat',
    Lato: 'Lato',
    DMSans: 'DM Sans',
    Nunito: 'Nunito',
    Raleway: 'Raleway',
    SourceSans3: 'Source Sans 3',
    Oswald: 'Oswald',
    Ubuntu: 'Ubuntu',
    WorkSans: 'Work Sans',
    Quicksand: 'Quicksand',
    Mulish: 'Mulish',
    Barlow: 'Barlow',
    Outfit: 'Outfit'
  },
  Serif: {
    PlayfairDisplay: 'Playfair Display',
    Merriweather: 'Merriweather',
    LoraFont: 'Lora',
    EBGaramond: 'EB Garamond',
    Crimson: 'Crimson Text'
  },
  'Handwriting & Script': {
    Pacifico: 'Pacifico',
    DancingScript: 'Dancing Script',
    Caveat: 'Caveat',
    IndieFlower: 'Indie Flower',
    ShadowsIntoLight: 'Shadows Into Light',
    PermanentMarker: 'Permanent Marker',
    KaushanScript: 'Kaushan Script',
    Satisfy: 'Satisfy',
    GreatVibes: 'Great Vibes',
    Parisienne: 'Parisienne'
  },
  'Display & Decorative': {
    Bangers: 'Bangers',
    Righteous: 'Righteous',
    Bebas: 'Bebas Neue',
    Anton: 'Anton',
    Audiowide: 'Audiowide',
    FredokaOne: 'Fredoka One',
    RussoOne: 'Russo One',
    Wallpoet: 'Wallpoet',
    Bungee: 'Bungee',
    PressStart2P: 'Press Start 2P'
  },
  Monospace: {
    RobotoMono: 'Roboto Mono',
    SourceCodePro: 'Source Code Pro',
    JetBrainsMono: 'JetBrains Mono',
    FiraCode: 'Fira Code',
    Courier: 'Courier Prime'
  },
  Rounded: {
    Comfortaa: 'Comfortaa',
    VarelaRound: 'Varela Round',
    Fredoka: 'Fredoka',
    Chewy: 'Chewy'
  },
  Condensed: {
    OswaldCondensed: 'Oswald',
    FjallaOne: 'Fjalla One',
    PathwayGothicOne: 'Pathway Gothic One'
  }
} as const;

// Type inference
export type FontCategory = keyof typeof GOOGLE_FONTS_BY_CATEGORY;
export type GoogleFont = {
  [K in FontCategory]: (typeof GOOGLE_FONTS_BY_CATEGORY)[K][keyof (typeof GOOGLE_FONTS_BY_CATEGORY)[K]];
}[FontCategory];

/**
 * Flattened GOOGLE_FONTS object for backward compatibility
 */
export const GOOGLE_FONTS = Object.values(GOOGLE_FONTS_BY_CATEGORY).reduce(
  (acc, category) => ({ ...acc, ...category }),
  {} as Record<string, string>
) as Record<string, GoogleFont>;

/**
 * Font categories with their fonts as arrays
 */
export const FONT_CATEGORIES = {
  'Sans-Serif': Object.values(GOOGLE_FONTS_BY_CATEGORY['Sans-Serif']),
  Serif: Object.values(GOOGLE_FONTS_BY_CATEGORY.Serif),
  'Handwriting & Script': Object.values(GOOGLE_FONTS_BY_CATEGORY['Handwriting & Script']),
  'Display & Decorative': Object.values(GOOGLE_FONTS_BY_CATEGORY['Display & Decorative']),
  Monospace: Object.values(GOOGLE_FONTS_BY_CATEGORY.Monospace),
  Rounded: Object.values(GOOGLE_FONTS_BY_CATEGORY.Rounded),
  Condensed: Object.values(GOOGLE_FONTS_BY_CATEGORY.Condensed)
} as const;

/**
 * Category display labels (optional for custom labels)
 */
export const CATEGORY_LABELS: Record<FontCategory, string> = {
  'Sans-Serif': 'Sans-Serif',
  Serif: 'Serif',
  'Handwriting & Script': 'Handwriting & Script',
  'Display & Decorative': 'Display & Decorative',
  Monospace: 'Monospace',
  Rounded: 'Rounded',
  Condensed: 'Condensed'
};

/**
 * Flattened array of all font values
 */
export const googleFontValues = Object.values(FONT_CATEGORIES).flat() as [
  GoogleFont,
  ...GoogleFont[]
];

/**
 * Font categories as array for iteration
 */
export const fontCategoriesArray = Object.entries(FONT_CATEGORIES).map(([category, fonts]) => ({
  label: CATEGORY_LABELS[category as FontCategory],
  category: category as FontCategory,
  fonts
}));

/**
 * Fonts that don't support variable weights (display, handwriting, etc.)
 */
const SINGLE_WEIGHT_FONTS = new Set<GoogleFont>([
  'Pacifico',
  'Permanent Marker',
  'Press Start 2P',
  'Fredoka One',
  'Russo One',
  'Wallpoet',
  'Bebas Neue',
  'Anton',
  'Audiowide',
  'Righteous',
  'Bangers',
  'Bungee',
  'Great Vibes',
  'Parisienne',
  'Satisfy',
  'Kaushan Script',
  'Chewy',
  'Fjalla One',
  'Pathway Gothic One'
]);

/**
 * Generate Google Fonts CSS URL for a given font family
 * Includes weight variants based on font capabilities
 */
export function getGoogleFontUrl(fontFamily: GoogleFont): string {
  const encodedFamily = fontFamily.replace(/ /g, '+');

  // Some fonts only support single weight
  if (SINGLE_WEIGHT_FONTS.has(fontFamily)) {
    return `https://fonts.googleapis.com/css2?family=${encodedFamily}&display=swap`;
  }

  // Most fonts support multiple weights
  return `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
}

/**
 * Check if a font has loaded successfully
 * Uses browser's FontFaceSet API
 */
export async function checkFontLoaded(fontFamily: GoogleFont): Promise<boolean> {
  if (!document.fonts) return false;

  try {
    // Wait for font to be loaded or timeout after 3 seconds
    const result = await Promise.race([
      document.fonts.load(`16px "${fontFamily}"`),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
    ]);

    if (!result) return false;

    // Check if font is actually available
    return document.fonts.check(`16px "${fontFamily}"`);
  } catch {
    return false;
  }
}
