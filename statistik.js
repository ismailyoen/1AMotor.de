/* =====================================================================
   1AMotor.de – Statistik
   Zählt, welche Inserate angeklickt und angeschaut werden, wie oft
   jemand Kontakt aufnimmt und was in die Suche eingegeben wird.

   Datenschutz: keine Cookies, keine IP, keine Nutzerkennung, kein
   Wiedererkennen von Besuchern. E-Mail-Adressen und Telefonnummern in
   Suchbegriffen werden vor dem Senden unkenntlich gemacht.

   Einbau: vor </body> auf jeder Seite
     <script src="/statistik.js" defer></script>

   Eigene Besuche nicht mitzählen: einmal 1amotor.de/?statistik=aus
   aufrufen (wieder einschalten mit ?statistik=an).
   ===================================================================== */
(function () {
  'use strict';

  var CFG = {
    url: 'https://xaqfptumjkmulobdbfid.supabase.co',
    key: 'sb_publishable_FK-FiDrd5gjFEj7LxVPZIg_5WXkNvgG',
    // Woran ein einzelnes Inserat zu erkennen ist (Pfad + Parameter mit der ID)
    inseratPfad: /\/(listing-detail|inserat|anzeige|angebot|listing|motor-detail|detail)(\.html)?\/?$/i,
    inseratParam: ['id', 'inserat', 'listing', 'anzeige'],
    // Parameter, in denen der Suchbegriff steht
    suchParam: ['q', 'suche', 'such', 's', 'query', 'search', 'begriff'],
    rubrikParam: ['category', 'kategorie', 'rubrik', 'kat', 'cat'],
    // Wo die Seite die Gesamtzahl der Treffer anzeigt (1amotor.de: „123 Ergebnisse“ in #se-title)
    trefferElement: '#se-title, [data-stat-treffer]',
    seiteParam: ['seite', 'page', 'p'],
    // Knöpfe auf der Inseratseite, die als Kontakt zählen
    kontaktText: /kaufen|zum angebot|zum shop|anfrage|anfragen|nachricht|kontaktieren|anrufen|whatsapp|e-?mail schreiben|rückruf/i
  };

  // ---------- Darf gezählt werden? ----------
  var qs = new URLSearchParams(location.search);
  try {
    if (qs.get('statistik') === 'aus') localStorage.setItem('amstat_aus', '1');
    if (qs.get('statistik') === 'an') localStorage.removeItem('amstat_aus');
  } catch (e) {}
  var aus = false;
  try { aus = localStorage.getItem('amstat_aus') === '1'; } catch (e) {}
  var bot = navigator.webdriver || /bot|crawl|spider|slurp|preview|lighthouse|headless|pagespeed|facebookexternalhit|whatsapp\/|curl|wget|python|axios/i.test(navigator.userAgent || '');
  var lokal = !/^https?:$/.test(location.protocol) || /^(localhost|127\.|0\.0\.0\.0|192\.168\.)/.test(location.hostname);
  var aktiv = !aus && !bot && !lokal;

  var geraet = function () { try { return matchMedia('(max-width: 820px)').matches ? 'mobil' : 'desktop'; } catch (e) { return null; } };
  var kurz = function (s, n) { s = String(s == null ? '' : s).trim(); return s.length > n ? s.slice(0, n) : s; };
  var param = function (p, liste) { for (var i = 0; i < liste.length; i++) { var v = p.get(liste[i]); if (v && String(v).trim()) return String(v).trim(); } return ''; };

  function senden(tabelle, daten) {
    if (!aktiv) { if (window.AMStat && window.AMStat.debug) console.log('[Statistik, nicht gesendet]', tabelle, daten); return; }
    try {
      fetch(CFG.url + '/rest/v1/' + tabelle, {
        method: 'POST', keepalive: true, mode: 'cors',
        headers: { apikey: CFG.key, Authorization: 'Bearer ' + CFG.key, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(daten)
      }).catch(function () {});
    } catch (e) {}
  }

  // ---------- Seiten einordnen ----------
  function seitenArt(pfad) {
    pfad = (pfad || '/').toLowerCase().replace(/\/index\.html?$/, '/');
    if (pfad === '/' || pfad === '') return 'startseite';
    if (CFG.inseratPfad.test(pfad)) return 'inserat';
    var regeln = [[/such|search|ergebnis/, 'suche'], [/motorenwelt/, 'motorenwelt'], [/lexikon/, 'lexikon'], [/kategorie|rubrik|category/, 'rubrik'],
      [/merkliste|favorit/, 'merkliste'], [/konto|dashboard|account/, 'konto'], [/haendler|händler|verkaeufer|seller|shop/, 'haendler'], [/ratgeber|blog|magazin/, 'ratgeber']];
    for (var i = 0; i < regeln.length; i++) if (regeln[i][0].test(pfad)) return regeln[i][1];
    return kurz(pfad.split('/').filter(Boolean)[0] || 'sonstige', 40).replace(/\.html?$/, '');
  }
  function herkunft() {
    var r = document.referrer;
    if (!r) return 'direkt';
    try {
      var u = new URL(r), h = u.hostname.replace(/^www\./, '');
      if (h === location.hostname.replace(/^www\./, '')) return seitenArt(u.pathname);
      if (/(^|\.)google\./.test(h)) return 'google';
      if (/(^|\.)bing\.|duckduckgo|ecosia|yahoo|qwant/.test(h)) return 'suchmaschine';
      if (/facebook|instagram|fb\.|t\.co|twitter|x\.com|tiktok|linkedin|pinterest|youtube/.test(h)) return 'social';
      if (/chatgpt|openai|perplexity|claude\.ai|gemini|copilot/.test(h)) return 'ki-suche';
      return kurz('extern:' + h, 40);
    } catch (e) { return 'extern'; }
  }
  function inseratAusUrl(href) {
    try {
      var u = new URL(href, location.href);
      if (u.hostname.replace(/^www\./, '') !== location.hostname.replace(/^www\./, '')) return '';
      if (!CFG.inseratPfad.test(u.pathname)) {
        // auch /inserat/123 oder /inserat/123-bmw-n47
        var m = u.pathname.match(/\/(inserat|anzeige|angebot|listing)\/([^\/?#]+)/i);
        return m ? kurz(m[2], 64) : '';
      }
      return kurz(param(u.searchParams, CFG.inseratParam), 64);
    } catch (e) { return ''; }
  }
  var hierArt = seitenArt(location.pathname);

  // ---------- Ereignisse ----------
  var gesehen = {}, letzterKlick = {};
  function ereignis(art, id, quelle) {
    id = kurz(id, 64); if (!id) return;
    if (art === 'aufruf') { if (gesehen[id]) return; gesehen[id] = 1; }
    if (art !== 'aufruf') { var k = art + '|' + id, t = Date.now(); if (letzterKlick[k] && t - letzterKlick[k] < 2000) return; letzterKlick[k] = t; }
    senden('statistik_events', { art: art, inserat_id: id, quelle: kurz(quelle || hierArt, 40) || null, geraet: geraet() });
  }
  function sauber(begriff) {
    return kurz(String(begriff || '')
      .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[E-Mail]')
      .replace(/\+?\d[\d\s\/().-]{7,}\d/g, '[Nummer]')
      .replace(/\s+/g, ' '), 120);
  }
  var letzteSuche = { b: '', t: 0 };
  function suche(begriff, treffer, rubrik) {
    var b = sauber(begriff); if (b.length < 2) return;
    var jetzt = Date.now(); if (b.toLowerCase() === letzteSuche.b && jetzt - letzteSuche.t < 5000) return;
    letzteSuche = { b: b.toLowerCase(), t: jetzt };
    var n = treffer === '' || treffer === null || treffer === undefined || isNaN(Number(treffer)) ? null : Math.max(0, Math.round(Number(treffer)));
    senden('statistik_suche', { begriff: b, treffer: n, rubrik: kurz(rubrik, 60) || null, geraet: geraet() });
  }

  // Welches Inserat zeigt diese Seite?
  function aktuellesInserat() {
    var el = document.querySelector('[data-stat-aufruf]');
    if (el) return el.getAttribute('data-stat-aufruf');
    return hierArt === 'inserat' ? inseratAusUrl(location.href) : '';
  }
  function imKopfOderFuss(el) { return !!(el.closest && el.closest('header, nav, footer, [data-stat-ignorieren]')); }

  // ---------- Klicks (eine Stelle für alles) ----------
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-stat-kontakt], [data-stat-inserat], a[href], button') : null;
    if (!el || el.closest('[data-stat-ignorieren]')) return;

    // 1) ausdrücklich markierter Kontakt-Knopf
    if (el.hasAttribute('data-stat-kontakt')) { ereignis('kontakt', el.getAttribute('data-stat-kontakt') || aktuellesInserat(), hierArt); return; }
    // 2) ausdrücklich markierte Inseratkarte
    var karte = el.closest('[data-stat-inserat]');
    if (karte) { ereignis('klick', karte.getAttribute('data-stat-inserat'), karte.getAttribute('data-stat-quelle') || hierArt); return; }
    // 3) Link auf eine Inseratseite
    var href = el.getAttribute('href');
    if (href && href.charAt(0) !== '#') { var id = inseratAusUrl(href); if (id && id !== aktuellesInserat()) { ereignis('klick', id, hierArt); return; } }
    // 4) Kontakt auf der Inseratseite (Kaufen, Anfrage, Telefon, WhatsApp, Weiterleitung zum Händler)
    if (hierArt === 'inserat' && !imKopfOderFuss(el)) {
      var eigenes = aktuellesInserat(); if (!eigenes) return;
      if (href && href.charAt(0) === '#') return; // nur Sprung zum Formular – gezählt wird erst das Absenden
      var text = (el.textContent || '') + ' ' + (el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('title') || '');
      var extern = false;
      if (href) { try { var u = new URL(href, location.href); extern = /^(tel|mailto|sms):/.test(href) || /wa\.me|whatsapp/.test(u.hostname) || (/^https?:$/.test(u.protocol) && u.hostname.replace(/^www\./, '') !== location.hostname.replace(/^www\./, '')); } catch (x) {} }
      if (extern || CFG.kontaktText.test(text)) ereignis('kontakt', eigenes, hierArt);
    }
  }, true);

  // ---------- Suche ----------
  // Gesamtzahl der Treffer, wie die Seite sie anzeigt; null = (noch) nicht erkennbar
  function trefferGesamt() {
    var t = document.querySelector(CFG.trefferElement);
    if (t) {
      var roh = t.getAttribute('data-stat-treffer') || t.textContent || '';
      var m = roh.match(/(\d[\d.\s]*)\s*(Ergebnis|Treffer|Anzeige|Inserat|result)/i) || (t.hasAttribute('data-stat-treffer') ? roh.match(/(\d[\d.]*)/) : null);
      if (m) return parseInt(m[1].replace(/\D/g, ''), 10);
    }
    if (/keine passenden anzeigen|keine treffer|nichts gefunden|no results/i.test((function (m) { return m.innerText || m.textContent || ''; })(document.querySelector('main') || document.body))) return 0;
    return null;
  }
  function trefferAufSeite() {
    var g = trefferGesamt(); if (g !== null) return g;
    var ids = {};
    document.querySelectorAll('[data-stat-inserat]').forEach(function (k) { ids[k.getAttribute('data-stat-inserat')] = 1; });
    document.querySelectorAll('main a[href], #ergebnisse a[href], .ergebnisse a[href], .results a[href], body a[href]').forEach(function (a) {
      if (imKopfOderFuss(a)) return; var id = inseratAusUrl(a.getAttribute('href')); if (id) ids[id] = 1;
    });
    return Object.keys(ids).length;
  }
  function sucheAusUrl() {
    var begriff = param(qs, CFG.suchParam); if (!begriff) return;
    var seite = parseInt(param(qs, CFG.seiteParam), 10); if (seite > 1) return; // Blättern zählt nicht als neue Suche
    var rubrik = param(qs, CFG.rubrikParam);
    sucheWennFertig(begriff, rubrik);
  }
  // wartet, bis die Seite ihre Trefferzahl zeigt (Ergebnisse kommen per JavaScript), höchstens 8 Sekunden
  function sucheWennFertig(begriff, rubrik) {
    var start = Date.now();
    (function pruefen() {
      var g = trefferGesamt(), dauer = Date.now() - start;
      if (g > 0) return suche(begriff, g, rubrik);
      if (dauer >= 1500 && g === 0) return suche(begriff, 0, rubrik);
      if (dauer >= 1500 && !document.querySelector(CFG.trefferElement)) return suche(begriff, trefferAufSeite(), rubrik);
      if (dauer > 8000) return suche(begriff, trefferAufSeite(), rubrik);
      setTimeout(pruefen, 300);
    })();
  }
  // Suche ohne Seitenwechsel, die nur die Adresse ändert (1amotor.de: Suchfeld auf suche.html)
  var letzteAdresseQ = param(qs, CFG.suchParam);
  function adresseGeaendert() {
    var p = new URLSearchParams(location.search), q = param(p, CFG.suchParam);
    if (!q || q === letzteAdresseQ) { letzteAdresseQ = q; return; }
    letzteAdresseQ = q;
    if (parseInt(param(p, CFG.seiteParam), 10) > 1) return;
    clearTimeout(adresseGeaendert.t);
    adresseGeaendert.t = setTimeout(function () { sucheWennFertig(q, param(p, CFG.rubrikParam)); }, 600);
  }
  ['pushState', 'replaceState'].forEach(function (fn) {
    var orig = history[fn]; if (!orig) return;
    history[fn] = function () { var r = orig.apply(this, arguments); try { adresseGeaendert(); } catch (e) {} return r; };
  });
  window.addEventListener('popstate', adresseGeaendert);
  // Suchfelder ohne Seitenwechsel (Suche per JavaScript)
  document.addEventListener('submit', function (e) {
    var f = e.target; if (!f || !f.querySelector) return;
    var feld = f.querySelector('input[type=search], input[name=q], input[name=suche], input[name=s], input[name=query], input[name=search], [data-stat-suchfeld]');
    if (!feld) return;
    setTimeout(function () {
      if (!e.defaultPrevented) return; // Seite wechselt – wird dort über die Adresse gezählt
      var begriff = feld.value; if (!begriff) return;
      setTimeout(function () { sucheWennFertig(begriff, param(qs, CFG.rubrikParam)); }, 300);
    }, 0);
  });

  // ---------- Seite geladen ----------
  function start() {
    var id = aktuellesInserat();
    if (id) ereignis('aufruf', id, herkunft());
    sucheAusUrl();
  }
  if (document.prerendering) document.addEventListener('prerenderingchange', start, { once: true });
  else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  // ---------- Für eigene Skripte der Website ----------
  window.AMStat = {
    aufruf: function (id, quelle) { ereignis('aufruf', id, quelle || herkunft()); },
    klick: function (id, quelle) { ereignis('klick', id, quelle); },
    kontakt: function (id) { ereignis('kontakt', id || aktuellesInserat(), hierArt); },
    suche: suche,
    aktiv: function () { return aktiv; },
    debug: false
  };
})();
