# BAT Markdown to DOCX

A browser-based Markdown to DOCX converter designed for AI-generated notes, technical documents, and bilingual content.

[中文说明](README.zh-CN.md)

## Highlights

- Convert Markdown directly to `.docx` in the browser.
- Import content by file picker, drag-and-drop, direct editing, or clipboard paste.
- Live Markdown preview while typing.
- Built-in LaTeX math support with DOCX-friendly OMML conversion.
- Export typography control (body + heading H1-H6 sizes).
- Export font selection with fallback strategy.
- Dark/light theme switch and bilingual UI (English/Chinese).
- Local persistence for theme and typography settings.

## Feature Details

### 1. Input Methods

- File upload supports `.md`, `.markdown`, and `.txt`.
- Drag-and-drop upload is supported in the drop zone.
- Clipboard paste is available through a dedicated action button.
- Manual editing is supported in the built-in Markdown editor.

### 2. Live Preview

- Preview updates in real time as content changes.
- Rendering uses `marked` + `marked-katex-extension`.
- Output HTML is sanitized by `dompurify` for safer rendering.

### 3. Math Conversion Pipeline

- Inline and block LaTeX are normalized before conversion.
- TeX is transformed to MathML and then to OMML for Word compatibility.
- Formula conversion includes post-processing for delimiter/stretch behavior.
- Fallback logic is included to reduce malformed math export failures.

### 4. DOCX Typography Controls

- Configure body text size and heading sizes H1-H6.
- Sizes use Word half-point units (for example, `24 = 12pt`).
- Typography settings are normalized and persisted in local storage.
- Export pipeline enforces run-level size normalization to reduce inconsistent Word rendering.

### 5. Export Naming

Export filename priority:

1. Source filename (if a file was uploaded).
2. First Markdown heading.
3. Timestamp fallback name.

## Quick Start

### Requirements

- Node.js 18+ recommended.
- npm.

### Install

```bash
npm install
```

### Run in Development

```bash
npm run dev
```

Open the local URL shown by Vite in your terminal.

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## End-User Workflow

1. Open the app in your browser.
2. Load Markdown content by upload, drag-and-drop, paste, or direct typing.
3. Choose language and theme if needed.
4. Optionally set export font and typography sizes.
5. Verify content in live preview.
6. Click Convert to download the generated `.docx` file.

## Minimal Copy-Paste Examples

Use the following snippets to quickly verify end-to-end behavior.

### Example 1: Plain Document

```markdown
# Project Weekly Notes

## Summary

This week we completed the prototype and validated the core flow.

## Action Items

- Finalize API contract
- Prepare demo slides
- Schedule QA round

## Timeline

1. Design review on Tuesday
2. Internal demo on Thursday
3. Public release next week
```

### Example 2: Math Formula Focus

```markdown
# Math Export Check

Inline formula: $E = mc^2$.

Quadratic roots:

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

Integral test:

$$
\int_0^1 x^2\,dx = \frac{1}{3}
$$
```

### Example 3: Table + Code Mixed

````markdown
# Mixed Content Check

## Metrics Table

| Module | Status | Coverage |
| --- | --- | --- |
| Parser | Done | 95% |
| Converter | In Progress | 82% |
| UI | Done | 90% |

## Code Block

```ts
function greet(name: string): string {
	return `Hello, ${name}!`;
}

console.log(greet("BAT"));
```

## Notes

- `~~strikethrough~~` should be preserved outside code blocks.
- Inline code like `const x = 1` should remain plain code text.
````

## Supported Content

- Standard Markdown headings, lists, emphasis, links, tables, and code blocks.
- Inline math like `$a^2+b^2=c^2$`.
- Block math like `$$\int_0^1 x^2 dx$$`.
- Strike-through in non-code context.

## Notes and Limitations

- Final visual result can still vary across Word/Office versions.
- Font availability depends on local OS/Office installation.
- Very complex LaTeX may still require manual adjustment after export.
- Build may show a large chunk warning because math/document libraries are heavy.

## Scripts

- `npm run dev`: start local dev server.
- `npm run start`: alias of dev server.
- `npm run build`: production build.
- `npm run preview`: preview production build locally.

## Project Structure (Current)

- Entry: `src/main.ts`
- App orchestration layer: `src/app/*`
- Markdown pipeline: `src/markdown/*`
- Conversion engine: `src/conversion/*`
- Config and shared modules: `src/config/*`, `src/i18n.ts`, `src/ui/template.ts`, `src/types.ts`

## Technical Stack

- Vite 7
- TypeScript
- `@mohtasham/md-to-docx`
- `docx`
- `marked`
- `marked-katex-extension`
- `katex`
- `mathml2omml`
- `dompurify`

## Documentation

- Architecture and dependency flow: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Troubleshooting

- Conversion button does nothing:
	- Ensure Markdown input is not empty.
	- Check browser console for conversion errors.
- Pasting from clipboard fails:
	- Browser may block clipboard API.
	- Use manual paste in editor as fallback.
- Exported DOCX typography looks inconsistent:
	- Re-check heading/body size settings.
	- Verify target font exists in local system/Office.
