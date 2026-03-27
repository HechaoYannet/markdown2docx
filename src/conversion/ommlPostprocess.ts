function escapeXmlText(value: string): string {
  return value
    .replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9A-Fa-f]+);)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sanitizeOmmlTextNodes(omml: string): string {
  return omml.replace(/(<(?:m|w):t\b[^>]*>)([\s\S]*?)(<\/(?:m|w):t>)/g, (_match, openTag: string, text: string, closeTag: string) => {
    return `${openTag}${escapeXmlText(text)}${closeTag}`;
  });
}

function normalizeMatrixColumnSpecs(omml: string): string {
  return omml.replace(/<m:mcs>([\s\S]*?)<\/m:mcs>/g, (_full, inner: string) => {
    let rebuilt = inner.replace(/<m:mc>\s*<m:mcPr>([\s\S]*?)<\/m:mcPr>\s*<\/m:mc>/g, (_mcFull, mcPrInner: string) => {
      const countMatch = mcPrInner.match(/<m:count\b[^>]*m:val="(\d+)"[^>]*\/>/i);
      const count = Math.max(1, countMatch ? Number.parseInt(countMatch[1], 10) : 1);
      const mcJcMatch = mcPrInner.match(/<m:mcJc\b[^>]*\/>/i);
      const mcJc = mcJcMatch ? mcJcMatch[0] : '<m:mcJc m:val="center"/>';

      return Array.from({ length: count }, () => `<m:mc>${mcJc}</m:mc>`).join("");
    });

    rebuilt = rebuilt
      .replace(/<m:mcPr>/g, "")
      .replace(/<\/m:mcPr>/g, "")
      .replace(/<m:count\b[^>]*\/>/g, "");

    return `<m:mcs>${rebuilt}</m:mcs>`;
  });
}

export function postprocessOmml(omml: string): string {
  const normalized = normalizeMatrixColumnSpecs(omml);
  return sanitizeOmmlTextNodes(normalized);
}
