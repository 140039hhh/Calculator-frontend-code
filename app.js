/**
 * 计算器前端逻辑（前后端分离作业 · 前端部分）
 *
 * 职责：界面交互 + 表达式输入 + 发送计算请求 + 显示结果与历史。
 * 所有数值计算（表达式求值、一元运算、百分号）均由后端完成，
 * 前端只做字符串拼接与展示 —— 停掉后端后，前端无法独立获得计算结果。
 */

"use strict";

// ---------- 状态 ----------
let lastResult = "0";       // 最近一次计算结果（用于记忆等）
let error = false;          // 错误状态
let errorMsg = "";
let memory = 0;             // 记忆值
let memorySet = false;      // 是否有记忆

// DOM
const exprInput = document.getElementById("expr-input");
const mainLabel = document.getElementById("main-label");
const memLabel = document.getElementById("mem-label");

// ---------- 后端调用 ----------

const API_BASE = "https://calculator-backend-code-1.onrender.com";

async function callApi(path, body) {
  const res = await fetch(API_BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

/** 串行队列：保证快速连续按键时请求按顺序生效 */
let chain = Promise.resolve();
function enqueue(fn) {
  chain = chain.then(fn).catch((e) => console.error(e));
}

function fmt(v) {
  if (v === null || v === undefined) return "0";
  if (Number.isInteger(v)) return String(v);
  const s = String(v);
  return s === "-0" ? "0" : s;
}

// ---------- 显示 ----------

function render() {
  if (error) {
    mainLabel.textContent = errorMsg;
    mainLabel.classList.add("error");
  } else {
    mainLabel.textContent = lastResult;
    mainLabel.classList.remove("error");
  }
  memLabel.textContent = memorySet ? "M" : "";
}

function setError(msg) {
  error = true;
  errorMsg = msg;
  render();
}

function clearError() {
  error = false;
  errorMsg = "";
}

// ---------- 表达式输入 ----------

function focusInput() {
  exprInput.focus();
}

/** 在光标处插入文本（按钮点击 / 键盘输入共用） */
function insertAtCursor(text) {
  focusInput();
  const start = exprInput.selectionStart ?? exprInput.value.length;
  const end = exprInput.selectionEnd ?? exprInput.value.length;
  const v = exprInput.value;
  exprInput.value = v.slice(0, start) + text + v.slice(end);
  const pos = start + text.length;
  exprInput.setSelectionRange(pos, pos);
  render();
}

// ---------- 按键处理 ----------

function press(key) {
  enqueue(() => handleKey(key));
}

async function handleKey(key) {
  if (key === "C") return clearAll();
  if (key === "CE") return clearEntry();
  if (key === "BS") return backspace();
  if (key === "=") return calculate();
  if (key === "MC" || key === "MR" || key === "M+" || key === "M-") return memoryOp(key);
  if (key === "%") return percentOp();
  if (key === "√" || key === "∛x" || key === "x²" || key === "1/x" || key === "+/-") return unaryOp(key);
  // 数字 / 小数点 / 运算符 / 括号：直接插入表达式
  if (/^[0-9]$/.test(key) || key === "." || key === "+" || key === "-" || key === "×" || key === "÷" || key === "(" || key === ")") {
    return insertAtCursor(key);
  }
}

async function calculate() {
  clearError();
  const expression = exprInput.value.trim();
  if (!expression) return;
  const r = await callApi("/api/calculate", { expression });
  if (!r.success) return setError(r.message);
  lastResult = fmt(r.result);
  // 结果成为当前输入值，便于继续运算
  exprInput.value = lastResult;
  render();
  refreshHistoryIfOpen();
}

async function unaryOp(key) {
  clearError();
  const expression = exprInput.value.trim();
  if (!expression) return;
  const opMap = {
    "√": "sqrt",
    "∛x": "cbrt",
    "x²": "square",
    "1/x": "reciprocal",
    "+/-": "negate",
  };
  const r = await callApi("/api/unary", { expression, op: opMap[key] });
  if (!r.success) return setError(r.message);
  lastResult = fmt(r.result);
  exprInput.value = lastResult;
  render();
  refreshHistoryIfOpen();
}

async function percentOp() {
  clearError();
  const expression = exprInput.value.trim();
  if (!expression) return;
  const r = await callApi("/api/percent", { expression });
  if (!r.success) return setError(r.message);
  lastResult = fmt(r.result);
  exprInput.value = lastResult;
  render();
  refreshHistoryIfOpen();
}

async function memoryOp(key) {
  if (key === "MC") {
    memory = 0;
    memorySet = false;
  } else if (key === "MR") {
    exprInput.value = fmt(memory);
    lastResult = fmt(memory);
  } else if (key === "M+") {
    memory += parseFloat(lastResult) || 0;
    memorySet = true;
  } else if (key === "M-") {
    memory -= parseFloat(lastResult) || 0;
    memorySet = true;
  }
  render();
}

async function clearAll() {
  exprInput.value = "";
  lastResult = "0";
  clearError();
  render();
}

async function clearEntry() {
  clearError();
  exprInput.value = "";
  render();
}

async function backspace() {
  clearError();
  const v = exprInput.value;
  if (v.length === 0) return;
  const start = exprInput.selectionStart ?? v.length;
  const end = exprInput.selectionEnd ?? v.length;
  if (start === end && start > 0) {
    exprInput.value = v.slice(0, start - 1) + v.slice(end);
    exprInput.setSelectionRange(start - 1, start - 1);
  } else {
    exprInput.value = v.slice(0, start) + v.slice(end);
    exprInput.setSelectionRange(start, start);
  }
  render();
}

// ---------- 事件绑定 ----------

document.querySelectorAll(".key").forEach((btn) => {
  btn.addEventListener("click", () => press(btn.dataset.key));
});

// 键盘支持：数字 / 运算符 / 括号 / Enter / Backspace / Esc / Delete / S R T I N
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key;
  if (/^[0-9]$/.test(k)) press(k);
  else if (k === ".") press(".");
  else if (k === "(" || k === ")") press(k);
  else if (k === "+" || k === "-" || k === "*" || k === "/") press({ "*": "×", "/": "÷" }[k] || k);
  else if (k === "%") press("%");
  else if (k === "=" || k === "Enter") press("=");
  else if (k === "Backspace") press("BS");
  else if (k === "Escape") press("C");
  else if (k === "Delete") press("CE");
  else if (k === "s" || k === "S") press("x²");
  else if (k === "r" || k === "R") press("√");
  else if (k === "t" || k === "T") press("∛x");
  else if (k === "i" || k === "I") press("1/x");
  else if (k === "n" || k === "N") press("+/-");
  else return;
  e.preventDefault();
});

