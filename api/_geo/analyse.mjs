/**
 * Rédaction du rapport GEO-Light à partir des 16 réponses : Claude lit les réponses, le texte du site
 * et l'extrait du registre du commerce, et renvoie les textes du rapport (JSON strict).
 * Choix de Pauline (2026-10-24) : la qualité du texte prime, peu de tests, chacun doit convaincre.
 * Les chiffres (n von 6, nombre de mentions des concurrents) sont calculés dans le code, pas par le modèle.
 * fillGrammar() (petites formes grammaticales) reste sur OpenAI, déjà utilisé pour geo-preview.
 *
 * Variables d'environnement : ANTHROPIC_API_KEY (rédaction), OPENAI_API_KEY (fillGrammar)
 * (optionnel : GEO_LIGHT_MODEL, défaut claude-opus-5-5)
 */

import Anthropic from '@anthropic-ai/sdk';

const MODEL_DEFAULT = 'claude-opus-5-5';

const LANG_NAME = { de: 'Deutsch (Schweiz, ohne ß, formelles Sie)', fr: 'Französisch (Schweiz, vouvoiement)', en: 'Englisch (höflich)' };

const SYSTEM = `Du schreibst den Bericht «GEO-Light» von Zbinden Software (Pauline Zbinden): ein kostenloser Test,
ob ein Unternehmen bei ChatGPT und Perplexity genannt wird. Die Person hat den Test selbst angefragt.
Du erhältst das getestete Profil, die 8 Fragen mit den Antworten beider KI-Systeme, den Text der Website
und (falls gefunden) den Handelsregistereintrag. Die Zahlen sind schon berechnet; erfinde keine anderen.

Grundregeln (von einem erfahrenen Unternehmer geprüft, unbedingt einhalten):
- Einfach, ruhig und konstruktiv. Nicht zu detailliert, nicht kompliziert. Keine Unsicherheit und keine
  Angst erzeugen: keine Alarmwörter, keine Statistiken über «verlorene Kunden», kein Druck.
- Die Methode NICHT preisgeben: nicht erklären, wie der Test gemacht wurde (keine API, keine Websuche,
  keine Fragennummern, keine Liste von Quellen, Portalen oder Verzeichnissen, in die man sich eintragen
  müsste, keine Schritt-für-Schritt-Anleitung). Der Bericht sagt WAS fehlt, nicht WIE man es im Detail
  behebt; das ist die bezahlte Leistung. Einzige Ausnahme: die eine Massnahme (measure).
- Nur Fakten, die du in den Antworten, auf der Website oder im Handelsregister siehst. Nichts behaupten,
  was du nicht prüfen kannst (Jahreszahlen, Telefonnummern, Bewertungen, Mitarbeiterzahlen).
- Nie versprechen, dass das Unternehmen danach von ChatGPT empfohlen wird.
- ALLE Felder AUSSCHLIESSLICH in der Berichtssprache, ohne ein einziges Wort in einer anderen Sprache
  (Wunsch von Pauline: der Bericht ist ganz in der Sprache des Formulars). Sind die Antworten, die Website
  oder die Branche in einer anderen Sprache, übersetze: Zitate werden übersetzt wiedergegeben (in «», ohne
  Originaltext), auch der Text der Massnahme ist in der Berichtssprache. Firmen- und Personennamen
  bleiben unverändert.
- Schweizer Schreibweise im Deutschen (ss statt ß). Keine Gedankenstriche als Satzzeichen, keine Emojis.
- Das Unternehmen immer genau so nennen wie im Profil angegeben (gleiche Schreibweise, keine Rechtsform
  dazu, keine Grossbuchstaben), ausser in Zitaten.
- Kurz: jedes Feld so knapp wie möglich, der Bericht muss auf zwei A4-Seiten passen.

Felder:
- "provider_mentions": für JEDE der 12 Antworten zu den Fragen 3 bis 8 (je ChatGPT und Perplexity)
  die Namen der empfohlenen oder genannten Anbieter, so wie ein Kunde sie nennen würde. Gleiche Firma =
  gleiche Schreibweise in allen Antworten (Rechtsform weglassen, ausser sie gehört zum Namen). NICHT
  das getestete Unternehmen selbst, keine Plattformen/Verzeichnisse (local.ch, Google, Houzz ...),
  keine Behörden. Leere Liste, wenn die Antwort keinen Anbieter nennt.
- "branche_label" und "city_label": Branche und Ort des Profils, in die Berichtssprache übersetzt
  (z. B. "Innovationsberater" → fr "conseiller en innovation", "Schweiz" → fr "Suisse"). Ist die
  Berichtssprache die Sprache des Profils, unverändert übernehmen.
- "result_note": EIN ruhiger Satz unter dem Ergebnis. Schwach (0 bis 2 von 6): dass das bei kleineren
  Unternehmen dieser Art häufig ist und sich gezielt verbessern lässt. Mittel (3 bis 4): was schon
  funktioniert und dass es ausbaufähig ist. Stark (5 bis 6): klar sagen, dass es ein sehr gutes Ergebnis
  ist, und wie sich die beiden KI-Systeme unterscheiden.
- "provider_phrase": Nebensatz, der den Satz «Bei 6 Fragen, in denen ___, wurde X genannt.» bzw.
  «Dans les 6 questions où ___» / «In 6 questions where ___» ergänzt. Ohne «wenn», «où», «where».
  Beispiele: de "jemand in Frick einen Maler sucht" / "ein KMU eine Innovationsberatung sucht";
  fr "quelqu'un cherche un peintre à Frick"; en "someone looks for a painter in Frick".
- "statements": genau 3 Aussagen, was die KI-Systeme über das Unternehmen oder die Person sagen
  (Zitat in «», in die Berichtssprache übersetzt, oder enge Umschreibung, höchstens 30 Wörter), mit "engine" ("ChatGPT",
  "Perplexity" oder "beide") und "tag": "ok" (stimmt), "wrong" (stimmt nicht), "mixup" (Verwechslung
  mit einer anderen Firma), "partial" (unvollständig, z. B. Standorte oder Hauptleistung fehlen).
  Bevorzuge, was für die Person nützlich ist: falsche Beschreibungen, Verwechslungen, «kann ich nicht
  bestätigen», fehlende Hauptleistung oder fehlende Standorte. Keine banalen Aussagen wie die Adresse.
  Gibt es kaum Aussagen, beschreibe, was fehlt ("partial").
- "causes": genau 3 Ursachen, je ein bis zwei kurze Sätze, jede belegt durch etwas Gesehenes (Website,
  Handelsregister, Antworten). Bei 5 bis 6 von 6: GENAU eine erste Ursache mit "kind" "good" (was gut ist),
  dann GENAU zwei mit "kind" "missing" (was fehlt, z. B. weniger Bewertungen als die vorne genannten
  Mitbewerber, Standorte oder Leistungen, die nie genannt werden, ein KI-System nennt sie seltener);
  sonst alle drei "kind" "none". Diagnose, keine Anleitung. Je höchstens 35 Wörter.
- "measure": EINE Massnahme, die der Inhaber allein und sofort umsetzen kann. "label" = "Wo"/"Où"/"Where"
  (Text auf der Website) oder "Was"/"Quoi"/"What" (andere Handlung). "where": wo genau bzw. was
  (ein Satz). "text": der genaue Text zum Übernehmen (Einleitung der Startseite: wer, was, wo, für wen,
  3 bis 4 Sätze, nur mit Fakten von der Website; oder z. B. eine Bitte um eine Bewertung). "why": ein
  Satz, warum, ohne versprochenes Ergebnis. Bei 5 bis 6 von 6 betrifft die Massnahme etwas, das fehlt
  (z. B. eine Bitte um Bewertungen), nicht die Startseite, wenn diese schon klar ist. "text" höchstens 70 Wörter.
- "offer_lead": ein bis zwei Sätze für den Abschnitt «Ihr nächster Schritt»: welcher Teil der Ursachen
  mit der Technik allein gelöst ist und welcher Inhalte und Erwähnungen auf anderen Seiten braucht.
  Den wichtigsten Teilsatz zwischen ** ** setzen (wird fett).
- "row_content": Tabellenzeile (höchstens 22 Wörter), was der GEO-Audit zu den Inhalten zeigt, mit dem
  Firmennamen, z. B. "was auf Ihre Startseite und Ihre Angebotsseite gehört, damit innoFutura klar
  als Innovationsberatung erkannt wird" (ohne «Ursache n:»).
- "row_competitors": nur gebraucht, wenn keine Mitbewerber genannt werden: Tabellenzeile (höchstens
  22 Wörter), was der GEO-Audit dann klärt (z. B. wo Kunden in der Region suchen und wo das Unternehmen
  erwähnt sein sollte). Sonst ein leerer String.
- "row_causes": welche Ursachen (Nummern 1 bis 3 in der Liste "causes") zu row_content bzw. zum Vergleich
  mit den Mitbewerbern gehören. Nie eine Ursache mit "kind" "good".
- "row_implementation": höchstens 18 Wörter, was bei der Umsetzung konkret gemacht wird, passend zu diesem Bericht, z. B.
  "Texte für Startseite und Angebot überarbeitet, FAQ, strukturierte Daten zu Angebot und Öffnungszeiten" (ohne «Umsetzung des Plans:»).
- "email_paragraph": ein bis zwei Sätze für die E-Mail: wer stattdessen (oder zusätzlich) empfohlen wird
  und was die KI über das Unternehmen sagt, ob es stimmt oder nicht.`;

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['provider_mentions', 'branche_label', 'city_label', 'result_note', 'provider_phrase', 'statements', 'causes', 'measure',
    'offer_lead', 'row_content', 'row_competitors', 'row_causes', 'row_implementation', 'email_paragraph'],
  properties: {
    provider_mentions: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['question', 'engine', 'providers'],
        properties: {
          question: { type: 'integer' },
          engine: { type: 'string', enum: ['ChatGPT', 'Perplexity'] },
          providers: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    branche_label: { type: 'string' },
    city_label: { type: 'string' },
    result_note: { type: 'string' },
    provider_phrase: { type: 'string' },
    statements: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['text', 'engine', 'tag'],
        properties: {
          text: { type: 'string' },
          engine: { type: 'string', enum: ['ChatGPT', 'Perplexity', 'beide'] },
          tag: { type: 'string', enum: ['ok', 'wrong', 'mixup', 'partial'] },
        },
      },
    },
    causes: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['kind', 'text'],
        properties: { kind: { type: 'string', enum: ['good', 'missing', 'none'] }, text: { type: 'string' } },
      },
    },
    measure: {
      type: 'object', additionalProperties: false, required: ['label', 'where', 'text', 'why'],
      properties: { label: { type: 'string' }, where: { type: 'string' }, text: { type: 'string' }, why: { type: 'string' } },
    },
    offer_lead: { type: 'string' },
    row_content: { type: 'string' },
    row_competitors: { type: 'string' },
    row_causes: {
      type: 'object', additionalProperties: false, required: ['content', 'competitors'],
      properties: {
        content: { type: 'array', items: { type: 'integer' } },
        competitors: { type: 'array', items: { type: 'integer' } },
      },
    },
    row_implementation: { type: 'string' },
    email_paragraph: { type: 'string' },
  },
};

