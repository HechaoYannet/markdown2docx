export function createAppTemplate(): string {
  return `
    <div class="orb orb-left" aria-hidden="true"></div>
    <div class="orb orb-right" aria-hidden="true"></div>
    <main class="panel">
      <header class="panel-header">
        <div>
          <h1 id="title"></h1>
          <p id="subtitle"></p>
        </div>
        <div class="toolbar">
          <label class="modern-select" for="langSelect">
            <span id="languageLabel"></span>
            <select id="langSelect" aria-label="Language">
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </label>
          <button id="themeBtn" class="theme-btn" type="button" aria-pressed="false"></button>
        </div>
      </header>

      <section class="input-block">
        <div class="label-row">
          <h2 id="uploadLabel"></h2>
          <span id="uploadHint" class="hint"></span>
        </div>
        <label class="file-drop" id="dropZone" for="fileInput" tabindex="0" role="button">
          <input id="fileInput" type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" />
          <span class="drop-title" id="dropHint"></span>
          <span id="fileName">No file selected</span>
        </label>
      </section>

      <section class="split-grid">
        <article class="input-block">
          <div class="label-row">
            <h2 id="pasteLabel"></h2>
            <label class="modern-select modern-select-font" for="fontSelect">
              <span id="fontLabel"></span>
              <select id="fontSelect" aria-label="Font">
                <option value="auto">Auto</option>
                <option value="Microsoft YaHei">Microsoft YaHei</option>
                <option value="SimSun">SimSun</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Arial">Arial</option>
              </select>
            </label>
          </div>
          <details class="settings-panel" id="typographySettings">
            <summary id="typographySummary"></summary>
            <p id="typographyHint" class="hint settings-hint"></p>
            <div class="typography-grid">
              <label class="size-field" for="bodySizeInput">
                <span id="bodySizeLabel"></span>
                <input id="bodySizeInput" type="number" min="12" max="96" step="1" />
              </label>
              <label class="size-field" for="h1SizeInput">
                <span id="heading1SizeLabel"></span>
                <input id="h1SizeInput" type="number" min="12" max="96" step="1" />
              </label>
              <label class="size-field" for="h2SizeInput">
                <span id="heading2SizeLabel"></span>
                <input id="h2SizeInput" type="number" min="12" max="96" step="1" />
              </label>
              <label class="size-field" for="h3SizeInput">
                <span id="heading3SizeLabel"></span>
                <input id="h3SizeInput" type="number" min="12" max="96" step="1" />
              </label>
              <label class="size-field" for="h4SizeInput">
                <span id="heading4SizeLabel"></span>
                <input id="h4SizeInput" type="number" min="12" max="96" step="1" />
              </label>
              <label class="size-field" for="h5SizeInput">
                <span id="heading5SizeLabel"></span>
                <input id="h5SizeInput" type="number" min="12" max="96" step="1" />
              </label>
              <label class="size-field" for="h6SizeInput">
                <span id="heading6SizeLabel"></span>
                <input id="h6SizeInput" type="number" min="12" max="96" step="1" />
              </label>
            </div>
            <div class="settings-actions">
              <button id="resetTypographyBtn" class="ghost" type="button"></button>
            </div>
          </details>
          <textarea id="markdownInput" rows="14"></textarea>
          <p id="fontHint" class="hint hint-font"></p>
          <div class="actions">
            <button id="pasteClipboardBtn" class="ghost" type="button"></button>
            <button id="clearBtn" class="ghost" type="button"></button>
            <button id="convertBtn" class="solid" type="button"></button>
          </div>
        </article>

        <article class="input-block preview-block">
          <div class="label-row">
            <h2 id="previewLabel"></h2>
          </div>
          <div id="preview" class="preview"></div>
        </article>
      </section>

      <footer>
        <p id="status" class="status"></p>
      </footer>
    </main>
  `;
}
