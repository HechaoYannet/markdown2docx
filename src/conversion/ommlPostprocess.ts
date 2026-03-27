const DELIMITER_PAIRS: Record<string, string> = {
  "(": ")",
  "（": "）",
  "[": "]",
  "［": "］",
  "{": "}",
  "｛": "｝",
  "|": "|",
  "∣": "∣",
  "⌈": "⌉",
  "⌊": "⌋",
  "<": ">",
  "⟨": "⟩"
};

function decodeDelimiterText(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "&lt;") return "<";
  if (trimmed === "&gt;") return ">";
  if (trimmed === "&#123;") return "{";
  if (trimmed === "&#125;") return "}";
  return trimmed;
}

function escapeXmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeXmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function makeTextRun(text: string): string {
  if (!text) {
    return "";
  }

  return `<m:r><m:t xml:space="preserve">${escapeXmlText(text)}</m:t></m:r>`;
}

function makeStretchyDelimiter(opening: string, closing: string, innerXml: string): string {
  const beginChar = escapeXmlAttribute(opening);
  const endChar = escapeXmlAttribute(closing);
  return `<m:d><m:dPr><m:begChr m:val="${beginChar}"/><m:endChr m:val="${endChar}"/><m:grow m:val="1"/></m:dPr><m:e>${innerXml}</m:e></m:d>`;
}

function splitOpeningDelimiter(text: string): { delimiter: string; rest: string } | null {
  const value = decodeDelimiterText(text);
  for (const delimiter of Object.keys(DELIMITER_PAIRS)) {
    if (value.startsWith(delimiter)) {
      return {
        delimiter,
        rest: value.slice(delimiter.length)
      };
    }
  }
  return null;
}

function splitClosingDelimiter(text: string): { delimiter: string; rest: string } | null {
  const value = decodeDelimiterText(text);
  for (const delimiter of Object.values(DELIMITER_PAIRS)) {
    if (value.endsWith(delimiter)) {
      return {
        delimiter,
        rest: value.slice(0, value.length - delimiter.length)
      };
    }
  }
  return null;
}

const TALL_MATH_PATTERN = /<m:(?:m|eqArr|f|rad|nary|sSub|sSup|sSubSup|limLow|limUpp|groupChr|bar|acc|func)\b/;

function hasTallMathContent(xml: string): boolean {
  return TALL_MATH_PATTERN.test(xml);
}

function wrapStretchableDelimiters(omml: string, middleTag: string): string {
  const escapedTag = middleTag.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const pattern = new RegExp(
    `<m:r>\\s*<m:t\\b[^>]*>([^<]+)<\\/m:t>\\s*<\\/m:r>\\s*(<${escapedTag}\\b[\\s\\S]*?<\\/${escapedTag}>)\\s*<m:r>\\s*<m:t\\b[^>]*>([^<]+)<\\/m:t>\\s*<\\/m:r>`,
    "g"
  );

  return omml.replace(pattern, (fullMatch, openRaw: string, middleXml: string, closeRaw: string) => {
    const opening = decodeDelimiterText(openRaw);
    const closing = decodeDelimiterText(closeRaw);
    const expectedClosing = DELIMITER_PAIRS[opening];

    if (!expectedClosing || expectedClosing !== closing) {
      return fullMatch;
    }

    return makeStretchyDelimiter(opening, closing, middleXml);
  });
}

function wrapStretchableDelimitersAroundCompositeContent(omml: string): string {
  return omml.replace(
    /<m:r>[\s\S]*?<m:t\b[^>]*>([^<]+)<\/m:t>[\s\S]*?<\/m:r>\s*([\s\S]*?)\s*<m:r>[\s\S]*?<m:t\b[^>]*>([^<]+)<\/m:t>[\s\S]*?<\/m:r>/g,
    (fullMatch, openRaw: string, middleXml: string, closeRaw: string) => {
      const openingPart = splitOpeningDelimiter(openRaw);
      const closingPart = splitClosingDelimiter(closeRaw);

      if (!openingPart || !closingPart) {
        return fullMatch;
      }

      const expectedClosing = DELIMITER_PAIRS[openingPart.delimiter];

      if (!expectedClosing || expectedClosing !== closingPart.delimiter) {
        return fullMatch;
      }

      // Avoid crossing math object boundaries or wrapping empty/simple content.
      if (!middleXml.trim() || middleXml.length > 3000) {
        return fullMatch;
      }
      if (/<\/m:oMath>|<m:oMath\b/.test(middleXml)) {
        return fullMatch;
      }
      if (!hasTallMathContent(middleXml)) {
        return fullMatch;
      }

      const innerXml = `${makeTextRun(openingPart.rest)}${middleXml}${makeTextRun(closingPart.rest)}`;
      return makeStretchyDelimiter(openingPart.delimiter, closingPart.delimiter, innerXml);
    }
  );
}

function wrapStretchableDelimitersInMathBase(omml: string): string {
  return omml.replace(
    /<m:e>\s*<m:r>[\s\S]*?<m:t\b[^>]*>([^<]+)<\/m:t>[\s\S]*?<\/m:r>\s*(<m:(m|eqArr|f|rad|nary|sSub|sSup|sSubSup|limLow|limUpp|groupChr|bar|acc|func)\b[\s\S]*?<\/m:\3>)\s*<m:r>[\s\S]*?<m:t\b[^>]*>([^<]+)<\/m:t>[\s\S]*?<\/m:r>\s*<\/m:e>/g,
    (fullMatch, openRaw: string, middleXml: string, _tagName: string, closeRaw: string) => {
      const openingPart = splitOpeningDelimiter(openRaw);
      const closingPart = splitClosingDelimiter(closeRaw);
      if (!openingPart || !closingPart) {
        return fullMatch;
      }

      const expectedClosing = DELIMITER_PAIRS[openingPart.delimiter];
      if (!expectedClosing || expectedClosing !== closingPart.delimiter) {
        return fullMatch;
      }

      const innerXml = `${makeTextRun(openingPart.rest)}${middleXml}${makeTextRun(closingPart.rest)}`;
      return `<m:e>${makeStretchyDelimiter(openingPart.delimiter, closingPart.delimiter, innerXml)}</m:e>`;
    }
  );
}

export function postprocessOmml(omml: string): string {
  const stretchyTargets = [
    "m:m",
    "m:eqArr",
    "m:f",
    "m:rad",
    "m:nary",
    "m:sSub",
    "m:sSup",
    "m:sSubSup",
    "m:limLow",
    "m:limUpp",
    "m:groupChr",
    "m:bar",
    "m:acc",
    "m:d"
  ];

  let next = omml;
  for (const tag of stretchyTargets) {
    next = wrapStretchableDelimiters(next, tag);
  }

  next = wrapStretchableDelimitersInMathBase(next);
  next = wrapStretchableDelimitersAroundCompositeContent(next);

  return next;
}
