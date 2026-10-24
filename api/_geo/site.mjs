/**
 * Lecture d'un site public pour le test GEO-Light (api/geo-preview.mjs et api/geo-light-run.mjs).
 * Aucune dépendance (fetch, Node 18+). Le préfixe « _ » empêche Vercel d'en faire une fonction.
 */

const MAX_BYTES = 1500000;
const UA = 'Mozilla/5.0 (compatible; ZbindenGeoLight/1.0; +https://www.zbinden.online/geo-audit)';

// Liens internes à lire en plus de l'accueil, par ordre de priorité.
const LINK_PATTERNS = [
  /angebot|leistung|dienstleist|services?|prestation|offre|offer|produkt|product|kompetenz|beratung|conseil/i,
  /ueber-uns|uber-uns|über|about|qui-sommes|a-propos|portrait|team|unternehmen|entreprise/i,
  /impressum|mentions|imprint|kontakt|contact/i,
];

export function okUrl(raw) {
  let s = String(raw || '').trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  let u;
  try { u = new URL(s); } catch (e) { return null; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  const h = u.hostname.toLowerCase();
  // Pas d'adresses locales ni d'IP brutes : on lit des sites publics.
  if (!h.includes('.') || h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal')) return null;
  if (/^[\d.]+$/.test(h) || h.includes(':') || h.startsWith('[')) return null;
  return u;
}

export async function getPage(url, ms) {
  const r = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(ms),
    // Pas d'Accept-Language : le site doit répondre dans sa langue par défaut.
    headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
  });
  if (!r.ok) throw new Error('status ' + r.status);
  const type = r.headers.get('content-type') || '';
  if (type && !/html|xml/i.test(type)) throw new Error('not html');

  // Lecture plafonnée : on s'arrête à MAX_BYTES.
  const reader = r.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.length;
    if (size >= MAX_BYTES) { try { await reader.cancel(); } catch (e) {} break; }
  }
  const buf = Buffer.concat(chunks.map(function (c) { return Buffer.from(c); }));

  // Les vieux sites ne sont souvent pas en UTF-8.
  let charset = (/charset=([\w-]+)/i.exec(type) || [])[1];
  if (!charset) {
    const head = buf.subarray(0, 4096).toString('latin1');
    charset = (/<meta[^>]+charset=["']?([\w-]+)/i.exec(head) || [])[1];
  }
  let html;
  try { html = new TextDecoder(charset || 'utf-8').decode(buf); }
  catch (e) { html = new TextDecoder('utf-8').decode(buf); }
  return { html: html, finalUrl: r.url || String(url) };
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', auml: 'ä', ouml: 'ö', uuml: 'ü',
  Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü', szlig: 'ß', eacute: 'é', egrave: 'è', ecirc: 'ê', agrave: 'à', acirc: 'â',
  ccedil: 'ç', ocirc: 'ô', icirc: 'î', ucirc: 'û', ugrave: 'ù', Eacute: 'É', rsquo: '’', lsquo: '‘',
  ldquo: '“', rdquo: '”', bdquo: '„', ndash: '–', mdash: '—', hellip: '…', laquo: '«', raquo: '»' };

export function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, function (m, e) {
    if (e[0] === '#') {
      const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : ' ';
    }
    return ENTITIES[e] !== undefined ? ENTITIES[e] : m;
  });
}

export function pageText(html, limit) {
  const title = decodeEntities(((/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html) || [])[1] || '').trim());
  const desc = decodeEntities((/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i.exec(html) || [])[1] || '');
  let body = html
    .replace(/<(script|style|noscript|svg|template|iframe)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(br|p|div|li|h[1-6]|tr|section|article|header|footer|nav)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  body = decodeEntities(body).replace(/[ \t ]+/g, ' ').replace(/\s*\n\s*/g, '\n').replace(/\n{2,}/g, '\n').trim();
  return (`Titel: ${title}\nBeschreibung: ${desc}\n${body}`).slice(0, limit);
}

export function pickLinks(html, base) {
  const host = base.hostname.replace(/^www\./, '');
  const found = [];
  const re = /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    let u;
    try { u = new URL(m[1], base); } catch (e) { continue; }
    if (!/^https?:$/.test(u.protocol) || u.hostname.replace(/^www\./, '') !== host) continue;
    if (/\.(pdf|jpe?g|png|gif|zip|docx?)$/i.test(u.pathname)) continue;
    u.hash = '';
    const label = m[2].replace(/<[^>]+>/g, ' ') + ' ' + decodeURIComponent(u.pathname);
    found.push({ url: u.toString(), label: label });
  }
  const picked = [];
  LINK_PATTERNS.forEach(function (re) {
    const hit = found.find(function (l) {
      return re.test(l.label) && l.url !== base.toString() && !picked.includes(l.url);
    });
    if (hit) picked.push(hit.url);
  });
  return picked;
}

/** Accueil + jusqu'à 3 pages internes, en texte brut. Lève une erreur si l'accueil est injoignable. */
export async function readSite(start, homeLimit, subLimit) {
  const home = await getPage(start, 7000);
  const base = new URL(home.finalUrl);
  const links = pickLinks(home.html, base);
  const subs = await Promise.allSettled(links.map(function (u) { return getPage(u, 5000); }));
  let text = `=== Startseite (${base}) ===
` + pageText(home.html, homeLimit || 6000);
  subs.forEach(function (s, i) {
    if (s.status === 'fulfilled') text += `

=== Unterseite (${links[i]}) ===
` + pageText(s.value.html, subLimit || 3500);
  });
  return { home: home, base: base, text: text };
}
