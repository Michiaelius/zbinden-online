// Rundgang für Kundenpräsentationen: nummerierte violette Hinweise, die über der Seite schweben
// (kein Einfluss aufs Layout) und sich ausblenden lassen. Nur in Vorschau-Builds (--vorschau).
//
// content.json: "rundgang": [{ "ziel": "#kunst .sec-cta", "text": "…", "seite": "rechts"|"links", "unten": true, "dy": 0 }]

import { esc } from './util.mjs';

export function rundgangHtml(c) {
  const notes = (c.rundgang || []).filter((n) => n.ziel && n.text);
  if (!notes.length) return '';
  const data = JSON.stringify(notes.map((n) => ({ z: n.ziel, s: n.seite === 'links' ? 'l' : 'r', u: !!n.unten, dy: n.dy || 0 }))).replace(/</g, '\\u003c');
  return `
<style>
.tour-note{position:absolute;z-index:60;width:min(340px,calc(100vw - 32px));padding:14px 16px 14px 52px;border-radius:16px;background:#5B3FD9;color:#fff;font:500 14.5px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 0 0 3px #fff,0 12px 30px rgba(40,20,120,.35);animation:tour-halo 2.4s ease-in-out infinite}
.tour-note b{position:absolute;left:14px;top:13px;display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:#fff;color:#5B3FD9;font-size:14px}
@keyframes tour-halo{0%,100%{box-shadow:0 0 0 3px #fff,0 0 0 6px rgba(91,63,217,.35),0 12px 30px rgba(40,20,120,.35)}50%{box-shadow:0 0 0 3px #fff,0 0 0 16px rgba(91,63,217,0),0 12px 30px rgba(40,20,120,.35)}}
.tour-off .tour-note{display:none}
.tour-note a{color:#fff;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:3px;font-weight:700}
.tour-note a:hover{text-decoration-color:#ffd84d}
.tour-toggle{position:fixed;left:16px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:61;min-height:44px;padding:10px 18px;border:3px solid #fff;border-radius:999px;background:#5B3FD9;color:#fff;font:600 14px/1 system-ui,-apple-system,"Segoe UI",sans-serif;cursor:pointer;box-shadow:0 6px 18px rgba(40,20,120,.35)}
@media (max-width:899px){.tour-toggle{bottom:calc(88px + env(safe-area-inset-bottom))}}
@media (prefers-reduced-motion:reduce){.tour-note{animation:none}}
</style>
${notes.map((n, i) => `<div class="tour-note" data-i="${i}" role="note"><b>${i + 1}</b>${linkVarianten(esc(n.text), c)}</div>`).join('\n')}
<button class="tour-toggle" type="button" aria-pressed="false">Hinweise ausblenden</button>
<script>
(function () {
  var N = ${data};
  var els = document.querySelectorAll('.tour-note');
  function place() {
    var vw = document.documentElement.clientWidth;
    els.forEach(function (el, i) {
      var t = document.querySelector(N[i].z);
      if (!t) { el.style.display = 'none'; return; }
      var r = t.getBoundingClientRect(), w = el.offsetWidth;
      var left = N[i].s === 'l' ? r.left + 8 : r.right - w - 8;
      left = Math.max(16, Math.min(left, vw - w - 16));
      el.style.left = (left + window.pageXOffset) + 'px';
      el.style.top = ((N[i].u ? r.bottom + 14 : r.top - el.offsetHeight - 14) + window.pageYOffset + N[i].dy) + 'px';
    });
  }
  window.addEventListener('load', place);
  window.addEventListener('resize', place);
  if (document.fonts) document.fonts.ready.then(place);
  place();
  var btn = document.querySelector('.tour-toggle');
  btn.addEventListener('click', function () {
    var off = document.documentElement.classList.toggle('tour-off');
    btn.textContent = off ? 'Hinweise einblenden' : 'Hinweise ausblenden';
    btn.setAttribute('aria-pressed', off ? 'true' : 'false');
    if (!off) place();
  });
})();
</script>`;
}

// In Vorschauen gibt es kein PHP (z. B. auf Vercel): Formular freundlich abfangen statt Fehlermeldung.
export function vorschauFormHtml() {
  return `<script>
document.addEventListener('submit', function (e) {
  var f = e.target.closest && e.target.closest('.contact-form');
  if (!f) return;
  e.preventDefault(); e.stopImmediatePropagation();
  var s = f.querySelector('.form-status');
  if (s) { s.className = 'form-status ok'; s.textContent = 'Vorschau: Das Formular verschickt hier noch nichts. Auf der fertigen Website kommt Ihre Nachricht direkt an.'; }
}, true);
</script>`;
}

