import katex from "katex";
import { mml2omml } from "mathml2omml";

const TOKEN_REGEX = /\{\{OMML_(BLOCK|INLINE):([A-Za-z0-9+/=]+)\}\}/g;

function utf8ToBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToUtf8(value: string): string {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function replaceLatexWithOmmlTokens(markdown: string): string {
  const blockHandled = markdown.replace(/\$\$([\s\S]*?)\$\$/g, (_, expr: string) => {
    const payload = utf8ToBase64(expr.trim());
    return `\n\n{{OMML_BLOCK:${payload}}}\n\n`;
  });

  return blockHandled.replace(/\$([^$\n]+?)\$/g, (_, expr: string) => {
    const payload = utf8ToBase64(expr.trim());
    return `{{OMML_INLINE:${payload}}}`;
  });
}

export function splitByOmmlTokens(input: string): Array<{ type: "text" | "omml"; value: string; display?: boolean }> {
  const result: Array<{ type: "text" | "omml"; value: string; display?: boolean }> = [];
  let lastIndex = 0;

  for (const match of input.matchAll(TOKEN_REGEX)) {
    const full = match[0];
    const kind = match[1];
    const payload = match[2];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      result.push({ type: "text", value: input.slice(lastIndex, index) });
    }

    result.push({
      type: "omml",
      value: base64ToUtf8(payload),
      display: kind === "BLOCK"
    });

    lastIndex = index + full.length;
  }

  if (lastIndex < input.length) {
    result.push({ type: "text", value: input.slice(lastIndex) });
  }

  return result;
}

export function containsOmmlToken(input: string): boolean {
  return /\{\{OMML_(BLOCK|INLINE):([A-Za-z0-9+/=]+)\}\}/.test(input);
}

function texToMathMl(expression: string, display: boolean): string {
  const rendered = katex.renderToString(expression, {
    throwOnError: false,
    displayMode: display,
    output: "mathml",
    strict: "ignore"
  });

  const mathMatch = rendered.match(/<math[\s\S]*<\/math>/i);
  return mathMatch ? mathMatch[0] : rendered;
}

export function texToOmml(expression: string, display: boolean): string {
  const mathMl = texToMathMl(expression, display);
  return mml2omml(mathMl);
}
