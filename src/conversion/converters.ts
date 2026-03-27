import {
  downloadDocx,
  parseToDocxOptions
} from "@mohtasham/md-to-docx";
import { Document, ImportedXmlComponent, Math, MathRun, Packer, TextRun } from "docx";
import { DEFAULT_TYPOGRAPHY_CONFIG, normalizeTypographyConfig } from "../config/typography";
import { splitByOmmlTokens, texToOmml } from "./nativeMath";
import type { ConversionContext, FontChoice, TypographyConfig } from "../types";

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

  protected normalizeTypography(docOptions: any, fontChoice: FontChoice, typographyConfig: TypographyConfig): void {
    const normalizedConfig = normalizeTypographyConfig(typographyConfig);
    const bodySize = normalizedConfig.bodySize;
    const headingSize = normalizedConfig.headings;

    const styles = (docOptions.styles = docOptions.styles || {});
    const defaultStyles = (styles.default = styles.default || {});
    const defaultDocument = (defaultStyles.document = defaultStyles.document || {});
    const defaultRun = (defaultDocument.run = defaultDocument.run || {});

    defaultRun.size = bodySize;
    if (fontChoice !== "auto") {
      defaultRun.font = fontChoice;
    }

    const paragraphStyles = Array.isArray(styles.paragraphStyles) ? styles.paragraphStyles : [];
    styles.paragraphStyles = paragraphStyles.map((style: any) => {
      if (!style || typeof style !== "object") {
        return style;
      }

      const id = String(style.id || "");
      const level = this.headingLevelFromStyleId(id);
      if (!level) {
        if (fontChoice === "auto") {
          return style;
        }
        return {
          ...style,
          run: {
            ...(style.run || {}),
            font: fontChoice
          }
        };
      }

      return {
        ...style,
        run: {
          ...(style.run || {}),
          size: headingSize[level as 1 | 2 | 3 | 4 | 5 | 6],
          ...(fontChoice === "auto" ? {} : { font: fontChoice })
        }
      };
    });

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

        const targetSize = this.resolveParagraphFontSize(paragraph, normalizedConfig);
        this.normalizeParagraphRunSizes(paragraph, targetSize);
      }
    }
  }

  protected headingLevelFromStyleId(styleId: string): number | null {
    const normalized = styleId.trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    if (normalized === "title") {
      return 1;
    }

    const match = normalized.match(/heading\s*([1-6])|heading([1-6])|^([1-6])$/);
    if (!match) {
      return null;
    }

    const value = Number(match[1] || match[2] || match[3]);
    if (!Number.isInteger(value) || value < 1 || value > 6) {
      return null;
    }

    return value;
  }

  protected resolveParagraphFontSize(paragraph: any, typographyConfig: TypographyConfig): number {
    const root = Array.isArray(paragraph?.root) ? paragraph.root : [];
    const pPr = root.find((node: any) => node?.rootKey === "w:pPr");
    const pPrRoot = Array.isArray(pPr?.root) ? pPr.root : [];
    const pStyle = pPrRoot.find((node: any) => node?.rootKey === "w:pStyle");
    const pStyleRoot = Array.isArray(pStyle?.root) ? pStyle.root : [];
    const pStyleAttr = pStyleRoot.find((node: any) => node?.rootKey === "_attr");
    const styleVal = pStyleAttr?.root?.val;
    const headings = typographyConfig.headings;

    const numericLevel = Number(styleVal);
    if (Number.isInteger(numericLevel) && headings[numericLevel as 1 | 2 | 3 | 4 | 5 | 6]) {
      return headings[numericLevel as 1 | 2 | 3 | 4 | 5 | 6];
    }

    const styleLevel = this.headingLevelFromStyleId(String(styleVal || ""));
    if (styleLevel && headings[styleLevel as 1 | 2 | 3 | 4 | 5 | 6]) {
      return headings[styleLevel as 1 | 2 | 3 | 4 | 5 | 6];
    }

    return typographyConfig.bodySize;
  }

  protected ensureRunSizeNode(runProperties: any[], key: "w:sz" | "w:szCs", size: number): void {
    const existing = runProperties.find((node) => node?.rootKey === key);
    if (existing) {
      const attr = Array.isArray(existing.root)
        ? existing.root.find((node: any) => node?.rootKey === "_attr")
        : null;

      if (attr && typeof attr === "object") {
        attr.root = { ...(attr.root || {}), val: size };
      } else {
        existing.root = [{ rootKey: "_attr", root: { val: size } }];
      }
      return;
    }

    runProperties.push({
      rootKey: key,
      root: [{ rootKey: "_attr", root: { val: size } }]
    });
  }

  protected normalizeParagraphRunSizes(paragraph: any, size: number): void {
    const root = Array.isArray(paragraph?.root) ? paragraph.root : [];

    for (const child of root) {
      if (!child || child.rootKey !== "w:r" || !Array.isArray(child.root)) {
        continue;
      }

      let rPr = child.root.find((node: any) => node?.rootKey === "w:rPr");
      if (!rPr) {
        rPr = { rootKey: "w:rPr", root: [] };
        child.root.unshift(rPr);
      }

      if (!Array.isArray(rPr.root)) {
        rPr.root = [];
      }

      this.ensureRunSizeNode(rPr.root, "w:sz", size);
      this.ensureRunSizeNode(rPr.root, "w:szCs", size);
    }
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

              // Keep display math as a single expression. Splitting by "\\" or
              // line breaks corrupts matrix/aligned environments inside \[...\]/$$...$$.
              const formulas = [normalized];

              for (const formula of formulas) {
                const ommlXml = texToOmml(formula, Boolean(segment.display));

                if (!this.isWellFormedXml(ommlXml)) {
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

  protected async buildBlob(context: ConversionContext): Promise<Blob> {
    const parsed = await parseToDocxOptions(context.markdown, context.options);
    const docOptions = parsed as any;
    this.normalizeTypography(docOptions, context.fontChoice, context.typographyConfig || DEFAULT_TYPOGRAPHY_CONFIG);
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
    await super.convert(context);
  }
}

export function createConverter(font: FontChoice): MarkdownConverter {
  return font === "auto" ? new DefaultMarkdownConverter() : new FontAwareMarkdownConverter();
}
