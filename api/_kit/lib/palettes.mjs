// Farbpaletten. Jede Palette definiert dieselben Tokens; build.mjs prüft die Kontraste (WCAG AA).
//   bg/surface  Seitenhintergrund / abgesetzte Flächen (Karten, Wechselsektionen)
//   ink/muted   Text / Nebentext
//   line        feine Linien
//   accent      Buttons und Akzentflächen, accentInk = Text auf accent
//   accentText  Akzent als Textfarbe auf bg (Kicker, Links) – muss 4.5:1 erreichen
//   dark/darkInk dunkle Flächen (Header Kontrast, Footer, Band)

export const PALETTES = {
  salbei: {
    label: 'Salbei', mode: 'light',
    bg: '#f7f5ef', surface: '#eceee3', ink: '#1f261e', muted: '#4f5a49', line: '#d8dccd',
    accent: '#5b6f4c', accentInk: '#ffffff', accentText: '#4a5c3d', dark: '#232c20', darkInk: '#f2f0e8',
  },
  terracotta: {
    label: 'Terracotta', mode: 'light',
    bg: '#faf6f1', surface: '#f3e6da', ink: '#2a1f1a', muted: '#65544a', line: '#e5d4c4',
    accent: '#a9492a', accentInk: '#ffffff', accentText: '#9a4123', dark: '#36201a', darkInk: '#faefe6',
  },
  ozean: {
    label: 'Ozean', mode: 'light',
    bg: '#f5f8fa', surface: '#e5edf2', ink: '#12212b', muted: '#465864', line: '#d1dde5',
    accent: '#1d5a80', accentInk: '#ffffff', accentText: '#1d5a80', dark: '#0f2a3a', darkInk: '#eaf2f7',
  },
  sonne: {
    label: 'Sonne', mode: 'light',
    bg: '#fffaf0', surface: '#fff0cc', ink: '#2b2416', muted: '#62563d', line: '#efdcae',
    accent: '#f0b23a', accentInk: '#2b2416', accentText: '#8a5a00', dark: '#3b2f17', darkInk: '#fff6e0',
  },
  graphit: {
    label: 'Graphit & Gold', mode: 'light',
    bg: '#f6f6f3', surface: '#ebebe6', ink: '#151515', muted: '#55554f', line: '#dadad3',
    accent: '#c9a227', accentInk: '#151515', accentText: '#7d6205', dark: '#0e0e0e', darkInk: '#f4f2ec',
  },
  beere: {
    label: 'Beere', mode: 'light',
    bg: '#fbf8f6', surface: '#f1e7e5', ink: '#231a1d', muted: '#62535a', line: '#e4d6d3',
    accent: '#8b2b47', accentInk: '#ffffff', accentText: '#8b2b47', dark: '#2a1820', darkInk: '#f8eef0',
  },
  stube: {
    label: 'Stube (dunkel)', mode: 'dark',
    bg: '#161310', surface: '#1f1b16', ink: '#f4eee3', muted: '#c9bfae', line: '#2f2820',
    accent: '#b08d57', accentInk: '#161310', accentText: '#c9a56b', dark: '#0d0b09', darkInk: '#f4eee3',
  },

  // --- Natur-Reihe (Inspiration Reel 31.10.2026: «Wenn die Natur sagt, es passt zusammen») ---
  // Pistazie: Pistaziencreme + Bordeaux + Weinrot – Interior, Boutique, Hotel
  pistazie: {
    label: 'Pistazie', mode: 'light',
    bg: '#f6f5ec', surface: '#e4e7c9', ink: '#1f2116', muted: '#525541', line: '#d3d7b2',
    accent: '#6e1f35', accentInk: '#ffffff', accentText: '#6e1f35', dark: '#4a1727', darkInk: '#eef0d6',
  },
  // Schiefer: Schiefergrau + Kupfer + Lehm – Handwerk, Bau, Architektur
  schiefer: {
    label: 'Schiefer & Kupfer', mode: 'light',
    bg: '#f3f2ef', surface: '#e2e0db', ink: '#1d1e20', muted: '#4c4d4f', line: '#d0cdc6',
    accent: '#8b5733', accentInk: '#ffffff', accentText: '#82512f', dark: '#2d3033', darkInk: '#ece8e1',
  },
  // Flamingo: Puderrosa + Nachtblau + Koralle – Coiffeur, Boutique, Kinder
  flamingo: {
    label: 'Flamingo', mode: 'light',
    bg: '#fbf7f4', surface: '#f6e0da', ink: '#1b2335', muted: '#4c5265', line: '#ecd0c8',
    accent: '#233456', accentInk: '#ffffff', accentText: '#a83f2a', dark: '#1d2a47', darkInk: '#f8e2dc',
  },
  // Kiwi: Kiwigrün + Moos + Nussbaum – Café, Gärtnerei, Bio
  kiwi: {
    label: 'Kiwi', mode: 'light',
    bg: '#f8f6f0', surface: '#e9eed0', ink: '#241c14', muted: '#554e3d', line: '#d9e0b6',
    accent: '#56710f', accentInk: '#ffffff', accentText: '#4b630c', dark: '#38291c', darkInk: '#eaf2c6',
  },
  // Kokos: Kokosweiss + Travertin + Espresso – Physio, Spa, Therapie
  kokos: {
    label: 'Kokos & Travertin', mode: 'light',
    bg: '#f8f4ee', surface: '#ece3d4', ink: '#2a1e16', muted: '#5d4f43', line: '#dccfba',
    accent: '#6b4a33', accentInk: '#ffffff', accentText: '#6b4a33', dark: '#2f2119', darkInk: '#f4efe7',
  },
  // Feige: Creme + Aubergine + Feigenrot + Gold – Weinbar, Restaurant, Beauty
  feige: {
    label: 'Feige', mode: 'light',
    bg: '#faf5ef', surface: '#f1e5da', ink: '#2a1422', muted: '#5e4553', line: '#e5d3c8',
    accent: '#9b1f3a', accentInk: '#ffffff', accentText: '#8c1c35', dark: '#3e1a33', darkInk: '#f3e3c8',
  },
  // Glut (dunkel): Kohle + Bernstein + Rost – Grill, Pizzeria, Ofenbau
  glut: {
    label: 'Glut (dunkel)', mode: 'dark',
    bg: '#1a1412', surface: '#251c18', ink: '#f5eadf', muted: '#cdb9a9', line: '#3a2a23',
    accent: '#e0893a', accentInk: '#1a1412', accentText: '#ec9a4c', dark: '#0f0b0a', darkInk: '#f5eadf',
  },
  // Kolibri: Creme + Nachtindigo + Magenta (Layout «atelier» ergänzt Türkis, Sonnengelb, Koralle) – Kunst, Kreative
  kolibri: {
    label: 'Kolibri', mode: 'light',
    bg: '#fff8ec', surface: '#ffecd2', ink: '#1d1b3a', muted: '#4b4868', line: '#f2dcbc',
    accent: '#c81d5a', accentInk: '#ffffff', accentText: '#b0174e', dark: '#1d1b3a', darkInk: '#fff4e0',
  },
  // Galerie: Kalkweiss + Wandgrau + Tiefschwarz + Rost – Kunst, Design, Architektur
  galerie: {
    label: 'Galerie', mode: 'light',
    bg: '#f7f5f1', surface: '#e6e1d9', ink: '#171615', muted: '#57524c', line: '#dcd6cc',
    accent: '#171615', accentInk: '#f7f5f1', accentText: '#8a3a22', dark: '#1d1b19', darkInk: '#f3efe8',
  },
  // Beton: Nachtbeton + Kreide + Sprühgelb – Street Art, Wandmalerei, Graffiti (Layout «fresque»)
  beton: {
    label: 'Beton & Sprühgelb', mode: 'dark',
    bg: '#161615', surface: '#22211f', ink: '#f1efe9', muted: '#bcb8ae', line: '#34322e',
    accent: '#f5c400', accentInk: '#141414', accentText: '#f5c400', dark: '#0c0c0b', darkInk: '#f1efe9',
  },
  // Muschel: Perle + Pfirsich + Aprikose + Taupe – Kosmetik, Hochzeit, Wellness
  muschel: {
    label: 'Muschel', mode: 'light',
    bg: '#fcf8f4', surface: '#f6e5d8', ink: '#2b211c', muted: '#64544b', line: '#ebd6c6',
    accent: '#e6ad8a', accentInk: '#2b211c', accentText: '#8a5238', dark: '#5a463c', darkInk: '#fbefe6',
  },
};

