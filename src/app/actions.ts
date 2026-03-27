import { DEFAULT_TYPOGRAPHY_CONFIG } from "../config/typography";
import { createConverter } from "../conversion/converters";
import { getText } from "../i18n";
import type { TypographyConfig } from "../types";
import { safeDocxName } from "./helpers/fileName";
import type { RenderContext } from "./render";
import { persistTypographyConfig, renderPreview, setStatus } from "./render";

function text(context: RenderContext, key: string): string {
  return getText(context.state.currentLocale, key);
}

export async function readFileToEditor(context: RenderContext, file: File): Promise<void> {
  // Read as UTF-8 text through browser File API. This keeps behavior
  // aligned with previous implementation and supports drag/drop + picker.
  const content = await file.text();
  context.state.currentFileName = file.name;
  context.dom.markdownInput.value = content;
  context.dom.fileNameEl.textContent = file.name;
  renderPreview(context, content);
  setStatus(context, `${text(context, "loadedFile")}: ${file.name}`, "success");
}

export function clearEditor(context: RenderContext): void {
  context.dom.markdownInput.value = "";
  context.state.currentFileName = "";
  context.dom.fileInput.value = "";
  context.dom.fileNameEl.textContent = text(context, "noFileSelected");
  renderPreview(context, "");
  setStatus(context, text(context, "idleStatus"));
}

export async function pasteFromClipboard(context: RenderContext): Promise<void> {
  if (!navigator.clipboard?.readText) {
    setStatus(context, text(context, "clipUnsupported"), "error");
    return;
  }

  const clipboardText = await navigator.clipboard.readText();
  if (!clipboardText.trim()) {
    setStatus(context, text(context, "clipEmpty"), "error");
    return;
  }

  // Keep pasted text in the same editing path as uploaded files so preview
  // and status updates stay fully consistent.
  context.dom.markdownInput.value = clipboardText;
  renderPreview(context, clipboardText);
  setStatus(context, text(context, "clipboardPasted"), "success");
}

export function resetTypography(context: RenderContext): void {
  context.state.currentTypography = {
    bodySize: DEFAULT_TYPOGRAPHY_CONFIG.bodySize,
    headings: { ...DEFAULT_TYPOGRAPHY_CONFIG.headings }
  };
  persistTypographyConfig(context, context.state.currentTypography);
  setStatus(context, text(context, "typographyResetDone"), "success");
}

// Keep conversion orchestration in one place so error handling, button state,
// markdown preprocessing order, and file naming stay consistent.
export async function convertMarkdown(context: RenderContext): Promise<void> {
  const markdown = context.dom.markdownInput.value.trim();
  if (!markdown) {
    setStatus(context, text(context, "empty"), "error");
    return;
  }

  const convertBtn = context.dom.convertBtn;
  convertBtn.disabled = true;
  convertBtn.textContent = text(context, "converting");

  try {
    // Pipeline order must not change: markdown normalization -> docx conversion.
    const normalized = context.markdownPipeline.forDocx(markdown);
    const filename = safeDocxName(context.state.currentFileName, context.dom.markdownInput.value);
    const converter = createConverter(context.state.currentFont);

    await converter.convert({
      markdown: normalized,
      filename,
      fontChoice: context.state.currentFont,
      typographyConfig: context.state.currentTypography,
      options: { style: { direction: "LTR" } }
    });

    setStatus(context, `${text(context, "converted")}: ${filename}`, "success");
  } catch (error) {
    // Conversion errors are surfaced as user-facing status while preserving
    // console diagnostics for debugging malformed markdown/math fragments.
    console.error(error);
    setStatus(context, text(context, "failed"), "error");
  } finally {
    convertBtn.disabled = false;
    convertBtn.textContent = text(context, "convert");
  }
}

export function applyTypographyInput(
  context: RenderContext,
  value: number,
  updater: (current: TypographyConfig, nextValue: number) => TypographyConfig
): void {
  context.state.currentTypography = updater(context.state.currentTypography, value);
  persistTypographyConfig(context, context.state.currentTypography);
}
