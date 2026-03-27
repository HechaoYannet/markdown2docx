// Produce timestamp fallback names for markdown exports.
export function formatNowForFileName(): string {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
}

// Reuse the first heading as an optional export filename candidate.
export function extractMarkdownTitle(markdown: string): string {
  const match = markdown.match(/^\s{0,3}#{1,6}\s+(.+?)\s*$/m);
  if (!match?.[1]) {
    return "";
  }

  return match[1]
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function safeDocxName(currentFileName: string, markdown: string): string {
  const fileBase = currentFileName.replace(/\.[^.]+$/, "").trim();
  if (fileBase) {
    return `${fileBase}.docx`;
  }

  const titleBase = extractMarkdownTitle(markdown);
  if (titleBase) {
    return `${titleBase}.docx`;
  }

  return `markdown-${formatNowForFileName()}.docx`;
}
