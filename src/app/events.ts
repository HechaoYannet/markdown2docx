import { getText } from "../i18n";
import type { FontChoice } from "../types";
import type { RenderContext } from "./render";
import { applyTheme, refreshUI, renderPreview, setStatus, syncTypographyInputs } from "./render";
import {
  applyTypographyInput,
  clearEditor,
  convertMarkdown,
  pasteFromClipboard,
  readFileToEditor,
  resetTypography
} from "./actions";

function bindSizeInput(
  context: RenderContext,
  input: HTMLInputElement,
  apply: (value: number) => void
): void {
  // Commit on both change and blur to cover keyboard edits and pointer-driven
  // interactions consistently across browsers.
  const onCommit = () => {
    const value = Number(input.value);
    if (!Number.isFinite(value)) {
      syncTypographyInputs(context);
      return;
    }

    apply(value);
  };

  input.addEventListener("change", onCommit);
  input.addEventListener("blur", onCommit);
}

// Register all UI listeners in a single module to keep event flow explicit
// and prevent accidental duplicate bindings during future feature expansion.
export function bindAppEvents(context: RenderContext): void {
  const { state, dom } = context;

  dom.langSelect.addEventListener("change", () => {
    state.currentLocale = dom.langSelect.value === "zh" ? "zh" : "en";
    refreshUI(context);
  });

  dom.themeBtn.addEventListener("click", () => {
    applyTheme(context, state.currentTheme === "dark" ? "light" : "dark");
  });

  dom.fontSelect.addEventListener("change", () => {
    state.currentFont = dom.fontSelect.value as FontChoice;
  });

  bindSizeInput(context, dom.bodySizeInput, (value) => {
    applyTypographyInput(context, value, (current, nextValue) => ({
      ...current,
      bodySize: nextValue,
      headings: { ...current.headings }
    }));
  });

  bindSizeInput(context, dom.h1SizeInput, (value) => {
    applyTypographyInput(context, value, (current, nextValue) => ({
      ...current,
      headings: { ...current.headings, 1: nextValue }
    }));
  });

  bindSizeInput(context, dom.h2SizeInput, (value) => {
    applyTypographyInput(context, value, (current, nextValue) => ({
      ...current,
      headings: { ...current.headings, 2: nextValue }
    }));
  });

  bindSizeInput(context, dom.h3SizeInput, (value) => {
    applyTypographyInput(context, value, (current, nextValue) => ({
      ...current,
      headings: { ...current.headings, 3: nextValue }
    }));
  });

  bindSizeInput(context, dom.h4SizeInput, (value) => {
    applyTypographyInput(context, value, (current, nextValue) => ({
      ...current,
      headings: { ...current.headings, 4: nextValue }
    }));
  });

  bindSizeInput(context, dom.h5SizeInput, (value) => {
    applyTypographyInput(context, value, (current, nextValue) => ({
      ...current,
      headings: { ...current.headings, 5: nextValue }
    }));
  });

  bindSizeInput(context, dom.h6SizeInput, (value) => {
    applyTypographyInput(context, value, (current, nextValue) => ({
      ...current,
      headings: { ...current.headings, 6: nextValue }
    }));
  });

  dom.resetTypographyBtn.addEventListener("click", () => {
    resetTypography(context);
  });

  dom.fileInput.addEventListener("change", async () => {
    const file = dom.fileInput.files?.[0];
    if (!file) {
      return;
    }

    await readFileToEditor(context, file);
  });

  dom.dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dom.dropZone.classList.add("drag-over");
  });

  dom.dropZone.addEventListener("dragleave", () => {
    dom.dropZone.classList.remove("drag-over");
  });

  dom.dropZone.addEventListener("drop", async (event) => {
    event.preventDefault();
    dom.dropZone.classList.remove("drag-over");

    const file = event.dataTransfer?.files?.[0];
    if (!file) {
      return;
    }

    if (!/\.(md|markdown|txt)$/i.test(file.name)) {
      setStatus(context, getText(context.state.currentLocale, "invalidFile"), "error");
      return;
    }

    await readFileToEditor(context, file);
  });

  dom.markdownInput.addEventListener("input", () => {
    renderPreview(context, dom.markdownInput.value);
  });

  dom.pasteClipboardBtn.addEventListener("click", async () => {
    await pasteFromClipboard(context);
  });

  dom.clearBtn.addEventListener("click", () => {
    clearEditor(context);
  });

  dom.convertBtn.addEventListener("click", async () => {
    // Disable/enable button state is handled inside convertMarkdown to ensure
    // all call paths (including future hotkeys) share the same safeguards.
    await convertMarkdown(context);
  });
}
