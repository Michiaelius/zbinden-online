/**
 * Rédaction du content.json de l'ébauche gratuite (« Kostenloser Entwurf ») par Claude.
 * Entrée : le brief du formulaire (api/website-entwurf.mjs) et, s'il existe, le texte du site actuel.
 * Sortie : { content, pruefen } : content = content.json du Starter-Kit (api/_kit), pruefen = points
 * que Pauline doit vérifier avant d'envoyer le lien (hypothèses du modèle).
 * Le code fixe ensuite ce qui ne doit pas venir du modèle : couleurs, logo, domaine, e-mail.
 *
 * Variable d'environnement : ANTHROPIC_API_KEY (optionnel : ENTWURF_MODEL, défaut claude-opus-5-5)
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LAYOUTS } from '../_kit/lib/layouts.mjs';
import { PALETTES } from '../_kit/lib/palettes.mjs';
import { ICON_NAMES } from '../_kit/lib/icons.mjs';
import { validate } from '../_kit/lib/validate.mjs';

const MODEL_DEFAULT = 'claude-opus-5-5';
const KIT = join(dirname(fileURLToPath(import.meta.url)), '..', '_kit');
const LANG_NAME = { de: 'Deutsch (Schweiz, ohne ß, formelles Sie)', fr: 'Französisch (Schweiz, vouvoiement)', en: 'Englisch (höflich)' };
// Spezial-Layouts und -Paletten nur für ihre Branche
const SPECIAL = { stube: 'nur Restaurants, Bars, Hotels', galerie: 'nur Kunstschaffende mit Werken', atelier: 'nur Kreative/Kinderangebote' };

function system(example) {
  const layouts = Object.entries(LAYOUTS).map(function ([id, l]) {
    return `- ${id}: ${l.label} · passt zu: ${l.passtZu}${SPECIAL[id] ? ` (${SPECIAL[id]})` : ''}`;
  }).join('\n');
  const palettes = Object.entries(PALETTES).filter(function ([id]) { return !['stube', 'galerie', 'kolibri'].includes(id); })
    .map(function ([id, p]) { return `${id} (${p.label || id}${p.mode === 'dark' ? ', dunkel' : ''})`; }).join(', ');
  return `Du schreibst die content.json für einen kostenlosen ERSTEN ENTWURF einer Website von Zbinden Software
(Pauline Zbinden, Webdesign für Schweizer KMU). Die Firma hat den Entwurf selbst angefragt. Pauline prüft
den Entwurf, bevor der Link an die Firma geht. Der Starter-Kit baut daraus eine One-Page-Website.

Ziel: Die Firma öffnet den Link und denkt «Wow, das ist ja schon meine Website». Also konkret, warm,
auf die Firma zugeschnitten, keine Floskeln, keine Platzhalter wie «Lorem ipsum» oder «[Name]».

Fakten (sehr wichtig, Pauline haftet gegenüber der Firma):
- Nur Fakten aus der Anfrage oder dem Text der aktuellen Website. NIE erfinden: keine Jahreszahlen,
  Anzahl Jahre Erfahrung, Mitarbeiterzahlen, Diplome, Zertifikate, Preise, Öffnungszeiten, Adressen,
  Namen von Personen, Kundenstimmen, Bewertungen, Auszeichnungen, Garantien.
- Keine Sektion «stimmen» (Kundenstimmen), ausser die Website zitiert echte Stimmen wörtlich.
- Keine Versprechen, die die Firma nicht selbst macht (z. B. «Erstgespräch kostenlos», «24h-Service»).
- Allgemeine Texte über das Angebot sind erlaubt (was eine Leistung bringt, wie eine Zusammenarbeit
  abläuft), solange sie nichts Prüfbares behaupten.
- Alles, was du annimmst und Pauline prüfen sollte, kommt in die Liste «pruefen» (kurz, auf Französisch,
  denn Pauline liest Französisch).

Sprache: ALLE Texte der Website in der verlangten Sprache. Auch nav, kicker, Buttons.

Aufbau (5 bis 7 Sektionen, in dieser Reihenfolge sinnvoll wählen):
- hero: kicker (2 bis 4 Angebote mit « · »), titel (kurz, stark, max. 8 Wörter), text (2 Sätze),
  cta { label, ziel: "#kontakt" }, cta2 { label, ziel: "#<id einer Sektion>" }, punkte (3 kurze Fakten aus der Anfrage, sonst weglassen)
- leistungen: 3 bis 6 items { icon, titel, text } (Icons NUR aus: ${ICON_NAMES.join(', ')})
- optional split { titel, text, punkte } oder zitat { text } (ein Satz, der die Haltung der Firma zeigt, ohne autor)
- optional ueber { kicker, titel, text, punkte } nur mit echten Angaben, OHNE bild.src
- ablauf { kicker, titel, intro, schritte: 3 bis 4 { titel, text } }
- optional region { titel, text, orte } nur wenn der Ort bekannt ist (orte: echte Nachbarorte)
- faq: 3 bis 5 items { frage, antwort }, Fragen, die Kunden dieser Branche wirklich stellen, Antworten ohne erfundene Fakten
- kontakt { typ: "kontakt", id: "kontakt", nav, kicker, titel, intro, formular: "kontakt" } (immer zuletzt)
Jede Sektion mit nav braucht eine id (kleingeschrieben, ohne Umlaute). Höchstens 5 nav-Einträge
(Sektionen mit nav + seiten zusammen).

Nur wenn der Umfang «mehrseitig» ist: Die fertige Website hat mehrere Seiten, der Entwurf zeigt nur die
Startseite. Man soll trotzdem sofort sehen, dass es weitere Seiten gibt:
- "seiten": 2 bis 4 Unterseiten [{ "label", "slug" }] passend zum Angebot (z. B. eine Seite pro Hauptleistung,
  Produkte, Referenzen, Über uns). Sie erscheinen im Menü. slug: a-z, 0-9, Bindestrich.
- In leistungen bei jedem item, das eine eigene Seite bekommt: "mehr": { "label": "Mehr erfahren", "ziel": "seite:<slug>" }
  (Label in der Sprache der Website, gerne konkreter, z. B. «Zu den Produkten»).
- 1 bis 2 weitere Buttons mit "ziel": "seite:<slug>" (leistungen.cta, split.cta), z. B. «Alle Referenzen ansehen».
- Die Sektionen der Startseite bleiben eine Übersicht; keine nav-Einträge für Sektionen, die eine eigene Seite werden.
Bei «onepager» oder «offen»: KEINE seiten und KEINE "seite:"-Ziele.
KEINE Bilder (kein "src" irgendwo): der Kit zeigt Formen in den Farben der Firma.

Gestaltung:
- layout: passend zur Branche wählen:
${layouts}
- palette: nur wenn verlangt «Palette wählen», eine aus: ${palettes}. Sonst weglassen.
- fonts weglassen (das Layout wählt sie).

firma: { name, kurzname (kurz, für Logo-Initialen), branche, schemaTyp (schema.org, z. B. LocalBusiness,
HomeAndConstructionBusiness, ProfessionalService, HealthAndBeautyBusiness, Store), slogan, beschreibung (1 Satz),
adresse { strasse, plz, ort } (strasse und plz NUR wenn auf der Website, sonst nur ort), region (1 bis 3),
telefon, whatsapp (true nur bei einer Handynummer 07x), email }
seo: { title (max. 60 Zeichen, Angebot + Ort + Firma), description (max. 155 Zeichen) }
lang: Sprachcode. domain weglassen (setzt der Code).

Antwort: NUR ein JSON-Objekt { "content": { …content.json… }, "pruefen": [ "…", … ] }, ohne Text davor oder danach.

Beispiel einer fertigen content.json (Stil und Felder, NICHT den Inhalt übernehmen):
${example}`;
}

function briefText(brief, siteText) {
  const farben = brief.farben
    ? `eigene Farben (setzt der Code, KEINE palette angeben): Hauptfarbe ${brief.farben.haupt}, Akzent ${brief.farben.akzent}`
    : brief.palette ? `Palette ${brief.palette} (setzt der Code, KEINE palette angeben)` : 'Palette wählen (passend zur Branche)';
  return [
    `Sprache der Website: ${LANG_NAME[brief.lang] || LANG_NAME.de}`,
    `Firma und Ort (wie im Formular eingegeben): ${brief.firma}`,
    `Aktuelle Website: ${brief.website || 'keine'}`,
    `Angebot (Text der Firma): ${brief.angebot || '(nicht angegeben, siehe Website)'}`,
    `Gewünschter Umfang: ${brief.umfang}${brief.umfang === 'mehrseitig' ? ' (Startseite mit Links auf die künftigen Unterseiten, siehe Regeln)' : ''}`,
    `Farben: ${farben}`,
    `Logo: ${brief.logo ? 'vorhanden (setzt der Code)' : 'keines (Initialen)'}`,
    `Kontakt aus dem Formular: E-Mail ${brief.kontakt.email}${brief.kontakt.telefon ? `, Telefon ${brief.kontakt.telefon}` : ''}` +
      ' (Telefon nur verwenden, wenn es nach einer Geschäftsnummer aussieht oder auf der Website steht; E-Mail setzt der Code)',
    '', '=== Text der aktuellen Website ===', siteText ? siteText.slice(0, 14000) : '(keine Website)',
  ].join('\n');
}

function parseJson(text) {
  const s = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  const a = s.indexOf('{');
  const b = s.lastIndexOf('}');
  return JSON.parse(s.slice(a, b + 1));
}

export async function writeContent(brief, siteText) {
  const client = new Anthropic({ timeout: 240000 });
  const example = await readFile(join(KIT, 'beispiel-waldmeier.json'), 'utf8');
  const messages = [{ role: 'user', content: briefText(brief, siteText) }];
  for (let attempt = 0; attempt < 2; attempt++) {
    // Streaming : avec la réflexion du modèle, la réponse peut prendre plus d'une minute.
    const msg = await client.beta.messages.stream({
      model: process.env.ENTWURF_MODEL || MODEL_DEFAULT,
      max_tokens: 32000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium' },
      system: system(example),
      messages: messages,
    }).finalMessage();
    if (msg.stop_reason === 'refusal') throw new Error('rédaction refusée par le modèle');
    if (msg.stop_reason === 'max_tokens') throw new Error('rédaction tronquée (max_tokens)');
    const text = msg.content.filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('');
    let out;
    try { out = parseJson(text); } catch (e) { out = null; }
    const content = out && out.content;
    const errors = content ? validate(content).errors : ['Antwort ist kein gültiges JSON'];
    if (!errors.length) return { content: content, pruefen: Array.isArray(out.pruefen) ? out.pruefen.map(String) : [] };
    if (attempt === 1) throw new Error('content.json invalide :\n· ' + errors.join('\n· '));
    messages.push({ role: 'assistant', content: text });
    messages.push({ role: 'user', content: 'Der Starter-Kit meldet Fehler. Bitte korrigieren und das ganze JSON nochmals senden:\n- ' + errors.join('\n- ') });
  }
}
