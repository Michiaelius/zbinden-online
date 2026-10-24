/**
 * POST /api/geo-light-run
 * Test GEO-Light automatique : 8 questions à ChatGPT et Perplexity, rapport rédigé par Claude,
 * PDF, puis BROUILLON de la réponse dans custom-software@zbinden.online (Microsoft Graph).
 * Rien n'est envoyé au client : Pauline relit le brouillon et l'envoie depuis Outlook.
 * Une alerte « Brouillon prêt » (avec le PDF et la transcription complète) part à info@ via Resend ;
 * en cas d'échec, l'alerte dit pourquoi, pour faire le test à la main avec /geo-light.
 *
 * Appelée par api/contact.mjs (formulaire GEO-Light, profil confirmé par le visiteur)
 * et par la page privée /geo-light-start (lancement manuel).
 *
 * En-tête : x-geo-secret = GEO_RUN_SECRET
 * Corps : { kandidat, email, report_lang: de|fr|en, source: form|manual, dry_run? }
 * Réponse : dry_run → { ok, questions } ; sinon 202 { ok: true } et le test continue en arrière-plan.
 *
 * Variables d'environnement : GEO_RUN_SECRET, OPENAI_API_KEY, PERPLEXITY_API_KEY, ANTHROPIC_API_KEY, RESEND_API_KEY,
 * GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET
 * (optionnel : GRAPH_MAILBOX, GEO_LIGHT_DAILY_MAX défaut 5, GEO_LIGHT_MODEL, OPENAI_MODEL, PPLX_MODEL, CONTACT_TO)
 * Limite : au plus GEO_LIGHT_DAILY_MAX tests automatiques par jour depuis le formulaire ;
 * au-delà, seule la notification habituelle arrive. Le lancement manuel n'est pas limité.
 */

import { waitUntil } from '@vercel/functions';
import { okUrl, readSite } from './_geo/site.mjs';
import { buildQuestions, runVisibilityTest, transcriptMarkdown } from './_geo/visibility.mjs';
import { fillGrammar, writeReport, zefixLookup } from './_geo/analyse.mjs';
import { renderReportHtml, renderEmail, fileStem, slugify } from './_geo/report.mjs';
import { htmlToPdf } from './_geo/pdf.mjs';
import { countToday, createDraft, graphConfigured } from './_geo/graph.mjs';

const FROM = 'Zbinden Software <info@zbinden.online>';
const KEYS = ['company', 'city', 'city_in', 'domain', 'person', 'person_role', 'branche',
  'welche_akk', 'welche_nom', 'quel', 'which', 'lang'];

function sanitize(k) {
  const c = {};
  KEYS.forEach(function (key) { c[key] = String((k || {})[key] == null ? '' : k[key]).replace(/\s+/g, ' ').trim().slice(0, 120); });
  if (!['de', 'fr', 'en'].includes(c.lang)) c.lang = 'de';
  c.offers = (Array.isArray(k && k.offers) ? k.offers : []).slice(0, 3)
    .map(function (o) { return String(o || '').replace(/\s+/g, ' ').trim().slice(0, 120); }).filter(Boolean);
  c.domain = c.domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  return c;
}

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function alert(subject, lines, attachments) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const html = `<div style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;color:#18150f;max-width:560px;">` +
    lines.map(function (l) { return l.startsWith('<') ? l : `<p style="margin:0 0 12px;line-height:1.55;white-space:pre-wrap;">${esc(l)}</p>`; }).join('') +
    `</div>`;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [process.env.CONTACT_TO || 'info@zbinden.online'],
        subject: subject,
        html: html,
        attachments: attachments || [],
      }),
    });
  } catch (e) {}
}