// --- Kontrast (WCAG 2.x) ---
function lum(hex) {
  const n = hex.replace('#', '');
  const c = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function contrast(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

// Liefert Warnungen für alle Text/Hintergrund-Paare, die unter 4.5:1 liegen.
export function checkPalette(p) {
  const pairs = [
    ['ink', 'bg'], ['ink', 'surface'], ['muted', 'bg'], ['muted', 'surface'],
    ['accentInk', 'accent'], ['accentText', 'bg'], ['darkInk', 'dark'],
  ];
  return pairs
    .map(([t, b]) => ({ t, b, r: contrast(p[t], p[b]) }))
    .filter((x) => x.r < 4.5)
    .map((x) => `${x.t} auf ${x.b}: ${x.r.toFixed(2)}:1 (< 4.5)`);
}

export function paletteCss(p) {
  const map = {
    bg: p.bg, surface: p.surface, ink: p.ink, muted: p.muted, line: p.line,
    accent: p.accent, 'accent-ink': p.accentInk, 'accent-text': p.accentText,
    dark: p.dark, 'dark-ink': p.darkInk,
  };
  return Object.entries(map).map(([k, v]) => `--${k}:${v}`).join(';');
}

// --- Eigene Farben (Formular «Website mieten»: Logo-/Wunschfarben) ---
// Aus zwei Farben eine vollständige Palette mit denselben Tokens ableiten:
//   haupt  = Markenfarbe → dunkle Flächen (Header Kontrast, Footer, Band) und Tönung der hellen Flächen
//   akzent = Buttons/Akzente; als Textfarbe wird sie so weit abgedunkelt, bis 4.5:1 erreicht ist
// Zu helle oder zu dunkle Eingaben werden angepasst, damit checkPalette() nie anschlägt.
function hexToHsl(hex) {
  const n = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function hslToHex(h, s, l) {
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return '#' + [0, 8, 4].map((n) => Math.round(f(n) * 255).toString(16).padStart(2, '0')).join('');
}
// Helligkeit schrittweise ändern, bis Kontrast zu «gegen» erreicht ist
function untilContrast(hex, gegen, ziel, richtung) {
  let [h, s, l] = hexToHsl(hex), out = hex;
  while (contrast(out, gegen) < ziel && l > 0.02 && l < 0.98) { l += richtung * 0.02; out = hslToHex(h, s, l); }
  return out;
}

export function isHex(v) { return /^#[0-9a-f]{6}$/i.test(String(v || '')); }

export function customPalette(haupt, akzent) {
  // Akzent fast weiss/grau (z. B. weisses Logo) → Markenfarbe als Akzent
  const [, as, al] = hexToHsl(akzent);
  if (al > 0.9 || (as < 0.12 && al > 0.75)) akzent = haupt;
  const [hh, hs] = hexToHsl(haupt);
  const tint = Math.min(hs, 0.35);
  const bg = hslToHex(hh, tint * 0.6, 0.975);
  const surface = hslToHex(hh, tint, 0.93);
  const line = hslToHex(hh, tint, 0.86);
  const ink = hslToHex(hh, Math.min(hs, 0.25), 0.12);
  const muted = untilContrast(hslToHex(hh, Math.min(hs, 0.15), 0.38), surface, 4.6, -1);
  const darkInk = hslToHex(hh, tint * 0.5, 0.96);
  const dark = untilContrast(haupt, darkInk, 7, -1);
  const accentInk = contrast(akzent, '#ffffff') >= contrast(akzent, ink) ? '#ffffff' : ink;
  const accent = untilContrast(akzent, accentInk, 4.5, accentInk === '#ffffff' ? -1 : 1);
  const accentText = untilContrast(akzent, bg, 4.6, -1);
  return { label: 'Eigene Farben', mode: 'light', bg, surface, ink, muted, line, accent, accentInk, accentText, dark, darkInk };
}
