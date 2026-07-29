// ===== Moodiary · 零依赖图表（热力图 / 趋势图） =====
import { MOODS, MOOD_SCORE, moodName, tagName, t } from "./i18n.js";

const MOOD_COLOR = Object.fromEntries(MOODS.map((m) => [m.key, m.color]));
const MOOD_EMOJI = Object.fromEntries(MOODS.map((m) => [m.key, m.emoji]));

function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ---- 日历热力图（GitHub 风格，Last ~26 周）----
export function renderHeatmap(container, entries) {
  container.innerHTML = "";
  const byDate = new Map(entries.map((e) => [e.date, e]));
  const weeks = 26;
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - (weeks * 7 - 1));
  start.setDate(start.getDate() - start.getDay()); // 对齐到周日

  const frag = document.createDocumentFragment();
  const cur = new Date(start);
  while (cur <= today) {
    const ds = fmtDate(cur);
    const cell = document.createElement("div");
    cell.className = "heat-cell";
    const entry = byDate.get(ds);
    if (entry) {
      const score = MOOD_SCORE[entry.mood] || 3;
      const opacity = 0.35 + (score / 5) * 0.65;
      cell.style.background = MOOD_COLOR[entry.mood];
      cell.style.opacity = opacity.toFixed(2);
      const note = entry.note ? ` · ${entry.note}` : "";
      cell.setAttribute("data-tip", `${ds} ${MOOD_EMOJI[entry.mood]} ${moodName(entry.mood)}${note}`);
    }
    frag.appendChild(cell);
    cur.setDate(cur.getDate() + 1);
  }
  container.appendChild(frag);
}

export function renderHeatLegend(container) {
  container.innerHTML = "";
  for (const m of MOODS) {
    const span = document.createElement("span");
    span.innerHTML = `<i style="background:${m.color}"></i>${moodName(m.key)}`;
    container.appendChild(span);
  }
}

// ---- 情绪趋势折线图（SVG）----
export function renderTrend(container, entries, range) {
  container.innerHTML = "";
  if (!entries.length) {
    const p = document.createElement("p");
    p.className = "empty-hint";
    p.textContent = t("trend.empty");
    container.appendChild(p);
    return;
  }
  const byDate = new Map(entries.map((e) => [e.date, e]));
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - (range - 1));

  const days = [];
  const cur = new Date(start);
  while (cur <= today) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }

  const W = 600, H = 220, padL = 36, padR = 12, padT = 16, padB = 26;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const x = (i) => padL + (plotW * i) / (days.length - 1);
  const y = (s) => padT + plotH * (1 - (s - 1) / 4); // score 1..5

  const pts = days
    .map((d, i) => ({ i, d, e: byDate.get(fmtDate(d)), s: byDate.get(fmtDate(d)) ? MOOD_SCORE[byDate.get(fmtDate(d)).mood] : null }))
    .filter((p) => p.s !== null);

  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  // 网格线 + Y 轴标签
  for (let s = 1; s <= 5; s++) {
    const gy = y(s);
    const line = document.createElementNS(ns, "line");
    line.setAttribute("x1", padL); line.setAttribute("x2", W - padR);
    line.setAttribute("y1", gy); line.setAttribute("y2", gy);
    line.setAttribute("stroke", "var(--border)"); line.setAttribute("stroke-width", "1");
    svg.appendChild(line);
    const lbl = document.createElementNS(ns, "text");
    lbl.setAttribute("x", padL - 8); lbl.setAttribute("y", gy + 4);
    lbl.setAttribute("text-anchor", "end"); lbl.setAttribute("font-size", "10");
    lbl.setAttribute("fill", "var(--text-faint)");
    lbl.textContent = s;
    svg.appendChild(lbl);
  }

  // 折线 + 区域
  if (pts.length > 1) {
    const dLine = pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.i).toFixed(1)},${y(p.s).toFixed(1)}`).join(" ");
    const area = `${dLine} L${x(pts[pts.length - 1].i).toFixed(1)},${y(1)} L${x(pts[0].i).toFixed(1)},${y(1)} Z`;

    const grad = document.createElementNS(ns, "linearGradient");
    grad.setAttribute("id", "trendGrad"); grad.setAttribute("x1", "0"); grad.setAttribute("y1", "0"); grad.setAttribute("x2", "0"); grad.setAttribute("y2", "1");
    grad.innerHTML = `<stop offset="0%" stop-color="var(--primary)" stop-opacity="0.28"/><stop offset="100%" stop-color="var(--primary)" stop-opacity="0"/>`;
    svg.appendChild(grad);

    const areaPath = document.createElementNS(ns, "path");
    areaPath.setAttribute("d", area); areaPath.setAttribute("fill", "url(#trendGrad)");
    svg.appendChild(areaPath);

    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", dLine); path.setAttribute("fill", "none");
    path.setAttribute("stroke", "var(--primary)"); path.setAttribute("stroke-width", "2.5");
    path.setAttribute("stroke-linejoin", "round"); path.setAttribute("stroke-linecap", "round");
    svg.appendChild(path);
  }

  // 数据点
  for (const p of pts) {
    const c = document.createElementNS(ns, "circle");
    c.setAttribute("cx", x(p.i)); c.setAttribute("cy", y(p.s)); c.setAttribute("r", "3.2");
    c.setAttribute("fill", MOOD_COLOR[p.e.mood]); c.setAttribute("stroke", "var(--surface-solid)"); c.setAttribute("stroke-width", "1.5");
    const tip = `${fmtDate(p.d)} ${MOOD_EMOJI[p.e.mood]} ${moodName(p.e.mood)}`;
    c.setAttribute("data-tip", tip);
    svg.appendChild(c);
  }

  // X 轴月份标签
  let lastMonth = -1;
  for (let i = 0; i < days.length; i += Math.ceil(days.length / 6)) {
    const d = days[i];
    if (d.getMonth() !== lastMonth) {
      lastMonth = d.getMonth();
      const lbl = document.createElementNS(ns, "text");
      lbl.setAttribute("x", x(i)); lbl.setAttribute("y", H - 8);
      lbl.setAttribute("text-anchor", "middle"); lbl.setAttribute("font-size", "9");
      lbl.setAttribute("fill", "var(--text-faint)");
      lbl.textContent = `${d.getMonth() + 1}/${d.getDate()}`;
      svg.appendChild(lbl);
    }
  }

  container.appendChild(svg);
}

// ---- 标签统计 ----
export function renderTagStats(container, tagStats) {
  container.innerHTML = "";
  if (!tagStats.length) {
    const p = document.createElement("p");
    p.className = "empty-hint"; p.textContent = t("tags.empty");
    container.appendChild(p);
    return;
  }
  for (const ts of tagStats) {
    const div = document.createElement("div");
    div.className = "tag-stat";
    const avgPct = Math.round(((ts.avg - 1) / 4) * 100);
    div.innerHTML = `
      <div class="ts-name"><span class="tag-dot" style="background:${MOOD_COLOR[ts.topMood]}"></span>${tagName(ts.tag)}</div>
      <div class="ts-meta">${MOOD_EMOJI[ts.topMood]} ${moodName(ts.topMood)} · ${ts.n}× · ${avgPct}%</div>`;
    container.appendChild(div);
  }
}
