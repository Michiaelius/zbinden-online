/**
 * POST /api/mockup-run
 * Ébauche gratuite automatique (« Kostenloser Entwurf ») : Claude écrit le content.json à partir de la
 * demande (et du site actuel s'il existe), le Starter-Kit construit le site avec le logo et les couleurs,
 * il est mis en ligne sur vorschau.zbinden.online/<slug>-<code>/, puis un BROUILLON de réponse avec le
 * lien est créé dans custom-software@zbinden.online (Microsoft Graph). Rien n'est envoyé au client :
 * Pauline ouvre l'ébauche, relit le brouillon et l'envoie depuis Outlook.
 * Une alerte « Ébauche prête » (points à vérifier + content.json) part à info@ via Resend ;
 * en cas d'échec, l'alerte dit à quelle étape, avec le brief pour le faire à la main.
 *
 * Appelée par api/website-entwurf.mjs (formulaire), ou à la main (source: manual, pas de limite du jour).
 * En-tête : x-geo-secret = GEO_RUN_SECRET
 * Corps : { brief (entwurf-<slug>.json), logo?: { ext, data base64 }, source: form|manual }
 * Réponse : 202 { ok: true, url } et le travail continue en arrière-plan.
 *
 * Variables d'environnement : GEO_RUN_SECRET, ANTHROPIC_API_KEY, RESEND_API_KEY, GRAPH_TENANT_ID,
 * GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET, VORSCHAU_FTP_HOST, VORSCHAU_FTP_USER, VORSCHAU_FTP_PASS
 * (optionnel : ENTWURF_DAILY_MAX défaut 5, ENTWURF_MODEL, VORSCHAU_BASE, GRAPH_MAILBOX, CONTACT_TO)
 */

import { waitUntil } from '@vercel/functions';
import { rm } from 'node:fs/promises';
import { okUrl, readSite } from './_geo/site.mjs';
import { countToday, createTextDraft, graphConfigured } from './_geo/graph.mjs';
import { writeContent } from './_entwurf/content.mjs';
import { buildMockup, upload, folderName, ftpConfigured } from './_entwurf/mockup.mjs';

const FROM = 'Zbinden Software <info@zbinden.online>';
const CATEGORY = 'Entwurf auto';
const PHONE = '+41 79 193 68 02';
const LOGO_EXT = ['png', 'jpg', 'svg', 'webp'];

const MAIL = {
  de: {
    subject: function (firma) { return `Ihr Website-Entwurf ist bereit — ${firma}`; },
    hi: 'Guten Tag',
    ready: 'Ihr kostenloser Entwurf ist bereit. Hier können Sie ihn ansehen, am besten auch auf dem Handy:',
    made: function (logo, site) {
      return `Ich habe ihn ${logo ? 'mit Ihrem Logo und ' : 'mit '}Ihren Farben gestaltet und die Texte aus Ihren Angaben${site ? ' und Ihrer Website' : ''} geschrieben. ` +
        'Es ist ein erster Entwurf: Texte und Aufbau passen wir gemeinsam an, und Fotos von Ihnen und Ihrer Arbeit ersetzen später die farbigen Formen.';
    },
    multi: 'Der Entwurf zeigt die Startseite. Die fertige Website wird mehrere Seiten haben: Die Links im Menü und die Buttons wie «Mehr erfahren» zeigen schon, wohin es gehen wird. Diese Unterseiten gestalten wir im gleichen Design, sobald wir die Inhalte zusammen festgelegt haben.',
    one: 'Der Entwurf ist ein Onepager, wie gewünscht. Sie können jederzeit auf eine Website mit mehreren Seiten umsteigen, gleich von Anfang an oder später, je nachdem, was Sie wirklich brauchen.',
    offen: 'Der Entwurf zeigt die Startseite. Ob eine einzige Seite reicht oder mehrere Seiten sinnvoller sind, entscheiden wir gemeinsam im Gespräch, je nachdem, was Sie wirklich brauchen.',
    next: 'Gefällt er Ihnen? Dann besprechen wir gerne in einem kurzen Gespräch die nächsten Schritte, ob Kauf oder Abo. Antworten Sie einfach auf diese E-Mail oder rufen Sie mich an.',
    regards: 'Freundliche Grüsse',
  },
  fr: {
    subject: function (firma) { return `Votre ébauche de site est prête — ${firma}`; },
    hi: 'Bonjour,',
    ready: 'Votre ébauche gratuite est prête. Vous pouvez la découvrir ici, idéalement aussi sur votre téléphone :',
    made: function (logo, site) {
      return `Je l’ai conçue ${logo ? 'avec votre logo et ' : 'avec '}vos couleurs, et j’ai rédigé les textes à partir de vos indications${site ? ' et de votre site' : ''}. ` +
        'C’est une première ébauche : nous ajustons ensemble les textes et la structure, et des photos de vous et de votre travail remplaceront ensuite les formes colorées.';
    },
    multi: 'L’ébauche montre la page d’accueil. Le site final comptera plusieurs pages : les liens du menu et les boutons comme « En savoir plus » montrent déjà où elles mèneront. Nous créerons ces pages dans le même design, dès que nous aurons défini ensemble leur contenu.',
    one: 'L’ébauche est un site d’une seule page, comme demandé. Vous pouvez passer à un site de plusieurs pages à tout moment, dès le départ ou plus tard, selon vos besoins réels.',
    offen: 'L’ébauche montre la page d’accueil. Une seule page suffit-elle, ou plusieurs pages seraient-elles plus utiles ? Nous le déciderons ensemble lors de notre entretien, selon vos besoins réels.',
    next: 'Elle vous plaît ? Parlons volontiers des prochaines étapes lors d’un court entretien, que ce soit pour un achat ou un abonnement. Répondez simplement à cet e-mail ou appelez-moi.',
    regards: 'Meilleures salutations,',
  },
  en: {
    subject: function (firma) { return `Your website draft is ready — ${firma}`; },
    hi: 'Hello,',
    ready: 'Your free draft is ready. You can view it here, ideally on your phone too:',
    made: function (logo, site) {
      return `I designed it ${logo ? 'with your logo and ' : 'with '}your colours and wrote the texts based on your details${site ? ' and your website' : ''}. ` +
        'It is a first draft: we will adjust the texts and structure together, and photos of you and your work will later replace the coloured shapes.';
    },
    multi: 'The draft shows the home page. The finished website will have several pages: the menu links and buttons such as “Learn more” already show where they will lead. We will design these pages in the same style once we have agreed on their content together.',
    one: 'As requested, the draft is a one-page website. You can switch to a website with several pages at any time, right from the start or later, depending on what you really need.',
    offen: 'The draft shows the home page. Whether a single page is enough or several pages make more sense, we will decide together in our conversation, depending on what you really need.',
    next: 'Do you like it? I would be happy to discuss the next steps in a short call, whether you want to buy or subscribe. Simply reply to this e-mail or give me a call.',
    regards: 'Kind regards,',
  },
};

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function slug(s) {
  return String(s).toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30).replace(/-$/, '') || 'entwurf';
}
// « Malerei Vogel, Frick » → « Malerei Vogel » pour le dossier et l'objet
function firmName(firma) { return String(firma).split(',')[0].trim() || String(firma).trim(); }

