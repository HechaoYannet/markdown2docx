import type { Options } from "@mohtasham/md-to-docx";

export type Locale = "zh" | "en";
export type ThemeMode = "light" | "dark";
export type FontChoice = "auto" | "Microsoft YaHei" | "SimSun" | "Times New Roman" | "Arial";

export interface ConversionContext {
  markdown: string;
  filename: string;
  options?: Options;
  fontChoice: FontChoice;
}
