import {
  downloadDocx,
  parseToDocxOptions
} from "@mohtasham/md-to-docx";
import { Document, ImportedXmlComponent, Math, MathRun, Packer, TextRun } from "docx";
import { splitByOmmlTokens, texToOmml } from "./nativeMath";
import type { ConversionContext, FontChoice } from "../types";

abstract class MarkdownConverter {
  abstract convert(context: ConversionContext): Promise<void>;

  protected sanitizeName(raw: string): string {
    const base = raw.replace(/\.[^.]+$/, "").trim();
    const safe = base.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]+/g, "-").replace(/-+/g, "-");
    return `${safe || "markdown"}.docx`;
  }

  protected getRunText(run: any): string | null {
    const textNode = run?.root?.find((node: any) => node?.rootKey === "w:t");
    if (!textNode || !Array.isArray(textNode.root) || textNode.root.length === 0) {
      return null;
    }

    const value = textNode.root[textNode.root.length - 1];
    return typeof value === "string" ? value : null;
  }

  protected injectNativeMath(docOptions: any): void {
    const sections = docOptions?.sections;
    if (!Array.isArray(sections)) {
      return;
    }

    for (const section of sections) {
      const children = section?.children;
      if (!Array.isArray(children)) {
        continue;
      }

      for (const paragraph of children) {
        if (!paragraph || paragraph.rootKey !== "w:p" || !Array.isArray(paragraph.root)) {
          continue;
        }

        const rewritten: any[] = [];
        for (const child of paragraph.root) {
          if (!child || child.rootKey !== "w:r") {
            rewritten.push(child);
            continue;
          }

          const runText = this.getRunText(child);
          if (!runText || !runText.includes("{{OMML_")) {
            rewritten.push(child);
            continue;
          }

          const segments = splitByOmmlTokens(runText);
          if (!segments.length) {
            rewritten.push(child);
            continue;
          }

          for (const segment of segments) {
            if (segment.type === "text") {
              if (segment.value) {
                rewritten.push(new TextRun(segment.value));
              }
              continue;
            }

            try {
              const normalized = segment.value.replace(/\r\n/g, "\n").trim();
              if (!normalized) continue;

              const formulas = segment.display
                ? normalized.replace(/\\\\/g, "\n").split("\n").map((line) => line.trim()).filter(Boolean)
                : [normalized];

              for (const formula of formulas) {
                const ommlXml = texToOmml(formula, Boolean(segment.display));

                if (!this.isWellFormedXml(ommlXml) || !this.isWordCompatibleOmml(ommlXml)) {
                  rewritten.push(new Math({ children: [new MathRun(formula)] }));
                  continue;
                }

                const imported = ImportedXmlComponent.fromXmlString(ommlXml) as any;
                const importedChildren = Array.isArray(imported?.root)
                  ? imported.root.filter((node: any) => node && typeof node.rootKey === "string")
                  : [];

                if (typeof imported?.rootKey === "string" && imported.rootKey) {
                  rewritten.push(imported);
                } else if (importedChildren.length) {
                  rewritten.push(...importedChildren);
                } else {
                  rewritten.push(new Math({ children: [new MathRun(formula)] }));
                }
              }
            } catch {
              // Fallback to plain text if conversion fails for a malformed expression.
              rewritten.push(new Math({ children: [new MathRun(segment.value)] }));
            }
          }
        }

        paragraph.root = rewritten;
      }
    }
  }

  protected isWellFormedXml(xml: string): boolean {
    try {
      if (typeof DOMParser === "undefined") {
        // Browser runtime should provide DOMParser. In non-browser contexts,
        // keep permissive behavior and rely on runtime conversion guards.
        return true;
      }

      const doc = new DOMParser().parseFromString(xml, "application/xml");
      return !doc.querySelector("parsererror");
    } catch {
      return false;
    }
  }

  protected isWordCompatibleOmml(xml: string): boolean {
    if (!xml || typeof xml !== "string") {
      return false;
    }

    // Prevent known malformed wrappers from being injected.
    if (/<undefined\b/i.test(xml)) {
      return false;
    }

    // These OMML containers should not hold bare text directly.
    if (/<m:(?:e|sub|sup|num|den)>\s*[^<\s][\s\S]*?<\/m:(?:e|sub|sup|num|den)>/i.test(xml)) {
      return false;
    }

    return true;
  }

  protected async buildBlob(context: ConversionContext): Promise<Blob> {
    const parsed = await parseToDocxOptions(context.markdown, context.options);
    const docOptions = parsed as any;
    this.injectNativeMath(docOptions);
    const doc = new Document(docOptions);
    return Packer.toBlob(doc);
  }
}

class DefaultMarkdownConverter extends MarkdownConverter {
  async convert(context: ConversionContext): Promise<void> {
    const blob = await this.buildBlob(context);
    downloadDocx(blob, this.sanitizeName(context.filename));
  }
}

class FontAwareMarkdownConverter extends DefaultMarkdownConverter {
  async convert(context: ConversionContext): Promise<void> {
    if (context.fontChoice === "auto") {
      await super.convert(context);
      return;
    }

    try {
      const parsed = await parseToDocxOptions(context.markdown, context.options);
      const docOptions = parsed as any;
      docOptions.styles = {
        ...(docOptions.styles || {}),
        default: {
          ...(docOptions.styles?.default || {}),
          document: {
            ...(docOptions.styles?.default?.document || {}),
            run: {
              ...(docOptions.styles?.default?.document?.run || {}),
              font: context.fontChoice
            }
          }
        }
      };
      this.injectNativeMath(docOptions);
      const doc = new Document(docOptions);
      const blob = await Packer.toBlob(doc);
      downloadDocx(blob, this.sanitizeName(context.filename));
    } catch {
      await super.convert(context);
    }
  }
}

export function createConverter(font: FontChoice): MarkdownConverter {
  return font === "auto" ? new DefaultMarkdownConverter() : new FontAwareMarkdownConverter();
}
