/**
 * Test de visibilité IA GEO-Light : port JavaScript de ai_visibility.py (skill geo-pipeline).
 * Les modèles de questions, la détection des mentions et les appels aux deux moteurs sont
 * identiques au script Python : toute modification là-bas doit être reportée ici, et dans
 * buildQuestions() de js/geo-light.js.
 *
 * Variables d'environnement : OPENAI_API_KEY, PERPLEXITY_API_KEY
 * (optionnel : OPENAI_MODEL défaut gpt-4o, PPLX_MODEL défaut sonar)
 */

const PPLX_ENDPOINT = 'https://api.perplexity.ai/chat/completions';
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/responses';

const SYSTEM_PROMPTS = {
  de: 'Du bist ein lokaler Empfehlungs-Assistent. Antworte auf Deutsch, kurz und ' +
    'konkret, so wie du einer Person antworten wuerdest, die eine echte Empfehlung ' +
    'sucht. Nenne konkrete Anbieter mit Namen, wenn du welche kennst.',
  fr: 'Tu es un assistant de recommandation local. Réponds en français, de façon ' +
    'brève et concrète, comme tu répondrais à une personne qui cherche une vraie ' +
    'recommandation. Cite des prestataires concrets par leur nom si tu en connais.',
  en: 'You are a local recommendation assistant. Answer in English, briefly and ' +
    'concretely, as you would answer someone looking for a real recommendation. ' +
    'Name concrete providers if you know any.',
};

const LEGAL_FORMS = [
  'gmbh', 'ag', 'sa', 'sarl', 'sagl', 'ohg', 'kg', 'kgaa', 'se', 'ug',
  'ltd', 'llc', 'inc', 'co', 'klg', 'eg', 'genossenschaft', 'gruppe', 'group',
  'holding', 'partner', 'partners', 'und partner', '& partner', '& co',
];

function cap(t) { return t.slice(0, 1).toUpperCase() + t.slice(1); }

/** Les 8 questions : [{ n, category, text }]. Catégories : identity, person, recommendation, discovery. */
export function buildQuestions(cand) {
  const company = String(cand.company || '').trim();
  const city = String(cand.city || '').trim();
  const person = String(cand.person || '').trim();
  const branche = String(cand.branche || '').trim() || 'Firma';
  const offers = (cand.offers || []).map(function (o) { return String(o || '').trim(); }).filter(Boolean);
  while (offers.length < 3) offers.push(offers.includes(branche) ? branche + ' Beratung' : branche);
  let [o1, o2, o3] = offers;
  const personRole = String(cand.person_role || '').trim() || branche;
  const lang = cand.lang || 'de';
  const opt = function (key, def) { return String(cand[key] || '').trim() || def; };

  if (lang === 'fr' || lang === 'en') { o1 = cap(o1); o2 = cap(o2); o3 = cap(o3); }

  let q1, q2Person, q2Fallback, rest;
  if (lang === 'fr') {
    const cityIn = opt('city_in', 'à ' + city);
    const quel = opt('quel', 'quel ' + branche);
    q1 = `Que fait ${company} ${cityIn} ?`;
    q2Person = `Qui est ${person}, ${personRole} ${cityIn} ?`;
    q2Fallback = `Que propose ${company} ${cityIn} ?`;
    rest = [
      ['recommendation', `${o1} ${city} — quel prestataire recommandes-tu ?`],
      ['discovery', `${o2} ${city}`],
      ['discovery', `${o3} ${city}`],
      ['recommendation', `${o1} ${cityIn} — ${quel} recommandes-tu ?`],
      ['recommendation', `${cap(quel)} recommandes-tu ${cityIn} ?`],
      ['discovery', `${cap(o2)} ${cityIn} : à qui s'adresser ?`],
    ];
  } else if (lang === 'en') {
    const cityIn = opt('city_in', city);
    const which = opt('which', 'which ' + branche);
    q1 = `What is ${company} in ${cityIn}?`;
    q2Person = `Who is ${person}, ${personRole} in ${cityIn}?`;
    q2Fallback = `What does ${company} offer in ${cityIn}?`;
    rest = [
      ['recommendation', `${o1} ${city} — which provider do you recommend?`],
      ['discovery', `${o2} ${city}`],
      ['discovery', `${o3} ${city}`],
      ['recommendation', `${o1} in ${cityIn} — ${which} do you recommend?`],
      ['recommendation', `${cap(which)} do you recommend in ${cityIn}?`],
      ['discovery', `${cap(o2)} in ${cityIn}: who should I contact?`],
    ];
  } else {
    const cityIn = opt('city_in', city);
    const akk = opt('welche_akk', 'welche ' + branche);
    const nom = opt('welche_nom', 'welche ' + branche);
    q1 = `Was ist ${company} in ${cityIn}?`;
    q2Person = `Wer ist ${person}, ${personRole} in ${cityIn}?`;
    q2Fallback = `${cap(nom)} ist ${company} in ${cityIn}?`;
    rest = [
      ['recommendation', `${o1} ${city} — welchen Anbieter empfiehlst du?`],
      ['discovery', `${o2} ${city}`],
      ['discovery', `${o3} ${city}`],
      ['recommendation', `${o1} in ${cityIn} — ${akk} empfiehlst du?`],
      ['recommendation', `${cap(akk)} empfiehlst du in ${cityIn}?`],
      ['discovery', `Wo in ${cityIn} macht man ${o2}?`],
    ];
  }

  const questions = [
    { n: 1, category: 'identity', text: q1 },
    person ? { n: 2, category: 'person', text: q2Person } : { n: 2, category: 'identity', text: q2Fallback },
  ];
  rest.forEach(function (r, i) { questions.push({ n: i + 3, category: r[0], text: r[1] }); });
  return questions;
}

