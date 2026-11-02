// Grafische Platzhalter statt Stockfotos: ruhige geometrische Kompositionen in den
// Palettenfarben (über CSS-Variablen), pro Kunde leicht variiert über einen Seed.
// Werden nur verwendet, wenn content.json für die Stelle kein Bild angibt.

import { seed as hash, esc } from './util.mjs';

const F = { a: 'var(--accent)', s: 'var(--surface)', d: 'var(--dark)', l: 'var(--line)', b: 'var(--bg)' };

function rng(n) {
  let x = n || 1;
  return () => ((x = Math.imul(x ^ (x >>> 15), 2246822507) ^ Math.imul(x ^ (x >>> 13), 3266489909)) >>> 0) / 4294967296;
}

const KINDS = {
  // Bögen – ruhig, architektonisch
  arches(r) {
    const n = 3 + Math.floor(r() * 2);
    let s = `<rect width="400" height="300" fill="${F.s}"/>`;
    for (let i = 0; i < n; i++) {
      const w = 400 / n, x = i * w, h = 150 + r() * 110;
      const fill = i % 2 ? F.a : F.d;
      s += `<path d="M${x + 10} 300V${300 - h + w / 2 - 10}a${w / 2 - 10} ${w / 2 - 10} 0 0 1 ${w - 20} 0V300z" fill="${fill}" opacity="${i % 2 ? 0.9 : 0.85}"/>`;
    }
    return s;
  },
  // Kreise – weich, freundlich
  circles(r) {
    let s = `<rect width="400" height="300" fill="${F.s}"/>`;
    const cx = 120 + r() * 160, cy = 110 + r() * 80;
    s += `<circle cx="${cx}" cy="${cy}" r="${110 + r() * 30}" fill="${F.a}" opacity=".9"/>`;
    s += `<circle cx="${cx + 90 - r() * 180}" cy="${cy + 70}" r="${50 + r() * 30}" fill="${F.d}" opacity=".85"/>`;
    s += `<circle cx="${60 + r() * 280}" cy="${40 + r() * 40}" r="${14 + r() * 10}" fill="${F.d}"/>`;
    return s;
  },
  // Blöcke – kräftig, technisch
  blocks(r) {
    let s = `<rect width="400" height="300" fill="${F.d}"/>`;
    const cols = 4, rows = 3;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const v = r();
      if (v < 0.35) continue;
      s += `<rect x="${i * 100 + 6}" y="${j * 100 + 6}" width="88" height="88" fill="${v > 0.75 ? F.a : F.s}" opacity="${v > 0.75 ? 1 : 0.14}"/>`;
    }
    return s;
  },
  // Linien – editorial
  lines(r) {
    let s = `<rect width="400" height="300" fill="${F.s}"/>`;
    for (let i = 0; i < 9; i++) {
      const y = 30 + i * 30 + r() * 6;
      s += `<path d="M0 ${y}C130 ${y - 30 * r()} 260 ${y + 30 * r()} 400 ${y - 10}" stroke="${i === 4 ? F.a : F.d}" stroke-width="${i === 4 ? 6 : 1.2}" fill="none" opacity="${i === 4 ? 1 : 0.5}"/>`;
    }
    s += `<circle cx="${280 + r() * 60}" cy="${70 + r() * 40}" r="36" fill="${F.a}"/>`;
    return s;
  },
};

export const ART_BY_LAYOUT = { klar: 'arches', warm: 'circles', kontrast: 'blocks', editorial: 'lines', atelier: 'circles', galerie: 'lines', stube: 'arches' };

export function art(kind, seedText, label = '') {
  const draw = KINDS[kind] || KINDS.arches;
  const svg = draw(rng(hash(seedText)));
  return `<svg class="art" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(label || 'Grafik')}">${svg}</svg>`;
}
