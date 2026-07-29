// ===== Moodiary · 主应用 =====
import { MOODS, TAGS, t, getLang, setLang, moodName, tagName } from "./i18n.js";
import {
  loadEntries, saveEntries, upsertEntry, removeAll, todayStr,
  getEntryByDate, computeStats, computeTagStats, generateSample,
} from "./store.js";
import { renderHeatmap, renderHeatLegend, renderTrend, renderTagStats } from "./charts.js";

// ---------- 状态 ----------
let selectedMood = null;
let selectedTags = new Set();
let trendRange = 30;

// ---------- DOM ----------
const $ = (s) => document.querySelector(s);
const el = {
  body: document.body,
  langBtn: $("#langBtn"),
  themeBtn: $("#themeBtn"),
  todayDate: $("#todayDate"),
  moodPicker: $("#moodPicker"),
  note: $("#noteInput"),
  tagChips: $("#tagChips"),
  saveBtn: $("#saveBtn"),
  saveHint: $("#saveHint"),
  statStreak: $("#statStreak"),
  statTotal: $("#statTotal"),
  statAvg: $("#statAvg"),
  statBest: $("#statBest"),
  heatmap: $("#heatmap"),
  heatLegend: $("#heatLegend"),
  trendChart: $("#trendChart"),
  rangeTabs: $("#rangeTabs"),
  tagStats: $("#tagStats"),
  exportBtn: $("#exportBtn"),
  importFile: $("#importFile"),
  sampleBtn: $("#sampleBtn"),
  resetBtn: $("#resetBtn"),
  toast: $("#toast"),
  repoLink: $("#repoLink"),
};

// ---------- 工具 ----------
function toast(msg) {
  el.toast.textContent = msg;
  el.toast.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.toast.classList.remove("show"), 2200);
}

function applyI18n() {
  document.documentElement.lang = getLang() === "zh" ? "zh-CN" : "en";
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-ph]").forEach((node) => {
    node.setAttribute("placeholder", t(node.getAttribute("data-i18n-ph")));
  });
}

// ---------- 渲染：今日记录组件 ----------
function renderMoodPicker() {
  el.moodPicker.innerHTML = "";
  for (const m of MOODS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mood-btn" + (selectedMood === m.key ? " selected" : "");
    btn.style.setProperty("--mood-c", m.color);
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", selectedMood === m.key);
    btn.dataset.mood = m.key;
    btn.innerHTML = `<span class="mood-emoji">${m.emoji}</span><span class="mood-name">${moodName(m.key)}</span>`;
    btn.addEventListener("click", () => {
      selectedMood = m.key;
      renderMoodPicker();
      updateSaveState();
    });
    el.moodPicker.appendChild(btn);
  }
}

function renderTagChips() {
  el.tagChips.innerHTML = "";
  for (const tag of TAGS) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "tag-chip" + (selectedTags.has(tag) ? " on" : "");
    chip.textContent = tagName(tag);
    chip.addEventListener("click", () => {
      if (selectedTags.has(tag)) selectedTags.delete(tag);
      else selectedTags.add(tag);
      chip.classList.toggle("on");
    });
    el.tagChips.appendChild(chip);
  }
}

function updateSaveState() {
  el.saveBtn.disabled = !selectedMood;
}

function prefillToday() {
  const entry = getEntryByDate(todayStr());
  selectedMood = entry ? entry.mood : null;
  selectedTags = new Set(entry ? entry.tags || [] : []);
  el.note.value = entry ? entry.note || "" : "";
  el.saveBtn.textContent = entry ? t("today.updated").replace(" ✓", "") : t("today.save");
  if (entry) el.saveBtn.textContent = t("today.save"); // 统一按钮文案，靠 hint 区分
}

