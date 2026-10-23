/* ═══════════════════════════════════════════════════════════════════
   1A Motor – Partner-Inserate + Kategorie-Banner im Suchbereich
   ───────────────────────────────────────────────────────────────────
   v4 · NEU: Kategorie-Banner (Abschnitt CATEGORY_BANNERS)
   • Erscheint direkt unter dem großen Kategorie-Hero, sobald genau
     EINE passende Kategorie gewählt ist (Kachel, Dropdown oder Link).
   • Erster Banner: Rotax (Flugmotoren) in der Kategorie „Flugzeugmotor“,
     verlinkt auf flyrotax.com (deutsch: /de/), Motiv von Rotax geliefert.
   • Inserat-Look mit weißer „Anzeige“-Pille (§5a UWG),
     Link: target=_blank, rel="sponsored noopener", UTM-Parameter.
   • Texte in DE / EN / FR / TR – folgt der Sprachauswahl der Seite.
   • Abschalten: active: false setzen oder end: "JJJJ-MM-TT" eintragen.

   v3 · Variante A „Nativ“ – die Partner-Karte ist eine ganz normale
   Ergebnis-Karte (.se-card), nur mit weißer Pille „Unbezahlte Werbung“
   oben rechts, Zeile „Partner-Angebot · maschinensucher.de“ und
   „Zum Angebot ↗“ (§5a UWG). Links: rel="sponsored noopener".
   Außerdem: Emojis in den Ergebnis-Karten und im Filter werden durch
   schlichte Linien-Icons ersetzt.
   • Nur auf suche.html eingebunden – NICHT auf index.html.
   • Nach jeder 6. echten Anzeige kommt 1 Partner-Karte (max. 4 je Seite),
     Reihenfolge rotiert alle 20 Minuten und je Seite.
   • Jedes Inserat läuft nach 60 Tagen automatisch aus (added + 60 Tage).
   Neue Inserate: einfach unten in PARTNER_ADS ergänzen.
═══════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ══ Kategorie-Banner (direkt gebuchte Werbepartner) ══════════════
     category = exakter Kategoriename aus der Datenbank
     start/end = Laufzeit (JJJJ-MM-TT), end: null = unbegrenzt
     href = Ziel je Sprache, "*" = alle übrigen Sprachen
  ═══════════════════════════════════════════════════════════════════ */
  var CATEGORY_BANNERS = [
    {
      id: "rotax-flugmotoren",
      active: true,
      category: "Flugzeugmotor",
      start: "2026-10-23",
      end: null,
      domain: "flyrotax.com",
      href: { de: "https://www.flyrotax.com/de/", "*": "https://www.flyrotax.com/" },
      utm: "utm_source=1amotor&utm_medium=banner&utm_campaign=flugzeugmotor",
      img: "data:image/webp;base64,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",
      text: {
        de: {
          label: "Anzeige",
          alt: "Rotax Werbemotiv: Mann schiebt ein großes rotes Hallentor auf",
          title: "Rotax Flugmotoren",
          sub: "Flugmotoren von der 912er-Reihe bis zum 916 i – Modelle, technische Daten und Kontakt direkt beim Hersteller.",
          chips: ["Kolbenflugmotoren", "Direkt vom Hersteller"],
          loc: "Gunskirchen, Österreich",
          cta: "Zur Rotax-Website",
          aria: "Anzeige: Rotax Flugmotoren – öffnet flyrotax.com in einem neuen Tab"
        },
        en: {
          label: "Ad",
          alt: "Rotax advertisement: a man pushing open a large red hangar door",
          title: "Rotax aircraft engines",
          sub: "Aircraft engines from the 912 series to the 916 i – models, technical data and contact, straight from the manufacturer.",
          chips: ["Piston aircraft engines", "Direct from the manufacturer"],
          loc: "Gunskirchen, Austria",
          cta: "Visit the Rotax website",
          aria: "Ad: Rotax aircraft engines – opens flyrotax.com in a new tab"
        },
        fr: {
          label: "Annonce",
          alt: "Publicité Rotax : un homme pousse une grande porte de hangar rouge",
          title: "Moteurs d'avion Rotax",
          sub: "De la série 912 au 916 i – modèles, données techniques et contact, directement chez le fabricant.",
          chips: ["Moteurs d'avion à pistons", "Direct fabricant"],
          loc: "Gunskirchen, Autriche",
          cta: "Vers le site Rotax",
          aria: "Annonce : moteurs d'avion Rotax – ouvre flyrotax.com dans un nouvel onglet"
        },
        tr: {
          label: "Reklam",
          alt: "Rotax reklam görseli: büyük kırmızı bir hangar kapısını iten bir adam",
          title: "Rotax uçak motorları",
          sub: "912 serisinden 916 i'ye kadar uçak motorları – modeller, teknik veriler ve iletişim doğrudan üreticiden.",
          chips: ["Pistonlu uçak motorları", "Doğrudan üreticiden"],
          loc: "Gunskirchen, Avusturya",
          cta: "Rotax web sitesine git",
          aria: "Reklam: Rotax uçak motorları – flyrotax.com yeni sekmede açılır"
        }
      }
    }
  ];

  var EVERY_N = 6;          // nach jeder 6. echten Anzeige
  var MAX_PER_PAGE = 4;     // höchstens 4 Partner-Karten pro Seite
  var LIFETIME_DAYS = 60;   // Auto-Ablauf laut Partnerabsprache
  var IMG_BASE = "https://cdn.machineseeker.com/data/listing/img/nds/ms/";
  var LINK_UTM = "&utm_source=1amotor&utm_medium=referral&utm_campaign=partner_inserate";

  // added = Datum, an dem das Inserat auf 1amotor ging (YYYY-MM-DD)
  var PARTNER_ADS = [
    { id: 22986846, img: "57/15", kat: "Fräsen für Alu-Fensterbau", title: "Rollenbahn", model: "Graule RO 2000", cc: "PL", loc: "Ostrożne", added: "2026-10-16" },
    { id: 19948700, img: "39/62", kat: "Fräsmaschinen – universal NC/CNC", title: "Werkzeugfräsmaschine – Universal", model: "KNUTH WF 3.1", year: 2008, cc: "DE", loc: "Dreieich", sw: "Werkzeugfräsmaschine - Universal KNUTH WF 3.1", added: "2026-10-16" },
    { id: 22986661, img: "55/15", kat: "Montagemaschinen", title: "Clipsetzer für Holz-Alufenster", model: "RUCHSER RU-CS-ST-Z", cc: "DE", loc: "Deutschland", sw: "Clipsetzer fuer Holz-Alufenster RUCHSER RU-CS-ST-Z", added: "2026-10-16" },
    { id: 22979422, img: "95/14", kat: "Fräsen für Alu-Fensterbau", title: "Kantenfräsmaschine ASO 750, 38", model: "Assfalg ASO 750", cc: "PL", loc: "Wymysłów", sw: "Assfalg ASO 750, 38 Kantenfräsmaschine Assfalg ASO 750", added: "2026-10-16" },
    { id: 21887898, img: "99/23", kat: "Leit-/Zugspindeldrehmaschinen", title: "Paralleldrehmaschine 205 x 1500 mm", model: "Norwik Orion C/6241", cc: "IT", loc: "Concordia Sagittaria", added: "2026-10-16" },
    { id: 22979917, img: "99/14", kat: "Montagemaschinen", title: "Montage-/Einstellwerkzeug", model: "KOENIG EXPANDER® ExTool 040-2", cc: "PL", loc: "Wymysłów", sw: "Montagewerkzeug / Einstellwerkzeug KOENIG EXPANDER ExTool 040-2", added: "2026-10-16" },
    { id: 22969337, img: "11/14", kat: "Fräsen für Alu-Fensterbau", title: "4-Achs-Bearbeitungszentrum", model: "Emmegi Comet", cc: "IT", loc: "Scerne", added: "2026-10-16" },
    { id: 20587490, img: "62/15", kat: "Fräsmaschinen", title: "Bohr-Fräsmaschine", model: "OPTIMUM OptiMill MF 4V", year: 2017, cc: "DE", loc: "Deutschland", added: "2026-10-16" },
    { id: 22199132, img: "92/49", kat: "Montagemaschinen", title: "Handarbeitsplatz Einpress-Montagesystem", model: "MDS A220-PD Autoriv", cc: "DE", loc: "Borken", sw: "MDS A220-PD Autoriv Handarbeitsplatz Einpress Montagesystem MDS A220-PD", added: "2026-10-16" },
    { id: 22132097, img: "34/44", kat: "Fräsen für Alu-Fensterbau", title: "Zwei-Kopf-Schweißmaschine", model: "ELUMATEC ZS 720/00Lv", year: 2005, cc: "LT", loc: "Šiauliai", added: "2026-10-16" },
    { id: 19247036, img: "91/03", kat: "Schnellradialbohrmaschinen", title: "Schnellradiale Bohrmaschine", model: "DONAU DR 32", year: 1976, cc: "DE", loc: "Bächingen an der Brenz", added: "2026-10-16" },
    { id: 22070598, img: "21/39", kat: "Montagemaschinen", title: "Montagestation", model: "PROZAP EK0 Assembly line station", year: 2023, cc: "DE", loc: "Trittau", added: "2026-10-16" },
    { id: 22132022, img: "33/44", kat: "Fräsen für Alu-Fensterbau", title: "Fräsmaschine", model: "ROTOX SDF 169", year: 2015, cc: "LT", loc: "Šiauliai", added: "2026-10-16" },
    { id: 18302276, img: "18/25", kat: "CNC-Drehmaschinen", title: "Metalldrehbank (gebraucht)", model: "Elmag G-MEA50807R", cc: "AT", loc: "Laakirchen", sw: "Metalldrehbank Elmag gebraucht Elmag G-MEA50807R", added: "2026-10-16" },
    { id: 22038083, img: "50/36", kat: "Montagemaschinen", title: "Montagemaschine", model: "Aumann Limbach-Oberfrohna GmbH", cc: "DE", loc: "Stuttgart", added: "2026-10-16" },
    { id: 22107728, img: "31/42", kat: "Fräsen für Alu-Fensterbau", title: "4-Achs-Bearbeitungszentrum", model: "Emmegi Diamant", year: 2005, cc: "IT", loc: "Scerne", added: "2026-10-16" },
    { id: 16419306, img: "27/68", kat: "Radialbohrmaschinen", title: "Radialbohrmaschine", model: "Stimin GR 820 H", cc: "DE", loc: "Kaufungen", added: "2026-10-16" },
    { id: 21973363, img: "11/31", kat: "Montagemaschinen", title: "Pneumatische Eckpresse", model: "ITACA Alta Coop", year: 2011, cc: "BE", loc: "Harelbeke", added: "2026-10-16" },
    { id: 22090178, img: "84/40", kat: "Fräsen für Alu-Fensterbau", title: "CNC-Fräsmaschine", model: "Mecal MC309 Nike", year: 2003, cc: "GB", loc: "Coventry", added: "2026-10-16" },
    { id: 22273542, img: "12/56", kat: "Leit-/Zugspindeldrehmaschinen", title: "Schwerdrehmaschine (gebraucht)", model: "Kraft BV-40160", cc: "DE", loc: "Nürnberg", sw: "Schwerdrehmaschine gebrauchtü Kraft BV-40160", added: "2026-10-16" },
    { id: 21973293, img: "10/31", kat: "Montagemaschinen", title: "CNC-gesteuerte Eckenpresse", model: "ITACA Alta coop", year: 2021, cc: "BE", loc: "Harelbeke", added: "2026-10-16" },
    { id: 22042643, img: "88/36", kat: "Fräsen für Alu-Fensterbau", title: "Ausklinkfräse", model: "Elumatec AF 223", cc: "DE", loc: "Gütersloh", sw: "Ausklinkfräse Elumatec AF 223 Elumatec AF 223", added: "2026-10-16" },
    { id: 21953503, img: "45/29", kat: "Bearbeitungszentren vertikal", title: "Bearbeitungszentrum – Vertikal", model: "MORI SEIKI MV 40B mit kompl. Werkstatt", year: 1988, cc: "DE", loc: "Deutschland", sw: "Bearbeitungszentrum - Vertikal MORI SEIKI MV 40B mit kompl. Werkstatt/with compl.tool shop", added: "2026-10-16" },
    { id: 21972873, img: "07/31", kat: "Montagemaschinen", title: "CNC-gesteuerte Eckenpresse", model: "ITACA Alta coop", year: 2022, cc: "BE", loc: "Harelbeke", added: "2026-10-16" }
  ];

  var COUNTRY = { DE: "Deutschland", PL: "Polen", IT: "Italien", LT: "Litauen", AT: "Österreich", BE: "Belgien", GB: "Großbritannien" };

  /* ══ Linien-Icons statt Emojis (gleicher Satz wie auf der Startseite) ══ */
  var ICON_PATHS = {
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    car: '<path d="M3 13l2-5a2 2 0 0 1 1.9-1.4h10.2A2 2 0 0 1 19 8l2 5v4a1 1 0 0 1-1 1h-1M5 18H4a1 1 0 0 1-1-1v-4h18"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    truck: '<path d="M1 4h14v12H1z"/><path d="M15 9h4l3 3v4h-7z"/><circle cx="5.5" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
    tractor: '<circle cx="7" cy="16" r="4"/><circle cx="18" cy="17" r="3"/><path d="M3 12V6h7l2 6h7v4"/><path d="M10 6V3"/>',
    boat: '<path d="M3 15h18l-2.5 4.5h-13z"/><path d="M6.5 15l2.5-6h6l2.5 6"/><path d="M12 9V4"/>',
    bike: '<circle cx="5.5" cy="16.5" r="3.5"/><circle cx="18.5" cy="16.5" r="3.5"/><path d="M5.5 16.5L9 11h5.5l4 5.5"/><path d="M14.5 11l-1.5-4h3"/>',
    factory: '<path d="M3 21V10l6 4V10l6 4V6l6 3v12z"/><path d="M7 17h2M12 17h2M17 17h2"/>',
    refresh: '<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M3 21v-5h5"/>',
    barrel: '<ellipse cx="12" cy="5" rx="7" ry="2.5"/><path d="M5 5v14c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V5"/><path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/>',
    pump: '<path d="M4 22V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v18"/><path d="M2 22h14"/><path d="M6 9h6"/><path d="M14 11h2a2 2 0 0 1 2 2v3a1.5 1.5 0 0 0 3 0V8l-3-3"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    flame: '<path d="M12 22c4 0 7-3 7-7 0-4-3-6-4-9-1 2-2 3-4 4 0-2-1-4-2-6-2 3-4 6-4 11 0 4 3 7 7 7z"/>',
    battery: '<rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><path d="M6 10v4M10 10v4"/>',
    drop: '<path d="M12 2.7l5.7 5.7a8 8 0 1 1-11.3 0z"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
    plane: '<path d="M2 16l20-8-6 13-3-6z"/><path d="M13 15l-4 5"/>',
    box: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 16-9 0 12-4 16-9 16z"/><path d="M4 20c4-4 7-7 11-9"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    star: '<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
    ext: '<path d="M14 4h6v6"/><path d="M10 14L20 4"/><path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"/>'
  };
  var EMOJI_ICON = {
    "🚗": "car", "🚘": "car", "🚙": "car", "🏎": "car", "🚕": "car",
    "🚚": "truck", "🚛": "truck", "🚐": "truck", "🚌": "truck",
    "🚜": "tractor", "🌾": "tractor",
    "⛵": "boat", "🚤": "boat", "🛥": "boat", "⚓": "boat", "🚢": "boat", "🛶": "boat",
    "🏍": "bike", "🛵": "bike", "🚲": "bike",
    "🏭": "factory", "🏗": "factory", "🚧": "factory",
    "⚙": "gear", "🔩": "gear", "🤖": "gear", "🎡": "gear", "🎢": "gear",
    "🔧": "wrench", "🛠": "wrench",
    "🔄": "refresh", "🔁": "refresh", "♻": "refresh",
    "🛢": "barrel", "⛽": "pump", "⚡": "bolt", "🔌": "bolt",
    "🔵": "flame", "🔥": "flame", "🔋": "battery", "💧": "drop",
    "✨": "spark", "🆕": "spark", "⭐": "star", "🌟": "star",
    "✈": "plane", "🛩": "plane", "🚁": "plane", "🛫": "plane",
    "📦": "box", "🌿": "leaf", "🌱": "leaf",
    "🔍": "search", "🔎": "search", "📍": "pin", "✅": "check"
  };
  function svg(name, cls) {
    return '<svg class="' + (cls || "ic") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (ICON_PATHS[name] || ICON_PATHS.gear) + '</svg>';
  }
  var EMOJI_RE = null;
  try { EMOJI_RE = new RegExp("\\p{Extended_Pictographic}(?:\\uFE0F|\\u200D\\p{Extended_Pictographic})*\\uFE0F?", "gu"); } catch (e) { EMOJI_RE = null; }
  var TEXT_SYMBOLS = /^[←-⇿☀-★☐-♧■-◿©®™✓]$/;
  var EMOJI_SINGLES = "⛽⚡✨⭐⚓⛵✅❌♻⚙✈⛔⚠";
  function isColorEmoji(match) {
    if (/️/.test(match)) return true;
    var cp = match.codePointAt(0);
    if (cp >= 0x1F000) return true;
    if (EMOJI_SINGLES.indexOf(match.charAt(0)) !== -1) return true;
    return !TEXT_SYMBOLS.test(match);
  }
  function replaceEmojis(root, cls) {
    if (!root || !EMOJI_RE || !document.createTreeWalker) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var hits = [];
    while (walker.nextNode()) {
      var n = walker.currentNode;
      EMOJI_RE.lastIndex = 0;
      if (n.nodeValue && EMOJI_RE.test(n.nodeValue)) hits.push(n);
    }
    hits.forEach(function (n) {
      var parent = n.parentNode;
      if (!parent || !parent.closest || parent.closest(".pa-card, .cb-card, script, style, textarea, select, option, svg")) return;
      var text = n.nodeValue, out = "", last = 0, changed = false, m;
      EMOJI_RE.lastIndex = 0;
      while ((m = EMOJI_RE.exec(text))) {
        if (!isColorEmoji(m[0])) continue;
        changed = true;
        out += esc(text.slice(last, m.index));
        var key = m[0].replace(/[️‍]/g, "");
        var name = EMOJI_ICON[key] || EMOJI_ICON[String.fromCodePoint(m[0].codePointAt(0))];
        if (name) out += svg(name, cls);
        last = m.index + m[0].length;
      }
      if (!changed) return;
      out += esc(text.slice(last));
      var tmp = document.createElement("span");
      tmp.innerHTML = out;
      var frag = document.createDocumentFragment();
      while (tmp.firstChild) frag.appendChild(tmp.firstChild);
      parent.replaceChild(frag, n);
    });
  }

  /* ── Stil (Basis-Look kommt von .se-card der Suchseite) ── */
  function injectCSS() {
    if (document.getElementById("pa-ad-css")) return;
    var css = [
      ".ic{display:inline-block;width:1.15em;height:1.15em;vertical-align:-.2em;flex-shrink:0}",
      ".se-ph-ico{width:44px;height:44px;color:#6f88a1;stroke-width:1.4}",
      ".se-ic{color:#8ba2ba}",
      ".se-card-img .ph{opacity:1}",
      /* Native Partner-Karte (Variante A) */
      ".pa-card .se-card-img{overflow:hidden}",
      ".pa-card .pa-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1}",
      ".pa-cat{position:absolute;top:12px;left:12px;z-index:3;max-width:calc(100% - 175px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:rgba(13,27,42,.78);color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:6px}",
      ".pa-pill{position:absolute;top:12px;right:12px;z-index:3;display:inline-flex;align-items:center;gap:5px;background:#fff;color:#0d1b2a;font-size:11px;font-weight:700;line-height:1.3;padding:5px 10px 5px 8px;border-radius:999px;box-shadow:0 1px 4px rgba(0,0,0,.18)}",
      ".pa-pill .ic{width:13px;height:13px;stroke-width:2.2}",
      ".pa-src{font-size:12px;font-weight:600;color:#8ba2ba;margin-top:-2px}",
      ".pa-card .se-card-title{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}",
      ".pa-card .se-loc-row .ic{width:13px;height:13px}",
      ".pa-card .pa-price{font-size:17px}",
      ".pa-cta{display:inline-flex;align-items:center;gap:4px;font-size:13px;font-weight:700;color:#7cc0ff}",
      ".pa-cta .ic{width:12px;height:12px;stroke-width:2.4}",
      ".se-grid.list .se-card.pa-card .se-card-img{min-height:150px}",
      "@media(max-width:900px){.pa-cat{display:none}.pa-pill{top:8px;right:8px;left:8px;justify-content:center;padding:3px 8px;font-size:10px}.pa-pill .ic{display:none}.pa-card .pa-price{font-size:15px}}",
      /* Kategorie-Banner (Inserat im Querformat unter dem Hero) */
      ".cb-card{position:relative;display:grid;grid-template-columns:300px minmax(0,1fr) auto;margin:6px 0 0;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.09);border-radius:16px;overflow:hidden;color:inherit;text-decoration:none;transition:transform .16s,border-color .16s,box-shadow .16s}",
      ".cb-card:hover{transform:translateY(-2px);border-color:rgba(77,166,255,.45);box-shadow:0 14px 34px rgba(0,0,0,.4)}",
      ".cb-card:focus-visible{outline:2px solid #4da6ff;outline-offset:3px}",
      ".cb-media{position:relative;min-height:260px;background:#202125}",
      ".cb-media img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:35% 40%;display:block}",
      ".cb-pill{position:absolute;top:12px;right:12px;z-index:2;display:inline-flex;align-items:center;gap:5px;background:#fff;color:#0d1b2a;font-size:11px;font-weight:700;line-height:1.3;padding:5px 10px 5px 8px;border-radius:999px;box-shadow:0 1px 4px rgba(0,0,0,.3)}",
      ".cb-pill .ic{width:13px;height:13px;stroke-width:2.2}",
      ".cb-body{display:flex;flex-direction:column;justify-content:center;gap:8px;padding:24px 28px;min-width:0}",
      ".cb-src{font-size:12.5px;font-weight:600;color:#8ba2ba}",
      ".cb-title{font-size:26px;font-weight:800;letter-spacing:-.4px;color:#fff;line-height:1.15}",
      ".cb-sub{margin:0;font-size:14.5px;color:#9fb6cd;line-height:1.55;max-width:560px}",
      ".cb-specs{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:12.5px;font-weight:600;color:#cddcec;margin-top:2px}",
      ".cb-specs span{display:inline-flex;align-items:center;gap:6px}",
      ".cb-specs .ic{width:14px;height:14px;color:#4da6ff;stroke-width:2.4}",
      ".cb-loc{display:flex;align-items:center;gap:6px;font-size:12.5px;color:#8ba2ba}",
      ".cb-loc .ic{width:13px;height:13px}",
      ".cb-side{display:flex;align-items:center;padding:24px 28px 24px 0}",
      ".cb-cta{display:inline-flex;align-items:center;gap:8px;white-space:nowrap;background:#dc4d49;color:#fff;font-size:14.5px;font-weight:700;padding:13px 22px;border-radius:10px;transition:background .15s}",
      ".cb-card:hover .cb-cta{background:#c43f3b}",
      ".cb-cta .ic{width:14px;height:14px;stroke-width:2.4}",
      "@media(max-width:900px){.cb-card{grid-template-columns:260px minmax(0,1fr)}.cb-media{grid-row:1 / span 2;min-height:200px}.cb-body{padding:20px 22px 12px}.cb-side{grid-column:2;padding:0 22px 20px}.cb-title{font-size:22px}}",
      "@media(max-width:640px){.cb-card{grid-template-columns:1fr}.cb-media{grid-row:auto;min-height:0;aspect-ratio:4/3}.cb-body{padding:16px 18px 12px}.cb-side{grid-column:auto;padding:0 18px 18px}.cb-cta{width:100%;justify-content:center}.cb-title{font-size:21px}.cb-sub{font-size:14px}}"
    ].join("\n");
    var st = document.createElement("style");
    st.id = "pa-ad-css";
    st.textContent = css;
    document.head.appendChild(st);
  }

  /* ── Helfer ── */
  function esc(v) { return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }
  function active(ad) {
    var start = new Date(ad.added + "T00:00:00");
    return !isNaN(start) && (Date.now() - start.getTime()) < LIFETIME_DAYS * 864e5;
  }
  function link(ad) {
    var sw = ad.sw || (ad.title + " " + ad.model);
    return "https://www.maschinensucher.de/main/search/index?search-word=" + encodeURIComponent(sw) +
      "&first-listing-id=" + ad.id + LINK_UTM;
  }
  function img(ad) { return IMG_BASE + ad.img + "/" + ad.id + "-01.jpg"; }
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffled(list, seed) {
    var rng = mulberry32(seed), a = list.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function currentPage() { return Math.max(1, parseInt(new URLSearchParams(location.search).get("page"), 10) || 1); }

  /* ── Native Partner-Karte (gleiches Raster wie echte Ergebnisse) ── */
  function cardHtml(ad) {
    var specs = '<span class="se-spec">' + esc(ad.kat) + '</span>' + (ad.year ? '<span class="se-spec">Bj. ' + ad.year + '</span>' : '');
    var place = ad.loc === "Deutschland" || ad.loc === COUNTRY[ad.cc] ? (COUNTRY[ad.cc] || ad.loc) : ad.loc + ", " + (COUNTRY[ad.cc] || ad.cc);
    return '' +
      '<a class="se-card pa-card" href="' + esc(link(ad)) + '" target="_blank" rel="sponsored noopener" data-partner-ad="' + ad.id + '"' +
        ' aria-label="Unbezahlte Werbung: ' + esc(ad.title + " " + ad.model) + ' bei Maschinensucher">' +
        '<div class="se-card-img">' + svg("factory", "ic se-ph-ico") +
          '<img class="pa-photo" src="' + esc(img(ad)) + '" alt="' + esc(ad.title + " " + ad.model) + '" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()" />' +
          '<span class="pa-cat">' + esc(ad.title) + '</span>' +
          '<span class="pa-pill">' + svg("info") + 'Unbezahlte Werbung</span>' +
        '</div>' +
        '<div class="se-card-body">' +
          '<div class="se-card-title">' + esc(ad.model) + ' – ' + esc(ad.title) + '</div>' +
          '<div class="pa-src">Partner-Angebot · maschinensucher.de</div>' +
          '<div class="se-specs">' + specs + '</div>' +
          '<div class="se-loc-row">' + svg("pin") + '<span>' + esc(place) + '</span></div>' +
          '<div class="se-card-foot"><span class="se-card-price pa-price">Preis auf Anfrage</span><span class="pa-cta">Zum Angebot' + svg("ext") + '</span></div>' +
        '</div>' +
      '</a>';
  }

  /* ══ Kategorie-Banner ══════════════════════════════════════════════ */
  var BANNER_LANGS = ["de", "en", "fr", "tr"];
  function pageLang() {
    var l = (document.documentElement.getAttribute("lang") || "").slice(0, 2).toLowerCase();
    if (BANNER_LANGS.indexOf(l) === -1) {
      try { l = (localStorage.getItem("1amotor_lang") || "").slice(0, 2).toLowerCase(); } catch (e) { l = ""; }
    }
    return BANNER_LANGS.indexOf(l) > -1 ? l : "de";
  }
  function bannerRunning(b) {
    if (!b || b.active === false) return false;
    var now = Date.now();
    if (b.start && now < new Date(b.start + "T00:00:00").getTime()) return false;
    if (b.end && now > new Date(b.end + "T23:59:59").getTime()) return false;
    return true;
  }
  function selectedCategories() {
    return (new URLSearchParams(location.search).get("category") || "").split(",")
      .map(function (s) { return s.trim(); }).filter(Boolean);
  }
  function bannerHref(b, lang) {
    var base = b.href[lang] || b.href["*"];
    return base + (base.indexOf("?") > -1 ? "&" : "?") + b.utm;
  }
  function bannerHtml(b, lang) {
    var t = b.text[lang] || b.text.de;
    return '' +
      '<a class="cb-card" id="cb-banner" data-key="' + esc(b.id + "|" + lang) + '" data-banner-ad="' + esc(b.id) + '"' +
        ' href="' + esc(bannerHref(b, lang)) + '" target="_blank" rel="sponsored noopener" aria-label="' + esc(t.aria) + '">' +
        '<div class="cb-media">' +
          '<img src="' + b.img + '" alt="' + esc(t.alt) + '" decoding="async" />' +
          '<span class="cb-pill">' + svg("info") + esc(t.label) + '</span>' +
        '</div>' +
        '<div class="cb-body">' +
          '<div class="cb-src">Rotax · ' + esc(b.domain) + '</div>' +
          '<div class="cb-title">' + esc(t.title) + '</div>' +
          '<p class="cb-sub">' + esc(t.sub) + '</p>' +
          '<div class="cb-specs">' + t.chips.map(function (c) { return '<span>' + svg("check") + esc(c) + '</span>'; }).join("") + '</div>' +
          '<div class="cb-loc">' + svg("pin") + '<span>' + esc(t.loc) + '</span></div>' +
        '</div>' +
        '<div class="cb-side"><span class="cb-cta">' + esc(t.cta) + svg("ext") + '</span></div>' +
      '</a>';
  }
  function updateCategoryBanner() {
    var hero = document.getElementById("se-cat-hero");
    var grid = document.getElementById("se-grid");
    if (!hero) return;
    var cats = selectedCategories();
    var loading = !grid || !!grid.querySelector(".se-loading");   // erst nach dem Laden zeigen (kein Springen)
    var b = null;
    if (cats.length === 1 && !loading) {
      b = CATEGORY_BANNERS.filter(function (x) {
        return bannerRunning(x) && x.category.toLowerCase() === cats[0].toLowerCase();
      })[0] || null;
    }
    var el = document.getElementById("cb-banner");
    if (!b) { if (el && el.parentNode) el.parentNode.removeChild(el); return; }
    var lang = pageLang();
    if (el && el.getAttribute("data-key") === b.id + "|" + lang) return; // schon richtig drin
    var tmp = document.createElement("div");
    tmp.innerHTML = bannerHtml(b, lang);
    var node = tmp.firstChild;
    if (el && el.parentNode) el.parentNode.replaceChild(node, el);
    else hero.parentNode.insertBefore(node, hero.nextSibling);
  }

  /* ── Emojis in Ergebnissen + Filter ersetzen ── */
  function cleanPage(grid) {
    Array.prototype.forEach.call(grid.querySelectorAll(".se-card:not(.pa-card) .se-card-img"), function (box) {
      replaceEmojis(box, "ic se-ph-ico");
    });
    Array.prototype.forEach.call(grid.querySelectorAll(".se-card:not(.pa-card) .se-card-body"), function (body) {
      replaceEmojis(body, "ic se-ic");
    });
    Array.prototype.forEach.call(document.querySelectorAll(".se-filters, .se-sidebar, #se-filters"), function (el) {
      replaceEmojis(el, "ic se-ic");
    });
  }

  /* ── Einfügen in das Ergebnis-Raster ── */
  function inject(grid) {
    cleanPage(grid);
    if (grid.querySelector("[data-partner-ad]")) return;            // schon drin
    var organic = grid.querySelectorAll(".se-card:not(.pa-card)");
    if (!organic.length) return;                                    // Laden / keine Treffer
    var pool = PARTNER_ADS.filter(active);
    if (!pool.length) return;

    var page = currentPage();
    var seed = Math.floor(Date.now() / (20 * 60 * 1000)) * 31 + page;
    var picks = shuffled(pool, seed);
    var slots = Math.min(MAX_PER_PAGE, Math.max(1, Math.floor(organic.length / EVERY_N)), picks.length);

    for (var i = 0; i < slots; i++) {
      var anchorIdx = Math.min((i + 1) * EVERY_N, organic.length) - 1;
      var tmp = document.createElement("div");
      tmp.innerHTML = cardHtml(picks[i]);
      organic[anchorIdx].insertAdjacentElement("afterend", tmp.firstChild);
    }
  }

  function start() {
    var grid = document.getElementById("se-grid");
    if (!grid) return;
    injectCSS();
    // suche.html rendert per innerHTML neu (Filter, Sortierung, Seiten) –
    // danach Partner-Karten jedes Mal wieder einsetzen.
    var timer = null;
    new MutationObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(function () { inject(grid); updateCategoryBanner(); }, 20);
    }).observe(grid, { childList: true });
    inject(grid);

    // Kategorie-Banner: reagiert auf Kategorie-Wechsel (Hero wird neu gebaut)
    // und auf die Sprachauswahl (<html lang> ändert sich).
    var hero = document.getElementById("se-cat-hero");
    if (hero) {
      new MutationObserver(updateCategoryBanner).observe(hero, { childList: true, attributes: true, attributeFilter: ["class"] });
    }
    new MutationObserver(updateCategoryBanner).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    updateCategoryBanner();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
