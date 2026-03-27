function toStretchableVerticalBarsAroundMatrix(omml: string): string {
  return omml.replace(
    /<m:r>\s*<m:t\b[^>]*>∣<\/m:t>\s*<\/m:r>\s*(<m:m>[\s\S]*?<\/m:m>)\s*<m:r>\s*<m:t\b[^>]*>∣<\/m:t>\s*<\/m:r>/g,
    (_match, matrixXml: string) => {
      return `<m:d><m:dPr><m:begChr m:val="|"/><m:endChr m:val="|"/></m:dPr><m:e>${matrixXml}</m:e></m:d>`;
    }
  );
}

export function postprocessOmml(omml: string): string {
  let next = omml;
  next = toStretchableVerticalBarsAroundMatrix(next);
  return next;
}
