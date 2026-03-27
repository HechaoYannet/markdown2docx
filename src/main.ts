import "katex/dist/katex.min.css";
import { marked } from "marked";
import markedKatex from "marked-katex-extension";
import DOMPurify from "dompurify";
import {
  DEFAULT_TYPOGRAPHY_CONFIG,
  loadTypographyConfig,
  normalizeTypographyConfig,
  saveTypographyConfig
} from "./config/typography";
import { createConverter } from "./conversion/converters";
import { getInitialLocale, getText } from "./i18n";
import { MarkdownPipeline } from "./markdown/preprocessors";
import type { FontChoice, Locale, ThemeMode, TypographyConfig } from "./types";
import { createAppTemplate } from "./ui/template";
import "./styles.css";

marked.use(markedKatex({ throwOnError: false, nonStandard: true }));
const markdownPipeline = new MarkdownPipeline();
const initialLocale: Locale = getInitialLocale();
let currentLocale: Locale = initialLocale;
let currentFileName = "";
let currentTheme: ThemeMode = (localStorage.getItem("md2doc-theme") as ThemeMode) || "light";
let currentFont: FontChoice = "auto";
let currentTypography: TypographyConfig = loadTypographyConfig();

document.querySelector<HTMLDivElement>("#app")!.innerHTML = createAppTemplate();

const langSelect = document.querySelector<HTMLSelectElement>("#langSelect")!;
const themeBtn = document.querySelector<HTMLButtonElement>("#themeBtn")!;
const fileInput = document.querySelector<HTMLInputElement>("#fileInput")!;
const dropZone = document.querySelector<HTMLLabelElement>("#dropZone")!;
const fontSelect = document.querySelector<HTMLSelectElement>("#fontSelect")!;
const markdownInput = document.querySelector<HTMLTextAreaElement>("#markdownInput")!;
const previewEl = document.querySelector<HTMLDivElement>("#preview")!;
const fileNameEl = document.querySelector<HTMLSpanElement>("#fileName")!;
const statusEl = document.querySelector<HTMLParagraphElement>("#status")!;
const convertBtn = document.querySelector<HTMLButtonElement>("#convertBtn")!;
const clearBtn = document.querySelector<HTMLButtonElement>("#clearBtn")!;
const pasteClipboardBtn = document.querySelector<HTMLButtonElement>("#pasteClipboardBtn")!;
const typographySummaryEl = document.querySelector<HTMLElement>("#typographySummary")!;
const typographyHintEl = document.querySelector<HTMLElement>("#typographyHint")!;
const bodySizeInput = document.querySelector<HTMLInputElement>("#bodySizeInput")!;
const h1SizeInput = document.querySelector<HTMLInputElement>("#h1SizeInput")!;
const h2SizeInput = document.querySelector<HTMLInputElement>("#h2SizeInput")!;
const h3SizeInput = document.querySelector<HTMLInputElement>("#h3SizeInput")!;
const h4SizeInput = document.querySelector<HTMLInputElement>("#h4SizeInput")!;
const h5SizeInput = document.querySelector<HTMLInputElement>("#h5SizeInput")!;
const h6SizeInput = document.querySelector<HTMLInputElement>("#h6SizeInput")!;
const resetTypographyBtn = document.querySelector<HTMLButtonElement>("#resetTypographyBtn")!;

function text(key: string): string {
  return getText(currentLocale, key);
}

function syncTypographyInputs() {
  bodySizeInput.value = String(currentTypography.bodySize);
  h1SizeInput.value = String(currentTypography.headings[1]);
  h2SizeInput.value = String(currentTypography.headings[2]);
  h3SizeInput.value = String(currentTypography.headings[3]);
  h4SizeInput.value = String(currentTypography.headings[4]);
  h5SizeInput.value = String(currentTypography.headings[5]);
  h6SizeInput.value = String(currentTypography.headings[6]);
}

function persistTypographyConfig(next: TypographyConfig) {
  currentTypography = normalizeTypographyConfig(next);
  saveTypographyConfig(currentTypography);
  syncTypographyInputs();
}

function setStatus(message: string, kind: "info" | "success" | "error" = "info") {
  statusEl.textContent = message;
  statusEl.dataset.kind = kind;
}

