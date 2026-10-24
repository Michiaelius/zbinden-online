/**
 * POST /api/geo-preview
 * Formulaire GEO-Light : lit le site du visiteur (accueil + jusqu'à 3 pages d'offre /
 * présentation / impressum) et demande à un modèle OpenAI le profil qui sera testé :
 * langue des questions, nom, lieu, branche, 3 offres, personne. Le visiteur confirme ou
 * corrige ce profil dans le formulaire avant l'envoi ; rien n'est testé ici.
 *
 * Corps : { url, lang }  (lang = langue de la page : de | fr | en)
 * Réponse : { ok: true, profile: {...} }  ou  { ok: false, reason }
 *
 * Aucune dépendance (fetch, Node 18+).
 * Variable d'environnement requise dans Vercel : OPENAI_API_KEY
 * (optionnel : GEO_PREVIEW_MODEL, défaut gpt-4o — gpt-4o-mini ne repère pas les activités multiples)
 * Protection des coûts : fixer une limite de dépenses mensuelle sur la clé OpenAI.
 */

import { okUrl, getPage, pageText, pickLinks } from './_geo/site.mjs';

const MODEL_DEFAULT = 'gpt-4o';

const SYSTEM = `Du analysierst die Website eines Unternehmens für einen KI-Sichtbarkeitstest.
Der Test stellt ChatGPT und Perplexity 8 Fragen, wie potenzielle Kundinnen und Kunden sie stellen,
und prüft, ob das Unternehmen genannt wird. Leite aus dem Website-Text das Profil ab, das getestet wird.

Regeln:
- "lang": Sprache, in der die Kundschaft des Unternehmens sucht ("de", "fr" oder "en"): Hauptsprache
  der Website und der Region. Bei mehrsprachigen Websites entscheidet die Region (Genf, Lausanne → "fr";
  Zürich, Bern → "de"), nicht die gelesene Sprachversion. "en" nur bei klar englischsprachiger
  Kundschaft. "ui_lang" ist nur die
  Sprache des Besuchers und hat mit "lang" NICHTS zu tun: eine deutschsprachige Website
  ergibt "de", auch wenn ui_lang "fr" ist.
- Alle Textfelder (branche, offers, person_role) in dieser Sprache "lang".
- "company": der Name, den das Unternehmen im Alltag für sich verwendet, ohne Rechtsform
  (ausser sie gehört zum üblichen Namen).
- "city": der Ort, den Kunden bei der Suche nennen würden. Bedient das Unternehmen klar die ganze
  Schweiz ohne Laufkundschaft (Software, Online-Dienst, Verlag ...): "Schweiz" / "Suisse" / "Switzerland".
  Ein kleines Dorf, nach dem niemand sucht: die Region oder den Kanton.
- "branche": Begriff, den ein Kunde verwenden würde, spezifisch genug, um fair zu sein
  (ein Nischenanbieter nicht gegen die ganze Branche testen). Ohne Artikel.
- "offers": genau 3 Kernleistungen, so formuliert, wie ein Interessent sie eintippen würde, ohne Artikel.
  Die wichtigste zuerst.
- Kernangebot = was das Unternehmen VERKAUFT, laut Angebots-/Leistungsseite. NICHT aus Slogans,
  Bannern, Slidern oder Aktions-Teasern ableiten. Betonen Startseite und Angebotsseite
  Unterschiedliches, gilt die Angebotsseite. Bei mehreren Tätigkeiten die, der die
  Angebotsseite am meisten Raum gibt.
- "person": namentlich genannte Inhaberin/Inhaber oder Geschäftsführung (Impressum/Kontakt), sonst "".
  Nie raten. "person_role": wie diese Person beschrieben würde (z. B. "Rechtsanwältin", "avocat").
- Grammatik-Felder, damit die Fragen korrekt klingen:
  de: "city_in" = Form nach "in" ("Winterthur", "der Schweiz"); "welche_akk" (z. B. "welchen Treuhänder",
      "welche Zahnarztpraxis"); "welche_nom" (z. B. "welcher Treuhänder").
  fr: "city_in" MIT Präposition ("à Lausanne", "en Suisse", "au Tessin"); "quel" ("quel avocat",
      "quelle fiduciaire").
  en: "city_in" = Form nach "in" ("Zurich", "Switzerland"); "which" ("which dentist").
  Nicht benötigte Felder als "".
- "activities": die verschiedenen GESCHÄFTSBEREICHE der Website, je 1-4 Wörter in der Sprache "lang",
  der gewählte zuerst. Ein Geschäftsbereich ist eine eigene Branche (z. B. ["Verlag", "Innovationsberatung"]),
  NICHT eine einzelne Leistung: Eine Bank mit Hypotheken und Vermögensverwaltung ist EIN Bereich
  (["Bank"]), eine Zahnarztpraxis mit Implantaten und Bleaching ebenso (["Zahnarztpraxis"]).
- "alternatives": nur bei 2 oder mehr Geschäftsbereichen, sonst []. Pro Bereich (max. 3, gleiche
  Reihenfolge wie "activities") ein Objekt mit: activity, branche, offers (genau 3, nur Leistungen
  DIESES Bereichs), welche_akk, welche_nom, quel, which. Das erste entspricht branche/offers oben.
  Die offers jedes Bereichs so konkret wie Suchbegriffe eines Kunden ("Coaching für Führungskräfte",
  nicht "Coaching"; "Workshops für Unternehmen", nicht "Workshops"), nach denselben Regeln wie "offers".
- "readable": false, wenn der Text nicht reicht, um Branche und Angebote zu bestimmen.

Vorgehen: Erstelle ZUERST die Liste "activities" – lies dazu Startseite UND Angebotsseite vollständig
und zähle jeden eigenen Geschäftsbereich auf (Verlag, Beratung, Coaching, Weiterbildung ... sind
verschiedene Bereiche). Erst danach wählst du den Hauptbereich für branche/offers.

Antworte ausschliesslich mit einem JSON-Objekt mit genau diesen Schlüsseln, in dieser Reihenfolge:
readable, lang, activities, alternatives, company, city, city_in, branche, offers, person, person_role,
welche_akk, welche_nom, quel, which`;