async function job(cand, email, reportLang, source) {
  const label = `${cand.company} (${cand.domain})`;
  let step = 'limite du jour';
  let pdf = null, mail = null, stem = '', transcript = '';
  try {
    if (source === 'form') {
      const max = parseInt(process.env.GEO_LIGHT_DAILY_MAX || '5', 10);
      const done = await countToday();
      if (done >= max) {
        await alert(`GEO-Light : limite du jour atteinte — ${label}`, [
          `${done} tests automatiques aujourd’hui (maximum ${max}). Celui-ci n’a pas été lancé.`,
          `À faire à la main : /geo-light https://${cand.domain} ${email}`,
          `<pre style="background:#f2efe7;padding:10px;border-radius:6px;font-size:12px;white-space:pre-wrap;">${esc(JSON.stringify(cand, null, 2))}</pre>`,
        ]);
        return;
      }
    }

    step = 'test ChatGPT / Perplexity';
    await fillGrammar(cand);
    const start = okUrl(cand.domain);
    const [test, site, zefix] = await Promise.all([
      runVisibilityTest(cand),
      start ? readSite(start, 6000, 3500).catch(function () { return { text: '' }; }) : Promise.resolve({ text: '' }),
      zefixLookup(cand.company, cand.city),
    ]);
    transcript = transcriptMarkdown(cand, test);
    if (test.errors > 4) throw new Error(`${test.errors} réponses sur 16 en erreur`);

    step = 'rédaction du rapport';
    const a = await writeReport(cand, test, site.text, zefix, reportLang);

    step = 'PDF';
    stem = fileStem(reportLang, slugify(cand.company));
    pdf = await htmlToPdf(renderReportHtml(cand, test, a, reportLang));
    mail = renderEmail(cand, test, a, reportLang);

    step = 'brouillon Outlook';
    const draft = await createDraft(email, mail.subject, mail.body, stem + '.pdf', pdf);

    const facts = a.statements.map(function (s) { return `· ${s.text} (${s.engine}, ${s.tag})`; }).join('\n');
    await alert(`Brouillon GEO-Light prêt : ${cand.company} — ${test.provider_named} sur 6`, [
      `Le brouillon de réponse à ${email} est dans les brouillons de ${process.env.GRAPH_MAILBOX || 'custom-software@zbinden.online'}. Relis le PDF et l’e-mail, puis envoie-le depuis Outlook.`,
      draft.webLink ? `<p style="margin:0 0 16px;"><a href="${esc(draft.webLink)}" style="display:inline-block;background:#24576b;color:#fff;text-decoration:none;font-weight:600;padding:10px 18px;border-radius:999px;">Ouvrir le brouillon</a></p>` : '',
      `Résultat : ${test.provider_named} sur 6 (ChatGPT ${test.provider_named_chatgpt}, Perplexity ${test.provider_named_perplexity})` +
        (test.errors ? ` · ${test.errors} réponse(s) en erreur` : '') +
        (a.competitors.length ? `\nConcurrents : ${a.competitors.map(function (c) { return `${c.name} ${c.count}×`; }).join(', ')}` : ''),
      `À vérifier en priorité (ce que dit l’IA) :\n${facts}`,
      `Profil testé : ${cand.branche} · ${cand.city} · ${cand.offers.join(', ')} · langue ${cand.lang}, rapport ${reportLang}` +
        (zefix ? `\nRegistre du commerce : ${zefix.name}, ${zefix.seat}` : '\nRegistre du commerce : rien trouvé automatiquement'),
      `Transcription complète des 16 réponses en pièce jointe.`,
    ], [
      { filename: stem + '.pdf', content: pdf.toString('base64') },
      { filename: `KI-Sichtbarkeit-${slugify(cand.company)}.md`, content: Buffer.from(transcript).toString('base64') },
    ]);
  } catch (e) {
    const att = [];
    if (pdf) att.push({ filename: stem + '.pdf', content: pdf.toString('base64') });
    if (transcript) att.push({ filename: `KI-Sichtbarkeit-${slugify(cand.company)}.md`, content: Buffer.from(transcript).toString('base64') });
    await alert(`GEO-Light automatique échoué : ${label}`, [
      `Étape : ${step}`,
      `Erreur : ${String(e && e.message || e).slice(0, 500)}`,
      pdf && mail
        ? `Le PDF est prêt (pièce jointe). Texte de l’e-mail à envoyer à ${email} :\n\nObjet : ${mail.subject}\n\n${mail.body}`
        : `À faire à la main : /geo-light https://${cand.domain} ${email}`,
      `<pre style="background:#f2efe7;padding:10px;border-radius:6px;font-size:12px;white-space:pre-wrap;">${esc(JSON.stringify(cand, null, 2))}</pre>`,
    ], att);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ ok: false, reason: 'method' });
    return;
  }
  const secret = process.env.GEO_RUN_SECRET;
  if (!secret || req.headers['x-geo-secret'] !== secret) {
    res.status(401).json({ ok: false, reason: 'unauthorized' });
    return;
  }

  let b = req.body;
  if (typeof b === 'string') {
    try { b = JSON.parse(b); } catch (e) { b = null; }
  }
  if (!b || typeof b !== 'object') {
    res.status(400).json({ ok: false, reason: 'body' });
    return;
  }
  const cand = sanitize(b.kandidat);
  if (!cand.company || !cand.city || !cand.domain || !cand.branche) {
    res.status(400).json({ ok: false, reason: 'profile' });
    return;
  }
  if (b.dry_run) {
    await fillGrammar(cand);
    res.status(200).json({ ok: true, kandidat: cand, questions: buildQuestions(cand).map(function (q) { return q.text; }) });
    return;
  }

  const email = String(b.email || '').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 200) {
    res.status(400).json({ ok: false, reason: 'email' });
    return;
  }
  if (!graphConfigured() || !process.env.PERPLEXITY_API_KEY || !process.env.OPENAI_API_KEY || !process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ ok: false, reason: 'not_configured' });
    return;
  }
  const reportLang = ['de', 'fr', 'en'].includes(b.report_lang) ? b.report_lang : 'de';
  const source = b.source === 'manual' ? 'manual' : 'form';

  waitUntil(job(cand, email, reportLang, source));
  res.status(202).json({ ok: true });
}
