/**
 * Rapport GEO-Light (HTML imprimé en PDF) et e-mail de réponse, en allemand, français ou anglais.
 * Mise en page reprise des modèles du skill geo-light (templates/beispiel-schwach-de.html et
 * beispiel-stark-de.html) : page 1 = sections 1 à 4, page 2 = sections 5 et 6.
 * Depuis 2026-10-24 sans annexe ni détail de méthode (conseil de Heinz Oftinger :
 * ne pas donner l'impression « so geht das, das kann ich selber »).
 */

import { FONT_CSS } from './fonts.mjs';

const CALENDLY = 'https://calendly.com/zbinden-austausch/30min';
const PHONE = '+41 79 193 68 02';

const T = {
  de: {
    stem: 'KI-Sichtbarkeit', colon: ':', title: 'KI-Sichtbarkeitstest', tested: 'getestet am {d} mit ChatGPT und Perplexity',
    of6: 'von 6',
    result: function (n, name, phrase) {
      return n === 6 ? `Bei allen 6 Fragen, in denen ${phrase}, wurde ${name} genannt.`
        : n === 0 ? `Bei 6 Fragen, in denen ${phrase}, wurde ${name} nicht genannt.`
        : `Bei ${n} von 6 Fragen, in denen ${phrase}, wurde ${name} genannt.`;
    },
    s1: 'Ergebnis', s2weak: 'Wer stattdessen empfohlen wird', s2strong: 'Wer ausserdem empfohlen wird',
    provider: 'Anbieter', times: 'Genannt in den 12 Antworten (6 Fragen × 2 KI-Systeme)', count: function (n) { return n + '-mal'; },
    none: 'In den 12 Antworten wurde kein konkreter Anbieter genannt.',
    s3: 'Was die KI über Sie sagt', statement: 'Aussage', source: 'Quelle', true_: 'Stimmt das?', both: 'beide',
    tags: { ok: 'stimmt', wrong: 'stimmt nicht', mixup: 'Verwechslung', partial: 'unvollständig' },
    s4weak: 'Die drei wichtigsten Ursachen', s4strong: 'Warum Sie gut dastehen, und was noch fehlt', good: 'Gut:', missing: 'Fehlt:',
    s5: 'Eine Massnahme, die Sie sofort umsetzen können', why: 'Warum:',
    s6: 'Ihr nächster Schritt', get: 'Was Sie bekommen', from: 'ab',
    tiers: ['GEO-Audit', 'Audit + Umsetzung', 'GEO Aktiv (Abo)'],
    prices: ['CHF 490', "CHF 1'480", 'CHF 249 / Monat'],
    rowTech: 'KI-Systeme können Ihre Website richtig lesen: strukturierte Daten, einheitliche Firmenangaben, Zugang für KI-Crawler (umgesetzt, nicht nur empfohlen)',
    rowCheck: 'Neuer KI-Check mit Vorher-Nachher-Vergleich (bei der Umsetzung nach 6 Monaten, im Abo jeden Monat)',
    rowAnalysis: 'Analyse in sechs Kategorien, priorisierter Aktionsplan und Besprechung (30 Min.)',
    rowComp: function (c, name) { return `Vergleich mit ${c.join(', ')} & Co.: warum sie empfohlen werden und wo ${name} erwähnt sein sollte`; },
    rowImpl: 'Umsetzung des Plans:', cause: 'Ursache', causes: 'Ursache', and: 'und',
    leadTail: 'Der GEO-Audit zeigt, was dort zu tun ist; mit der Umsetzung oder im Abo mit GEO Aktiv setze ich es für Sie um.',
    gain: 'Ihr Gewinn:',
    gainWeak: 'Mit dem GEO-Audit wissen Sie genau, warum andere empfohlen werden und was Sie in welcher Reihenfolge ändern. Mit der Umsetzung ist es danach auch erledigt, ohne dass Sie selbst Zeit investieren.',
    gainStrong: 'Sie bauen Ihren Vorsprung gezielt aus, statt ihn dem Zufall zu überlassen. Mit GEO Aktiv beobachte ich Ihre Sichtbarkeit jeden Monat und baue sie für Sie aus.',
    cta: 'Kostenloses Gespräch vereinbaren (30 Min.)', diff: 'GEO Aktiv: CHF 490 Setup (der Audit), danach CHF 249 pro Monat, Mindestdauer 6 Monate.',
    footer: 'Dieser Test ist kostenlos und unverbindlich. Die Antworten von KI-Systemen ändern sich mit der Zeit; dieser Test ist eine Momentaufnahme.',
    site: 'zbinden.online/geo-audit',
  },
  fr: {
    stem: 'Visibilite-IA', colon: ' :', title: 'Test de visibilité IA', tested: 'testé le {d} avec ChatGPT et Perplexity',
    of6: 'sur 6',
    result: function (n, name, phrase) {
      return n === 6 ? `Dans les 6 questions où ${phrase}, ${name} a été cité à chaque fois.`
        : n === 0 ? `Dans les 6 questions où ${phrase}, ${name} n’a pas été cité.`
        : `Dans ${n} des 6 questions où ${phrase}, ${name} a été cité.`;
    },
    s1: 'Résultat', s2weak: 'Qui est recommandé à votre place', s2strong: 'Qui est recommandé en plus de vous',
    provider: 'Prestataire', times: 'Cité dans les 12 réponses (6 questions × 2 systèmes d’IA)', count: function (n) { return n + ' fois'; },
    none: 'Aucune des 12 réponses ne cite de prestataire concret.',
    s3: 'Ce que l’IA dit de vous', statement: 'Affirmation', source: 'Source', true_: 'Est-ce juste ?', both: 'les deux',
    tags: { ok: 'correct', wrong: 'faux', mixup: 'confusion', partial: 'incomplet' },
    s4weak: 'Les trois causes principales', s4strong: 'Pourquoi vous êtes bien placé, et ce qui manque encore', good: 'Bien :', missing: 'Manque :',
    s5: 'Une mesure à mettre en place tout de suite', why: 'Pourquoi :',
    s6: 'Votre prochaine étape', get: 'Ce que vous obtenez', from: 'dès',
    tiers: ['Audit GEO', 'Audit + mise en œuvre', 'GEO Actif (abo)'],
    prices: ['CHF 490', "CHF 1'480", 'CHF 249 / mois'],
    rowTech: 'Les systèmes d’IA lisent correctement votre site : données structurées, informations d’entreprise cohérentes, accès pour les robots d’IA (mis en place, pas seulement recommandé)',
    rowCheck: 'Nouveau test IA avec comparaison avant-après (après 6 mois avec la mise en œuvre, chaque mois en abonnement)',
    rowAnalysis: 'Analyse en six catégories, plan d’action par priorités et entretien (30 min)',
    rowComp: function (c, name) { return `Comparaison avec ${c.join(', ')} & Cie : pourquoi ils sont recommandés et où ${name} devrait être mentionné`; },
    rowImpl: 'Mise en œuvre du plan :', cause: 'Cause', causes: 'Causes', and: 'et',
    leadTail: 'L’audit GEO montre ce qu’il faut faire ; avec la mise en œuvre ou en abonnement avec GEO Actif, je le mets en place pour vous.',
    gain: 'Ce que vous y gagnez :',
    gainWeak: 'Avec l’audit GEO, vous savez exactement pourquoi d’autres sont recommandés et quoi changer, dans quel ordre. Avec la mise en œuvre, c’est ensuite fait, sans que vous y consacriez votre temps.',
    gainStrong: 'Vous consolidez votre avance de façon ciblée au lieu de la laisser au hasard. Avec GEO Actif, je suis votre visibilité chaque mois et la renforce pour vous.',
    cta: 'Réserver un entretien gratuit (30 min)', diff: 'GEO Actif : CHF 490 de mise en place (l’audit), puis CHF 249 par mois, durée minimale 6 mois.',
    footer: 'Ce test est gratuit et sans engagement. Les réponses des systèmes d’IA évoluent avec le temps ; ce test est un instantané.',
    site: 'zbinden.online/fr/geo-audit',
  },
  en: {
    stem: 'AI-Visibility', colon: ':', title: 'AI visibility test', tested: 'tested on {d} with ChatGPT and Perplexity',
    of6: 'of 6',
    result: function (n, name, phrase) {
      return n === 6 ? `In all 6 questions where ${phrase}, ${name} was named.`
        : n === 0 ? `In 6 questions where ${phrase}, ${name} was not named.`
        : `In ${n} of 6 questions where ${phrase}, ${name} was named.`;
    },
    s1: 'Result', s2weak: 'Who is recommended instead', s2strong: 'Who else is recommended',
    provider: 'Provider', times: 'Named in the 12 answers (6 questions × 2 AI systems)', count: function (n) { return n + (n === 1 ? ' time' : ' times'); },
    none: 'None of the 12 answers names a specific provider.',
    s3: 'What AI says about you', statement: 'Statement', source: 'Source', true_: 'Accurate?', both: 'both',
    tags: { ok: 'accurate', wrong: 'inaccurate', mixup: 'confusion', partial: 'incomplete' },
    s4weak: 'The three main causes', s4strong: 'Why you are well placed, and what is still missing', good: 'Good:', missing: 'Missing:',
    s5: 'One measure you can put in place right away', why: 'Why:',
    s6: 'Your next step', get: 'What you get', from: 'from',
    tiers: ['GEO audit', 'Audit + implementation', 'GEO Active (subscription)'],
    prices: ['CHF 490', "CHF 1'480", 'CHF 249 / month'],
    rowTech: 'AI systems read your website correctly: structured data, consistent company details, access for AI crawlers (implemented, not just recommended)',
    rowCheck: 'New AI check with before/after comparison (after 6 months with the implementation, every month by subscription)',
    rowAnalysis: 'Analysis in six categories, prioritised action plan and discussion (30 min)',
    rowComp: function (c, name) { return `Comparison with ${c.join(', ')} & co.: why they are recommended and where ${name} should be mentioned`; },
    rowImpl: 'Implementation of the plan:', cause: 'Cause', causes: 'Causes', and: 'and',
    leadTail: 'The GEO audit shows what to do there; with the implementation or by subscription with GEO Active, I implement it for you.',
    gain: 'What you gain:',
    gainWeak: 'With the GEO audit you know exactly why others are recommended and what to change in which order. With the implementation it is then also done, without investing your own time.',
    gainStrong: 'You build on your lead deliberately instead of leaving it to chance. With GEO Active, I monitor your visibility every month and build on it for you.',
    cta: 'Book a free call (30 min)', diff: 'GEO Active: CHF 490 setup (the audit), then CHF 249 per month, minimum term 6 months.',
    footer: 'This test is free and without obligation. AI answers change over time; this test is a snapshot.',
    site: 'zbinden.online/en/geo-audit',
  },
};


