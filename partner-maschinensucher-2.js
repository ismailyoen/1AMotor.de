/* ══════════════════════════════════════════════════════════════════
   1A Motor – Partner-Inserate: Maschinensucher (Machineseeker Group GmbH)
   ------------------------------------------------------------------
   v2 · Spotlight-Look (Variante C) – gleiche Karte wie alle anderen
   Werbeflächen (ad-manager.js, suche-partner-ads.js).
   • Dunkle Navy-Karte, Foto als helle Kachel, gelbes "Anzeige"-Badge,
     blauer Button → klar als Werbung erkennbar (§5a Abs. 4 UWG, §6 DDG,
     AdSense-Richtlinie "Anzeigen nicht als Inhalt tarnen").
   • Links: rel="sponsored noopener" + target="_blank".
   • Zwei Platzierungen:
       1) In-Feed: 2 Partner-Karten im Grid "Aktuelle Angebote"
          (nach der 3. und 9. Karte), rotiert alle 6 Stunden.
       2) Partner-Block "Industriemaschinen" unter dem Angebots-Panel
          mit 4 Karten + Link zu Maschinensucher.
   • Überlebt Re-Renders von index-live.js (MutationObserver).
   Einbinden in index.html NACH index-live.js und i18n.js:
     <script src="partner-maschinensucher.js?v=2" defer></script>
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

  /* ── Inserate (Maschinensucher-Newsletter vom 24.09. + 26.09.2026) ──
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
    { id: "21288272", type: "Spulenwickelmaschine", name: "Micafil", cat: "Montagemaschinen", year: null, cc: "DE", loc: "Dingelstädt", img: "02/74/21288272", q: "Spulenwickelmaschine Micafil" },
    /* ── Newsletter vom 26.09.2026 ── */
    { id: "22820450", type: "4-Achs-Profilbearbeitungszentrum", name: "Elumatec SBZ 140", cat: "Fräsen für Alu-Fensterbau", year: 2013, cc: "NL", loc: "Zevenaar", img: "70/01/22820450", q: "4-Achs-Profilbearbeitungszentrum Elumatec SBZ  140" },
    { id: "21446282", type: "Clipsetzer für Holz-Alu-Fenster", name: "RUCHSER Clipsetzen Holz-Alu", cat: "Montagemaschinen", year: null, cc: "DE", loc: "Aalen", img: "19/87/21446282", q: "Clipsetzer fuer Holz-Alufenster RUCHSER Clipsetzen Holz-Alu" },
    { id: "22820235", type: "4-Achs-Profilbearbeitungszentrum", name: "Elumatec SBZ 140", cat: "Fräsen für Alu-Fensterbau", year: 2018, cc: "NL", loc: "Veghel", img: "68/01/22820235", q: "4-Achs-Profilbearbeitungszentrum Elumatec SBZ  140" },
    { id: "22819605", type: "4-Kopf-Schweiß-/Putzlinie", name: "Stürtz TurboLine", cat: "Fräsen für Alu-Fensterbau", year: 2018, cc: "DE", loc: "Sankt Egidien", img: "63/01/22819605", video: true, q: "4 Kopf Schweiß Puitzlinie Stürtz TurboLine" },
    { id: "22811925", type: "Kopierfräsmaschine", name: "RITIM IIS", cat: "Fräsen für Alu-Fensterbau", year: null, cc: "NL", loc: "Enschede", img: "99/00/22811925", q: "Kopierfräsmaschine RITIM IIS" },
    { id: "7779086", type: "Bandsäge – vertikal", name: "Mössner SSF 1050", cat: "Bandsägen halbautomatisch", year: 1968, cc: "DE", loc: "Niederlangen", img: "25/48/7779086", q: "Bandsäge - Vertikal Mössner SSF 1050" },
    { id: "21808538", type: "CNC-Drehzentrum", name: "Haas SL-30THE", cat: "Drehmaschinen", year: 2007, cc: "DE", loc: "Deutschland", img: "37/17/21808538", q: "CNC Drehzentrum Haas SL-30THE" },
    { id: "21054477", type: "CNC-Dreh- und Fräszentrum", name: "EMCO Turn 365", cat: "CNC Dreh-Fräszentren", year: 1999, cc: "AT", loc: "Einöden", img: "53/54/21054477", video: true, q: "CNC-Dreh- und Fräszentrum EMCO Emco Turn 365" },
    { id: "21288102", type: "Spulenwickelmaschine", name: "Blume und Redecker AM 100", cat: "Montagemaschinen", year: null, cc: "DE", loc: "Dingelstädt", img: "00/74/21288102", q: "Spulenwickelmaschine Blume und Redecker AM 100" },
    { id: "22004873", type: "Ausklinkfräse", name: "Graule AKF 6/300", cat: "Fräsen für Alu-Fensterbau", year: 1994, cc: "DE", loc: "Dinkelsbühl", img: "73/33/22004873", q: "Ausklinkfräse Graule AKF 6/300" },
    { id: "19651006", type: "Gewinderollmaschine", name: "SENY D.44. EH", cat: "Gewinderollmaschinen", year: 1988, cc: "DE", loc: "Deutschland", img: "58/37/19651006", q: "Gewinderollmaschine SENY D.44. EH" },
    { id: "21285187", type: "Spulenwickelmaschine", name: "Bobifil", cat: "Montagemaschinen", year: null, cc: "DE", loc: "Dingelstädt", img: "76/73/21285187", q: "Spulenwickelmaschine Bobifil " }
  ];

  /* ── Texte (DE/EN/FR/TR) ───────────────────────────────────────── */
  var TXT = {
    de: { ad: "Anzeige", partner: "Partnerangebot", price: "Preis auf Anfrage", cta: "Zum Angebot", blockTitle: "Industriemaschinen bei unserem Partner", blockSub: "Gebrauchte Werkzeug- und Produktionsmaschinen – angeboten auf Maschinensucher", all: "Alle Maschinen ansehen →", video: "Video", note: "Externe Angebote. Kauf und Abwicklung erfolgen über maschinensucher.de." },
    en: { ad: "Ad", partner: "Partner offer", price: "Price on request", cta: "View offer", blockTitle: "Industrial machinery from our partner", blockSub: "Used machine tools and production equipment – listed on Maschinensucher", all: "View all machines →", video: "Video", note: "External offers. Purchase and processing via maschinensucher.de." },
    fr: { ad: "Annonce", partner: "Offre partenaire", price: "Prix sur demande", cta: "Voir l’offre", blockTitle: "Machines industrielles de notre partenaire", blockSub: "Machines-outils et équipements d’occasion – proposés sur Maschinensucher", all: "Voir toutes les machines →", video: "Vidéo", note: "Offres externes. Achat et traitement via maschinensucher.de." },
    tr: { ad: "Reklam", partner: "İş ortağı teklifi", price: "Fiyat talep üzerine", cta: "Teklife git", blockTitle: "İş ortağımızdan endüstriyel makineler", blockSub: "İkinci el takım tezgahları ve üretim makineleri – Maschinensucher’de", all: "Tüm makineleri gör →", video: "Video", note: "Harici teklifler. Satın alma maschinensucher.de üzerinden yapılır." }
  };
  function lang() {
    var l = (window.I18n && window.I18n.lang) || safeLS("1amotor_lang") || "de";
    return TXT[l] ? l : "de";
  }
  function t(k) { return TXT[lang()][k]; }
  function safeLS(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  /* Ländername statt Kürzel, wenn der Ort schon das Land ist */
  var COUNTRY = { DE: "Deutschland", CZ: "Tschechien" };

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
  function place(item) {
    return item.loc === COUNTRY[item.cc] ? item.loc : item.loc + ", " + item.cc;
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

  /* ── Spotlight-Stil (identisch in ad-manager.js / suche-partner-ads.js;
        wird nur einmal pro Seite eingefügt – id "sp-ad-css") ───────── */
  var SP_ICON = {
    ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6"/><path d="M10 14L20 4"/><path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"/></svg>',
    factory: '<svg class="sp-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21V10l6 4V10l6 4V6l6 3v12z"/><path d="M7 17h2M12 17h2M17 17h2"/></svg>'
  };
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

  /* ── Zusatz-Stil nur für diese Datei (Partner-Block) ──────────── */
  function injectCSS() {
    injectSpotlightCSS();
    if (document.getElementById("ms-partner-css")) return;
    var css = [
      ".ms-block .panel-head h2{display:flex;align-items:center;gap:10px;flex-wrap:wrap}",
      ".ms-block-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}",
      ".ms-block-note{font-size:11.5px;color:#5f7891;padding:0 22px 18px}",
      "@media(max-width:1100px){.ms-block-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}",
      "@media(max-width:640px){.ms-block-grid{grid-template-columns:1fr}}"
    ].join("\n");
    var s = document.createElement("style");
    s.id = "ms-partner-css";
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* ── Spotlight-Karte ───────────────────────────────────────────── */
  function cardHTML(item, placement) {
    var img = CFG.imgBase + item.img + "-01.jpg";
    var title = item.name + " – " + item.type + (item.year ? " – " + item.year : "");
    return '' +
      '<a class="listing-card sp-card ms-ad" data-ms-ad="' + esc(item.id) + '" href="' + esc(linkFor(item, placement)) + '"' +
      ' target="_blank" rel="sponsored noopener" aria-label="' + esc(t("ad") + ": " + title + " – " + CFG.partnerName) + '">' +
        '<div class="sp-media">' +
          '<div class="sp-tile">' + SP_ICON.factory +
            '<img src="' + esc(img) + '" alt="' + esc(item.type + " " + item.name) + '" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">' +
          '</div>' +
          '<span class="sp-badge">' + esc(t("ad")) + '</span>' +
          (item.video ? '<span class="sp-video">▶ ' + esc(t("video")) + '</span>' : '') +
        '</div>' +
        '<div class="sp-body">' +
          '<div class="sp-eyebrow">' + esc(t("partner")) + ' · ' + esc(CFG.partnerName) + '</div>' +
          '<div class="sp-title">' + esc(title) + '</div>' +
          '<div class="sp-chips"><span>' + esc(item.cat) + '</span><span>' + esc(place(item)) + '</span></div>' +
          '<div class="sp-price">' + esc(t("price")) + '</div>' +
          '<span class="sp-btn">' + esc(t("cta")) + SP_ICON.ext + '</span>' +
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
      return el.classList.contains("listing-card") && !el.classList.contains("ms-ad") && !el.classList.contains("sp-card");
    });
    if (!organic.length) return; // noch "wird geladen…" / leer → nichts einfügen
    var existing = grid.querySelectorAll(".ms-ad");
    var want = CFG.inFeedPositions.filter(function (pos) { return organic.length >= pos; }).length;
    if (existing.length === want) return; // schon drin

    busy = true;
    if (observer) observer.disconnect();
    Array.prototype.forEach.call(existing, function (el) { el.remove(); });

    // von hinten einfügen, damit Positionen stabil bleiben
    for (var i = CFG.inFeedPositions.length - 1; i >= 0; i--) {
      var pos = CFG.inFeedPositions[i];
      if (organic.length < pos) continue; // zu wenige echte Inserate → Slot auslassen
      organic[pos - 1].after(toNode(cardHTML(feedItems[i], "infeed")));
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
        '<div><h2><span class="sp-badge sp-static">' + esc(t("ad")) + '</span>' + esc(t("blockTitle")) + '</h2>' +
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
    if (!window.I18n || window.I18n.__msHooked || typeof window.I18n.setLang !== "function") return;
    var orig = window.I18n.setLang.bind(window.I18n);
    window.I18n.setLang = function (l) { var r = orig(l); rebuild(); return r; };
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
