# Code Style 规范 —— 前端（HTML / CSS / JavaScript）

> 标准来源：本规范以 **[Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html)** 与
> **[Google HTML/CSS Style Guide](https://google.github.io/styleguide/htmlcssguide.html)** 为主要依据，
> 并结合 **[Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)** 中与原生前端项目相符的条目。
> 前端采用原生 HTML5 + CSS3 + JavaScript（无框架），遵循以下约定。

## 1. 文件组织

- 三个文件职责分离：
  - `index.html`：页面结构（结构层）
  - `style.css`：样式表现（表现层）
  - `app.js`：交互逻辑（行为层）
- 命名语义化：`expr-input`（表达式输入框）、`hist-panel`（历史面板）等。

## 2. HTML 规范

- 使用 HTML5 文档类型与语义化标签。
- 属性名使用小写 + 连字符（`data-key`、`aria-label`）。
- 按钮使用 `<button>` 而非 `<div>`，保证可访问性与键盘操作。
- 可交互元素必须绑定真实事件，禁止"僵尸按钮"。

## 3. CSS 规范

- 类名使用小写 + 连字符（`.expr-input`、`.hist-item`）。
- 缩进 2 空格；属性按 布局 → 视觉 → 字体 顺序书写。
- 颜色使用语义化注释分组（显示区 / 按键区 / 历史面板）。
- 深色主题统一色板：
  - 背景 `#17181a` / 面板 `#202124` / 按键 `#3c4043` / 功能键 `#5f6368` / 强调蓝 `#1a73e8`
- 不使用 `!important`（除非覆盖第三方样式）。

## 4. JavaScript 规范

- 一律 `const` / `let`，禁止 `var`；语句以分号结尾。
- 函数命名：动词开头（`calculate`、`loadHistory`、`deleteHistory`）。
- 状态集中管理（顶部状态区），渲染逻辑与事件逻辑分离。
- **前端不做任何数学计算**：数值运算全部通过 `fetch` 请求后端完成。
- 异步用 `async/await`；连续请求用队列保证顺序。
- 动态拼 HTML 时对用户可控内容做转义（`escapeHtml`），防 XSS。

## 5. 可访问性

- 表单控件提供 `aria-label`。
- 键盘全支持：数字 / 运算符 / 括号 / Enter(=) / Backspace / Esc。
- 焦点可见，操作有 hover/active 反馈。

## 6. 注释

- 文件头部说明职责；复杂状态流转写注释。
- 注释使用中文，术语保留英文原名。

## 7. 代码审查自检

提交前自查：

- [ ] 无 `eval`、无前端本地计算结果（全部走后端）
- [ ] 无僵尸按钮（每个按钮都有 handler）
- [ ] 动态内容已转义
- [ ] 深色风格统一、响应式可用
- [ ] 键盘操作完整
