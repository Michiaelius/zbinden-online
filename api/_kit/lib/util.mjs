export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Absätze: Leerzeile trennt <p>, einfacher Zeilenumbruch wird <br>.
export function paras(text, cls = '') {
  if (!text) return '';
  const c = cls ? ` class="${cls}"` : '';
  return String(text).split(/\n\s*\n/).map((p) => `<p${c}>${esc(p.trim()).replace(/\n/g, '<br>')}</p>`).join('\n');
}

export function slug(s) {
  return String(s).toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// 079 123 45 67 → +41791234567
export function telHref(t) {
  const d = String(t || '').replace(/[^\d+]/g, '');
  return d.startsWith('0') ? '+41' + d.slice(1) : d;
}

// Deterministische Zahl aus einem Text (für Grafik-Varianten pro Kunde).
export function seed(s) {
  let h = 2166136261;
  for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

export function initials(name) {
  const words = String(name).replace(/[^\p{L}\s&-]/gu, ' ').split(/[\s-]+/).filter((w) => w.length > 1 && !/^(gmbh|ag|und|and|et|der|die|das|le|la|les)$/i.test(w));
  return (words.length >= 2 ? words[0][0] + words[1][0] : (words[0] || '?').slice(0, 2)).toUpperCase();
}
