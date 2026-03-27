export interface AppDomRefs {
  langSelect: HTMLSelectElement;
  themeBtn: HTMLButtonElement;
  fileInput: HTMLInputElement;
  dropZone: HTMLLabelElement;
  fontSelect: HTMLSelectElement;
  markdownInput: HTMLTextAreaElement;
  previewEl: HTMLDivElement;
  fileNameEl: HTMLSpanElement;
  statusEl: HTMLParagraphElement;
  convertBtn: HTMLButtonElement;
  clearBtn: HTMLButtonElement;
  pasteClipboardBtn: HTMLButtonElement;
  typographySummaryEl: HTMLElement;
  typographyHintEl: HTMLElement;
  bodySizeInput: HTMLInputElement;
  h1SizeInput: HTMLInputElement;
  h2SizeInput: HTMLInputElement;
  h3SizeInput: HTMLInputElement;
  h4SizeInput: HTMLInputElement;
  h5SizeInput: HTMLInputElement;
  h6SizeInput: HTMLInputElement;
  resetTypographyBtn: HTMLButtonElement;
}

// Query all long-lived DOM references once to avoid scattered selectors
// across modules and to fail fast if the template contract changes.
export function queryDomRefs(): AppDomRefs {
  return {
    langSelect: document.querySelector<HTMLSelectElement>("#langSelect")!,
    themeBtn: document.querySelector<HTMLButtonElement>("#themeBtn")!,
    fileInput: document.querySelector<HTMLInputElement>("#fileInput")!,
    dropZone: document.querySelector<HTMLLabelElement>("#dropZone")!,
    fontSelect: document.querySelector<HTMLSelectElement>("#fontSelect")!,
    markdownInput: document.querySelector<HTMLTextAreaElement>("#markdownInput")!,
    previewEl: document.querySelector<HTMLDivElement>("#preview")!,
    fileNameEl: document.querySelector<HTMLSpanElement>("#fileName")!,
    statusEl: document.querySelector<HTMLParagraphElement>("#status")!,
    convertBtn: document.querySelector<HTMLButtonElement>("#convertBtn")!,
    clearBtn: document.querySelector<HTMLButtonElement>("#clearBtn")!,
    pasteClipboardBtn: document.querySelector<HTMLButtonElement>("#pasteClipboardBtn")!,
    typographySummaryEl: document.querySelector<HTMLElement>("#typographySummary")!,
    typographyHintEl: document.querySelector<HTMLElement>("#typographyHint")!,
    bodySizeInput: document.querySelector<HTMLInputElement>("#bodySizeInput")!,
    h1SizeInput: document.querySelector<HTMLInputElement>("#h1SizeInput")!,
    h2SizeInput: document.querySelector<HTMLInputElement>("#h2SizeInput")!,
    h3SizeInput: document.querySelector<HTMLInputElement>("#h3SizeInput")!,
    h4SizeInput: document.querySelector<HTMLInputElement>("#h4SizeInput")!,
    h5SizeInput: document.querySelector<HTMLInputElement>("#h5SizeInput")!,
    h6SizeInput: document.querySelector<HTMLInputElement>("#h6SizeInput")!,
    resetTypographyBtn: document.querySelector<HTMLButtonElement>("#resetTypographyBtn")!
  };
}
