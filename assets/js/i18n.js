// ===== Moodiary · 国际化与情绪定义 =====

// 情绪定义（顺序即强度从正向到负向）
export const MOODS = [
  { key: "happy",   color: "var(--m-happy)",   emoji: "😄" },
  { key: "calm",    color: "var(--m-calm)",    emoji: "😌" },
  { key: "tired",   color: "var(--m-tired)",   emoji: "😪" },
  { key: "anxious", color: "var(--m-anxious)", emoji: "😰" },
  { key: "sad",     color: "var(--m-sad)",     emoji: "😢" },
];
// 数值映射：happy=5 ... sad=1，用于趋势图与平均
export const MOOD_SCORE = { happy: 5, calm: 4, tired: 3, anxious: 2, sad: 1 };

// 可选标签 key（大众通用场景）
export const TAGS = [
  "work", "study", "family", "friends", "health", "exercise",
  "sleep", "diet", "love", "money", "entertainment", "weather",
];

export function tagName(key) { return t("tag." + key); }

const DICT = {
  zh: {
    "brand.tag": "隐私优先的情绪日记",
    "today.title": "今天感觉如何？",
    "today.notePlaceholder": "写点什么吧（可选）…",
    "today.tags": "发生了什么？（可多选）",
    "today.save": "保存今天",
    "today.saved": "已保存 ✓",
    "today.updated": "已更新今天的记录 ✓",
    "stat.streak": "连续记录",
    "stat.total": "总记录",
    "stat.avg": "平均心情",
    "stat.best": "最常见心情",
    "heat.title": "心情日历",
    "heat.none": "暂无记录",
    "trend.title": "情绪趋势",
    "trend.empty": "记录越多，曲线越有意义～",
    "tags.title": "标签与心情",
    "tags.empty": "添加标签后，这里会显示每个场景下的心情分布。",
    "data.title": "你的数据",
    "data.desc": "所有数据都只保存在这台设备上（浏览器本地存储），不会上传到任何服务器。换设备前记得导出备份。",
    "data.export": "导出备份",
    "data.import": "导入备份",
    "data.sample": "载入示例",
    "data.reset": "清空数据",
    "footer.made": "用☕与☁️打造的隐私优先小工具",
    "footer.source": "查看源码",
    "toast.exported": "已导出备份文件",
    "toast.imported": "导入成功",
    "toast.importFail": "导入失败：文件格式不正确",
    "toast.sampled": "已载入示例数据",
    "toast.reset": "数据已清空",
    "toast.confirmReset": "确定要清空全部数据吗？此操作不可恢复。",
    "mood.happy": "开心", "mood.calm": "平静", "mood.tired": "疲惫",
    "mood.anxious": "焦虑", "mood.sad": "难过",
    "tag.work": "工作", "tag.study": "学习", "tag.family": "家庭",
    "tag.friends": "朋友", "tag.health": "健康", "tag.exercise": "运动",
    "tag.sleep": "睡眠", "tag.diet": "饮食", "tag.love": "恋爱",
    "tag.money": "金钱", "tag.entertainment": "娱乐", "tag.weather": "天气",
  },
  en: {
    "brand.tag": "A privacy-first mood diary",
    "today.title": "How are you feeling today?",
    "today.notePlaceholder": "Write something (optional)…",
    "today.tags": "What happened? (optional)",
    "today.save": "Save today",
    "today.saved": "Saved ✓",
    "today.updated": "Updated today's entry ✓",
    "stat.streak": "Day streak",
    "stat.total": "Entries",
    "stat.avg": "Avg mood",
    "stat.best": "Top mood",
    "heat.title": "Mood calendar",
    "heat.none": "No entries yet",
    "trend.title": "Mood trend",
    "trend.empty": "The more you log, the more meaningful this gets 💡",
    "tags.title": "Tags & moods",
    "tags.empty": "Add tags to see how different areas of life affect your mood.",
    "data.title": "Your data",
    "data.desc": "Everything stays on this device (browser local storage). Nothing is ever uploaded to a server. Export a backup before switching devices.",
    "data.export": "Export",
    "data.import": "Import",
    "data.sample": "Load demo",
    "data.reset": "Clear data",
    "footer.made": "A privacy-first toy, brewed with ☕ & ☁️",
    "footer.source": "View source",
    "toast.exported": "Backup file exported",
    "toast.imported": "Imported successfully",
    "toast.importFail": "Import failed: invalid file",
    "toast.sampled": "Demo data loaded",
    "toast.reset": "All data cleared",
    "toast.confirmReset": "Clear ALL data? This cannot be undone.",
    "mood.happy": "Happy", "mood.calm": "Calm", "mood.tired": "Tired",
    "mood.anxious": "Anxious", "mood.sad": "Sad",
    "tag.work": "Work", "tag.study": "Study", "tag.family": "Family",
    "tag.friends": "Friends", "tag.health": "Health", "tag.exercise": "Exercise",
    "tag.sleep": "Sleep", "tag.diet": "Diet", "tag.love": "Love",
    "tag.money": "Money", "tag.entertainment": "Entertainment", "tag.weather": "Weather",
  },
};

let currentLang = localStorage.getItem("moodiary.lang") || (navigator.language || "zh").toLowerCase().startsWith("zh") ? "zh" : "en";

export function getLang() { return currentLang; }
export function setLang(lang) { currentLang = lang; localStorage.setItem("moodiary.lang", lang); }

export function t(key) { return (DICT[currentLang] && DICT[currentLang][key]) || (DICT.en[key]) || key; }

export function moodName(key) { return t("mood." + key); }