function clientMail(brief, url, hasSite) {
  const t = MAIL[brief.lang] || MAIL.de;
  return {
    subject: t.subject(firmName(brief.firma)),
    body: [
      t.hi, '',
      t.ready, url, '',
      t.made(!!brief.logo, hasSite), '',
    ].concat(brief.umfang === 'mehrseitig' ? [t.multi, ''] : brief.umfang === 'onepager' ? [t.one, ''] : [t.offen, '']).concat([
      t.next, '',
      t.regards,
      'Pauline Zbinden',
      'Zbinden Software',
      PHONE,
      'www.zbinden.online',
    ]).join('\n'),
  };
}

async function alert(subject, lines, attachments) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const html = `<div style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;color:#18150f;max-width:560px;">` +
    lines.filter(Boolean).map(function (l) { return l.startsWith('<') ? l : `<p style="margin:0 0 12px;line-height:1.55;white-space:pre-wrap;">${esc(l)}</p>`; }).join('') +
    `</div>`;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [process.env.CONTACT_TO || 'info@zbinden.online'], subject, html, attachments: attachments || [] }),
    });
  } catch (e) {}
}

function button(href, label) {
  return `<p style="margin:0 0 16px;"><a href="${esc(href)}" style="display:inline-block;background:#24576b;color:#fff;text-decoration:none;font-weight:600;padding:10px 18px;border-radius:999px;">${esc(label)}</a></p>`;
}