// --- Détection des mentions ------------------------------------------------

function norm(text) {
  return String(text || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' und ').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function companyVariants(company) {
  const full = norm(company);
  const variants = new Set([full]);
  let toks = full.split(' ');
  while (toks.length > 1 && LEGAL_FORMS.includes(toks[toks.length - 1])) toks = toks.slice(0, -1);
  if (toks.length) variants.add(toks.join(' '));
  return Array.from(variants).filter(function (v) { return v.length >= 3; });
}

function domainCore(domain) {
  const d = String(domain || '').toLowerCase().trim().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  return d.split('.')[0] || '';
}

function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function detectMention(answer, variants, dcore) {
  const hay = norm(answer);
  if (variants.some(function (v) { return v && hay.includes(v); })) return true;
  return !!(dcore && dcore.length >= 4 && new RegExp('\\b' + escRe(dcore) + '\\b').test(hay));
}

function detectSourceCitation(sources, domain) {
  const dc = domainCore(domain);
  const dl = String(domain || '').toLowerCase();
  return sources.some(function (s) {
    s = String(s || '').toLowerCase();
    return (dl && s.includes(dl)) || (dc && dc.length >= 4 && s.includes(dc));
  });
}

function uniq(list) { return Array.from(new Set(list)); }

// --- Appels aux moteurs ----------------------------------------------------

async function askPerplexity(question, cfg) {
  const r = await fetch(PPLX_ENDPOINT, {
    method: 'POST',
    signal: AbortSignal.timeout(90000),
    headers: { Authorization: `Bearer ${cfg.pplxKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: cfg.pplxModel,
      temperature: 0.2,
      messages: [{ role: 'system', content: cfg.system }, { role: 'user', content: question }],
    }),
  });
  if (!r.ok) throw new Error('perplexity ' + r.status);
  const data = await r.json();
  const answer = (((data.choices || [])[0] || {}).message || {}).content || '';
  const sources = [];
  (data.citations || []).forEach(function (c) {
    if (typeof c === 'string') sources.push(c);
    else if (c && c.url) sources.push(c.url);
  });
  (data.search_results || []).forEach(function (s) { if (s && s.url) sources.push(s.url); });
  return { answer: answer.trim(), sources: uniq(sources) };
}

function openaiExtract(data) {
  const parts = [];
  const sources = [];
  if (typeof data.output_text === 'string' && data.output_text.trim()) parts.push(data.output_text.trim());
  (data.output || []).forEach(function (item) {
    if (!item || typeof item !== 'object') return;
    if (item.type === 'message') {
      (item.content || []).forEach(function (block) {
        if (!block || (block.type !== 'output_text' && block.type !== 'text')) return;
        const txt = String(block.text || '').trim();
        if (txt && !parts.includes(txt)) parts.push(txt);
        (block.annotations || []).forEach(function (a) { if (a && a.url) sources.push(a.url); });
      });
    } else if (item.type === 'web_search_call' || item.type === 'web_search_results') {
      (item.results || item.search_results || []).forEach(function (s) { if (s && s.url) sources.push(s.url); });
    }
  });
  return { answer: parts.join('\n\n').trim(), sources: uniq(sources) };
}

async function askOpenAI(question, cfg) {
  const call = function (tool) {
    return fetch(OPENAI_ENDPOINT, {
      method: 'POST',
      signal: AbortSignal.timeout(120000),
      headers: { Authorization: `Bearer ${cfg.openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: cfg.openaiModel,
        instructions: cfg.system,
        input: question,
        tools: [{ type: tool }],
        tool_choice: 'auto',
      }),
    });
  };
  let r = await call('web_search');
  if (r.status === 400) r = await call('web_search_preview');
  if (!r.ok) throw new Error('openai ' + r.status);
  return openaiExtract(await r.json());
}

