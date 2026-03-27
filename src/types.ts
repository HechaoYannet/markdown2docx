import type { Options } from "@mohtasham/md-to-docx";

export type Locale = "zh" | "en";
export type ThemeMode = "light" | "dark";
export type FontChoice = "auto" | "Microsoft YaHei" | "SimSun" | "Times New Roman" | "Arial";

export interface TypographyConfig {
  bodySize: number;
  headings: Record<1 | 2 | 3 | 4 | 5 | 6, number>;
}

export interface ConversionContext {
  markdown: string;
  filename: string;
  options?: Options;
  fontChoice: FontChoice;
  typographyConfig: TypographyConfig;
}
