import { marked } from "marked";
import markedKatex from "marked-katex-extension";
import { MarkdownPipeline } from "../markdown/preprocessors";
import { createAppTemplate } from "../ui/template";
import { queryDomRefs } from "./dom";
import { bindAppEvents } from "./events";
import { applyTheme, refreshUI, syncTypographyInputs, type RenderContext } from "./render";
import { createInitialState } from "./state";

// App bootstrap wires together template, state, rendering and event binding.
// This keeps entrypoint minimal and makes module boundaries explicit.
export function bootstrapApp(): void {
  marked.use(markedKatex({ throwOnError: false, nonStandard: true }));

  document.querySelector<HTMLDivElement>("#app")!.innerHTML = createAppTemplate();

  const context: RenderContext = {
    state: createInitialState(),
    dom: queryDomRefs(),
    markdownPipeline: new MarkdownPipeline()
  };

  context.dom.langSelect.value = context.state.currentLocale;
  context.dom.fontSelect.value = context.state.currentFont;

  applyTheme(context, context.state.currentTheme);
  syncTypographyInputs(context);
  bindAppEvents(context);
  refreshUI(context);
}