const GRAMMAR = {
  de: ['welche_akk', 'welche_nom', 'city_in'],
  fr: ['quel', 'city_in'],
  en: ['which', 'city_in'],
};

/**
 * Le formulaire vide les champs de grammaire quand le visiteur corrige la branche.
 * Complète seulement ceux qui manquent (« welchen Innovationsberater », « à Lausanne »…) ;
 * le contenu confirmé par le visiteur (branche, offres, lieu) n'est jamais modifié.
 */
export async function fillGrammar(cand) {
  const missing = GRAMMAR[cand.lang].filter(function (k) { return !cand[k]; });
  if (!missing.length) return cand;
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Gib grammatisch korrekte Formen für Suchfragen zurück, als JSON mit genau den verlangten Schlüsseln. ' +
            'de: welche_akk = Akkusativ mit «welche/welchen/welches» + Branche («welchen Treuhänder», «welche Zahnarztpraxis»), ' +
            'welche_nom = Nominativ («welcher Treuhänder»), city_in = Form nach «in» («Winterthur», «der Schweiz»). ' +
            'fr: quel = «quel/quelle» + branche («quelle fiduciaire»), city_in = MIT Präposition («à Lausanne», «en Suisse», «au Tessin»). ' +
            'en: which = «which» + branche, city_in = Form nach «in» («Zurich», «Switzerland»).' },
          { role: 'user', content: `Sprache: ${cand.lang}\nBranche: ${cand.branche}\nOrt: ${cand.city}\nSchlüssel: ${missing.join(', ')}` },
        ],
      }),
    });
    if (!r.ok) return cand;
    const g = JSON.parse((await r.json()).choices[0].message.content);
    missing.forEach(function (k) { if (typeof g[k] === 'string' && g[k].trim()) cand[k] = g[k].trim().slice(0, 120); });
    if (cand.lang !== 'fr') cand.city_in = cand.city_in.replace(/^in\s+/i, '');
  } catch (e) {}
  return cand;
}

