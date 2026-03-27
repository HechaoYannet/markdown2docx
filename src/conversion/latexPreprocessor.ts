type LatexRule = (expression: string) => string;

function wrapCommandParenthesisGroup(expression: string): string {
  // Some TeX -> MathML -> OMML chains are sensitive to command-parenthesis groups
  // like \mu(X); wrapping as {\mu(X)} is more stable for Word rendering.
  return expression.replace(/(?<!\{)(\\[a-zA-Z]+\s*\([^()]*\))(?!\})/g, "{$1}");
}

function normalizeMidOperators(expression: string): string {
  const withMidCommand = expression.replace(/\\mid/g, (_match, offset: number, source: string) => {
    const prefix = source.slice(Math.max(0, offset - 8), offset);
    return prefix === "\\mathrm{" ? "\\mid" : "\\mathrm{\\mid}";
  });

  return withMidCommand.replace(/\|/g, (_match, offset: number, source: string) => {
    const leftContext = source.slice(Math.max(0, offset - 12), offset);
    if (/\\(?:left|right)\s*$/.test(leftContext)) {
      return "|";
    }

    if (offset > 0 && source[offset - 1] === "\\") {
      return "|";
    }

    return "\\mathrm{\\mid}";
  });
}

const RULES: LatexRule[] = [
  wrapCommandParenthesisGroup,
  normalizeMidOperators
];

export function preprocessLatexForOmml(expression: string): string {
  let next = expression;

  for (const rule of RULES) {
    next = rule(next);
  }

  return next;
}
