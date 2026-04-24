import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, View } from "react-native";
import { colorScheme as nativewindColorScheme, vars } from "nativewind";

import { SchemeColors, type ColorScheme } from "@/constants/theme";

type ThemeContextValue = {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // GiftVault is dark-mode first
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('dark');

  const applyScheme = useCallback((scheme: ColorScheme) => {
    nativewindColorScheme.set(scheme);
    Appearance.setColorScheme?.(scheme);
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.dataset.theme = scheme;
      root.classList.toggle("dark", scheme === "dark");
      const palette = SchemeColors[scheme];
      Object.entries(palette).forEach(([token, value]) => {
        root.style.setProperty(`--color-${token}`, value);
      });
    }
  }, []);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    applyScheme(scheme);
  }, [applyScheme]);

  useEffect(() => {
    applyScheme(colorScheme);
  }, [applyScheme, colorScheme]);

  const palette = SchemeColors[colorScheme] as any;

  const themeVariables = useMemo(
    () =>
      vars({
        "color-primary": palette.primary,
        "color-background": palette.background,
        "color-surface": palette.surface,
        "color-foreground": palette.foreground,
        "color-muted": palette.muted,
        "color-border": palette.border,
        "color-success": palette.success,
        "color-warning": palette.warning,
        "color-error": palette.error,
        "color-secondary": palette.secondary ?? '#F472B6',
        "color-gold": palette.gold ?? '#F59E0B',
        "color-surface2": palette.surface2 ?? '#16213E',
        "color-tint": palette.tint ?? palette.primary,
      }),
    [colorScheme],
  );

  const value = useMemo(
    () => ({
      colorScheme,
      setColorScheme,
    }),
    [colorScheme, setColorScheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1 }, themeVariables]}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return ctx;
}
