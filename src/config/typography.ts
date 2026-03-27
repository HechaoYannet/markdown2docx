import type { TypographyConfig } from "../types";

export const TYPOGRAPHY_STORAGE_KEY = "md2doc-typography";

export const DEFAULT_TYPOGRAPHY_CONFIG: TypographyConfig = {
  bodySize: 24,
  headings: {
    1: 32,
    2: 28,
    3: 24,
    4: 22,
    5: 20,
    6: 20
  }
};

function clampSize(value: number): number {
  const rounded = Math.round(value);
  if (!Number.isFinite(rounded)) {
    return DEFAULT_TYPOGRAPHY_CONFIG.bodySize;
  }
  return Math.min(96, Math.max(12, rounded));
}

export function normalizeTypographyConfig(value: unknown): TypographyConfig {
  const bodyRaw = (value as any)?.bodySize;
  const headingsRaw = (value as any)?.headings || {};

  return {
    bodySize: clampSize(Number(bodyRaw ?? DEFAULT_TYPOGRAPHY_CONFIG.bodySize)),
    headings: {
      1: clampSize(Number(headingsRaw[1] ?? DEFAULT_TYPOGRAPHY_CONFIG.headings[1])),
      2: clampSize(Number(headingsRaw[2] ?? DEFAULT_TYPOGRAPHY_CONFIG.headings[2])),
      3: clampSize(Number(headingsRaw[3] ?? DEFAULT_TYPOGRAPHY_CONFIG.headings[3])),
      4: clampSize(Number(headingsRaw[4] ?? DEFAULT_TYPOGRAPHY_CONFIG.headings[4])),
      5: clampSize(Number(headingsRaw[5] ?? DEFAULT_TYPOGRAPHY_CONFIG.headings[5])),
      6: clampSize(Number(headingsRaw[6] ?? DEFAULT_TYPOGRAPHY_CONFIG.headings[6]))
    }
  };
}

export function loadTypographyConfig(): TypographyConfig {
  try {
    const raw = localStorage.getItem(TYPOGRAPHY_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_TYPOGRAPHY_CONFIG, headings: { ...DEFAULT_TYPOGRAPHY_CONFIG.headings } };
    }

    const parsed = JSON.parse(raw);
    return normalizeTypographyConfig(parsed);
  } catch {
    return { ...DEFAULT_TYPOGRAPHY_CONFIG, headings: { ...DEFAULT_TYPOGRAPHY_CONFIG.headings } };
  }
}

export function saveTypographyConfig(config: TypographyConfig): void {
  const normalized = normalizeTypographyConfig(config);
  localStorage.setItem(TYPOGRAPHY_STORAGE_KEY, JSON.stringify(normalized));
}
