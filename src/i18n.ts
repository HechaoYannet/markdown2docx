import type { Locale } from "./types";

export const messages: Record<Locale, Record<string, string>> = {
  zh: {
    title: "Markdown 一键转 DOCX",
    subtitle: "支持文件选择、拖拽上传与实时预览，面向中英文排版。",
    language: "语言",
    darkMode: "暗黑模式",
    uploadLabel: "导入 Markdown",
    uploadHint: "支持 .md / .markdown / .txt",
    dropHint: "拖拽文件到此处，或点击选择文件",
    pasteLabel: "粘贴或编辑 Markdown",
    placeholder: "在这里粘贴 Markdown 内容，或先选择文件后自动填入...",
    previewLabel: "实时预览",
    previewEmpty: "预览区域：输入 Markdown 后会实时显示效果。",
    pasteClipboard: "从剪贴板粘贴",
    clear: "清空",
    convert: "一键转化",
    converting: "正在转换...",
    fontLabel: "导出字体",
    fontHint: "字体依赖本机 Office/系统安装；不支持时会自动回退。",
    idleStatus: "等待输入 Markdown 内容。",
    loadedFile: "已加载文件",
    empty: "请输入 Markdown 内容后再转换。",
    clipUnsupported: "当前浏览器不支持剪贴板读取，请手动粘贴。",
    clipEmpty: "剪贴板为空。",
    converted: "转换完成，已开始下载",
    failed: "转换失败，请检查 Markdown 内容后重试。",
    invalidFile: "仅支持 .md/.markdown/.txt 文件。",
    switchToLight: "切换到浅色",
    switchToDark: "切换到深色",
    noFileSelected: "未选择文件",
    clipboardPasted: "已从剪贴板粘贴内容。"
  },
  en: {
    title: "One-Click Markdown to DOCX",
    subtitle: "Choose, drag, or paste Markdown with real-time preview for bilingual content.",
    language: "Language",
    darkMode: "Dark Mode",
    uploadLabel: "Choose Markdown File",
    uploadHint: "Supports .md / .markdown / .txt",
    dropHint: "Drop file here, or click to browse",
    pasteLabel: "Paste or Edit Markdown",
    placeholder: "Paste your Markdown here, or select a file to auto-fill...",
    previewLabel: "Live Preview",
    previewEmpty: "Preview area: render appears here while you type.",
    pasteClipboard: "Paste from Clipboard",
    clear: "Clear",
    convert: "Convert Now",
    converting: "Converting...",
    fontLabel: "Export Font",
    fontHint: "Font usage depends on installed Office/system fonts; unsupported fonts fallback automatically.",
    idleStatus: "Waiting for Markdown input.",
    loadedFile: "Loaded file",
    empty: "Please input Markdown content before converting.",
    clipUnsupported: "Clipboard read is not supported in this browser. Please paste manually.",
    clipEmpty: "Clipboard is empty.",
    converted: "Conversion complete. Download started",
    failed: "Conversion failed. Please review your Markdown and try again.",
    invalidFile: "Only .md/.markdown/.txt files are supported.",
    switchToLight: "Switch to Light",
    switchToDark: "Switch to Dark",
    noFileSelected: "No file selected",
    clipboardPasted: "Pasted content from clipboard."
  }
};

export function getInitialLocale(): Locale {
  return navigator.language.toLowerCase().includes("zh") ? "zh" : "en";
}

export function getText(locale: Locale, key: string): string {
  return messages[locale][key] || key;
}
