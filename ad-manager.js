/* ══════════════════════════════════════════════════════════════════
   1A Motor – Werbe-Manager (ad-manager.js)
   ------------------------------------------------------------------
   v2 · Spotlight-Look (Variante C) für ALLE Werbeflächen: dunkle
   Navy-Karte, helle Bild-/Markenkachel, gelbes "Anzeige"-Badge, blauer
   Button. Gleiche Karte wie partner-maschinensucher.js und
   suche-partner-ads.js (gemeinsamer Stil, id "sp-ad-css").

   Wasserfall je Fläche (wer zuerst liefern kann, wird gezeigt):
     1. Google AdSense   – nur mit Werbe-Einwilligung (cookie-consent.js)
                           und nur wenn eine echte Slot-ID eingetragen ist
     2. Partner-Anzeige  – NUR Partner mit schriftlicher Vereinbarung
                           (PARTNERS unten, active:true)
     3. Eigenwerbung     – "Werben auf 1A Motor" → Kontakt/Mediadaten

   Rechtliches (nicht verhandelbar, siehe §5a Abs. 4 UWG, §6 DDG,
   AdSense-Programmrichtlinien):
     • Jede Fläche trägt sichtbar "Anzeige" (bzw. Übersetzung).
     • Partner-Links: rel="sponsored noopener", target="_blank".
     • Keine Anzeigen auf Seiten ohne eigenen Inhalt (Login, Dashboard,
       Formulare, leere Trefferlisten) – AdSense-Verstoß
       "Anzeigen auf Seiten ohne Publisher-Content".
     • Google-Anzeigen selbst werden NICHT umgestaltet – sie sitzen nur
       in einem Spotlight-Rahmen mit "Anzeige"-Badge.

   Einbinden (am Ende von <body>, NACH cookie-consent.js, i18n.js und
   index-live.js / suche-live.js):
     <script src="ad-manager.js?v=2" defer></script>
   ══════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ── 1. Konfiguration ─────────────────────────────────────────── */
  var CLIENT = "ca-pub-4690558719999917";

  /* Slot-IDs: in AdSense je Fläche einen eigenen Anzeigenblock anlegen
     und die ID hier eintragen. "" = Fläche nutzt nur Partner/Eigenwerbung. */
  var SLOTS = {
    infeed:   "",            // AdSense "In-Feed-Anzeige" (native) – Layout-Key unten
    infeedLayoutKey: "",     // z. B. "-6t+ed+2i-1n-4w" (kommt aus AdSense)
    banner:   "",            // horizontaler Banner zwischen Sektionen
    detail:   "",            // Rechteck auf der Inseratsdetailseite
    sidebar:  "4564801273"   // existiert bereits in index.html (nur Fallback-Logik)
  };

  /* Verifizierte Werbepartner. NUR mit schriftlicher Vereinbarung auf
     active:true setzen. url = Zielseite, die der Partner freigegeben hat.
     icon = "leaf" | "factory" | "car" | "megaphone" (siehe SP_ICON). */
  var PARTNERS = [
    {
      id: "kress",
      active: true,
      name: "Kress",
      claim: { de: "Mähroboter ohne Begrenzungsdraht", en: "Robotic mowers without boundary wire", fr: "Robots tondeuses sans fil périphérique", tr: "Sınır teli gerektirmeyen robot çim biçme makineleri" },
      cta:   { de: "Zum Hersteller", en: "Visit manufacturer", fr: "Voir le fabricant", tr: "Üreticiye git" },
      url: "https://www.kress.com/",          // TODO: von Kress freigegebene Landingpage eintragen
      icon: "leaf",
      categories: ["Elektromotor", "Rasenmäher", "Garten"]
    },
    {
      id: "maschinensucher",
      active: true,
      name: "Maschinensucher",
      claim: { de: "Gebrauchte Industriemaschinen europaweit", en: "Used industrial machinery across Europe", fr: "Machines industrielles d’occasion en Europe", tr: "Avrupa genelinde ikinci el endüstriyel makineler" },
      cta:   { de: "Maschinen ansehen", en: "Browse machines", fr: "Voir les machines", tr: "Makineleri gör" },
      url: "https://www.maschinensucher.de/",
      icon: "factory",
      categories: ["Industriemotor", "Asynchronmotor", "Aufzugmotor"]
    },
    {
      id: "limbaecher",
      active: false,                          // TODO: URL eintragen, dann auf true
      name: "Autohaus Limbächer",
      claim: { de: "Ihr Autohaus-Partner", en: "Your car dealership partner", fr: "Votre concessionnaire partenaire", tr: "Bayi ortağınız" },
      cta:   { de: "Zum Autohaus", en: "Visit dealership", fr: "Voir la concession", tr: "Bayiye git" },
      url: "",
      icon: "car",
      categories: ["Automotor", "Austauschmotor", "Dieselmotor Auto"]
    }
  ];

  var HOUSE_URL = "kontakt.html?betreff=Werbung";

  /* Seiten OHNE Werbung (kein Publisher-Content / private Bereiche) */
  var NO_ADS = /(login|registrieren|dashboard|profil|anfragen|meine-|anzeige-erstellen|admin|import|passwort|danke|404)/i;

  /* Platzierungen je Seitentyp – Selektoren werden der Reihe nach probiert */
  var PAGES = {
    home: {
      match: function (p) { return p === "/" || /index\.html$/.test(p); },
      infeed: { grid: ["#home-listing-grid"], every: 6, max: 2 },
      banner: { after: [".faq-panel"], max: 1 },
      partnerStrip: { before: ["footer.footer", "footer"] }
    },
    search: {
      match: function (p) { return /suche/.test(p) || /\/motoren\//.test(p); },
      infeed: { grid: ["#search-listing-grid", "#results-grid", "#suche-grid", ".results .listing-grid", ".listing-grid"], every: 9, max: 3 },
      partnerStrip: { before: ["footer.footer", "footer"] }
    },
    detail: {
      match: function (p) { return /listing-detail|inserat/.test(p); },
      detail: { after: ["#listing-description", ".listing-description", ".detail-description", ".description"] },
      partnerStrip: { before: ["footer.footer", "footer"] }
    }
  };

  /* ── 2. Texte ─────────────────────────────────────────────────── */
  var TXT = {
    de: { ad: "Anzeige", partner: "Werbepartner", houseT: "Ihre Anzeige auf 1A Motor", houseS: "Erreichen Sie Käufer von Motoren & Antriebstechnik – direkt im Angebots-Feed.", houseC: "Jetzt werben", strip: "Unsere Werbepartner", stripS: "Bezahlte Partnerschaften – Kauf und Abwicklung erfolgen beim jeweiligen Anbieter.", yours: "Ihr Logo hier", sponsored: "Gesponsert" },
    en: { ad: "Ad", partner: "Advertising partner", houseT: "Your ad on 1A Motor", houseS: "Reach buyers of engines & drive technology – right in the listings feed.", houseC: "Advertise now", strip: "Our advertising partners", stripS: "Paid partnerships – purchase and processing via the respective provider.", yours: "Your logo here", sponsored: "Sponsored" },
    fr: { ad: "Annonce", partner: "Partenaire publicitaire", houseT: "Votre annonce sur 1A Motor", houseS: "Touchez les acheteurs de moteurs et d’entraînements – directement dans le fil d’annonces.", houseC: "Faire de la publicité", strip: "Nos partenaires publicitaires", stripS: "Partenariats rémunérés – achat et traitement chez le fournisseur concerné.", yours: "Votre logo ici", sponsored: "Sponsorisé" },
    tr: { ad: "Reklam", partner: "Reklam ortağı", houseT: "1A Motor’da reklamınız", houseS: "Motor ve tahrik teknolojisi alıcılarına doğrudan ilan akışında ulaşın.", houseC: "Hemen reklam verin", strip: "Reklam ortaklarımız", stripS: "Ücretli iş birlikleri – satın alma ilgili sağlayıcı üzerinden yapılır.", yours: "Logonuz burada", sponsored: "Sponsorlu" }
  };
  function lang() {
    var l = (window.I18n && window.I18n.lang) || safeLS("1amotor_lang") || document.documentElement.lang || "de";
    l = String(l).slice(0, 2);
    return TXT[l] ? l : "de";
  }
  function t(k) { return TXT[lang()][k]; }
  function loc(obj) { return (obj && (obj[lang()] || obj.de)) || ""; }
  function safeLS(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function q(list) {
    for (var i = 0; i < list.length; i++) { var n = document.querySelector(list[i]); if (n) return n; }
    return null;
  }
  function utm(url, placement) {
    if (!/^https?:/.test(url)) return url;
    var u = new URL(url);
    u.searchParams.set("utm_source", "1amotor");
    u.searchParams.set("utm_medium", "display");
    u.searchParams.set("utm_campaign", "partner");
    u.searchParams.set("utm_content", placement);
    return u.toString();
  }
  function host(url) { try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return ""; } }
  function hasConsent() { return !!(window.__1amConsent && window.__1amConsent.marketing); }

  /* ── 3. Partner-Auswahl (Rotation + Kategorie-Bezug) ──────────── */
  function activePartners() { return PARTNERS.filter(function (p) { return p.active && p.url; }); }
  function pickPartner(n) {
    var list = activePartners();
    if (!list.length) return null;
    var cat = new URLSearchParams(location.search).get("category") || "";
    var fit = list.filter(function (p) { return cat && p.categories.indexOf(cat) !== -1; });
    var pool = fit.length ? fit : list;
    var bucket = Math.floor(Date.now() / (4 * 3600 * 1000)); // wechselt alle 4 h
    return pool[(bucket + n) % pool.length];
  }

  /* ── 4. Styles ────────────────────────────────────────────────── */
  var SVG_OPEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var SP_ICON = {
    ext: SVG_OPEN + ' stroke-width="2.4"><path d="M14 4h6v6"/><path d="M10 14L20 4"/><path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"/></svg>',
    factory: SVG_OPEN + ' stroke-width="1.6" class="sp-ico"><path d="M3 21V10l6 4V10l6 4V6l6 3v12z"/><path d="M7 17h2M12 17h2M17 17h2"/></svg>',
    leaf: SVG_OPEN + ' stroke-width="1.6" class="sp-ico"><path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 16-9 0 12-4 16-9 16z"/><path d="M4 20c4-4 7-7 11-9"/></svg>',
    car: SVG_OPEN + ' stroke-width="1.6" class="sp-ico"><path d="M3 13l2-5a2 2 0 0 1 1.9-1.4h10.2A2 2 0 0 1 19 8l2 5v4a1 1 0 0 1-1 1h-1M5 18H4a1 1 0 0 1-1-1v-4h18"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
    megaphone: SVG_OPEN + ' stroke-width="1.6" class="sp-ico"><path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M17 8a5 5 0 0 1 0 8"/></svg>',
    plus: SVG_OPEN + ' stroke-width="2" class="sp-ico"><path d="M12 5v14M5 12h14"/></svg>'
  };
  function icon(key) { return SP_ICON[key] || SP_ICON.megaphone; }

  /* Gemeinsamer Spotlight-Stil – identisch in partner-maschinensucher.js
     und suche-partner-ads.js; wird nur einmal pro Seite eingefügt. */
  function injectSpotlightCSS() {
    if (document.getElementById("sp-ad-css")) return;
    var css = [
      ".sp-card{position:relative;display:flex !important;flex-direction:column;background:#142336 !important;border:1px solid #22384f !important;border-radius:12px;overflow:hidden;color:#fff !important;text-decoration:none !important;box-shadow:0 8px 28px rgba(13,27,42,.22) !important;transition:transform .2s,box-shadow .2s,border-color .2s;font-family:inherit}",
      ".sp-card:hover{border-color:rgba(77,166,255,.6) !important;box-shadow:0 14px 36px rgba(13,27,42,.32) !important}",
      ".sp-card:focus-visible{outline:3px solid #4da6ff;outline-offset:2px}",
      ".sp-media{position:relative;flex-shrink:0;padding:10px 10px 0}",
      ".sp-tile{position:relative;height:180px;border-radius:8px;overflow:hidden;background:#e9eef4;color:#5f7891;display:flex;align-items:center;justify-content:center}",
      ".sp-tile img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}",
      ".sp-ico{width:46px;height:46px}",
      ".sp-tile.sp-brand{background:#1d3149;color:#cfe3f6;flex-direction:column;gap:10px}",
      ".sp-brand-name{font-size:20px;font-weight:800;letter-spacing:-.01em;color:#fff}",
      ".sp-tile.sp-house{background:#1a2e45;border:1.5px dashed #3c5878;box-sizing:border-box}",
      ".sp-badge{position:absolute;top:20px;left:20px;z-index:2;background:#fde8b8;color:#5c3a00;font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:4px 9px;border-radius:6px;line-height:1.4}",
      ".sp-badge.sp-static{position:static;display:inline-block}",
      ".sp-video{position:absolute;right:20px;bottom:10px;z-index:2;background:rgba(13,27,42,.78);color:#fff;font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px}",
      ".sp-body{display:flex;flex-direction:column;flex:1;min-width:0;padding:14px 16px 16px}",
      ".sp-eyebrow{font-size:11.5px;font-weight:600;color:#9fb3c8;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".sp-title{font-size:14px;font-weight:700;line-height:1.4;color:#fff;min-height:40px;margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}",
      ".sp-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;max-height:52px;overflow:hidden}",
      ".sp-chips span{font-size:12px;color:#c4d4e4;background:rgba(255,255,255,.08);padding:2px 8px;border-radius:4px;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".sp-text{font-size:12.5px;color:#9fb3c8;line-height:1.45;margin-bottom:12px}",
      ".sp-price{font-size:19px;font-weight:800;color:#7cc0ff;margin-bottom:12px}",
      ".sp-btn{margin-top:auto;height:38px;display:flex;align-items:center;justify-content:center;gap:6px;background:#4da6ff;color:#0d1b2a;border-radius:8px;font-size:13px;font-weight:800;transition:background .15s}",
      ".sp-card:hover .sp-btn{background:#72b8ff}",
      ".sp-btn svg{width:12px;height:12px}"
    ].join("\n");
    var s = document.createElement("style");
    s.id = "sp-ad-css";
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* Zusatz-Stile nur für den Werbe-Manager: AdSense-Rahmen, Banner, Partnerleiste */
  function injectCSS() {
    injectSpotlightCSS();
    if (document.getElementById("am-ad-css")) return;
    var css = [
      /* AdSense im Spotlight-Rahmen (Google-Anzeige selbst bleibt unverändert) */
      ".sp-gads .sp-badge{top:10px;left:10px}",
      ".sp-gads-in{margin:40px 10px 10px;background:#fff;border-radius:8px;overflow:hidden;min-height:280px}",
      ".sp-gads ins.adsbygoogle{display:block;width:100%;min-height:280px}",
      /* Banner zwischen Sektionen / auf der Detailseite */
      ".am-banner{margin:22px 0;background:#142336;border:1px solid #22384f;border-radius:12px;padding:14px 16px 16px;box-shadow:0 8px 28px rgba(13,27,42,.18);color:#fff}",
      ".am-banner .am-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}",
      ".am-banner a.am-row{display:flex;align-items:center;gap:14px;color:#fff;text-decoration:none}",
      ".am-banner .am-ico{width:56px;height:56px;flex-shrink:0;border-radius:10px;display:grid;place-items:center;background:#1d3149;color:#cfe3f6}",
      ".am-banner .am-ico .sp-ico{width:28px;height:28px}",
      ".am-banner .am-txt{flex:1;min-width:0}",
      ".am-banner .am-txt b{display:block;font-size:15px;color:#fff}",
      ".am-banner .am-txt small{display:block;font-size:12.5px;color:#9fb3c8;margin-top:2px}",
      ".am-banner .am-go{flex-shrink:0;display:flex;align-items:center;justify-content:center;gap:6px;height:38px;padding:0 16px;border-radius:8px;background:#4da6ff;color:#0d1b2a;font-size:13px;font-weight:800;transition:background .15s}",
      ".am-banner a.am-row:hover .am-go{background:#72b8ff}",
      ".am-banner .am-go svg{width:12px;height:12px}",
      ".am-banner ins.adsbygoogle{display:block;min-height:90px;background:#fff;border-radius:8px}",
      /* Partnerleiste über dem Footer */
      ".am-strip{max-width:var(--max,1360px);margin:28px auto 0;padding:0 24px}",
      ".am-strip-in{background:#142336;border:1px solid #22384f;border-radius:12px;padding:16px 18px}",
      ".am-strip h3{display:flex;align-items:center;gap:10px;font-size:15px;font-weight:800;color:#fff;margin:0}",
      ".am-strip p{font-size:11.5px;color:#9fb3c8;margin:4px 0 12px}",
      ".am-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px}",
      ".am-tile{display:flex;align-items:center;gap:10px;min-width:0;padding:10px 12px;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:rgba(255,255,255,.05);color:#fff;text-decoration:none;transition:border-color .15s,background .15s}",
      ".am-tile:hover{border-color:rgba(77,166,255,.6);background:rgba(77,166,255,.08)}",
      ".am-tile .am-ti{width:36px;height:36px;flex-shrink:0;border-radius:8px;display:grid;place-items:center;background:#1d3149;color:#cfe3f6}",
      ".am-tile .am-ti .sp-ico{width:20px;height:20px}",
      ".am-tile .am-tt{min-width:0}",
      ".am-tile b{display:block;font-size:13.5px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".am-tile small{display:block;font-size:11px;color:#9fb3c8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".am-tile.am-yours{border-style:dashed;border-color:#3c5878;background:transparent}",
      "@media(max-width:640px){.am-banner a.am-row{flex-wrap:wrap}.am-banner .am-go{width:100%}.am-strip{padding:0 16px}}"
    ].join("\n");
    var s = document.createElement("style");
    s.id = "am-ad-css";
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* ── 5. Bausteine ─────────────────────────────────────────────── */
  function adsenseHTML(slot, kind) {
    if (kind === "infeed" && SLOTS.infeedLayoutKey) {
      return '<ins class="adsbygoogle" data-ad-format="fluid" data-ad-layout-key="' + esc(SLOTS.infeedLayoutKey) +
        '" data-ad-client="' + CLIENT + '" data-ad-slot="' + esc(slot) + '"></ins>';
    }
    return '<ins class="adsbygoogle" data-ad-client="' + CLIENT + '" data-ad-slot="' + esc(slot) +
      '" data-ad-format="' + (kind === "banner" ? "horizontal" : "auto") + '" data-full-width-responsive="true"></ins>';
  }

  /* Partner-Karte im Spotlight-Look (Markenkachel statt Produktfoto) */
  function partnerCard(p, placement) {
    return '<a class="listing-card sp-card" data-am="partner" href="' + esc(utm(p.url, placement)) + '" target="_blank" rel="sponsored noopener"' +
      ' aria-label="' + esc(t("ad") + ": " + p.name + " – " + loc(p.claim)) + '">' +
      '<div class="sp-media"><div class="sp-tile sp-brand">' + icon(p.icon) + '<span class="sp-brand-name">' + esc(p.name) + '</span></div>' +
      '<span class="sp-badge">' + esc(t("ad")) + '</span></div>' +
      '<div class="sp-body">' +
        '<div class="sp-eyebrow">' + esc(t("partner")) + ' · ' + esc(host(p.url)) + '</div>' +
        '<div class="sp-title">' + esc(loc(p.claim)) + '</div>' +
        '<span class="sp-btn">' + esc(loc(p.cta)) + SP_ICON.ext + '</span>' +
      '</div></a>';
  }

  /* Eigenwerbung (wenn weder AdSense noch Partner liefern) */
  function houseCard() {
    return '<a class="listing-card sp-card" data-am="house" href="' + HOUSE_URL + '" aria-label="' + esc(t("ad") + ": " + t("houseT")) + '">' +
      '<div class="sp-media"><div class="sp-tile sp-brand sp-house">' + SP_ICON.megaphone + '<span class="sp-brand-name">1A Motor</span></div>' +
      '<span class="sp-badge">' + esc(t("ad")) + '</span></div>' +
      '<div class="sp-body">' +
        '<div class="sp-eyebrow">1A Motor</div>' +
        '<div class="sp-title">' + esc(t("houseT")) + '</div>' +
        '<div class="sp-text">' + esc(t("houseS")) + '</div>' +
        '<span class="sp-btn">' + esc(t("houseC")) + '</span>' +
      '</div></a>';
  }

  function bannerInner(p, placement) {
    if (p) {
      return '<a class="am-row" href="' + esc(utm(p.url, placement)) + '" target="_blank" rel="sponsored noopener">' +
        '<span class="am-ico">' + icon(p.icon) + '</span>' +
        '<span class="am-txt"><b>' + esc(p.name) + ' – ' + esc(loc(p.claim)) + '</b><small>' + esc(t("partner")) + ' · ' + esc(host(p.url)) + '</small></span>' +
        '<span class="am-go">' + esc(loc(p.cta)) + SP_ICON.ext + '</span></a>';
    }
    return '<a class="am-row" href="' + HOUSE_URL + '"><span class="am-ico">' + SP_ICON.megaphone + '</span>' +
      '<span class="am-txt"><b>' + esc(t("houseT")) + '</b><small>' + esc(t("houseS")) + '</small></span>' +
      '<span class="am-go">' + esc(t("houseC")) + '</span></a>';
  }

  /* Wasserfall: AdSense versuchen, bei "unfilled"/ohne Consent → Fallback */
  function fill(container, kind, slot, fallbackHTML) {
    container.innerHTML = fallbackHTML;
    if (!slot || !hasConsent()) return;
    var holder = document.createElement("div");
    /* In-Feed: AdSense-Anzeige im Spotlight-Rahmen + "Anzeige"-Badge */
    holder.innerHTML = kind === "infeed"
      ? '<div class="listing-card sp-card sp-gads" data-am="gads"><span class="sp-badge">' + esc(t("ad")) + '</span><div class="sp-gads-in">' + adsenseHTML(slot, kind) + '</div></div>'
      : adsenseHTML(slot, kind);
    var unit = holder.firstChild;
    var ins = unit.matches("ins") ? unit : unit.querySelector("ins");
    /* AdSense braucht eine sichtbare Breite zum Messen → Unit zeigen,
       Fallback ausblenden; bei "unfilled" oder Timeout zurück zum Fallback. */
    var fallbacks = Array.prototype.filter.call(container.children, function (c) { return !c.classList.contains("am-head"); });
    fallbacks.forEach(function (c) { c.style.display = "none"; });
    container.appendChild(unit);
    function revert() {
      if (!unit.parentNode) return;
      unit.remove();
      fallbacks.forEach(function (c) { c.style.display = ""; });
      mo.disconnect();
    }
    var mo = new MutationObserver(function () {
      var st = ins.getAttribute("data-ad-status");
      if (st === "filled") { fallbacks.forEach(function (c) { c.remove(); }); mo.disconnect(); clearTimeout(timer); }
      else if (st === "unfilled") { clearTimeout(timer); revert(); }
    });
    var timer = setTimeout(revert, 6000);
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { clearTimeout(timer); revert(); return; }
    mo.observe(ins, { attributes: true, attributeFilter: ["data-ad-status"] });
  }

  /* ── 6. Platzierungen ─────────────────────────────────────────── */
  var gridObserver = null, busy = false;

  function injectInFeed(cfg) {
    var grid = q(cfg.grid);
    if (!grid || busy) return;
    var organic = Array.prototype.filter.call(grid.children, function (el) {
      return el.classList.contains("listing-card") && !/(^|\s)(sp-card|am-card|ms-ad|kress-ad|partner-card)(\s|$)/.test(el.className) && !el.hasAttribute("data-am");
    });
    var want = Math.min(cfg.max, Math.floor(organic.length / cfg.every));
    var existing = grid.querySelectorAll('[data-am-slot="infeed"]');
    if (existing.length === want) return;
    busy = true;
    if (gridObserver) gridObserver.disconnect();
    Array.prototype.forEach.call(existing, function (el) { el.remove(); });
    for (var i = want - 1; i >= 0; i--) {
      var anchor = organic[(i + 1) * cfg.every - 1];
      var wrap = document.createElement("div");
      wrap.setAttribute("data-am-slot", "infeed");
      wrap.style.display = "contents";
      var p = pickPartner(i);
      anchor.after(wrap);
      fill(wrap, "infeed", SLOTS.infeed, p ? partnerCard(p, "infeed_" + (i + 1)) : houseCard());
    }
    if (gridObserver) gridObserver.observe(grid, { childList: true });
    busy = false;
  }

  function injectBanner(cfg, slotKey, placement) {
    if (document.querySelector('[data-am-slot="' + placement + '"]')) return;
    var anchor = q(cfg.after);
    if (!anchor) return;
    var box = document.createElement("aside");
    box.className = "am-banner";
    box.setAttribute("data-am-slot", placement);
    box.setAttribute("aria-label", t("ad"));
    anchor.after(box);
    var head = '<div class="am-head"><span class="sp-badge sp-static">' + esc(t("ad")) + '</span></div>';
    var p = pickPartner(placement === "detail" ? 1 : 0);
    fill(box, "banner", SLOTS[slotKey], head + bannerInner(p, placement));
  }

  function injectStrip(cfg) {
    if (document.getElementById("am-partner-strip")) return;
    var anchor = q(cfg.before);
    var list = activePartners();
    if (!anchor || !list.length) return;
    var sec = document.createElement("section");
    sec.id = "am-partner-strip";
    sec.className = "am-strip";
    sec.setAttribute("aria-label", t("strip"));
    sec.innerHTML = '<div class="am-strip-in"><h3><span class="sp-badge sp-static">' + esc(t("sponsored")) + '</span>' + esc(t("strip")) + '</h3>' +
      '<p>' + esc(t("stripS")) + '</p><div class="am-tiles">' +
      list.map(function (p) {
        return '<a class="am-tile" href="' + esc(utm(p.url, "strip")) + '" target="_blank" rel="sponsored noopener"><span class="am-ti">' + icon(p.icon) +
          '</span><span class="am-tt"><b>' + esc(p.name) + '</b><small>' + esc(loc(p.claim)) + '</small></span></a>';
      }).join("") +
      '<a class="am-tile am-yours" href="' + HOUSE_URL + '"><span class="am-ti">' + SP_ICON.plus + '</span><span class="am-tt"><b>' + esc(t("yours")) + '</b><small>' + esc(t("houseC")) + '</small></span></a>' +
      '</div></div>';
    anchor.parentNode.insertBefore(sec, anchor);
  }

  /* Bestehende statische Slots (Sidebar / FAQ): Platzhalter ausblenden,
     sobald AdSense liefert; ohne Slot-ID / unfilled → Partner statt Platzhalter */
  function upgradeStaticSlots() {
    var sidePh = document.getElementById("adsense-placeholder");
    var faqPh = document.querySelector(".faq-ad-placeholder");
    [[sidePh, 'ins.adsbygoogle[data-ad-slot="' + SLOTS.sidebar + '"]'], [faqPh, ".faq-ad-slot ins.adsbygoogle"]].forEach(function (pair) {
      var ph = pair[0];
      if (!ph) return;
      var ins = document.querySelector(pair[1]);
      if (ins && ins.getAttribute("data-ad-slot") === "0000000000") ins.remove(); // Platzhalter-ID nie ausliefern
      var p = pickPartner(ph === sidePh ? 2 : 0);
      if (p && !ph.getAttribute("data-am-upgraded")) {
        ph.setAttribute("data-am-upgraded", "1");
        var a = ph.querySelector("a[href]");
        if (a) {
          a.href = utm(p.url, ph === sidePh ? "sidebar" : "faq");
          a.target = "_blank";
          a.rel = "sponsored noopener";
          a.textContent = loc(p.cta) + " →";
        }
        var strong = ph.querySelector("strong");
        var span = ph.querySelector(".faq-ad-placeholder-text span");
        if (strong) strong.textContent = p.name;
        if (span) span.textContent = loc(p.claim);
      }
      if (ins) {
        new MutationObserver(function () {
          if (ins.getAttribute("data-ad-status") === "filled") ph.style.display = "none";
        }).observe(ins, { attributes: true, attributeFilter: ["data-ad-status"] });
      }
    });
  }

  /* ── 7. Start ─────────────────────────────────────────────────── */
  function run() {
    var path = location.pathname;
    if (NO_ADS.test(path)) return;
    var page = null;
    Object.keys(PAGES).some(function (k) { if (PAGES[k].match(path)) { page = PAGES[k]; return true; } return false; });
    if (!page) return;
    injectCSS();
    if (page.banner) injectBanner(page.banner, "banner", "banner");
    if (page.detail) injectBanner(page.detail, "detail", "detail");
    if (page.partnerStrip) injectStrip(page.partnerStrip);
    upgradeStaticSlots();
    if (page.infeed) {
      var grid = q(page.infeed.grid);
      if (grid) {
        gridObserver = new MutationObserver(function () { injectInFeed(page.infeed); });
        gridObserver.observe(grid, { childList: true });
        injectInFeed(page.infeed);
      }
    }
  }

  function rebuild() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-am-slot], #am-partner-strip"), function (el) { el.remove(); });
    if (gridObserver) { gridObserver.disconnect(); gridObserver = null; }
    run();
  }

  /* Neu aufbauen bei Sprachwechsel oder geänderter Werbe-Einwilligung */
  document.addEventListener("1am-consent-changed", rebuild);
  function hookLang() {
    if (!window.I18n || window.I18n.__amHooked || typeof window.I18n.setLang !== "function") return;
    var orig = window.I18n.setLang.bind(window.I18n);
    window.I18n.setLang = function (l) { var r = orig(l); rebuild(); return r; };
    window.I18n.__amHooked = true;
  }

  window.__1amAds = { rebuild: rebuild, partners: PARTNERS, slots: SLOTS };

  function start() { run(); hookLang(); window.addEventListener("load", hookLang); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