async function job(brief, logo, source, folder) {
  const label = brief.firma;
  const briefAtt = { filename: `entwurf-${slug(firmName(brief.firma))}.json`, content: Buffer.from(JSON.stringify(brief, null, 2)).toString('base64') };
  let step = 'limite du jour';
  let built = null, url = '', content = null;
  try {
    if (source === 'form') {
      const max = parseInt(process.env.ENTWURF_DAILY_MAX || '5', 10);
      const done = await countToday(CATEGORY);
      if (done >= max) {
        await alert(`Ébauche : limite du jour atteinte — ${label}`, [
          `${done} ébauches automatiques aujourd’hui (maximum ${max}). Celle-ci n’a pas été lancée : à faire à la main avec le brief joint.`,
        ], [briefAtt]);
        return;
      }
    }

    step = 'lecture du site actuel';
    const start = brief.website ? okUrl(brief.website) : null;
    const site = start ? await readSite(start, 8000, 4000).catch(function () { return { text: '' }; }) : { text: '' };

    step = 'rédaction des textes (Claude)';
    const w = await writeContent(brief, site.text);
    content = w.content;
    // Ce qui ne doit pas venir du modèle
    if (brief.farben) { content.farben = brief.farben; delete content.palette; }
    else if (brief.palette) content.palette = brief.palette;
    content.lang = brief.lang;
    content.firma.email = brief.kontakt.email;

    step = 'construction (Starter-Kit)';
    built = await buildMockup(content, logo, folder);

    step = 'mise en ligne FTP';
    url = await upload(built.siteDir, folder);

    step = 'brouillon Outlook';
    const mail = clientMail(brief, url, !!site.text);
    const draft = await createTextDraft(brief.kontakt.email, mail.subject, mail.body, CATEGORY);

    await alert(`Ébauche prête : ${label}`, [
      `L’ébauche est en ligne et le brouillon de réponse à ${brief.kontakt.email} est dans les brouillons de ${process.env.GRAPH_MAILBOX || 'custom-software@zbinden.online'}. Regarde l’ébauche (aussi sur le téléphone), relis le brouillon, puis envoie-le depuis Outlook.`,
      button(url, 'Ouvrir l’ébauche'),
      draft.webLink ? button(draft.webLink, 'Ouvrir le brouillon') : '',
      `Adresse : ${url}`,
      `Layout ${built.layoutId} · couleurs ${built.palette} · police ${built.fontsId}` + (brief.website ? `\nSite lu : ${brief.website}${site.text ? '' : ' (illisible, textes écrits seulement d’après le formulaire)'}` : ''),
      w.pruefen.length ? `À vérifier (hypothèses de Claude) :\n${w.pruefen.map(function (p) { return '· ' + p; }).join('\n')}` : '',
      built.warnings.length ? `Remarques du Starter-Kit :\n${built.warnings.map(function (p) { return '· ' + p; }).join('\n')}` : '',
      `Pour corriger : modifier content.json (joint), puis node build.mjs content.json --vorschau et recharger le dossier ${folder}/ par FTP.`,
    ], [
      { filename: 'content.json', content: Buffer.from(JSON.stringify(built.content, null, 2)).toString('base64') },
      briefAtt,
    ]);
  } catch (e) {
    const att = [briefAtt];
    if (content) att.push({ filename: 'content.json', content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64') });
    await alert(`Ébauche automatique échouée : ${label}`, [
      `Étape : ${step}`,
      `Erreur : ${String(e && e.message || e).slice(0, 600)}`,
      url ? `L’ébauche est pourtant en ligne : ${url} (seul le brouillon manque, écris la réponse à ${brief.kontakt.email} à la main).`
        : 'À faire à la main avec le brief joint (Starter-Kit, puis FTP vorschau).',
    ], att);
  } finally {
    if (built) await rm(built.dir, { recursive: true, force: true }).catch(function () {});
  }
}

function cleanBrief(b) {
  if (!b || typeof b !== 'object') return null;
  const s = function (v, max) { return String(v == null ? '' : v).trim().slice(0, max); };
  const hex = function (v) { return /^#[0-9a-f]{6}$/i.test(String(v || '')); };
  const brief = {
    firma: s(b.firma, 200),
    website: s(b.website, 400) || null,
    angebot: s(b.angebot, 3000) || null,
    umfang: ['onepager', 'mehrseitig', 'offen'].includes(b.umfang) ? b.umfang : 'offen',
    lang: ['de', 'fr', 'en'].includes(b.lang) ? b.lang : 'de',
    palette: /^[a-z]{3,20}$/.test(String(b.palette || '')) ? b.palette : null,
    farben: b.farben && hex(b.farben.haupt) && hex(b.farben.akzent) ? { haupt: b.farben.haupt.toLowerCase(), akzent: b.farben.akzent.toLowerCase() } : null,
    logo: b.logo ? s(b.logo, 120) : null,
    kontakt: { email: s(b.kontakt && b.kontakt.email, 200), telefon: s(b.kontakt && b.kontakt.telefon, 60) || null },
    eingegangen: s(b.eingegangen, 40) || new Date().toISOString(),
  };
  if (brief.farben) brief.palette = null;
  if (!brief.firma || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(brief.kontakt.email)) return null;
  return brief;
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
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  const brief = cleanBrief(b && b.brief);
  if (!brief) {
    res.status(400).json({ ok: false, reason: 'brief' });
    return;
  }
  let logo = null;
  if (b.logo && LOGO_EXT.includes(b.logo.ext) && /^[A-Za-z0-9+/=]+$/.test(String(b.logo.data || ''))) {
    logo = { ext: b.logo.ext, data: b.logo.data };
  }
  if (!brief.logo) logo = null;
  if (!graphConfigured() || !ftpConfigured() || !process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ ok: false, reason: 'not_configured' });
    return;
  }
  const folder = folderName(slug(firmName(brief.firma)));
  waitUntil(job(brief, logo, b.source === 'manual' ? 'manual' : 'form', folder));
  res.status(202).json({ ok: true, url: `${(process.env.VORSCHAU_BASE || 'https://vorschau.zbinden.online').replace(/\/$/, '')}/${folder}/` });
}
