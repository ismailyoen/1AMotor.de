/* ══════════════════════════════════════════════════════════════════
   1A Motor – Partner-Inserate: Maschinensucher (Machineseeker Group GmbH)
   ------------------------------------------------------------------
   • Zeigt Maschinensucher-Angebote im Look der eigenen Inserate.
   • Jede Karte ist als "Anzeige" gekennzeichnet (§5a Abs. 4 UWG,
     §6 DDG, Google-AdSense-Richtlinie "Anzeigen nicht als Inhalt tarnen").
   • Links: rel="sponsored noopener" + target="_blank" (Google-Vorgabe
     für bezahlte/Partner-Links).
   • Zwei Platzierungen:
       1) In-Feed: 2 Partner-Karten im Grid "Aktuelle Angebote"
          (nach der 3. und 9. Karte), rotiert alle 6 Stunden.
       2) Partner-Block "Industriemaschinen" unter dem Angebots-Panel
          mit 4 Karten + Link zu Maschinensucher.
   • Überlebt Re-Renders von index-live.js (MutationObserver).
   Einbinden in index.html NACH index-live.js und i18n.js:
     <script src="partner-maschinensucher.js?v=1" defer></script>
   ══════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ── Konfiguration ─────────────────────────────────────────────── */
  var CFG = {
    gridId: "home-listing-grid",
    inFeedPositions: [3, 9],      // nach der 3. und 9. organischen Karte
    blockCount: 4,                // Karten im Partner-Block
    rotateHours: 6,               // Rotation der Auswahl
    utm: { utm_source: "1amotor", utm_medium: "referral", utm_campaign: "partner_listings" },
    partnerName: "Maschinensucher",
    partnerHome: "https://www.maschinensucher.de/",
    imgBase: "https://cdn.machineseeker.com/data/listing/img/nds/ms/"
  };

  /* ── Inserate (aus dem Maschinensucher-Newsletter vom 24.09.2026) ──
     q   = Suchbegriff, den Maschinensucher selbst für den Link nutzt
     img = Pfad-Segment unter imgBase (ohne -01.jpg)                    */
  var LISTINGS = [
    { id: "22808205", type: "Bearbeitungszentrum", name: "Emmegi Phantomatic T4 A", cat: "Fräsen für Alu-Fensterbau", year: 2007, cc: "IT", loc: "Scerne", img: "68/00/22808205", q: "Emmegi Bearbeitungszentrum Emmegi Phantomatic T4 A" },
    { id: "20087755", type: "Tischbohrwerk", name: "Juaristi MDR 110", cat: "Tischbohrwerke 100–119 mm Spindel", year: 1984, cc: "DE", loc: "Bad Berleburg", img: "97/73/20087755", q: "Tischbohrwerk Juaristi MDR 110" },
    { id: "21427167", type: "Schraubmodul", name: "Apex Cleco TSE 961446PT", cat: "Montagemaschinen", year: 2017, cc: "DE", loc: "Altenglan", img: "59/85/21427167", q: "Schraubmodul Apex Cleco TSE 961446PT" },
    { id: "22804470", type: "Stabbearbeitungszentrum", name: "Schüco HS 100", cat: "Fräsen für Alu-Fensterbau", year: 2017, cc: "DE", loc: "Gütersloh", img: "37/00/22804470", q: "Stabbearbeitungszentrum Schüco HS 100" },
    { id: "17818586", type: "Universal-Fräsmaschine", name: "DECKEL FP3", cat: "Fräsmaschinen NC/CNC", year: null, cc: "DE", loc: "Deutschland", img: "88/84/17818586", q: "Fräsmaschine - Universal DECKEL FP3" },
    { id: "21309452", type: "Röntgeneinheit", name: "Comet Yxlon Cougar ECO", cat: "Montagemaschinen", year: null, cc: "EE", loc: "Tallinn", img: "78/75/21309452", q: "Röntgeneinheit Comet Yxlon Cougar ECO" },
    { id: "22804100", type: "Kopierfräsmaschine", name: "RITIM ADRIATIC IS", cat: "Fräsen für Alu-Fensterbau", year: null, cc: "NL", loc: "Enschede", img: "34/00/22804100", q: "Kopierfräsmaschine RITIM ADRIATIC IS" },
    { id: "20332715", type: "Fräsmaschine", name: "TOS KUŘIM FGS 50/63", cat: "Fräsmaschinen konventionell", year: 1990, cc: "CZ", loc: "Tschechien", img: "39/94/20332715", q: "Fräsmaschine TOS KUŘIM FGS 50/63" },
    { id: "21294567", type: "Spulenwickelmaschine", name: "HDR 20.1/89", cat: "Montagemaschinen", year: null, cc: "DE", loc: "Dingelstädt", img: "54/74/21294567", q: "Spulenwickelmaschine HDR 20.1/89" },
    { id: "22550002", type: "CNC-Profilbearbeitungszentrum", name: "Acroloc SBZ 200", cat: "Fräsen für Alu-Fensterbau", year: 2026, cc: "DE", loc: "Pfullingen", img: "16/79/22550002", q: "CNC Profilbearbeitungszentrum Acroloc SBZ 200" },
    { id: "16312585", type: "Radialbohrmaschine", name: "TOS / MAS VO 50", cat: "Radialbohrmaschinen", year: 1983, cc: "DE", loc: "Krefeld", img: "38/59/16312585", q: "Radialbohrmaschine TOS / MAS VO 50" },
    { id: "21289087", type: "Trafoblech-Schachtelmaschine", name: "Kinematrix ing Mod 802", cat: "Montagemaschinen", year: null, cc: "DE", loc: "Dingelstädt", img: "09/74/21289087", q: "Trafoblech Schachtelmaschine Kinematrix ing Mod 802" },
    { id: "22147427", type: "Profil-Schneid- und Bearbeitungszentrum", name: "PLASTMAK SÇ 4550 S", cat: "Fräsen für Alu-Fensterbau", year: 2026, cc: "TR", loc: "Minareliçavuş", img: "61/45/22147427", video: true, q: "Profil-Schneid- und Bearbeitungszentrum PLASTMAK PVC ALÜMİNUM İŞLEME MAKİNELERİ SÇ 4550 S PROFILE PROCESSING MACHINERY" },
    { id: "7641218", type: "Spritzgießmaschine", name: "Arburg Allrounder Centex 320C", cat: "Spritzgießmaschinen 250–999 kN", year: 1999, cc: "DE", loc: "Deutschland", img: "76/36/7641218", q: "Spritzgießmaschine Arburg ALLROUNDER CENTEX 320C 500-250 VO" },
    { id: "21288412", type: "Spulenwickelmaschine", name: "Blume und Redecker AM 2100", cat: "Montagemaschinen", year: null, cc: "DE", loc: "Dingelstädt", img: "03/74/21288412", q: "Spulenwickelmaschine Blume und Redecker AM 2100" },
    { id: "22131512", type: "Glasleisten-Schneidemaschine", name: "Rotox GLA 400 + LA398", cat: "Fräsen für Alu-Fensterbau", year: 2015, cc: "LT", loc: "Šiauliai", img: "29/44/22131512", q: "Glasleisten-Schneidemaschine Rotox GLA 400  +  LA398" },
    { id: "18340176", type: "Bearbeitungszentrum", name: "Emco VMC 300", cat: "Bearbeitungszentren", year: 1995, cc: "DE", loc: "Weiterstadt", img: "34/28/18340176", q: "Bearbeitungszentrum Emco VMC 300" },
    { id: "21288367", type: "Spulenwickelmaschine", name: "Meteor M10", cat: "Montagemaschinen", year: null, cc: "DE", loc: "Dingelstädt", img: "03/74/21288367", q: "Spulenwickelmaschine Meteor M10" },
    { id: "22090178", type: "CNC-Fräsmaschine", name: "Mecal MC309 Nike", cat: "Fräsen für Alu-Fensterbau", year: 2003, cc: "GB", loc: "Coventry", img: "84/40/22090178", q: "CNC-Fräsmaschine Mecal MC309 Nike" },
    { id: "17687223", type: "3-Backenfutter", name: "WMW 600x3", cat: "Dreibackenfutter", year: null, cc: "DE", loc: "Deutschland", img: "93/73/17687223", q: "Futter - 3-Backenfutter WMW 600x3" },
    { id: "21288317", type: "Spulenwickelmaschine", name: "Frieseke und Höpfner FW 100", cat: "Montagemaschinen", year: null, cc: "DE", loc: "Dingelstädt", img: "02/74/21288317", q: "Spulenwickelmaschine Frieseke und Höpfner FW 100" },
    { id: "22006528", type: "Gehrungssäge für Glasleisten", name: "Elumatec GLS 192/06", cat: "Fräsen für Alu-Fensterbau", year: null, cc: "IT", loc: "Silvi", img: "87/33/22006528", video: true, q: "Gehrungssäge für Glasleisten (Fermavetri) Elumatec GLS 192/06" },
    { id: "16393237", type: "Vertikales Bearbeitungszentrum", name: "Hardinge Bridgeport 450P3", cat: "Bearbeitungszentren vertikal", year: 2005, cc: "GB", loc: "Erith", img: "10/66/16393237", video: true, q: "Vertikales Bearbeitungszentrum **USED HARDINGE BRIDGEPORT** 450P3" },
    { id: "21288272", type: "Spulenwickelmaschine", name: "Micafil", cat: "Montagemaschinen", year: null, cc: "DE", loc: "Dingelstädt", img: "02/74/21288272", q: "Spulenwickelmaschine Micafil" }
  ];

  /* ── Texte (DE/EN/FR/TR) ───────────────────────────────────────── */
  var TXT = {
    de: { ad: "Anzeige", partner: "Partnerangebot von", price: "Preis auf Anfrage", cta: "Preisinfo ansehen →", blockTitle: "Industriemaschinen bei unserem Partner", blockSub: "Gebrauchte Werkzeug- und Produktionsmaschinen – angeboten auf Maschinensucher", all: "Alle Maschinen ansehen →", video: "Video", note: "Externe Angebote. Kauf und Abwicklung erfolgen über maschinensucher.de." },
    en: { ad: "Ad", partner: "Partner offer from", price: "Price on request", cta: "View price info →", blockTitle: "Industrial machinery from our partner", blockSub: "Used machine tools and production equipment – listed on Maschinensucher", all: "View all machines →", video: "Video", note: "External offers. Purchase and processing via maschinensucher.de." },
    fr: { ad: "Annonce", partner: "Offre partenaire de", price: "Prix sur demande", cta: "Voir le prix →", blockTitle: "Machines industrielles de notre partenaire", blockSub: "Machines-outils et équipements d’occasion – proposés sur Maschinensucher", all: "Voir toutes les machines →", video: "Vidéo", note: "Offres externes. Achat et traitement via maschinensucher.de." },
    tr: { ad: "Reklam", partner: "İş ortağı teklifi:", price: "Fiyat talep üzerine", cta: "Fiyat bilgisi →", blockTitle: "İş ortağımızdan endüstriyel makineler", blockSub: "İkinci el takım tezgahları ve üretim makineleri – Maschinensucher’de", all: "Tüm makineleri gör →", video: "Video", note: "Harici teklifler. Satın alma maschinensucher.de üzerinden yapılır." }
  };
  function lang() {
    var l = (window.I18n && window.I18n.lang) || safeLS("1amotor_lang") || "de";
    return TXT[l] ? l : "de";
  }
  function t(k) { return TXT[lang()][k]; }
  function safeLS(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  var FLAGS = { DE: "🇩🇪", IT: "🇮🇹", NL: "🇳🇱", CZ: "🇨🇿", EE: "🇪🇪", TR: "🇹🇷", LT: "🇱🇹", GB: "🇬🇧" };

  /* ── Helfer ────────────────────────────────────────────────────── */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function linkFor(item, placement) {
    var p = new URLSearchParams();
    p.set("search-word", item.q);
    p.set("first-listing-id", item.id);
    Object.keys(CFG.utm).forEach(function (k) { p.set(k, CFG.utm[k]); });
    p.set("utm_content", placement + "_" + item.id);
    return "https://www.maschinensucher.de/main/search/index?" + p.toString();
  }
  function homeLink() {
    var p = new URLSearchParams(CFG.utm);
    p.set("utm_content", "block_all");
    return CFG.partnerHome + "?" + p.toString();
  }
  // deterministische Rotation (gleiches Zeitfenster = gleiche Auswahl)
  function seededOrder(list) {
    var seed = Math.floor(Date.now() / (CFG.rotateHours * 3600 * 1000)) || 1;
    var arr = list.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      seed = (seed * 9301 + 49297) % 233280;
      var j = Math.floor((seed / 233280) * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  /* ── Styles (an index.html angelehnt: --blue, --dark, --muted …) ─ */
  function injectCSS() {
    if (document.getElementById("ms-partner-css")) return;
    var css = [
      ".ms-ad.listing-card{position:relative;border-color:#f3d9a4;}",
      ".ms-ad.listing-card:hover{border-color:#e9b949;}",
      ".ms-ad .listing-image{background-color:#e7eef6;}",
      ".ms-ad-badge{position:absolute;top:10px;left:10px;z-index:3;display:inline-flex;align-items:center;gap:5px;background:#fff7e6;color:#8a5a00;border:1px solid #f0c36d;font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:4px 9px;border-radius:6px;}",
      ".ms-ad-video{position:absolute;bottom:10px;right:10px;z-index:3;background:rgba(13,27,42,.72);color:#fff;font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px;}",
      ".ms-ad .listing-title small{display:block;font-size:11.5px;font-weight:600;color:var(--muted,#64748b);margin-top:2px;}",
      ".ms-ad-price{font-size:15px;font-weight:800;color:var(--dark,#0d1b2a);margin-bottom:4px;}",
      ".ms-ad-cta{font-size:12.5px;font-weight:700;color:var(--blue,#1c6ea4);margin-bottom:10px;}",
      ".ms-ad .seller{gap:8px;}",
      ".ms-ad-src{display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--muted,#64748b);}",
      ".ms-ad-src b{color:var(--dark,#0d1b2a);}",
      /* Partner-Block */
      ".ms-block{margin-top:0;}",
      ".ms-block .panel-head h2{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}",
      ".ms-block .panel-head .ms-ad-badge{position:static;}",
      ".ms-block .seller{flex-direction:column;align-items:flex-start;gap:3px;}",
      ".ms-ad-src{white-space:nowrap;}",
      ".ms-ad .seller>span:last-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;}",
      ".ms-block-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}",
      ".ms-block-note{font-size:11.5px;color:var(--muted,#64748b);padding:0 22px 18px;}",
      "@media(max-width:1100px){.ms-block-grid{grid-template-columns:repeat(2,1fr);}}",
      "@media(max-width:640px){.ms-block-grid{grid-template-columns:1fr;}}"
    ].join("\n");
    var s = document.createElement("style");
    s.id = "ms-partner-css";
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* ── Karte im Inserat-Look ─────────────────────────────────────── */
  function cardHTML(item, placement) {
    var img = CFG.imgBase + item.img + "-01.jpg";
    var meta = [];
    if (item.year) meta.push("<span>" + item.year + "</span>");
    meta.push("<span>" + esc(item.cat) + "</span>");
    return '' +
      '<a class="listing-card ms-ad" data-ms-ad="' + esc(item.id) + '" href="' + esc(linkFor(item, placement)) + '"' +
      ' target="_blank" rel="sponsored noopener" aria-label="' + esc(t("ad") + ": " + item.type + " " + item.name + " – " + CFG.partnerName) + '">' +
        '<div class="listing-image">' +
          '<img src="' + esc(img) + '" alt="' + esc(item.type + " " + item.name) + '" loading="lazy" decoding="async" referrerpolicy="no-referrer"' +
          ' style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" onerror="this.remove()">' +
          '<span class="ms-ad-badge">' + esc(t("ad")) + '</span>' +
          (item.video ? '<span class="ms-ad-video">▶ ' + esc(t("video")) + '</span>' : '') +
          '<span aria-hidden="true">🏭</span>' +
        '</div>' +
        '<div class="listing-body">' +
          '<div class="listing-title">' + esc(item.type) + '<small>' + esc(item.name) + '</small></div>' +
          '<div class="meta">' + meta.join("") + '</div>' +
          '<div class="ms-ad-price">' + esc(t("price")) + '</div>' +
          '<div class="ms-ad-cta">' + esc(t("cta")) + '</div>' +
          '<div class="seller">' +
            '<span class="ms-ad-src">' + esc(t("partner")) + ' <b>' + esc(CFG.partnerName) + '</b></span>' +
            '<span>' + (FLAGS[item.cc] || "") + " " + esc(item.loc) + '</span>' +
          '</div>' +
        '</div>' +
      '</a>';
  }
  function toNode(html) {
    var d = document.createElement("div");
    d.innerHTML = html;
    return d.firstChild;
  }

  /* ── 1) In-Feed im Grid ────────────────────────────────────────── */
  var order = seededOrder(LISTINGS);
  var feedItems = order.slice(0, CFG.inFeedPositions.length);
  var blockItems = order.slice(CFG.inFeedPositions.length, CFG.inFeedPositions.length + CFG.blockCount);
  var observer = null;
  var busy = false;

  function injectInFeed() {
    var grid = document.getElementById(CFG.gridId);
    if (!grid || busy) return;
    var organic = Array.prototype.filter.call(grid.children, function (el) {
      return el.classList.contains("listing-card") && !el.classList.contains("ms-ad");
    });
    if (!organic.length) return; // noch "wird geladen…" / leer → nichts einfügen
    var existing = grid.querySelectorAll(".ms-ad");
    if (existing.length === feedItems.length) return; // schon drin

    busy = true;
    if (observer) observer.disconnect();
    Array.prototype.forEach.call(existing, function (el) { el.remove(); });

    // von hinten einfügen, damit Positionen stabil bleiben
    for (var i = CFG.inFeedPositions.length - 1; i >= 0; i--) {
      var pos = CFG.inFeedPositions[i];
      if (organic.length < pos) continue; // zu wenige echte Inserate → Slot auslassen
      var node = toNode(cardHTML(feedItems[i], "infeed"));
      organic[pos - 1].after(node);
    }
    if (observer) observer.observe(grid, { childList: true });
    busy = false;
  }

  /* ── 2) Partner-Block unter "Aktuelle Angebote" ────────────────── */
  function injectBlock() {
    if (document.getElementById("ms-partner-block")) return;
    var grid = document.getElementById(CFG.gridId);
    var panel = grid && grid.closest(".panel");
    if (!panel) return;
    var block = document.createElement("section");
    block.id = "ms-partner-block";
    block.className = "panel ms-block";
    block.setAttribute("aria-label", t("ad") + " – " + t("blockTitle"));
    block.innerHTML =
      '<div class="panel-head">' +
        '<div><h2><span class="ms-ad-badge">' + esc(t("ad")) + '</span>' + esc(t("blockTitle")) + '</h2>' +
        '<p>' + esc(t("blockSub")) + '</p></div>' +
        '<div class="panel-head-right"><a class="view-all-link" href="' + esc(homeLink()) + '" target="_blank" rel="sponsored noopener">' + esc(t("all")) + '</a></div>' +
      '</div>' +
      '<div class="panel-body"><div class="ms-block-grid">' +
        blockItems.map(function (it) { return cardHTML(it, "block"); }).join("") +
      '</div></div>' +
      '<div class="ms-block-note">' + esc(t("note")) + '</div>';
    panel.after(block);
  }

  /* ── Sprachwechsel: Partner-Inhalte neu aufbauen ───────────────── */
  function rebuild() {
    var grid = document.getElementById(CFG.gridId);
    if (grid) Array.prototype.forEach.call(grid.querySelectorAll(".ms-ad"), function (el) { el.remove(); });
    var b = document.getElementById("ms-partner-block");
    if (b) b.remove();
    injectInFeed();
    injectBlock();
  }
  function hookLang() {
    if (!window.I18n || window.I18n.__msHooked) return;
    var orig = window.I18n.setLang.bind(window.I18n);
    window.I18n.setLang = function (l) { orig(l); rebuild(); };
    window.I18n.__msHooked = true;
  }

  /* ── Start ─────────────────────────────────────────────────────── */
  function start() {
    var grid = document.getElementById(CFG.gridId);
    if (!grid) return; // nur Seiten mit Home-Grid
    injectCSS();
    injectBlock();
    observer = new MutationObserver(function () { injectInFeed(); });
    observer.observe(grid, { childList: true });
    injectInFeed();
    hookLang();
    window.addEventListener("load", hookLang);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