function clean(v, max) {
  return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max || 120);
}

function cleanOffers(list) {
  return (Array.isArray(list) ? list : []).map(function (o) { return clean(o); }).filter(Boolean).slice(0, 3);
}

function sanitize(p, uiLang) {
  const lang = ['de', 'fr', 'en'].includes(p.lang) ? p.lang : uiLang;
  const offers = cleanOffers(p.offers);
  // Une proposition complète par domaine d'activité : le visiteur choisit celui à tester.
  const alternatives = (Array.isArray(p.alternatives) ? p.alternatives : [])
    .filter(function (a) { return a && clean(a.activity) && clean(a.branche) && cleanOffers(a.offers).length; })
    .slice(0, 3)
    .map(function (a) {
      return {
        activity: clean(a.activity, 60),
        branche: clean(a.branche),
        offers: cleanOffers(a.offers),
        welche_akk: lang === 'de' ? clean(a.welche_akk) : '',
        welche_nom: lang === 'de' ? clean(a.welche_nom) : '',
        quel: lang === 'fr' ? clean(a.quel) : '',
        which: lang === 'en' ? clean(a.which) : '',
      };
    });
  return {
    lang: lang,
    company: clean(p.company),
    city: clean(p.city, 80),
    // « city_in » suit « in » en allemand et en anglais : pas de préposition en double.
    city_in: lang === 'fr' ? clean(p.city_in, 80) : clean(p.city_in, 80).replace(/^in\s+/i, ''),
    branche: clean(p.branche),
    offers: offers,
    person: clean(p.person, 80),
    person_role: clean(p.person_role, 80),
    welche_akk: lang === 'de' ? clean(p.welche_akk) : '',
    welche_nom: lang === 'de' ? clean(p.welche_nom) : '',
    quel: lang === 'fr' ? clean(p.quel) : '',
    which: lang === 'en' ? clean(p.which) : '',
    activities: (Array.isArray(p.activities) ? p.activities : []).map(function (a) { return clean(a, 60); }).filter(Boolean).slice(0, 4),
    alternatives: alternatives.length > 1 ? alternatives : [],
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ ok: false, reason: 'method' });
    return;
  }
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    res.status(500).json({ ok: false, reason: 'not_configured' });
    return;
  }

  let b = req.body;
  if (typeof b === 'string') {
    try { b = JSON.parse(b); } catch (e) { b = null; }
  }
  const uiLang = b && ['de', 'fr', 'en'].includes(b.lang) ? b.lang : 'de';
  const start = b ? okUrl(b.url) : null;
  if (!start) {
    res.status(400).json({ ok: false, reason: 'bad_url' });
    return;
  }

  // 1. Accueil, puis jusqu'à 3 pages internes en parallèle.
  let home;
  try {
    home = await getPage(start, 7000);
  } catch (e) {
    res.status(200).json({ ok: false, reason: 'unreachable' });
    return;
  }
  const base = new URL(home.finalUrl);
  const htmlLang = ((/<html[^>]*\slang=["']?([a-z]{2})/i.exec(home.html) || [])[1] || '').toLowerCase();
  // Langues proposées par le site : la version servie par défaut n'est pas forcément celle des clients.
  const hreflangs = Array.from(new Set((home.html.match(/hreflang=["']?[a-z]{2}/gi) || [])
    .map(function (h) { return h.slice(-2).toLowerCase(); })));
  const links = pickLinks(home.html, base);
  const subs = await Promise.allSettled(links.map(function (u) { return getPage(u, 5000); }));

  let text = `=== Startseite (${base}) ===\n` + pageText(home.html, 6000);
  subs.forEach(function (s, i) {
    if (s.status === 'fulfilled') text += `\n\n=== Unterseite (${links[i]}) ===\n` + pageText(s.value.html, 3500);
  });
  if (text.replace(/\s/g, '').length < 300) {
    res.status(200).json({ ok: false, reason: 'no_text' });
    return;
  }

  // 2. Profil proposé par le modèle.
  let p;
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: AbortSignal.timeout(16000),
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.GEO_PREVIEW_MODEL || MODEL_DEFAULT,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: `ui_lang: ${uiLang}\nhtml lang (gelesene Version): ${htmlLang || '?'}\n` +
            `Sprachversionen der Website (hreflang): ${hreflangs.join(', ') || '?'}\n\n${text}` },
        ],
      }),
    });
    if (!r.ok) throw new Error('openai ' + r.status);
    const data = await r.json();
    p = JSON.parse(data.choices[0].message.content);
  } catch (e) {
    res.status(200).json({ ok: false, reason: 'ai_error' });
    return;
  }

  if (!p || p.readable === false) {
    res.status(200).json({ ok: false, reason: 'no_text' });
    return;
  }
  res.status(200).json({ ok: true, profile: sanitize(p, uiLang) });
}
