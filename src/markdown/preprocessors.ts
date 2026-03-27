import { replaceLatexWithOmmlTokens } from "../conversion/nativeMath";

abstract class MarkdownPreprocessor {
  abstract process(markdown: string): string;
}

function getMaxBacktickRun(text: string): number {
  let max = 0;
  for (const match of text.matchAll(/`+/g)) {
    const len = match[0].length;
    if (len > max) {
      max = len;
    }
  }
  return max;
}

class CodeFenceNormalizer extends MarkdownPreprocessor {
  process(markdown: string): string {
    const lines: string[] = [];
    let index = 0;

    while (index < markdown.length) {
      const lineEndMatch = markdown.slice(index).match(/\r?\n/);
      const lineEnd = lineEndMatch ? index + lineEndMatch.index! + lineEndMatch[0].length : markdown.length;
      lines.push(markdown.slice(index, lineEnd));
      index = lineEnd;
    }

    if (!lines.length) {
      return markdown;
    }

    const output: string[] = [];
    let inFence = false;
    let fenceMarker: { ch: "`" | "~"; length: number } | null = null;
    let fenceIndent = "";
    let fenceInfo = "";
    let fenceNewline = "\n";
    let blockLines: string[] = [];

    const flushFenceBlock = (closingNewline: string) => {
      if (!fenceMarker) {
        return;
      }

      const blockText = blockLines.join("");
      const maxTicksInBlock = getMaxBacktickRun(blockText);
      const normalizedLen = Math.max(3, fenceMarker.length, maxTicksInBlock + 1);
      const fence = "`".repeat(normalizedLen);

      output.push(`${fenceIndent}${fence}${fenceInfo}${fenceNewline}`);
      output.push(blockText);
      output.push(`${fenceIndent}${fence}${closingNewline}`);

      inFence = false;
      fenceMarker = null;
      fenceIndent = "";
      fenceInfo = "";
      fenceNewline = "\n";
      blockLines = [];
    };

    for (const line of lines) {
      if (!inFence) {
        const openMatch = line.match(/^( {0,3})(`{3,}|~{3,})([^\r\n]*)(\r?\n?)$/);
        if (!openMatch) {
          output.push(line);
          continue;
        }

        inFence = true;
        fenceMarker = { ch: openMatch[2][0] as "`" | "~", length: openMatch[2].length };
        fenceIndent = openMatch[1];
        fenceInfo = openMatch[3] || "";
        fenceNewline = openMatch[4] || "";
        blockLines = [];
        continue;
      }

      if (fenceMarker && isFenceClosingLine(line, fenceMarker)) {
        const closingNewline = (line.match(/(\r?\n?)$/)?.[1]) || "";
        flushFenceBlock(closingNewline);
        continue;
      }

      blockLines.push(line);
    }

    if (inFence) {
      // Auto-close unmatched fences so downstream markdown parsers do not corrupt following content.
      flushFenceBlock("\n");
    }

    return output.join("");
  }
}

function splitInlineCodeSpans(text: string): Array<{ type: "text" | "code"; value: string }> {
  const segments: Array<{ type: "text" | "code"; value: string }> = [];
  let cursor = 0;
  let textStart = 0;

  while (cursor < text.length) {
    if (text[cursor] !== "`") {
      cursor += 1;
      continue;
    }

    let tickCount = 0;
    while (cursor + tickCount < text.length && text[cursor + tickCount] === "`") {
      tickCount += 1;
    }

    let closeAt = -1;
    let seek = cursor + tickCount;
    while (seek < text.length) {
      if (text[seek] !== "`") {
        seek += 1;
        continue;
      }

      let closeCount = 0;
      while (seek + closeCount < text.length && text[seek + closeCount] === "`") {
        closeCount += 1;
      }

      if (closeCount === tickCount) {
        closeAt = seek;
        break;
      }

      seek += closeCount;
    }

    if (closeAt === -1) {
      cursor += tickCount;
      continue;
    }

    if (cursor > textStart) {
      segments.push({ type: "text", value: text.slice(textStart, cursor) });
    }

    const codeEnd = closeAt + tickCount;
    segments.push({ type: "code", value: text.slice(cursor, codeEnd) });
    cursor = codeEnd;
    textStart = cursor;
  }

  if (textStart < text.length) {
    segments.push({ type: "text", value: text.slice(textStart) });
  }

  return segments;
}

function transformOutsideInlineCode(text: string, transform: (value: string) => string): string {
  const segments = splitInlineCodeSpans(text);
  return segments
    .map((segment) => (segment.type === "text" ? transform(segment.value) : segment.value))
    .join("");
}

function parseFenceMarker(line: string): { ch: "`" | "~"; length: number } | null {
  const pure = line.replace(/\r?\n$/, "");
  const match = pure.match(/^ {0,3}(`{3,}|~{3,})/);
  if (!match) {
    return null;
  }

  const marker = match[1];
  return { ch: marker[0] as "`" | "~", length: marker.length };
}

function isFenceClosingLine(line: string, marker: { ch: "`" | "~"; length: number }): boolean {
  const pure = line.replace(/\r?\n$/, "");
  const escaped = marker.ch === "`" ? "`" : "~";
  const closingRegex = new RegExp(`^ {0,3}${escaped}{${marker.length},}[ \\t]*$`);
  return closingRegex.test(pure);
}

function transformOutsideCode(markdown: string, transform: (text: string) => string): string {
  let output = "";
  let textBuffer = "";
  let inFence = false;
  let currentFence: { ch: "`" | "~"; length: number } | null = null;

  const flushText = () => {
    if (!textBuffer) {
      return;
    }
    output += transformOutsideInlineCode(textBuffer, transform);
    textBuffer = "";
  };

  let index = 0;
  while (index < markdown.length) {
    const lineEndMatch = markdown.slice(index).match(/\r?\n/);
    const lineEnd = lineEndMatch ? index + lineEndMatch.index! + lineEndMatch[0].length : markdown.length;
    const line = markdown.slice(index, lineEnd);

    if (inFence && currentFence) {
      output += line;
      if (isFenceClosingLine(line, currentFence)) {
        inFence = false;
        currentFence = null;
      }
      index = lineEnd;
      continue;
    }

    const openingFence = parseFenceMarker(line);
    if (openingFence) {
      flushText();
      output += line;
      inFence = true;
      currentFence = openingFence;
      index = lineEnd;
      continue;
    }

    textBuffer += line;
    index = lineEnd;
  }

  flushText();
  return output;
}

function compactInlineLatex(expr: string): string {
  return expr
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeOverEscapedLatexCommands(markdown: string): string {
  // Some inputs come from JSON/chat contexts and contain doubled command slashes
  // like "\\frac". Normalize only inside math delimiters.
  return markdown
    .replace(/\$\$([\s\S]*?)\$\$/g, (_match, expr: string) => {
      const normalized = expr.replace(/\\\\(?=[a-zA-Z]+)/g, "\\");
      return `$$${normalized}$$`;
    })
    .replace(/\$([^\n$]+?)\$/g, (_match, expr: string) => {
      const normalized = expr.replace(/\\\\(?=[a-zA-Z]+)/g, "\\");
      return `$${normalized}$`;
    });
}

function escapeOperatorAsterisks(text: string): string {
  // Prevent markdown emphasis parsing from hijacking math/programming operators.
  // Examples: a*b, x**2, 2*(n+1), A[i]*B[j]
  const operandLeft = "[A-Za-z0-9_\\)\\]\\}]";
  const operandRight = "[A-Za-z0-9_\\(\\[\\{]";

  const powerOrDoubleMul = new RegExp(`(?<=${operandLeft})\\*\\*(?=${operandRight})`, "g");
  const singleMul = new RegExp(`(?<=${operandLeft})\\*(?=${operandRight})`, "g");

  return text
    .replace(powerOrDoubleMul, "\\\\*\\\\*")
    .replace(singleMul, "\\\\*");
}

class BaseSyntaxPreprocessor extends MarkdownPreprocessor {
  process(markdown: string): string {
    return transformOutsideCode(markdown, (text) => {
      const normalized = text
        .replace(/\uFF03/g, "#")
        .replace(/\uFF0A/g, "*");

      const starSafe = escapeOperatorAsterisks(normalized);
      return starSafe.replace(/^(#{1,6})([^\s#])/gm, "$1 $2");
    });
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

    return normalizeOverEscapedLatexCommands(converted.join("\n"));
  }
}

class DocxMathFallbackPreprocessor extends MarkdownPreprocessor {
  process(markdown: string): string {
    return replaceLatexWithOmmlTokens(markdown);
  }
}

class DocxStrikeTokenPreprocessor extends MarkdownPreprocessor {
  process(markdown: string): string {
    return markdown.replace(/~~([^\n]+?)~~/g, (_match, inner: string) => {
      const value = inner.trim();
      if (!value) {
        return _match;
      }
      return `{{STRIKE:${encodeURIComponent(value)}}}`;
    });
  }
}

class HeadingBoldPreprocessor extends MarkdownPreprocessor {
  process(markdown: string): string {
    return transformOutsideCode(markdown, (text) => text.replace(/^(#{1,6}\s+)(.+)$/gm, (_, prefix: string, title: string) => {
      const clean = title.trim();
      // Only auto-bold plain headings. If heading already contains markdown syntax,
      // keep it untouched to avoid malformed nested emphasis.
      const hasInlineMarkdownSyntax = /[`*_~\[\]()>]/.test(clean);
      if (hasInlineMarkdownSyntax || /^\*\*.*\*\*$/.test(clean)) {
        return `${prefix}${clean}`;
      }
      return `${prefix}**${clean}**`;
    }));
  }
}

export class MarkdownPipeline {
  private readonly codeFence = new CodeFenceNormalizer();
  private readonly base = new BaseSyntaxPreprocessor();
  private readonly latex = new LatexNormalizer();
  private readonly docxStrike = new DocxStrikeTokenPreprocessor();
  private readonly docxMath = new DocxMathFallbackPreprocessor();
  private readonly headingBold = new HeadingBoldPreprocessor();

  forPreview(markdown: string): string {
    const fenceProcessed = this.codeFence.process(markdown);
    const baseProcessed = this.base.process(fenceProcessed);
    return transformOutsideCode(baseProcessed, (text) => this.latex.process(text));
  }

  forDocx(markdown: string): string {
    const fenceProcessed = this.codeFence.process(markdown);
    const baseProcessed = this.base.process(fenceProcessed);
    const latexProcessed = transformOutsideCode(baseProcessed, (text) => this.latex.process(text));
    const headingProcessed = this.headingBold.process(latexProcessed);
    const strikeTokenized = transformOutsideCode(headingProcessed, (text) => this.docxStrike.process(text));
    return transformOutsideCode(strikeTokenized, (text) => this.docxMath.process(text));
  }
}
