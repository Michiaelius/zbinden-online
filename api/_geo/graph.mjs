/**
 * Microsoft Graph, en mode application (sans connexion interactive) : crée le brouillon de la
 * réponse GEO-Light dans la boîte d'envoi. Rien n'est jamais envoyé au client d'ici :
 * Pauline relit le brouillon et l'envoie elle-même depuis Outlook.
 *
 * Variables d'environnement : GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET
 * (optionnel : GRAPH_MAILBOX, défaut custom-software@zbinden.online)
 * Permission d'application Mail.ReadWrite, limitée à cette boîte (voir api/SETUP-geo-light-auto.md).
 */

export const CATEGORY = 'GEO-Light auto';

function mailbox() { return process.env.GRAPH_MAILBOX || 'custom-software@zbinden.online'; }

export function graphConfigured() {
  return !!(process.env.GRAPH_TENANT_ID && process.env.GRAPH_CLIENT_ID && process.env.GRAPH_CLIENT_SECRET);
}

async function token() {
  const r = await fetch(`https://login.microsoftonline.com/${process.env.GRAPH_TENANT_ID}/oauth2/v2.0/token`, {
    method: 'POST',
    signal: AbortSignal.timeout(10000),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GRAPH_CLIENT_ID,
      client_secret: process.env.GRAPH_CLIENT_SECRET,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    }),
  });
  if (!r.ok) throw new Error('graph token ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return (await r.json()).access_token;
}

async function graph(tok, path, init) {
  const r = await fetch('https://graph.microsoft.com/v1.0/users/' + encodeURIComponent(mailbox()) + path, Object.assign({
    signal: AbortSignal.timeout(15000),
  }, init, { headers: Object.assign({ Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' }, (init || {}).headers) }));
  if (!r.ok) throw new Error('graph ' + path.split('?')[0] + ' ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return r.status === 204 ? null : r.json();
}

/** Nombre de brouillons GEO-Light créés aujourd'hui (heure suisse), envoyés ou non. */
export async function countToday() {
  const tok = await token();
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich' }).format(new Date());
  // Minuit à Zurich ≈ 22 h ou 23 h UTC la veille : on prend large puis on filtre la date locale.
  const since = new Date(new Date(day + 'T00:00:00Z').getTime() - 2 * 3600 * 1000).toISOString();
  const data = await graph(tok, `/messages?$filter=createdDateTime ge ${since}&$select=categories,createdDateTime&$top=200`);
  return (data.value || []).filter(function (m) {
    return (m.categories || []).includes(CATEGORY) &&
      new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich' }).format(new Date(m.createdDateTime)) === day;
  }).length;
}

/** Crée le brouillon (texte brut + PDF joint) et renvoie son lien web Outlook. */
export async function createDraft(to, subject, body, pdfName, pdf) {
  const tok = await token();
  const msg = await graph(tok, '/messages', {
    method: 'POST',
    body: JSON.stringify({
      subject: subject,
      body: { contentType: 'Text', content: body },
      toRecipients: [{ emailAddress: { address: to } }],
      categories: [CATEGORY],
      attachments: [{
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: pdfName,
        contentType: 'application/pdf',
        contentBytes: pdf.toString('base64'),
      }],
    }),
  });
  return { id: msg.id, webLink: msg.webLink || '' };
}
