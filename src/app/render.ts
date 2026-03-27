import DOMPurify from "dompurify";
import { marked } from "marked";
import { normalizeTypographyConfig, saveTypographyConfig } from "../config/typography";
import { getText } from "../i18n";
import type { ThemeMode, TypographyConfig } from "../types";
import type { MarkdownPipeline } from "../markdown/preprocessors";
import type { AppDomRefs } from "./dom";
import type { AppState } from "./state";

export interface RenderContext {
  state: AppState;
  dom: AppDomRefs;
  markdownPipeline: MarkdownPipeline;
}

function text(state: AppState, key: string): string {
  return getText(state.currentLocale, key);
}

export function syncTypographyInputs(context: RenderContext): void {
  const { state, dom } = context;
  dom.bodySizeInput.value = String(state.currentTypography.bodySize);
  dom.h1SizeInput.value = String(state.currentTypography.headings[1]);
  dom.h2SizeInput.value = String(state.currentTypography.headings[2]);
  dom.h3SizeInput.value = String(state.currentTypography.headings[3]);
  dom.h4SizeInput.value = String(state.currentTypography.headings[4]);
  dom.h5SizeInput.value = String(state.currentTypography.headings[5]);
  dom.h6SizeInput.value = String(state.currentTypography.headings[6]);
}

export function persistTypographyConfig(context: RenderContext, next: TypographyConfig): void {
  context.state.currentTypography = normalizeTypographyConfig(next);
  saveTypographyConfig(context.state.currentTypography);
  syncTypographyInputs(context);
}

export function setStatus(
  context: RenderContext,
  message: string,
  kind: "info" | "success" | "error" = "info"
): void {
  context.dom.statusEl.textContent = message;
  context.dom.statusEl.dataset.kind = kind;
}

export function applyTheme(context: RenderContext, mode: ThemeMode): void {
  const { state, dom } = context;
  state.currentTheme = mode;
  document.documentElement.dataset.theme = mode;
  localStorage.setItem("md2doc-theme", mode);
  dom.themeBtn.setAttribute("aria-pressed", String(mode === "dark"));
  dom.themeBtn.textContent = mode === "dark"
    ? text(state, "switchToLight")
    : text(state, "switchToDark");
}

export function renderPreview(context: RenderContext, markdown: string): void {
  const { dom, markdownPipeline, state } = context;
  if (!markdown.trim()) {
    dom.previewEl.innerHTML = `<p class="preview-empty">${text(state, "previewEmpty")}</p>`;
    return;
  }

  const normalized = markdownPipeline.forPreview(markdown);
  const html = marked.parse(normalized, { breaks: true, gfm: true, async: false });
  dom.previewEl.innerHTML = DOMPurify.sanitize(html);
}

// UI copy update is intentionally centralized so locale switching only
// touches one place and avoids divergent label states.
export function refreshUI(context: RenderContext): void {
  const { state, dom } = context;

  document.querySelector<HTMLElement>("#title")!.textContent = text(state, "title");
  document.querySelector<HTMLElement>("#subtitle")!.textContent = text(state, "subtitle");
  document.querySelector<HTMLElement>("#languageLabel")!.textContent = text(state, "language");
  document.querySelector<HTMLElement>("#uploadLabel")!.textContent = text(state, "uploadLabel");
  document.querySelector<HTMLElement>("#uploadHint")!.textContent = text(state, "uploadHint");
  document.querySelector<HTMLElement>("#dropHint")!.textContent = text(state, "dropHint");
  document.querySelector<HTMLElement>("#pasteLabel")!.textContent = text(state, "pasteLabel");
  document.querySelector<HTMLElement>("#previewLabel")!.textContent = text(state, "previewLabel");
  document.querySelector<HTMLElement>("#fontLabel")!.textContent = text(state, "fontLabel");
  document.querySelector<HTMLElement>("#fontHint")!.textContent = text(state, "fontHint");
  dom.typographySummaryEl.textContent = text(state, "typographySummary");
  dom.typographyHintEl.textContent = text(state, "typographyHint");
  document.querySelector<HTMLElement>("#bodySizeLabel")!.textContent = text(state, "bodySizeLabel");
  document.querySelector<HTMLElement>("#heading1SizeLabel")!.textContent = text(state, "heading1SizeLabel");
  document.querySelector<HTMLElement>("#heading2SizeLabel")!.textContent = text(state, "heading2SizeLabel");
  document.querySelector<HTMLElement>("#heading3SizeLabel")!.textContent = text(state, "heading3SizeLabel");
  document.querySelector<HTMLElement>("#heading4SizeLabel")!.textContent = text(state, "heading4SizeLabel");
  document.querySelector<HTMLElement>("#heading5SizeLabel")!.textContent = text(state, "heading5SizeLabel");
  document.querySelector<HTMLElement>("#heading6SizeLabel")!.textContent = text(state, "heading6SizeLabel");
  dom.resetTypographyBtn.textContent = text(state, "resetTypography");
  dom.markdownInput.placeholder = text(state, "placeholder");
  dom.pasteClipboardBtn.textContent = text(state, "pasteClipboard");
  dom.clearBtn.textContent = text(state, "clear");
  dom.convertBtn.textContent = text(state, "convert");

  dom.fileNameEl.textContent = state.currentFileName || text(state, "noFileSelected");

  if (!dom.statusEl.textContent) {
    setStatus(context, text(state, "idleStatus"));
  }

  // Theme label and preview rendering both depend on locale-sensitive text,
  // so they are refreshed together after i18n copy updates.
  applyTheme(context, state.currentTheme);
  renderPreview(context, dom.markdownInput.value);
}
