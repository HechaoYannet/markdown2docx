import { loadTypographyConfig } from "../config/typography";
import { getInitialLocale } from "../i18n";
import type { FontChoice, Locale, ThemeMode, TypographyConfig } from "../types";

export interface AppState {
  currentLocale: Locale;
  currentFileName: string;
  currentTheme: ThemeMode;
  currentFont: FontChoice;
  currentTypography: TypographyConfig;
}

// Centralized state initialization keeps startup behavior deterministic
// and makes it easier to unit-test future state transitions.
export function createInitialState(): AppState {
  return {
    currentLocale: getInitialLocale(),
    currentFileName: "",
    currentTheme: (localStorage.getItem("md2doc-theme") as ThemeMode) || "light",
    currentFont: "auto",
    currentTypography: loadTypographyConfig()
  };
}
