import { Colors, type ColorScheme, type ThemeColorPalette } from "@/constants/theme";
import { useColorScheme } from "./use-color-scheme";

// Extended palette with GiftVault brand colors
export type ExtendedPalette = ThemeColorPalette & {
  secondary: string;
  gold: string;
  surface2: string;
};

/**
 * Returns the current theme's color palette.
 * Usage: const colors = useColors(); then colors.text, colors.background, etc.
 */
export function useColors(colorSchemeOverride?: ColorScheme): ExtendedPalette {
  const colorSchema = useColorScheme();
  const scheme = (colorSchemeOverride ?? colorSchema ?? "dark") as ColorScheme;
  const base = Colors[scheme];
  // Inject brand-specific tokens that may not be in the base palette type
  const extended = base as any;
  return {
    ...base,
    secondary: extended.secondary ?? (scheme === 'dark' ? '#F472B6' : '#EC4899'),
    gold: extended.gold ?? (scheme === 'dark' ? '#F59E0B' : '#D97706'),
    surface2: extended.surface2 ?? (scheme === 'dark' ? '#16213E' : '#F0EEF8'),
  } as ExtendedPalette;
}
