type LatexRule = (expression: string) => string;

const NARY_OPERATORS = new Set([
  "sum",
  "prod",
  "coprod",
  "bigcup",
  "bigcap",
  "bigvee",
  "bigwedge"
]);

const STOP_COMMANDS = new Set([
  "right",
  "middle",
  "le",
  "leq",
  "ge",
  "geq",
  "neq",
  "approx",
  "sim",
  "to",
  "in",
  "notin",
  "subset",
  "subseteq",
  "supset",
  "supseteq"
]);

function wrapCommandParenthesisGroup(expression: string): string {
  // Some TeX -> MathML -> OMML chains are sensitive to command-parenthesis groups
  // like \mu(X); wrapping as {\mu(X)} is more stable for Word rendering.
  return expression.replace(/(?<!\{)(\\[a-zA-Z]+\s*\([^()]*\))(?!\})/g, "{$1}");
}

function normalizeMidOperators(expression: string): string {
  const protectedExpression = expression.replace(/\\(left|right|middle)\s*\|/g, (_full, side: string) => {
    return `\\${side}__BAR_PLACEHOLDER__`;
  });

  const withMidCommand = protectedExpression.replace(/\\mid/g, (_match, offset: number, source: string) => {
    const prefix = source.slice(Math.max(0, offset - 8), offset);
    return prefix === "\\mathrm{" ? "\\mid" : "\\mathrm{\\mid}";
  });

  return withMidCommand
    .replace(/\|/g, "\\mathrm{\\mid}")
    .replace(/__BAR_PLACEHOLDER__/g, "|");
}

function readGroup(input: string, start: number): number {
  let depth = 0;
  for (let i = start; i < input.length; i += 1) {
    if (input[i] === "{") depth += 1;
    if (input[i] === "}") {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
  }
  return input.length;
}

function readScript(input: string, start: number): number {
  if (start >= input.length) return start;
  if (input[start] === "{") return readGroup(input, start);
  if (input[start] === "\\") {
    const cmd = input.slice(start).match(/^\\[a-zA-Z]+/);
    return cmd ? start + cmd[0].length : start + 1;
  }
  return start + 1;
}

function wrapNaryOperands(expression: string): string {
  let out = "";
  let cursor = 0;

  while (cursor < expression.length) {
    const cmdMatch = expression.slice(cursor).match(/^\\([a-zA-Z]+)/);
    if (!cmdMatch || !NARY_OPERATORS.has(cmdMatch[1])) {
      out += expression[cursor];
      cursor += 1;
      continue;
    }

    const cmdStart = cursor;
    cursor += cmdMatch[0].length;

    // Parse optional _{...}/^{...} scripts attached to n-ary operators.
    for (let loops = 0; loops < 2; loops += 1) {
      while (cursor < expression.length && /\s/.test(expression[cursor])) cursor += 1;
      if (expression[cursor] !== "_" && expression[cursor] !== "^") break;
      cursor += 1;
      while (cursor < expression.length && /\s/.test(expression[cursor])) cursor += 1;
      cursor = readScript(expression, cursor);
    }

    const afterScripts = cursor;
    while (cursor < expression.length && /\s/.test(expression[cursor])) cursor += 1;
    if (cursor >= expression.length) {
      out += expression.slice(cmdStart, afterScripts);
      break;
    }

    if (expression[cursor] === "{") {
      out += expression.slice(cmdStart, cursor);
      continue;
    }

    const operandStart = cursor;
    let operandEnd = cursor;

    while (operandEnd < expression.length) {
      const ch = expression[operandEnd];
      if (ch === "+" || ch === "-" || ch === "=" || ch === "<" || ch === ">" || ch === "&" || ch === "," || ch === ";") {
        break;
      }

      if (ch === "\\") {
        const stopCmdMatch = expression.slice(operandEnd).match(/^\\([a-zA-Z]+)/);
        if (stopCmdMatch && STOP_COMMANDS.has(stopCmdMatch[1])) {
          break;
        }
      }

      operandEnd += 1;
    }

    const operand = expression.slice(operandStart, operandEnd).trim();
    if (!operand) {
      out += expression.slice(cmdStart, cursor);
      continue;
    }

    out += `${expression.slice(cmdStart, operandStart)}{${operand}}`;
    cursor = operandEnd;
  }

  return out;
}

const RULES: LatexRule[] = [
  wrapCommandParenthesisGroup,
  normalizeMidOperators,
  wrapNaryOperands
];

export function preprocessLatexForOmml(expression: string): string {
  let next = expression;

  for (const rule of RULES) {
    next = rule(next);
  }

  return next;
}
