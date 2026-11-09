/**
 * Test du micro pour le voice-agent ElevenLabs (pages ki-agenten-automatisierung DE/FR/EN).
 * Le widget démarre l'appel même quand le micro est bloqué : l'agent n'entend alors rien
 * et le visiteur ne sait pas pourquoi. Au début de chaque appel vocal (événement
 * « elevenlabs-convai:call », pas en mode texte), on vérifie l'accès au micro et
 * on affiche un message clair dans la langue de la page si quelque chose bloque :
 *  - navigateur intégré (WhatsApp, Instagram, Facebook, Gmail …) → ouvrir dans Chrome/Safari ;
 *  - accès refusé, aucun micro, micro occupé par une autre app ;
 *  - micro accessible mais totalement muet (silence numérique pendant 6 s).
 */
(function () {
  var widget = document.querySelector('elevenlabs-convai');
  if (!widget) return;

  var LANG = (document.documentElement.lang || 'de').slice(0, 2);
  var TEXT = {
    de: {
      title: 'Mikrofon',
      inapp: 'Diese App lässt das Mikrofon nicht zu. Bitte öffnen Sie die Seite in Chrome oder Safari (Menü ⋮ → «Im Browser öffnen»).',
      blocked: 'Das Mikrofon ist blockiert. Tippen Sie auf das Symbol links neben der Adresse → Berechtigungen → Mikrofon erlauben, und starten Sie das Gespräch neu.',
      none: 'Es wurde kein Mikrofon gefunden. Schliessen Sie ein Mikrofon an oder nutzen Sie «Nachricht schreiben».',
      busy: 'Das Mikrofon wird gerade von einer anderen App benutzt (Anruf, Sprachaufnahme …). Schliessen Sie diese und starten Sie das Gespräch neu.',
      silent: 'Ihr Mikrofon liefert keinen Ton. Prüfen Sie, ob es stummgeschaltet ist oder über Bluetooth-Kopfhörer läuft.',
      unsupported: 'Ihr Browser unterstützt keine Sprachgespräche. Bitte öffnen Sie die Seite in Chrome oder Safari oder nutzen Sie «Nachricht schreiben».',
      close: 'Schliessen'
    },
    fr: {
      title: 'Micro',
      inapp: 'Cette application bloque le micro. Ouvrez la page dans Chrome ou Safari (menu ⋮ → « Ouvrir dans le navigateur »).',
      blocked: 'Le micro est bloqué. Touchez l’icône à gauche de l’adresse → Autorisations → autoriser le micro, puis relancez la conversation.',
      none: 'Aucun micro trouvé. Branchez un micro ou utilisez « Écrire un message ».',
      busy: 'Le micro est utilisé par une autre application (appel, enregistreur …). Fermez-la et relancez la conversation.',
      silent: 'Votre micro ne transmet aucun son. Vérifiez qu’il n’est pas coupé ou relié à des écouteurs Bluetooth.',
      unsupported: 'Votre navigateur ne permet pas les conversations vocales. Ouvrez la page dans Chrome ou Safari, ou utilisez « Écrire un message ».',
      close: 'Fermer'
    },
    en: {
      title: 'Microphone',
      inapp: 'This app blocks the microphone. Please open the page in Chrome or Safari (menu ⋮ → “Open in browser”).',
      blocked: 'The microphone is blocked. Tap the icon left of the address → Permissions → allow microphone, then restart the conversation.',
      none: 'No microphone was found. Connect one or use “Message”.',
      busy: 'The microphone is being used by another app (call, voice recorder …). Close it and restart the conversation.',
      silent: 'Your microphone isn’t sending any sound. Check that it isn’t muted or routed to Bluetooth headphones.',
      unsupported: 'Your browser doesn’t support voice conversations. Please open the page in Chrome or Safari, or use “Message”.',
      close: 'Close'
    }
  };
  var T = TEXT[LANG] || TEXT.de;

  var css = document.createElement('style');
  css.textContent =
    '.mic-hint{position:fixed;left:50%;top:max(16px,env(safe-area-inset-top));transform:translateX(-50%);z-index:2147483647;' +
    'width:min(440px,calc(100vw - 32px));box-sizing:border-box;padding:14px 44px 14px 16px;border-radius:14px;' +
    'background:#0a0a0a;color:#f5f1e6;border:1px solid #c9a227;box-shadow:0 18px 40px -12px rgba(0,0,0,.55);' +
    'font:300 .95rem/1.5 "Jost","Helvetica Neue",Helvetica,Arial,sans-serif;animation:micHintIn .3s ease both;}' +
    '.mic-hint strong{display:block;font-weight:600;color:#e8d38a;letter-spacing:.06em;text-transform:uppercase;font-size:.78rem;margin-bottom:4px;}' +
    '.mic-hint button{position:absolute;top:8px;right:8px;width:30px;height:30px;border:none;border-radius:999px;cursor:pointer;' +
    'background:transparent;color:#e8d38a;font-size:1.2rem;line-height:1;}' +
    '.mic-hint button:focus-visible{outline:2px solid #c9a227;outline-offset:2px;}' +
    '@keyframes micHintIn{from{opacity:0;transform:translate(-50%,-8px);}to{opacity:1;transform:translate(-50%,0);}}' +
    '@media (prefers-reduced-motion:reduce){.mic-hint{animation:none;}}';
  document.head.appendChild(css);

  var box = null;
  function show(key) {
    if (box) box.remove();
    box = document.createElement('div');
    box.className = 'mic-hint';
    // ne pas refermer le widget (script « clic à côté » de la page)
    box.addEventListener('click', function (ev) { ev.stopPropagation(); });
    box.setAttribute('role', 'alert');
    var title = document.createElement('strong');
    title.textContent = '🎙 ' + T.title;
    var msg = document.createElement('span');
    msg.textContent = T[key];
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', T.close);
    btn.textContent = '×';
    btn.addEventListener('click', function () {
      box.remove();
      box = null;
    });
    box.appendChild(title);
    box.appendChild(msg);
    box.appendChild(btn);
    document.body.appendChild(box);
  }
  function hide() {
    if (box) { box.remove(); box = null; }
  }

  // Aperçus intégrés des apps (WebView Android, navigateurs in-app) : micro souvent coupé
  var IN_APP = /WhatsApp|Instagram|FBAN|FBAV|FB_IAB|Line\/|Snapchat|LinkedInApp|GSA\/|; wv\)/i;

  // Écoute 6 s : un vrai micro capte toujours un peu de bruit, un flux entièrement à zéro = muet
  function checkSilence(stream) {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { stop(stream); return; }
    var ctx = new AC();
    var analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    ctx.createMediaStreamSource(stream).connect(analyser);
    var buf = new Float32Array(analyser.fftSize);
    var peak = 0;
    var timer = setInterval(function () {
      analyser.getFloatTimeDomainData(buf);
      for (var i = 0; i < buf.length; i++) {
        var v = Math.abs(buf[i]);
        if (v > peak) peak = v;
      }
    }, 200);
    if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
    setTimeout(function () {
      clearInterval(timer);
      stop(stream);
      if (ctx.close) ctx.close();
      if (ctx.state !== 'suspended' && peak < 0.0001) show('silent');
    }, 6000);
  }
  function stop(stream) {
    stream.getTracks().forEach(function (t) { t.stop(); });
  }

  widget.addEventListener('elevenlabs-convai:call', function (ev) {
    var config = ev.detail && ev.detail.config;
    if (config && config.textOnly) return; // conversation écrite : pas de micro
    hide();

    if (IN_APP.test(navigator.userAgent)) { show('inapp'); return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { show('unsupported'); return; }

    navigator.mediaDevices.getUserMedia({ audio: true }).then(checkSilence, function (err) {
      var name = err && err.name;
      if (name === 'NotAllowedError' || name === 'SecurityError') show('blocked');
      else if (name === 'NotFoundError' || name === 'OverconstrainedError') show('none');
      else if (name === 'NotReadableError' || name === 'AbortError') show('busy');
      else show('blocked');
    });
  });
})();