// 手动输入时归一化：* -> ×，/ -> ÷（避免与表达式解析歧义）
exprInput.addEventListener("input", () => {
  const v = exprInput.value;
  if (v.includes("*") || v.includes("/")) {
    exprInput.value = v.replace(/\*/g, "×").replace(/\//g, "÷");
  }
  clearError();
  render();
});

// ---------- 计算历史 ----------

const histBtn = document.getElementById("hist-btn");
const histPanel = document.getElementById("hist-panel");
const histList = document.getElementById("hist-list");
const histClear = document.getElementById("hist-clear");
const histClose = document.getElementById("hist-close");
let histOpen = false;

async function loadHistory() {
  try {
    const res = await fetch(API_BASE + "/api/history");
    const data = await res.json();
    renderHistory(data.list || []);
  } catch (e) {
    renderHistory([]);
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function renderHistory(list) {
  if (list.length === 0) {
    histList.innerHTML = '<li class="hist-empty">暂无计算记录</li>';
    return;
  }
  histList.innerHTML = list.map((r) =>
    `<li class="hist-item" data-result="${escapeHtml(r.result)}">` +
      `<span class="hist-main">` +
        `<span class="hist-expr">${escapeHtml(r.expression)}</span>` +
        `<span class="hist-eq">=</span>` +
        `<span class="hist-result">${escapeHtml(r.result)}</span>` +
      `</span>` +
      `<span class="hist-time">${escapeHtml(r.created_at || r.time)}</span>` +
      `<button class="hist-del" data-id="${escapeHtml(r.id)}" title="删除这条记录">×</button>` +
    `</li>`
  ).join("");
}

function refreshHistoryIfOpen() {
  if (histOpen) loadHistory();
}

async function deleteHistory(id) {
  try {
    await fetch(API_BASE + "/api/history/" + encodeURIComponent(id), { method: "DELETE" });
    loadHistory();
  } catch (e) { /* 忽略 */ }
}

async function clearHistory() {
  try {
    await fetch(API_BASE + "/api/history", { method: "DELETE" });
    loadHistory();
  } catch (e) { /* 忽略 */ }
}

// 面板开关
histBtn.addEventListener("click", () => {
  histOpen = !histOpen;
  histPanel.classList.toggle("hidden", !histOpen);
  if (histOpen) loadHistory();
});

histClose.addEventListener("click", () => {
  histOpen = false;
  histPanel.classList.add("hidden");
});

histClear.addEventListener("click", clearHistory);

// 删除单条 / 点击条目复用结果（事件委托）
histList.addEventListener("click", (e) => {
  const delBtn = e.target.closest(".hist-del");
  if (delBtn) {
    e.stopPropagation();
    deleteHistory(delBtn.dataset.id);
    return;
  }
  const item = e.target.closest(".hist-item");
  if (item) {
    exprInput.value = item.dataset.result;
    lastResult = item.dataset.result;
    render();
  }
});

// 首次进入聚焦输入框
exprInput.focus();
render();