export function fileStem(reportLang, slug) { return `${T[reportLang].stem}-${slug}`; }

export function slugify(name) {
  return String(name || '').trim().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-').replace(/[^A-Za-z0-9-]/g, '').replace(/-{2,}/g, '-').replace(/^-|-$/g, '') || 'Kandidat';
}

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// **gras** → <strong> (après échappement).
function rich(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'); }

function dateFmt(iso, lang) {
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'de-CH',
    { timeZone: 'Europe/Zurich', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
}

// « Ursache 1: » ; si bon résultat, « Fehlt 1: » numérote seulement les points « Fehlt » de la section 4.
function causeLabel(t, nums, causes, strong) {
  let n = (nums || []).filter(function (x) { return x >= 1 && x <= 3; });
  if (strong) {
    const missing = causes.map(function (c, i) { return c.kind === 'missing' ? i + 1 : 0; }).filter(Boolean);
    n = n.filter(function (x) { return missing.includes(x); }).map(function (x) { return missing.indexOf(x) + 1; });
    return n.length ? `${t.missing.replace(/\s*:$/, '')} ${list(n, t.and)}${t.colon}` : '';
  }
  return n.length ? `${n.length > 1 ? t.causes : t.cause} ${list(n, t.and)}${t.colon}` : '';
}

// [1, 2, 3] → « 1, 2 und 3 »
function list(n, and) { return n.length > 1 ? `${n.slice(0, -1).join(', ')} ${and} ${n[n.length - 1]}` : String(n[0]); }

const CSS = `
  @page { size: A4; margin: 15mm 16mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: "Noto Sans", sans-serif; color: #2b2b2b; font-size: 9.6pt; line-height: 1.45; margin: 0; }
  h1 { font-size: 19pt; margin: 0 0 1mm; color: #1a1a1a; }
  h2 { font-size: 11.5pt; margin: 5.5mm 0 2mm; color: #1a1a1a; display: flex; align-items: baseline; gap: 2.5mm; }
  h2 .n { display: inline-block; min-width: 5.5mm; height: 5.5mm; line-height: 5.5mm; text-align: center; border-radius: 50%; background: #24576b; color: #fff; font-size: 8.5pt; font-weight: 700; }
  p { margin: 0 0 2mm; }
  .meta { color: #666; font-size: 9pt; }
  .result { margin: 4mm 0 0; padding: 4mm 5mm; background: #f1f6f8; border-radius: 4px; display: flex; align-items: center; gap: 6mm; }
  .result .num { font-size: 30pt; font-weight: 700; color: #24576b; line-height: 1; white-space: nowrap; }
  .result .num small { font-size: 13pt; font-weight: 600; color: #4d7586; }
  .result .txt { font-size: 10.5pt; }
  .result .txt span { display: block; color: #555; font-size: 9pt; margin-top: 1mm; }
  table { width: 100%; border-collapse: collapse; font-size: 9pt; }
  th, td { text-align: left; padding: 1.6mm 2.2mm; border-bottom: 1px solid #e2e2e2; vertical-align: top; }
  th { background: #f4f4f4; font-weight: 600; }
  .bar { display: inline-block; height: 2.6mm; background: #24576b; border-radius: 1px; vertical-align: middle; margin-right: 2mm; }
  .tag { display: inline-block; padding: 0.4mm 2mm; border-radius: 3px; font-size: 8.5pt; font-weight: 600; white-space: nowrap; }
  .ok { background: #e3f1e8; color: #1d6b3d; }
  .part { background: #fdf0dc; color: #8a5300; }
  .wrong { background: #f8e3e3; color: #9b2222; }
  .src { color: #777; font-size: 8.5pt; }
  ol.causes { margin: 0; padding-left: 5mm; }
  ol.causes li { margin-bottom: 1.2mm; }
  .action { border: 1.5px solid #24576b; border-radius: 4px; padding: 3.5mm 4.5mm; }
  .action .where { font-size: 9pt; color: #444; margin-bottom: 2mm; }
  .action .text { background: #f7f7f7; border-left: 3px solid #24576b; padding: 2.5mm 3.5mm; font-size: 9.5pt; }
  .action .why { font-size: 9pt; color: #444; margin: 2mm 0 0; }
  .offer { border: 1.5px solid #24576b; border-radius: 4px; overflow: hidden; break-inside: avoid; }
  .offer .lead { padding: 3mm 4.5mm; font-size: 9.5pt; }
  .offer .lead strong { color: #24576b; }
  .offer table.cmp th, .offer table.cmp td { padding: 1.3mm 2.6mm; font-size: 8.8pt; }
  .offer table.cmp th.p { text-align: center; width: 17.5%; white-space: nowrap; }
  .offer table.cmp th.p small { display: block; font-weight: 400; color: #555; }
  .offer table.cmp th.hl, .offer table.cmp td.hl { background: #e7f0f3; }
  .offer table.cmp td.y { text-align: center; color: #1d6b3d; font-weight: 700; }
  .offer table.cmp td.n { text-align: center; color: #aaa; }
  .offer .gain { padding: 3mm 4.5mm 0; font-size: 9.5pt; }
  .offer .bottom { background: #24576b; color: #fff; padding: 3mm 4.5mm; margin-top: 3mm; display: flex; align-items: center; gap: 5mm; }
  .offer .bottom .cta { display: inline-block; background: #fff; color: #24576b; font-weight: 700; padding: 1.8mm 4mm; border-radius: 3px; text-decoration: none; white-space: nowrap; }
  .offer .bottom span { font-size: 8.5pt; color: #d6e4ea; }
  .footer { margin-top: 4mm; padding-top: 1.5mm; border-top: 1px solid #ddd; color: #888; font-size: 7.5pt; break-inside: avoid; }
`;

/** HTML complet du rapport. a = sortie de writeReport(), test = sortie de runVisibilityTest(). */
export function renderReportHtml(cand, test, a, reportLang) {
  const t = T[reportLang];
  const n = test.provider_named;
  const strong = n >= 5;
  const name = cand.company;
  a.provider_phrase = String(a.provider_phrase || '').replace(/^\s*(wenn|où|where)\s+/i, '');
  const tagClass = { ok: 'ok', wrong: 'wrong', mixup: 'wrong', partial: 'part' };
  const engine = function (e) { return e === 'beide' ? t.both : e; };
  const bar = function (c, own) {
    return `<span class="bar" style="width:${Math.min(8 * c, 80)}mm${own ? '' : strong ? ';background:#8aa9b6' : ''}"></span>`;
  };

  const compRows = (strong && test.provider_answers_named
    ? [`<tr><td><strong>${esc(name)}</strong></td><td>${bar(test.provider_answers_named, true)}<strong>${esc(t.count(test.provider_answers_named))}</strong></td></tr>`]
    : []).concat(a.competitors.slice(0, strong ? 4 : 5).map(function (c) {
    return `<tr><td>${esc(c.name)}</td><td>${bar(c.count)}${esc(t.count(c.count))}</td></tr>`;
  }));
  const section2 = a.competitors.length || (strong && test.provider_answers_named)
    ? `<table><thead><tr><th style="width:42%">${t.provider}</th><th>${t.times}</th></tr></thead><tbody>${compRows.join('')}</tbody></table>`
    : `<p>${esc(t.none)}</p>`;

  const statements = a.statements.map(function (s) {
    return `<tr><td>${rich(s.text)}</td><td class="src">${esc(engine(s.engine))}</td><td><span class="tag ${tagClass[s.tag]}">${esc(t.tags[s.tag])}</span></td></tr>`;
  }).join('');

  const causes = a.causes.map(function (c) {
    const pre = strong && c.kind === 'good' ? `<strong>${t.good}</strong> ` : strong && c.kind === 'missing' ? `<strong>${t.missing}</strong> ` : '';
    return `<li>${pre}${rich(c.text)}</li>`;
  }).join('');

  // Coche dessinée : le ✓ n'existe pas dans Noto Sans et Chromium sur Vercel n'a pas d'autre police.
  const check = '<svg width="11" height="9" viewBox="0 0 11 9" aria-label="✓"><path d="M1 4.6 4 7.5 10 1.2" fill="none" stroke="#1d6b3d" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const yes = `<td class="y">${check}</td>`, no = '<td class="n">—</td>', yesHl = `<td class="y hl">${check}</td>`;
  const labelled = function (label, text) { return (label ? `<strong>${esc(label)}</strong> ` : '') + rich(text); };
  // Les deux lignes liées aux causes, dans l'ordre de leur premier numéro (« Fehlt 1 » avant « Fehlt 2 »).
  const first = function (nums) { return Math.min.apply(null, (nums || []).concat([9])); };
  const causeRows = [
    [first(a.row_causes.content), labelled(causeLabel(t, a.row_causes.content, a.causes, strong), a.row_content)],
    [first(a.row_causes.competitors), labelled(causeLabel(t, a.row_causes.competitors, a.causes, strong),
      a.competitors.length ? t.rowComp(a.competitors.slice(0, 2).map(function (c) { return c.name; }), name) : a.row_competitors)],
  ].sort(function (x, y) { return x[0] - y[0]; }).map(function (r) { return [r[1], yes + yes + yesHl]; });
  const rows = [
    [esc(t.rowTech), no + yes + yesHl],
    [esc(t.rowCheck), no + yes + yesHl],
  ].concat(causeRows, [
    [esc(t.rowAnalysis), yes + yes + yesHl],
    [labelled(t.rowImpl, a.row_implementation), no + yes + yesHl],
  ]).map(function (r) { return `<tr><td>${r[0]}</td>${r[1]}</tr>`; }).join('');

  const heads = t.tiers.map(function (tier, i) {
    return `<th class="p${i === 2 ? ' hl' : ''}">${esc(tier)}<small>${t.from} ${t.prices[i]}</small></th>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="${reportLang}">
<head>
<meta charset="utf-8">
<title>${esc(t.title)} — ${esc(name)}</title>
<style>${FONT_CSS}${CSS}</style>
</head>
<body>

<h1>${esc(t.title)}</h1>
<div class="meta"><strong>${esc(name)}</strong> &nbsp;·&nbsp; ${esc(a.branche_label || cand.branche)} &nbsp;·&nbsp; ${esc(a.city_label || cand.city)} &nbsp;·&nbsp; ${esc(t.tested.replace('{d}', dateFmt(test.tested_at, reportLang)))}</div>

<h2><span class="n">1</span>${t.s1}</h2>
<div class="result">
  <div class="num">${n} <small>${t.of6}</small></div>
  <div class="txt">${esc(t.result(n, name, a.provider_phrase))}
    <span>${rich(a.result_note)}</span></div>
</div>

<h2><span class="n">2</span>${strong ? t.s2strong : t.s2weak}</h2>
${section2}

<h2><span class="n">3</span>${t.s3}</h2>
<table>
  <thead><tr><th style="width:62%">${t.statement}</th><th style="width:16%">${t.source}</th><th>${t.true_}</th></tr></thead>
  <tbody>${statements}</tbody>
</table>

<div style="break-inside:avoid"><h2><span class="n">4</span>${strong ? t.s4strong : t.s4weak}</h2>
<ol class="causes">${causes}</ol></div>

<h2 style="break-before:page;margin-top:0"><span class="n">5</span>${t.s5}</h2>
<div class="action">
  <div class="where"><strong>${esc(a.measure.label.replace(/\s*:?\s*$/, ''))}${t.colon}</strong> ${rich(a.measure.where)}</div>
  <div class="text">${rich(a.measure.text)}</div>
  <p class="why">${t.why} ${rich(a.measure.why)}</p>
</div>

<div style="break-inside:avoid">
<h2><span class="n">6</span>${t.s6}</h2>
<div class="offer">
  <div class="lead">${rich(a.offer_lead)} ${esc(t.leadTail)}</div>
  <table class="cmp">
    <thead><tr><th>${t.get}</th>${heads}</tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="gain"><strong>${t.gain}</strong> ${esc(strong ? t.gainStrong : t.gainWeak)}</div>
  <div class="bottom"><a class="cta" href="${CALENDLY}">${esc(t.cta)}</a><span>${esc(t.diff)}</span></div>
</div>
</div>

<div class="footer">
  Zbinden Software &nbsp;·&nbsp; Pauline Zbinden &nbsp;·&nbsp; ${PHONE} &nbsp;·&nbsp; info@zbinden.online &nbsp;·&nbsp; ${t.site}<br>
  ${esc(t.footer)}
</div>

</body>
</html>`;
}

const MAIL = {
  de: {
    subject: function (name) { return `Ihr GEO-Light-Ergebnis: ${name} bei ChatGPT und Perplexity`; },
    hi: 'Guten Tag,',
    intro: 'vielen Dank für Ihre Anfrage zum GEO-Light-Test. Ich habe ChatGPT und Perplexity acht Fragen gestellt, wie sie Ihre potenziellen Kundinnen und Kunden heute stellen.',
    result: 'Ergebnis:',
    pdf: 'Im angehängten PDF finden Sie die drei wichtigsten Ursachen und eine Massnahme, die Sie sofort selbst umsetzen können, mit dem genauen Text dazu.',
    strongPdf: 'Im angehängten PDF sehen Sie, was bei Ihnen gut funktioniert, was noch fehlt, und eine Massnahme, die Sie sofort selbst umsetzen können.',
    next: `Wenn Sie den nächsten Schritt besprechen möchten, zeige ich Ihnen gern in 30 Minuten, was sich bei Ihnen konkret verbessern lässt, kostenlos und unverbindlich: ${CALENDLY}`,
    regards: 'Freundliche Grüsse,',
    site: 'https://www.zbinden.online/geo-audit',
  },
  fr: {
    subject: function (name) { return `Votre résultat GEO-Light : ${name} sur ChatGPT et Perplexity`; },
    hi: 'Bonjour,',
    intro: 'merci pour votre demande de test GEO-Light. J’ai posé à ChatGPT et Perplexity huit questions, telles que vos clientes et clients potentiels les posent aujourd’hui.',
    result: 'Résultat :',
    pdf: 'Dans le PDF ci-joint, vous trouverez les trois causes principales et une mesure que vous pouvez mettre en place vous-même tout de suite, avec le texte exact.',
    strongPdf: 'Dans le PDF ci-joint, vous verrez ce qui fonctionne bien chez vous, ce qui manque encore, et une mesure que vous pouvez mettre en place vous-même tout de suite.',
    next: `Si vous souhaitez parler de la prochaine étape, je vous montre volontiers en 30 minutes ce qui peut concrètement être amélioré chez vous, gratuitement et sans engagement : ${CALENDLY}`,
    regards: 'Meilleures salutations,',
    site: 'https://www.zbinden.online/fr/geo-audit',
  },
  en: {
    subject: function (name) { return `Your GEO-Light result: ${name} on ChatGPT and Perplexity`; },
    hi: 'Dear Sir or Madam,',
    intro: 'thank you for requesting the GEO-Light test. I asked ChatGPT and Perplexity eight questions of the kind your potential customers ask today.',
    result: 'Result:',
    pdf: 'The attached PDF shows the three main causes and one measure you can put in place yourself right away, with the exact text.',
    strongPdf: 'The attached PDF shows what works well for you, what is still missing, and one measure you can put in place yourself right away.',
    next: `If you would like to discuss the next step, I am happy to show you in 30 minutes what can be improved in your case, free and without obligation: ${CALENDLY}`,
    regards: 'Kind regards,',
    site: 'https://www.zbinden.online/en/geo-audit',
  },
};

/** { subject, body } de l'e-mail de réponse (texte brut, comme envoi_email.py). */
export function renderEmail(cand, test, a, reportLang) {
  const m = MAIL[reportLang];
  const t = T[reportLang];
  const strong = test.provider_named >= 5;
  const body = [
    m.hi, '',
    m.intro, '',
    `${m.result} ${t.result(test.provider_named, cand.company, a.provider_phrase)}`, '',
    a.email_paragraph.replace(/\*\*/g, ''), '',
    strong ? m.strongPdf : m.pdf, '',
    m.next, '',
    m.regards, '',
    'Pauline Zbinden', '',
    'Zbinden Software', PHONE, 'info@zbinden.online', m.site,
  ].join('\n');
  return { subject: m.subject(cand.company), body: body };
}