/** Registre du commerce (Zefix, sans compte) : nom légal, siège, but. null si rien de sûr. */
export async function zefixLookup(name, city) {
  if (!name) return null;
  const key = function (s) { return String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ''); };
  const own = key(name);
  const place = key(city);
  try {
    const r = await fetch('https://www.zefix.ch/ZefixREST/api/v1/firm/search.json', {
      method: 'POST',
      signal: AbortSignal.timeout(6000),
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ name: name, languageKey: 'de', maxEntries: 5 }),
    });
    if (!r.ok) return null;
    const data = await r.json();
    // Un homonyme ailleurs (« 5 Sterne Maler Vogel » à Illnau pour Maler Vogel à Frick) fausserait le rapport :
    // on ne garde qu'une firme dont le nom commence par celui de l'entreprise, au même siège si possible.
    const list = (data.list || [])
      .filter(function (f) { return f.status !== 'GELOESCHT' && f.status !== 'DELETED' && key(f.name).startsWith(own); })
      .sort(function (x, y) { return (key(y.legalSeat) === place) - (key(x.legalSeat) === place); });
    if (!list.length) return null;
    if (place && place !== 'schweiz' && place !== 'suisse' && place !== 'switzerland' && key(list[0].legalSeat) !== place &&
      list.length > 1) return null;
    const d = await fetch(`https://www.zefix.ch/ZefixREST/api/v1/firm/${list[0].ehraid}.json`, { signal: AbortSignal.timeout(6000) });
    const firm = d.ok ? await d.json() : list[0];
    const purpose = firm.purpose || '';
    return {
      name: firm.name || list[0].name,
      seat: firm.legalSeat || list[0].legalSeat || '',
      purpose: String(purpose).slice(0, 1200),
      others: list.slice(1).map(function (f) { return f.name; }),
    };
  } catch (e) {
    return null;
  }
}