async function runEngine(engine, question, cfg, variants, dcore) {
  let last;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const out = engine === 'perplexity' ? await askPerplexity(question, cfg) : await askOpenAI(question, cfg);
      return {
        named: detectMention(out.answer, variants, dcore),
        cited_source: detectSourceCitation(out.sources, cfg.domain),
        answer: out.answer,
        sources: out.sources,
        error: null,
      };
    } catch (e) {
      last = e;
      if (attempt === 0) await new Promise(function (ok) { setTimeout(ok, 2000); });
    }
  }
  return { named: false, cited_source: false, answer: '', sources: [], error: String(last && last.message || last) };
}

/**
 * Pose les 8 questions aux deux moteurs (16 appels en parallèle) et renvoie le même résumé
 * que KI-Sichtbarkeit-<Slug>.json, plus provider_named = « n von 6 » (questions 3 à 8).
 */
export async function runVisibilityTest(cand) {
  const cfg = {
    openaiKey: process.env.OPENAI_API_KEY,
    pplxKey: process.env.PERPLEXITY_API_KEY,
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4o',
    pplxModel: process.env.PPLX_MODEL || 'sonar',
    domain: cand.domain || '',
    system: SYSTEM_PROMPTS[cand.lang] || SYSTEM_PROMPTS.de,
  };
  if (!cfg.openaiKey || !cfg.pplxKey) throw new Error('OPENAI_API_KEY ou PERPLEXITY_API_KEY manquant');

  const variants = companyVariants(cand.company);
  const dcore = domainCore(cand.domain);
  const questions = buildQuestions(cand);
  const jobs = [];
  questions.forEach(function (q) {
    ['chatgpt', 'perplexity'].forEach(function (eng) {
      jobs.push(runEngine(eng, q.text, cfg, variants, dcore).then(function (r) { q[eng] = r; }));
    });
  });
  await Promise.all(jobs);

  const errors = questions.reduce(function (n, q) { return n + (q.chatgpt.error ? 1 : 0) + (q.perplexity.error ? 1 : 0); }, 0);
  const providerQs = questions.filter(function (q) { return q.n >= 3; });
  return {
    company: cand.company,
    lang: cand.lang,
    tested_at: new Date().toISOString(),
    openai_model: cfg.openaiModel,
    pplx_model: cfg.pplxModel,
    questions: questions,
    errors: errors,
    provider_named: providerQs.filter(function (q) { return q.chatgpt.named || q.perplexity.named; }).length,
    provider_named_chatgpt: providerQs.filter(function (q) { return q.chatgpt.named; }).length,
    provider_named_perplexity: providerQs.filter(function (q) { return q.perplexity.named; }).length,
    // Nombre des 12 réponses « fournisseur » qui citent l'entreprise (ligne mise en avant si bon résultat).
    provider_answers_named: providerQs.reduce(function (n, q) { return n + (q.chatgpt.named ? 1 : 0) + (q.perplexity.named ? 1 : 0); }, 0),
    cited_source_count: questions.reduce(function (n, q) { return n + (q.chatgpt.cited_source ? 1 : 0) + (q.perplexity.cited_source ? 1 : 0); }, 0),
  };
}

/** Transcription complète en Markdown (même forme que KI-Sichtbarkeit-<Slug>.md), jointe à l'alerte interne. */
export function transcriptMarkdown(cand, t) {
  const L = [`# KI-Sichtbarkeitstest — ${cand.company}`, '',
    `- Ort: ${cand.city}`, `- Sprache der Fragen: ${cand.lang}`, `- Website: ${cand.domain}`,
    `- Branche: ${cand.branche}`, `- Angebote: ${(cand.offers || []).join(', ')}`,
    `- Getestet am: ${t.tested_at} (ChatGPT ${t.openai_model}, Perplexity ${t.pplx_model})`, '',
    `## Ergebnis: ${t.provider_named} von 6 Anbieterfragen (ChatGPT ${t.provider_named_chatgpt}, Perplexity ${t.provider_named_perplexity})`, ''];
  t.questions.forEach(function (q) {
    L.push(`## Frage ${q.n} (${q.category})`, '', `> ${q.text}`, '');
    [['chatgpt', 'ChatGPT'], ['perplexity', 'Perplexity']].forEach(function (e) {
      const r = q[e[0]];
      L.push(`### ${e[1]} — ${r.error ? 'Fehler' : r.named ? 'genannt' : 'NICHT genannt'}`, '');
      L.push(r.error ? `_${r.error}_` : (r.answer || '_(keine Antwort)_'));
      if (r.sources.length) L.push('', '**Quellen:**', ...r.sources.map(function (s) { return '- ' + s; }));
      L.push('');
    });
  });
  return L.join('\n') + '\n';
}
