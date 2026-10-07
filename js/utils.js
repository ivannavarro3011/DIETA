// Subir junto con CACHE_NAME de sw.js en cada publicación.
export const APP_VERSION = 9;

export function todayStr() {
  return toDateStr(new Date());
}

export function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

export function formatDateHuman(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const opts = { weekday: 'long', day: 'numeric', month: 'long' };
  const s = d.toLocaleDateString('es-ES', opts);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Devuelve el lunes de la semana de dateStr
export function startOfWeek(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay(); // 0=domingo
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toDateStr(d);
}

export function weekDates(mondayStr) {
  return Array.from({ length: 7 }, (_, i) => addDays(mondayStr, i));
}

export function weekKey(mondayStr) {
  return mondayStr; // usamos la fecha del lunes como identificador de semana
}

export function round1(n) {
  return Math.round(n * 10) / 10;
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