function answersBlock(test) {
  return test.questions.map(function (q) {
    const one = function (label, r) {
      const src = r.sources.slice(0, 6).map(function (s) { return s.replace(/^https?:\/\/(www\.)?/, '').slice(0, 80); }).join(', ');
      return `--- ${label} (${r.error ? 'Fehler' : r.named ? 'Unternehmen genannt' : 'Unternehmen NICHT genannt'}) ---\n` +
        (r.error ? '(keine Antwort)' : r.answer.slice(0, 2500)) + (src ? `\nQuellen: ${src}` : '');
    };
    return `### Frage ${q.n} (${q.category === 'identity' || q.category === 'person' ? 'Name steht in der Frage' : 'Kunde sucht einen Anbieter'}): ${q.text}\n` +
      one('ChatGPT', q.chatgpt) + '\n' + one('Perplexity', q.perplexity);
  }).join('\n\n');
}

export async function writeReport(cand, test, siteText, zefix, reportLang) {
  const client = new Anthropic({ timeout: 180000 });
  const user = [
    `Berichtssprache: ${LANG_NAME[reportLang]} (alle Felder in dieser Sprache).`,
    `Sprache der Fragen: ${cand.lang}`,
    `Unternehmen: ${cand.company} · Website: ${cand.domain} · Ort: ${cand.city} · Branche: ${cand.branche} · ` +
      `Angebote: ${(cand.offers || []).join(', ')}${cand.person ? ` · Person: ${cand.person}` : ''}`,
    `Ergebnis: bei ${test.provider_named} von 6 Anbieterfragen genannt (ChatGPT ${test.provider_named_chatgpt} von 6, ` +
      `Perplexity ${test.provider_named_perplexity} von 6). Eigene Website als Quelle in ${test.cited_source_count} von 16 Antworten.`,
    zefix ? `Handelsregister: ${zefix.name}, Sitz ${zefix.seat}. Zweck: ${zefix.purpose}` +
      (zefix.others.length ? ` (weitere Treffer: ${zefix.others.join('; ')})` : '') : 'Handelsregister: kein eindeutiger Eintrag gefunden (nicht als Ursache verwenden).',
    '', '=== Antworten ===', answersBlock(test),
    '', '=== Website ===', siteText.slice(0, 12000),
  ].join('\n');

  // Streaming : avec la réflexion du modèle, la réponse peut prendre plus d'une minute.
  const msg = await client.beta.messages.stream({
    model: process.env.GEO_LIGHT_MODEL || MODEL_DEFAULT,
    max_tokens: 32000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'high', format: { type: 'json_schema', schema: SCHEMA } },
    system: SYSTEM,
    messages: [{ role: 'user', content: user }],
  }).finalMessage();
  if (msg.stop_reason === 'refusal') throw new Error('rédaction refusée par le modèle');
  if (msg.stop_reason === 'max_tokens') throw new Error('rédaction tronquée (max_tokens)');
  const text = msg.content.filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('');
  const a = JSON.parse(text);
  a.statements = a.statements.slice(0, 3);
  a.causes = a.causes.slice(0, 3);
  a.competitors = countCompetitors(a.provider_mentions, cand.company);
  return a;
}

/** Top 5 des concurrents : nombre des 12 réponses « fournisseur » qui les citent. */
function countCompetitors(mentions, company) {
  const own = company.toLowerCase().replace(/[^a-z0-9äöüéèàç]+/g, '');
  const counts = new Map();
  (mentions || []).forEach(function (m) {
    Array.from(new Set(m.providers.map(function (p) { return p.trim(); }).filter(Boolean))).forEach(function (p) {
      const k = p.toLowerCase().replace(/[^a-z0-9äöüéèàç]+/g, '');
      if (!k || k === own || (own.length >= 5 && k.includes(own))) return;
      const cur = counts.get(k) || { name: p, count: 0 };
      cur.count += 1;
      counts.set(k, cur);
    });
  });
  return Array.from(counts.values()).sort(function (x, y) { return y.count - x.count; }).slice(0, 5);
}
