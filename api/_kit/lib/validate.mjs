// Prüft content.json, bevor gebaut wird. Fehler stoppen den Build, Hinweise nicht.

import { LAYOUTS } from './layouts.mjs';
import { PALETTES, isHex } from './palettes.mjs';
import { FONT_PAIRS } from './fonts.mjs';
import { ICON_NAMES } from './icons.mjs';
import { SECTION_TYPES } from './sections.mjs';

export function validate(c) {
  const errors = [];
  const hints = [];
  const need = (cond, msg) => { if (!cond) errors.push(msg); };
  const hint = (cond, msg) => { if (!cond) hints.push(msg); };

  need(c && typeof c === 'object', 'content.json ist kein Objekt');
  if (!c || typeof c !== 'object') return { errors, hints };

  need(LAYOUTS[c.layout], `layout "${c.layout}" unbekannt (${Object.keys(LAYOUTS).join(', ')})`);
  if (c.palette) need(PALETTES[c.palette], `palette "${c.palette}" unbekannt (${Object.keys(PALETTES).join(', ')})`);
  if (c.farben) need(isHex(c.farben.haupt) && isHex(c.farben.akzent), 'farben braucht haupt + akzent als #rrggbb');
  if (c.fonts) need(FONT_PAIRS[c.fonts], `fonts "${c.fonts}" unbekannt (${Object.keys(FONT_PAIRS).join(', ')})`);
  if (c.lang) need(['de', 'fr', 'en'].includes(c.lang.slice(0, 2)), `lang "${c.lang}" nicht unterstützt (de, fr, en)`);

  const f = c.firma || {};
  need(f.name, 'firma.name fehlt');
  hint(f.telefon || f.email, 'Weder firma.telefon noch firma.email – Besucher können niemanden erreichen');
  hint(f.adresse?.strasse, 'firma.adresse fehlt – nötig für Impressum und Google');
  hint(c.seo?.description, 'seo.description fehlt (wichtig für Google und KI-Suchen)');
  hint(c.domain, 'domain fehlt – canonical, og:image und Sitemap ohne absolute Adresse');

  const h = c.hero || {};
  need(h.titel, 'hero.titel fehlt');
  if (LAYOUTS[c.layout]?.hero === 'photo') hint(h.bild?.src, 'Layout mit Foto-Hero, aber hero.bild fehlt – es wird eine Grafik gezeigt');

  const S = c.sektionen || [];
  need(Array.isArray(S) && S.length, 'sektionen fehlt oder ist leer');
  const ids = new Set();
  S.forEach((s, i) => {
    const where = `sektionen[${i}] (${s.typ || '?'})`;
    need(SECTION_TYPES.includes(s.typ), `${where}: typ unbekannt (${SECTION_TYPES.join(', ')})`);
    if (s.id) { need(!ids.has(s.id), `${where}: id "${s.id}" doppelt`); ids.add(s.id); }
    if (s.nav) need(s.id, `${where}: nav gesetzt, aber keine id`);
    for (const it of s.items || []) if (it.icon) need(ICON_NAMES.includes(it.icon), `${where}: icon "${it.icon}" unbekannt`);
    if (s.typ === 'leistungen') need((s.items || []).length, `${where}: items leer`);
    if (s.typ === 'faq') need((s.items || []).every((q) => q.frage && q.antwort), `${where}: jede Frage braucht frage + antwort`);
    if (s.typ === 'kontakt') need(s.id === 'kontakt', `${where}: Kontakt-Sektion muss id "kontakt" haben (Buttons verlinken darauf)`);
  });
  hint(S.some((s) => s.typ === 'kontakt'), 'Keine Kontakt-Sektion');
  hint(S.some((s) => s.typ === 'faq'), 'Keine FAQ – für KI-Sichtbarkeit sehr empfohlen');

  return { errors, hints };
}
