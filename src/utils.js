// Small shared utilities
export function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Format seconds to mm:ss
export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Parse mm:ss or seconds string to seconds (number)
export function parseDuration(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  const parts = String(str).split(':').map(Number);
  if (parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) return parts[0] * 60 + parts[1];
  const n = Number(str);
  return Number.isNaN(n) ? 0 : n;
}

// Safe localStorage JSON helpers
export function getJson(key, defaultVal = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultVal;
    return JSON.parse(raw);
  } catch (e) {
    return defaultVal;
  }
}

export function setJson(key, obj) {
  try {
    localStorage.setItem(key, JSON.stringify(obj));
  } catch (e) {
    // ignore
  }
}

export function removeItem(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {}
}

// Count questions in a given section JSON
export async function countQuestionsInSection(moduleName, sec) {
  try {
    const resp = await fetch(`data/${moduleName}/seccion${sec}.json`);
    const jd = await resp.json();
    return Array.isArray(jd) ? jd.length : Array.isArray(jd.preguntas) ? jd.preguntas.length : 0;
  } catch (e) {
    return 0;
  }
}

// Update aggregated module stats by adding values (safe merge)
export function updateModuleAggregate(moduleName, addCorrect, addTotal) {
  try {
    const key = `stats_${moduleName}`;
    const existing = JSON.parse(localStorage.getItem(key) || '{}');
    const prevCorrect = existing.correct || 0;
    const prevTotal = existing.total || 0;
    const newCorrect = prevCorrect + (addCorrect || 0);
    const newTotal = prevTotal + (addTotal || 0);
    localStorage.setItem(key, JSON.stringify({ correct: newCorrect, total: newTotal, updated: new Date().toISOString() }));
  } catch (e) {
    // ignore
  }
}

// Compute module stats: prefer aggregated, fallback to per-section and JSON fetches
export async function computeModuleStats(mod) {
  try {
    const agg = JSON.parse(localStorage.getItem(`stats_${mod.name}`) || 'null');
    if (agg && typeof agg.correct === 'number' && typeof agg.total === 'number') {
      const correct = agg.correct;
      const total = agg.total;
      const incorrect = total - correct;
      return { correct, incorrect, notAnswered: 0, total };
    }
  } catch (e) {
    // fall through to per-section computation
  }
  let correct = 0, incorrect = 0, notAnswered = 0, total = 0;
  for (const sec of mod.sections) {
    const key = `resultado_${mod.name}_seccion${sec}`;
    const res = localStorage.getItem(key);
    if (res) {
      try {
        const obj = JSON.parse(res);
        correct += obj.score || 0;
        incorrect += ((obj.total || 0) - (obj.score || 0));
        total += obj.total || 0;
      } catch (e) {
        // ignore malformed
      }
    } else {
      const count = await countQuestionsInSection(mod.name, sec);
      notAnswered += count;
      total += count;
    }
  }
  return { correct, incorrect, notAnswered, total };
}
// src/utils.js

/**
 * Shuffle an array in place using Fisher-Yates algorithm.
 * @param {Array} array
 * @returns {Array}
 */
export function shuffle(array) {
  let m = array.length, t, i;
  while (m) {
    i = Math.floor(Math.random() * m--);
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }
  return array;
}

/**
 * Debounce a function to limit how often it can fire.
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
export function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Format a date as YYYY-MM-DD HH:mm:ss
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}
