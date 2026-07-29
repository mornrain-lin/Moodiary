// ===== Moodiary · 数据层（localStorage） =====

const KEY = "moodiary.entries.v1";

/** 条目结构: { id, date:'YYYY-MM-DD', ts:ISO, mood, note, tags:[] } */

export function loadEntries() {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveEntries(entries) {
  localStorage.setItem(KEY, JSON.stringify(entries));
}

export function upsertEntry(entry) {
  const entries = loadEntries();
  const idx = entries.findIndex((e) => e.date === entry.date);
  if (idx >= 0) entries[idx] = entry;
  else entries.push(entry);
  saveEntries(entries);
  return entries;
}

export function removeAll() {
  localStorage.removeItem(KEY);
}

export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getEntryByDate(date) {
  return loadEntries().find((e) => e.date === date) || null;
}

// ===== 统计计算 =====
export function computeStats(entries) {
  if (!entries.length) return { streak: 0, total: 0, avg: null, best: null };

  const byDate = new Map(entries.map((e) => [e.date, e]));
  // 连续记录：从今天往前数
  let streak = 0;
  const d = new Date();
  while (true) {
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (byDate.has(ds)) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }

  const scores = entries.map((e) => MOOD_SCORE[e.mood] || 0);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

  const count = {};
  for (const e of entries) count[e.mood] = (count[e.mood] || 0) + 1;
  let best = null, bestN = -1;
  for (const k in count) if (count[k] > bestN) { bestN = count[k]; best = k; }

  return { streak, total: entries.length, avg, best };
}

import { MOOD_SCORE } from "./i18n.js";

// 标签维度统计：每个标签对应的平均心情与出现次数
export function computeTagStats(entries) {
  const map = new Map();
  for (const e of entries) {
    const score = MOOD_SCORE[e.mood] || 0;
    for (const tag of e.tags || []) {
      if (!map.has(tag)) map.set(tag, { sum: 0, n: 0, moods: {} });
      const o = map.get(tag);
      o.sum += score; o.n += 1; o.moods[e.mood] = (o.moods[e.mood] || 0) + 1;
    }
  }
  const out = [];
  for (const [tag, o] of map) {
    let topMood = null, topN = -1;
    for (const m in o.moods) if (o.moods[m] > topN) { topN = o.moods[m]; topMood = m; }
    out.push({ tag, avg: o.sum / o.n, n: o.n, topMood });
  }
  out.sort((a, b) => b.n - a.n);
  return out;
}

// 生成近 ~26 周的示例数据
export function generateSample() {
  const moods = ["happy", "calm", "tired", "anxious", "sad"];
  const tagsPool = ["work", "study", "family", "friends", "health", "exercise", "sleep", "diet", "entertainment", "weather"];
  const notes = ["顺利的一天", "有点累但还好", "想休息一下", "压力有点大", "和朋友们很开心", "睡得不错", "需要放松", ""];
  const out = [];
  const today = new Date();
  for (let i = 180; i >= 0; i--) {
    if (Math.random() < 0.32) continue; // 约 2/3 的日子有记录
    const d = new Date(today); d.setDate(today.getDate() - i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    // 周末更可能开心
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    let mood;
    const r = Math.random();
    if (weekend) mood = r < 0.55 ? "happy" : r < 0.8 ? "calm" : moods[Math.floor(Math.random() * 5)];
    else mood = r < 0.35 ? "calm" : r < 0.6 ? "tired" : moods[Math.floor(Math.random() * 5)];
    const tagN = 1 + Math.floor(Math.random() * 2);
    const tags = [];
    while (tags.length < tagN) {
      const t = tagsPool[Math.floor(Math.random() * tagsPool.length)];
      if (!tags.includes(t)) tags.push(t);
    }
    out.push({ id: ds, date: ds, ts: d.toISOString(), mood, note: notes[Math.floor(Math.random() * notes.length)], tags });
  }
  return out;
}