function applyTheme(mode: ThemeMode) {
  currentTheme = mode;
  document.documentElement.dataset.theme = mode;
  localStorage.setItem("md2doc-theme", mode);
  themeBtn.setAttribute("aria-pressed", String(mode === "dark"));
  themeBtn.textContent = mode === "dark"
    ? text("switchToLight")
    : text("switchToDark");
}

function renderPreview(markdown: string) {
  if (!markdown.trim()) {
    previewEl.innerHTML = `<p class="preview-empty">${text("previewEmpty")}</p>`;
    return;
  }

  const normalized = markdownPipeline.forPreview(markdown);
  const html = marked.parse(normalized, { breaks: true, gfm: true, async: false });
  previewEl.innerHTML = DOMPurify.sanitize(html);
}

async function readFileToEditor(file: File) {
  const content = await file.text();
  currentFileName = file.name;
  markdownInput.value = content;
  fileNameEl.textContent = file.name;
  renderPreview(content);
  setStatus(`${text("loadedFile")}: ${file.name}`, "success");
}

function refreshUI() {
  document.querySelector<HTMLElement>("#title")!.textContent = text("title");
  document.querySelector<HTMLElement>("#subtitle")!.textContent = text("subtitle");
  document.querySelector<HTMLElement>("#languageLabel")!.textContent = text("language");
  document.querySelector<HTMLElement>("#uploadLabel")!.textContent = text("uploadLabel");
  document.querySelector<HTMLElement>("#uploadHint")!.textContent = text("uploadHint");
  document.querySelector<HTMLElement>("#dropHint")!.textContent = text("dropHint");
  document.querySelector<HTMLElement>("#pasteLabel")!.textContent = text("pasteLabel");
  document.querySelector<HTMLElement>("#previewLabel")!.textContent = text("previewLabel");
  document.querySelector<HTMLElement>("#fontLabel")!.textContent = text("fontLabel");
  document.querySelector<HTMLElement>("#fontHint")!.textContent = text("fontHint");
  typographySummaryEl.textContent = text("typographySummary");
  typographyHintEl.textContent = text("typographyHint");
  document.querySelector<HTMLElement>("#bodySizeLabel")!.textContent = text("bodySizeLabel");
  document.querySelector<HTMLElement>("#heading1SizeLabel")!.textContent = text("heading1SizeLabel");
  document.querySelector<HTMLElement>("#heading2SizeLabel")!.textContent = text("heading2SizeLabel");
  document.querySelector<HTMLElement>("#heading3SizeLabel")!.textContent = text("heading3SizeLabel");
  document.querySelector<HTMLElement>("#heading4SizeLabel")!.textContent = text("heading4SizeLabel");
  document.querySelector<HTMLElement>("#heading5SizeLabel")!.textContent = text("heading5SizeLabel");
  document.querySelector<HTMLElement>("#heading6SizeLabel")!.textContent = text("heading6SizeLabel");
  resetTypographyBtn.textContent = text("resetTypography");
  markdownInput.placeholder = text("placeholder");
  pasteClipboardBtn.textContent = text("pasteClipboard");
  clearBtn.textContent = text("clear");
  convertBtn.textContent = text("convert");
  if (currentFileName) {
    fileNameEl.textContent = currentFileName;
  } else {
    fileNameEl.textContent = text("noFileSelected");
  }

  if (!statusEl.textContent) {
    setStatus(text("idleStatus"));
  }

  applyTheme(currentTheme);
  renderPreview(markdownInput.value);
}

function safeDocxName(): string {
  const base = currentFileName || "markdown";
  return `${base.replace(/\.[^.]+$/, "") || "markdown"}.docx`;
}

langSelect.value = currentLocale;
fontSelect.value = currentFont;
applyTheme(currentTheme);
syncTypographyInputs();

langSelect.addEventListener("change", () => {
  currentLocale = langSelect.value === "zh" ? "zh" : "en";
  refreshUI();
});

themeBtn.addEventListener("click", () => {
  applyTheme(currentTheme === "dark" ? "light" : "dark");
});

fontSelect.addEventListener("change", () => {
  currentFont = fontSelect.value as FontChoice;
});

