export const nowIso = () => new Date().toISOString();

export function createId() {
  return crypto.randomUUID();
}

export function normalizeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function escapeHtml(text = '') {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function readJsonFile(file) {
  const text = await file.text();
  return JSON.parse(text);
}

export function setRoute(hash) {
  if (location.hash === hash) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    return;
  }
  location.hash = hash;
}
