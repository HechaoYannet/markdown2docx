import { replaceLatexWithOmmlTokens } from "../conversion/nativeMath";

abstract class MarkdownPreprocessor {
  abstract process(markdown: string): string;
}

function compactInlineLatex(expr: string): string {
  return expr
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

class BaseSyntaxPreprocessor extends MarkdownPreprocessor {
  process(markdown: string): string {
    return markdown
      .replace(/\uFF03/g, "#")
      .replace(/\uFF0A/g, "*")
      .replace(/^(#{1,6})([^\s#])/gm, "$1 $2")
      .replace(/\*\*\s+([^*\n][\s\S]*?[^*\n])\s+\*\*/g, "**$1**");
  }
}

class LatexNormalizer extends MarkdownPreprocessor {
  process(markdown: string): string {
    const bracketNormalized = markdown
      .replace(/\\\[([\s\S]*?)\\\]/g, (_, expr: string) => `\n$$\n${expr.trim()}\n$$\n`)
      .replace(/\\\(([\s\S]*?)\\\)/g, (_, expr: string) => {
        const normalized = compactInlineLatex(expr);
        if (!normalized) {
          return "";
        }
        return `$${normalized}$`;
      });

    const lines = bracketNormalized.split(/\r?\n/);
    const converted: string[] = [];
    let inMathBlock = false;

    for (const line of lines) {
      const t = line.trim();

      if (/^\$\$$/.test(t)) {
        inMathBlock = !inMathBlock;
        converted.push("$$");
        continue;
      }

      if (inMathBlock || !t) {
        converted.push(line);
        continue;
      }

      if (t.startsWith("$") || t.startsWith("#") || t.startsWith("-") || t.startsWith("*") || /^\d+\./.test(t)) {
        converted.push(line);
        continue;
      }

      if (/^\\[a-zA-Z]+/.test(t) && !/[`<>]/.test(t)) {
        converted.push("$$");
        converted.push(t);
        converted.push("$$");
        continue;
      }

      converted.push(line);
    }

    return converted.join("\n");
  }
}

class DocxMathFallbackPreprocessor extends MarkdownPreprocessor {
  process(markdown: string): string {
    return replaceLatexWithOmmlTokens(markdown);
  }
}

class HeadingBoldPreprocessor extends MarkdownPreprocessor {
  process(markdown: string): string {
    return markdown.replace(/^(#{1,6}\s+)(.+)$/gm, (_, prefix: string, title: string) => {
      const clean = title.trim();
      if (/^\*\*.*\*\*$/.test(clean)) {
        return `${prefix}${clean}`;
      }
      return `${prefix}**${clean}**`;
    });
  }
}

export class MarkdownPipeline {
  private readonly base = new BaseSyntaxPreprocessor();
  private readonly latex = new LatexNormalizer();
  private readonly docxMath = new DocxMathFallbackPreprocessor();
  private readonly headingBold = new HeadingBoldPreprocessor();

  forPreview(markdown: string): string {
    return this.latex.process(this.base.process(markdown));
  }

  forDocx(markdown: string): string {
    return this.docxMath.process(this.headingBold.process(this.latex.process(this.base.process(markdown))));
  }
}