// ---------- 渲染：统计与图表 ----------
function renderStats() {
  const entries = loadEntries();
  const s = computeStats(entries);
  el.statStreak.textContent = s.streak;
  el.statTotal.textContent = s.total;
  el.statAvg.textContent = s.avg ? s.avg.toFixed(1) : "–";
  el.statBest.textContent = s.best ? MOODS.find((m) => m.key === s.best)?.emoji + " " + moodName(s.best) : "–";
  renderHeatmap(el.heatmap, entries);
  renderHeatLegend(el.heatLegend);
  renderTrend(el.trendChart, entries, trendRange);
  renderTagStats(el.tagStats, computeTagStats(entries));
}

// ---------- 保存 ----------
function onSave() {
  if (!selectedMood) return;
  const date = todayStr();
  const entry = {
    id: date, date, ts: new Date().toISOString(),
    mood: selectedMood, note: el.note.value.trim(), tags: [...selectedTags],
  };
  const existed = !!getEntryByDate(date);
  upsertEntry(entry);
  el.saveHint.textContent = existed ? t("today.updated") : t("today.saved");
  setTimeout(() => (el.saveHint.textContent = ""), 2500);
  renderStats();
}

// ---------- 数据管理 ----------
function onExport() {
  const entries = loadEntries();
  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const ds = todayStr().replace(/-/g, "");
  a.href = url; a.download = `moodiary-backup-${ds}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast(t("toast.exported"));
}

function onImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data)) throw new Error("bad");
      saveEntries(data);
      prefillToday(); renderTagChips(); renderMoodPicker();
      renderStats();
      toast(t("toast.imported"));
    } catch {
      toast(t("toast.importFail"));
    }
  };
  reader.readAsText(file);
  e.target.value = "";
}

function onSample() {
  saveEntries(generateSample());
  prefillToday(); renderTagChips(); renderMoodPicker();
  renderStats();
  toast(t("toast.sampled"));
}

function onReset() {
  if (!confirm(t("toast.confirmReset"))) return;
  removeAll();
  selectedMood = null; selectedTags = new Set(); el.note.value = "";
  renderMoodPicker(); renderTagChips(); renderStats();
  toast(t("toast.reset"));
}

// ---------- 主题 / 语言 ----------
function initTheme() {
  const saved = localStorage.getItem("moodiary.theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (prefersDark ? "dark" : "light");
  setTheme(theme);
}
function setTheme(theme) {
  el.body.setAttribute("data-theme", theme);
  localStorage.setItem("moodiary.theme", theme);
  el.themeBtn.querySelector(".theme-icon").textContent = theme === "dark" ? "☀️" : "🌙";
}
function toggleTheme() {
  setTheme(el.body.getAttribute("data-theme") === "dark" ? "light" : "dark");
}
function toggleLang() {
  setLang(getLang() === "zh" ? "en" : "zh");
  applyI18n();
  renderMoodPicker(); renderTagChips(); renderStats();
  prefillToday();
}

// ---------- 初始化 ----------
function init() {
  // repo 链接与页脚
  const repoUrl = "https://github.com";
  el.repoLink.href = repoUrl;

  initTheme();
  applyI18n();

  el.todayDate.textContent = new Date().toLocaleDateString(getLang() === "zh" ? "zh-CN" : "en-US",
    { year: "numeric", month: "long", day: "numeric", weekday: "long" });

  renderMoodPicker();
  renderTagChips();
  prefillToday();
  renderStats();
  updateSaveState();

  // 事件
  el.saveBtn.addEventListener("click", onSave);
  el.exportBtn.addEventListener("click", onExport);
  el.importFile.addEventListener("change", onImport);
  el.sampleBtn.addEventListener("click", onSample);
  el.resetBtn.addEventListener("click", onReset);
  el.themeBtn.addEventListener("click", toggleTheme);
  el.langBtn.addEventListener("click", toggleLang);
  el.rangeTabs.addEventListener("click", (e) => {
    const tab = e.target.closest(".range-tab");
    if (!tab) return;
    trendRange = Number(tab.dataset.range);
    el.rangeTabs.querySelectorAll(".range-tab").forEach((b) => b.classList.toggle("active", b === tab));
    renderStats();
  });

  // PWA
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("assets/sw.js").catch(() => {}));
  }
}

init();