// «Variante 2» in Rundgang-Texten → Link zur Zeile in der Varianten-Übersicht (falls vorhanden)
function linkVarianten(html, c) {
  if (!(c.varianten?.zeilen || []).length) return html;
  return html.replace(/Variante (\d)/g, (m, n) => `<a href="#variante-${n}">${m}</a>`);
}

// Varianten-Übersicht am Ende der Vorschau (gleicher Violett-Stil wie der Rundgang). Nur --vorschau.
// content.json: "varianten": { titel, intro, spalten: ["24 Monate", …], zeilen: [{ name, inhalt, preise: [] }],
//                             enthalten: [], hinweise: [] }
export function variantenHtml(c) {
  const v = c.varianten;
  if (!v || !(v.zeilen || []).length) return '';
  const sp = v.spalten || [];
  return `
<style>
.offer{padding:72px 0 88px;background:#f1edff;color:#1f1640;scroll-margin-top:80px}
.offer .wrap{max-width:1040px}
.offer-tag{display:inline-block;padding:6px 14px;border-radius:999px;background:#5B3FD9;color:#fff;font:600 12px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.12em;text-transform:uppercase}
.offer h2{margin:16px 0 10px;color:#1f1640}
.offer-intro{max-width:62ch;color:#4a4070}
.offer-table{width:100%;margin-top:32px;border-collapse:separate;border-spacing:0;background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 0 0 3px #fff,0 18px 40px rgba(40,20,120,.14)}
.offer-table th{background:#5B3FD9;color:#fff;text-align:left;font:600 14px/1.3 system-ui,-apple-system,"Segoe UI",sans-serif;padding:14px 18px}
.offer-table td{padding:18px;border-top:1px solid #e6e0fb;vertical-align:top;font-size:15.5px}
.offer-table td.price{white-space:nowrap;font-weight:700;font-size:18px;color:#3b25a8}
.offer-table td.price small{display:none;font-weight:500;font-size:12px;color:#6a5fa0}
.offer-table .vname{font-weight:700;font-size:17px;white-space:nowrap}
.offer-table tr{scroll-margin-top:110px;transition:background .4s}
.offer-table tr:target td{background:#fff4c2}
.offer-cols{display:grid;gap:22px;margin-top:28px}
@media (min-width:800px){.offer-cols{grid-template-columns:1.1fr .9fr}}
.offer-box{background:#fff;border-radius:22px;padding:24px 26px}
.offer-box h3{font-size:20px;margin-bottom:12px;color:#1f1640}
.offer-box ul{margin:0;padding-left:20px;display:grid;gap:8px;color:#3a3160;font-size:15.5px}
@media (max-width:699px){
  .offer-table thead{display:none}
  .offer-table,.offer-table tbody,.offer-table tr,.offer-table td{display:block;width:100%}
  .offer-table td{border-top:0;padding:6px 18px}
  .offer-table tr{border-top:1px solid #e6e0fb;padding:12px 0}
  .offer-table tr:first-child{border-top:0}
  .offer-table td.price{display:inline-block;width:auto;padding-right:6px}
  .offer-table td.price small{display:inline;margin-left:6px}
}
</style>
<section class="offer" id="varianten">
  <div class="wrap">
    <span class="offer-tag">${esc(v.tag || 'Ihr Angebot')}</span>
    <h2>${esc(v.titel || 'Die Varianten im Überblick')}</h2>
    ${v.intro ? `<p class="offer-intro">${esc(v.intro)}</p>` : ''}
    <table class="offer-table">
      <thead><tr><th>Variante</th><th>Inhalt</th>${sp.map((s) => `<th>${esc(s)}</th>`).join('')}</tr></thead>
      <tbody>
        ${v.zeilen.map((z, i) => `<tr id="variante-${i + 1}"><td class="vname">${esc(z.name)}</td><td>${esc(z.inhalt)}</td>${(z.preise || []).map((p, k) => `<td class="price">${esc(p)}<small>${esc(sp[k] || '')}</small></td>`).join('')}</tr>`).join('')}
      </tbody>
    </table>
    <div class="offer-cols">
      ${(v.enthalten || []).length ? `<div class="offer-box"><h3>${esc(v.enthaltenTitel || 'In jedem Abo enthalten')}</h3><ul>${v.enthalten.map((e) => `<li>${esc(e)}</li>`).join('')}</ul></div>` : ''}
      ${(v.hinweise || []).length ? `<div class="offer-box"><h3>${esc(v.hinweiseTitel || 'Gut zu wissen')}</h3><ul>${v.hinweise.map((e) => `<li>${esc(e)}</li>`).join('')}</ul></div>` : ''}
    </div>
  </div>
</section>`;
}
