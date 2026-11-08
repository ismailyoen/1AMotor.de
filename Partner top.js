/* ══════════════════════════════════════════════════════════════════
   1A Motor – Top-Anzeige (partner-top.js)
   ------------------------------------------------------------------
   v1 · 08.11.2026
   Setzt EINE Partner-Anzeige auf Position 1 im Grid „Aktuelle Angebote“
   der Startseite (#home-listing-grid). Look wie ein normales Inserat
   (Variante A „Nativ“), aber klar gekennzeichnet:
     • weiße „Anzeige“-Pille oben rechts (§5a Abs. 4 UWG, §6 DDG)
     • „Zum Angebot ↗“ statt Herz/„Live“
     • Link: target="_blank" rel="sponsored noopener"
   Bleibt auch nach Neuaufbau des Grids (Sortierung, Sprachwechsel,
   20-Minuten-Mischung) auf Platz 1 – per MutationObserver.

   Aktuelle Anzeige: Pelletpresse 5,5 kW (Gökçen Makine, Hepsiburada)
   Laufzeit: bis zum Datum in AD.until – danach verschwindet sie von selbst.

   Einbinden in index.html am Ende von <body>, NACH index-live.js:
     <script src="partner-top.js?v=1" defer></script>
   ══════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ── Anzeige ───────────────────────────────────────────────────── */
  var AD = {
    id: "hb-pelletpresse-5-5kw",
    active: true,
    until: "2026-12-08",                     // läuft 30 Tage – danach automatisch weg
    url: "https://www.hepsiburada.com/220v-5-5-kw-pelet-makinesi-yem-peletleme-makinesi-yuksek-verimli-guclu-motorlu-endustriyel-kullanim-pm-HBC0000BYY1B1",
    domain: "hepsiburada.com",
    seller: "Gökçen Makine",
    images: [
      "https://productimages.hepsiburada.net/s/777/424-600/110001421904361.jpg",
      "https://productimages.hepsiburada.net/s/777/424-600/110001421904362.jpg",
      "https://productimages.hepsiburada.net/s/777/424-600/110001421904363.jpg"
    ],
    title: {
      de: "Pelletpresse 5,5 kW / 220 V – Futterpellet-Maschine",
      en: "Pellet mill 5.5 kW / 220 V – feed pellet machine",
      fr: "Presse à granulés 5,5 kW / 220 V – granulés d’aliments",
      tr: "Pelet makinesi 5,5 kW / 220 V – yem peletleme makinesi"
    },
    badge: { de: "Landmaschine", en: "Farm machinery", fr: "Machine agricole", tr: "Tarım makinesi" },
    chips: {
      de: ["5,5 kW", "220 V", "Stahlgehäuse"],
      en: ["5.5 kW", "220 V", "Steel body"],
      fr: ["5,5 kW", "220 V", "Corps en acier"],
      tr: ["5,5 kW", "220 V", "Çelik gövde"]
    },
    price: { de: "Preis beim Anbieter", en: "Price at seller", fr: "Prix chez le vendeur", tr: "Fiyat satıcıda" },
    sub: {
      de: "Neu · 24 Monate Garantie",
      en: "New · 24-month warranty",
      fr: "Neuf · garantie 24 mois",
      tr: "Sıfır · 24 ay garanti"
    }
  };

  var TXT = {
    de: { ad: "Anzeige", cta: "Zum Angebot" },
    en: { ad: "Ad", cta: "View offer" },
    fr: { ad: "Annonce", cta: "Voir l’offre" },
    tr: { ad: "Reklam", cta: "Teklife git" }
  };

  var GRID_ID = "home-listing-grid";
  var CARD_ATTR = "data-top-ad";

  /* ── Helfer ────────────────────────────────────────────────────── */
  function lang() {
    var l = (window.I18n && window.I18n.lang) || safeLS("1amotor_lang") || document.documentElement.lang || "de";
    l = String(l).slice(0, 2);
    return TXT[l] ? l : "de";
  }
  function safeLS(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function L(obj) { return (obj && (obj[lang()] || obj.de)) || ""; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function isLive() {
    if (!AD.active) return false;
    var end = new Date(AD.until + "T23:59:59");
    return !(end instanceof Date) || isNaN(end) ? true : Date.now() <= end.getTime();
  }
  function trackUrl(url) {
    try {
      var u = new URL(url);
      u.searchParams.set("utm_source", "1amotor");
      u.searchParams.set("utm_medium", "display");
      u.searchParams.set("utm_campaign", "top_ad");
      u.searchParams.set("utm_content", AD.id);
      return u.toString();
    } catch (e) { return url; }
  }
  var SVG = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">';
  var IC = {
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
    ext: '<path d="M14 4h6v6"/><path d="M10 14L20 4"/><path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"/>',
    box: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>'
  };
  function svg(k) { return SVG + IC[k] + "</svg>"; }

  /* ── Styles (nur Ergänzungen – Basis kommt von .listing-card) ─── */
  function injectCSS() {
    if (document.getElementById("top-ad-css")) return;
    var css = [
      ".ic{display:inline-block;width:1.15em;height:1.15em;vertical-align:-.2em;flex-shrink:0}",
      ".top-ad .listing-image{position:relative;overflow:hidden;background:#fff;display:flex;align-items:center;justify-content:center}",
      ".top-ad .ta-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;padding:6px;box-sizing:border-box;background:#fff}",
      ".top-ad .ta-fallback{width:52px;height:52px;color:#5f7891;stroke-width:1.4}",
      ".top-ad .listing-image .badge{z-index:3;max-width:calc(100% - 120px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".top-ad .ta-pill{position:absolute;top:10px;right:10px;z-index:3;display:inline-flex;align-items:center;gap:5px;background:#fff;color:#0d1b2a;border:1px solid #e0e9f2;font-size:11px;font-weight:700;line-height:1.3;padding:5px 10px 5px 8px;border-radius:999px;box-shadow:0 1px 4px rgba(13,27,42,.08)}",
      ".top-ad .ta-pill .ic{width:13px;height:13px;stroke-width:2.2}",
      ".top-ad .listing-title{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}",
      ".top-ad .ta-price{font-size:15px}",
      ".top-ad .ta-sub{color:#5f7891;font-weight:600}",
      ".top-ad .seller{gap:8px}",
      ".top-ad .ta-dom{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".top-ad .ta-cta{display:inline-flex;align-items:center;gap:4px;flex-shrink:0;color:var(--blue2,#2176c7);font-weight:700}",
      ".top-ad .ta-cta .ic{width:12px;height:12px;stroke-width:2.4}",
      "@media(max-width:900px){",
      "  .top-ad .listing-image .badge{max-width:calc(100% - 88px) !important}",
      "  .top-ad .ta-pill{top:8px;right:8px;padding:3px 8px;font-size:10px}",
      "  .top-ad .ta-pill .ic{display:none}",
      "  .top-ad .ta-dom{display:none}",
      "  .top-ad .seller{justify-content:flex-end}",
      "}"
    ].join("\n");
    var s = document.createElement("style");
    s.id = "top-ad-css";
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* ── Karte ─────────────────────────────────────────────────────── */
  function cardHTML() {
    var t = TXT[lang()];
    var title = L(AD.title);
    var chips = (AD.chips[lang()] || AD.chips.de).map(function (c) { return "<span>" + esc(c) + "</span>"; }).join("");
    return '<a class="listing-card na-card top-ad" ' + CARD_ATTR + '="' + esc(AD.id) + '" data-am="partner"' +
      ' href="' + esc(trackUrl(AD.url)) + '" target="_blank" rel="sponsored noopener"' +
      ' aria-label="' + esc(t.ad + ": " + title + " – " + AD.seller) + '">' +
      '<div class="listing-image">' +
        svg("box").replace('class="ic"', 'class="ic ta-fallback"') +
        '<img class="ta-photo" src="' + esc(AD.images[0]) + '" data-i="0" alt="' + esc(title) + '"' +
        ' loading="eager" decoding="async" referrerpolicy="no-referrer">' +
        '<span class="badge">' + esc(L(AD.badge)) + '</span>' +
        '<span class="ta-pill">' + svg("info") + esc(t.ad) + '</span>' +
      '</div>' +
      '<div class="listing-body">' +
        '<div class="listing-title">' + esc(title) + '</div>' +
        '<div class="meta">' + chips + '</div>' +
        '<div class="price ta-price">' + esc(L(AD.price)) + '</div>' +
        '<div class="shipping ta-sub">' + esc(L(AD.sub)) + '</div>' +
        '<div class="seller"><span class="ta-dom">' + esc(AD.seller) + ' · ' + esc(AD.domain) + '</span>' +
          '<span class="ta-cta">' + esc(t.cta) + svg("ext") + '</span></div>' +
      '</div>' +
    '</a>';
  }

  /* Bild fällt aus → nächstes Bild probieren, sonst schlichtes Icon */
  function wireImage(card) {
    var img = card.querySelector(".ta-photo");
    if (!img) return;
    img.addEventListener("error", function () {
      var i = Number(img.getAttribute("data-i") || 0) + 1;
      if (i < AD.images.length) { img.setAttribute("data-i", String(i)); img.src = AD.images[i]; }
      else img.remove();
    });
  }

  /* ── Platz 1 im Grid sichern ───────────────────────────────────── */
  var observer = null, busy = false;

  function ensureFirst() {
    var grid = document.getElementById(GRID_ID);
    if (!grid || busy) return;
    var hasListings = grid.querySelector(".listing-card:not([" + CARD_ATTR + "])");
    var current = grid.querySelector("[" + CARD_ATTR + "]");
    var wantLang = lang();

    if (!isLive() || !hasListings) {           // abgelaufen oder leeres Grid → keine Werbung
      if (current) { busy = true; current.remove(); busy = false; }
      return;
    }
    if (current && grid.firstElementChild === current && current.getAttribute("data-lang") === wantLang) return;

    busy = true;
    if (observer) observer.disconnect();
    if (current) current.remove();
    var wrap = document.createElement("div");
    wrap.innerHTML = cardHTML();
    var card = wrap.firstChild;
    card.setAttribute("data-lang", wantLang);
    wireImage(card);
    grid.insertBefore(card, grid.firstChild);
    if (observer) observer.observe(grid, { childList: true });
    busy = false;
  }

  function start() {
    var grid = document.getElementById(GRID_ID);
    if (!grid) return;                          // nur Startseite
    injectCSS();
    var timer = null;
    observer = new MutationObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(ensureFirst, 15);      // nach anderen Skripten (Partner-/Lexikon-Karten)
    });
    observer.observe(grid, { childList: true });
    new MutationObserver(function () { setTimeout(ensureFirst, 15); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    window.addEventListener("i18n:changed", function () { setTimeout(ensureFirst, 15); });
    ensureFirst();
    window.addEventListener("load", ensureFirst);
  }

  window.__1amTopAd = { refresh: ensureFirst, ad: AD };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();