function bindSizeInput(input: HTMLInputElement, apply: (value: number) => void) {
  const onCommit = () => {
    const value = Number(input.value);
    if (!Number.isFinite(value)) {
      syncTypographyInputs();
      return;
    }

    apply(value);
    persistTypographyConfig(currentTypography);
  };

  input.addEventListener("change", onCommit);
  input.addEventListener("blur", onCommit);
}

bindSizeInput(bodySizeInput, (value) => {
  currentTypography = {
    ...currentTypography,
    bodySize: value,
    headings: { ...currentTypography.headings }
  };
});

bindSizeInput(h1SizeInput, (value) => {
  currentTypography = {
    ...currentTypography,
    headings: { ...currentTypography.headings, 1: value }
  };
});
bindSizeInput(h2SizeInput, (value) => {
  currentTypography = {
    ...currentTypography,
    headings: { ...currentTypography.headings, 2: value }
  };
});
bindSizeInput(h3SizeInput, (value) => {
  currentTypography = {
    ...currentTypography,
    headings: { ...currentTypography.headings, 3: value }
  };
});
bindSizeInput(h4SizeInput, (value) => {
  currentTypography = {
    ...currentTypography,
    headings: { ...currentTypography.headings, 4: value }
  };
});
bindSizeInput(h5SizeInput, (value) => {
  currentTypography = {
    ...currentTypography,
    headings: { ...currentTypography.headings, 5: value }
  };
});
bindSizeInput(h6SizeInput, (value) => {
  currentTypography = {
    ...currentTypography,
    headings: { ...currentTypography.headings, 6: value }
  };
});

resetTypographyBtn.addEventListener("click", () => {
  currentTypography = {
    bodySize: DEFAULT_TYPOGRAPHY_CONFIG.bodySize,
    headings: { ...DEFAULT_TYPOGRAPHY_CONFIG.headings }
  };
  persistTypographyConfig(currentTypography);
  setStatus(text("typographyResetDone"), "success");
});

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (!file) {
    return;
  }
  await readFileToEditor(file);
});

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("drag-over");
});

dropZone.addEventListener("drop", async (event) => {
  event.preventDefault();
  dropZone.classList.remove("drag-over");
  const file = event.dataTransfer?.files?.[0];
  if (!file) {
    return;
  }
  if (!/\.(md|markdown|txt)$/i.test(file.name)) {
    setStatus(text("invalidFile"), "error");
    return;
  }
  await readFileToEditor(file);
});

markdownInput.addEventListener("input", () => {
  renderPreview(markdownInput.value);
});

pasteClipboardBtn.addEventListener("click", async () => {
  if (!navigator.clipboard?.readText) {
    setStatus(text("clipUnsupported"), "error");
    return;
  }

  const clipboardText = await navigator.clipboard.readText();
  if (!clipboardText.trim()) {
    setStatus(text("clipEmpty"), "error");
    return;
  }

  markdownInput.value = clipboardText;
  renderPreview(clipboardText);
  setStatus(text("clipboardPasted"), "success");
});

clearBtn.addEventListener("click", () => {
  markdownInput.value = "";
  currentFileName = "";
  fileInput.value = "";
  fileNameEl.textContent = text("noFileSelected");
  renderPreview("");
  setStatus(text("idleStatus"));
});

convertBtn.addEventListener("click", async () => {
  const markdown = markdownInput.value.trim();
  if (!markdown) {
    setStatus(text("empty"), "error");
    return;
  }

  convertBtn.disabled = true;
  convertBtn.textContent = text("converting");

  try {
    const normalized = markdownPipeline.forDocx(markdown);
    const converter = createConverter(currentFont);
    await converter.convert({
      markdown: normalized,
      filename: safeDocxName(),
      fontChoice: currentFont,
      typographyConfig: currentTypography,
      options: { style: { direction: "LTR" } }
    });
    setStatus(`${text("converted")}: ${safeDocxName()}`, "success");
  } catch (error) {
    console.error(error);
    setStatus(text("failed"), "error");
  } finally {
    convertBtn.disabled = false;
    convertBtn.textContent = text("convert");
  }
});

refreshUI();
