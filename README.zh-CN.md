# BAT Markdown 转 DOCX

一个基于浏览器的 Markdown 转 DOCX 工具，适用于 AI 生成内容、技术文档与中英文混排场景。

[English](README.md)

## 功能亮点

- 在浏览器中直接将 Markdown 转为 `.docx`。
- 支持文件选择、拖拽上传、编辑器直接输入、剪贴板粘贴。
- 支持 Markdown 实时预览。
- 内置 LaTeX 数学公式处理，并转换为适配 Word 的 OMML。
- 支持导出字号控制（正文 + H1-H6 标题）。
- 支持导出字体选择与回退策略。
- 支持浅色/深色主题与中英文界面。
- 主题与字号配置可本地持久化保存。

## 功能说明

### 1. 内容输入方式

- 文件上传支持 `.md`、`.markdown`、`.txt`。
- 拖拽文件到上传区域即可导入。
- 提供剪贴板粘贴按钮。
- 支持在内置编辑器中直接编写或修改 Markdown。

### 2. 实时预览

- 内容变化后立即刷新预览。
- 预览渲染基于 `marked` + `marked-katex-extension`。
- 渲染结果通过 `dompurify` 清洗，提升展示安全性。

### 3. 数学公式转换链路

- 对行内和块级 LaTeX 先做规范化处理。
- TeX 先转 MathML，再转 OMML，提升 Word 兼容性。
- 包含分隔符/伸缩行为后处理，优化复杂公式展示。
- 内置失败回退逻辑，尽量降低复杂公式导致的导出失败。

### 4. DOCX 排版与字号控制

- 可分别设置正文和 H1-H6 标题字号。
- 字号单位使用 Word 半磅值（例如 `24 = 12pt`）。
- 字号配置会归一化并保存到本地存储。
- 导出阶段会做 run 级字号规范化，降低 Word 中字号不一致问题。

### 5. 导出文件命名规则

导出文件名优先级如下：

1. 上传文件原名（若有）。
2. Markdown 首个标题。
3. 时间戳兜底名称。

## 快速开始

### 环境要求

- 建议 Node.js 18+。
- npm。

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

在终端中打开 Vite 输出的本地地址。

### 生产构建

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

## 用户使用流程

1. 在浏览器打开应用。
2. 通过上传、拖拽、粘贴或直接输入导入 Markdown。
3. 视需要切换语言与主题。
4. 可选设置导出字体与字号。
5. 在实时预览中确认内容。
6. 点击 Convert 下载生成的 `.docx` 文件。

## 最小可复制示例

可直接复制以下示例，快速验证完整导出链路。

### 示例 1：普通文档

```markdown
# 项目周报

## 本周总结

本周完成了原型开发，并验证了核心流程。

## 待办事项

- 整理 API 协议
- 准备演示文档
- 安排 QA 回归

## 时间计划

1. 周二设计评审
2. 周四内部演示
3. 下周发布
```

### 示例 2：数学公式

```markdown
# 公式导出检查

行内公式：$E = mc^2$。

一元二次方程求根：

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

积分示例：

$$
\int_0^1 x^2\,dx = \frac{1}{3}
$$
```

### 示例 3：表格与代码混合

````markdown
# 混合内容检查

## 指标表格

| 模块 | 状态 | 覆盖率 |
| --- | --- | --- |
| Parser | 完成 | 95% |
| Converter | 进行中 | 82% |
| UI | 完成 | 90% |

## 代码块

```ts
function greet(name: string): string {
  return `Hello, ${name}!`;
}

console.log(greet("BAT"));
```

## 说明

- `~~删除线~~` 在非代码区域应保持正确。
- 行内代码如 `const x = 1` 应保持代码样式文本。
````

## 支持内容

- 常见 Markdown 语法：标题、列表、强调、链接、表格、代码块。
- 行内公式，例如 `$a^2+b^2=c^2$`。
- 块级公式，例如 `$$\\int_0^1 x^2 dx$$`。
- 非代码上下文中的删除线。

## 注意事项与限制

- 不同 Word/Office 版本最终显示可能存在差异。
- 字体可用性受本机系统与 Office 安装影响。
- 极复杂 LaTeX 公式导出后可能仍需手工微调。
- 构建时出现大 chunk 提示属于数学/文档库体积带来的常见现象。

## 脚本命令

- `npm run dev`：启动本地开发服务。
- `npm run start`：`dev` 的别名。
- `npm run build`：生成生产构建。
- `npm run preview`：本地预览生产构建。

## 当前工程结构

- 入口层：`src/main.ts`
- 应用编排层：`src/app/*`
- Markdown 处理层：`src/markdown/*`
- 转换引擎层：`src/conversion/*`
- 配置与共享模块：`src/config/*`、`src/i18n.ts`、`src/ui/template.ts`、`src/types.ts`

## 技术栈

- Vite 7
- TypeScript
- `@mohtasham/md-to-docx`
- `docx`
- `marked`
- `marked-katex-extension`
- `katex`
- `mathml2omml`
- `dompurify`

## 相关文档

- 架构与依赖流向说明：[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## 常见问题排查

- 点击转换无反应：
  - 确认输入内容非空。
  - 打开浏览器控制台查看转换异常日志。
- 剪贴板粘贴失败：
  - 可能是浏览器未授权 Clipboard API。
  - 可退回到编辑器手动粘贴。
- 导出后字号不一致：
  - 重新确认正文与标题字号配置。
  - 确认目标字体在本机系统/Office 可用。
