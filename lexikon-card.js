/* lexikon-card.js v3 – 1A Motor Motorenlexikon
   Gemeinsame Lexikon-Karte. Seit v3 im hellen INSERAT-LOOK (weiß, wie die
   Inseratkarten auf der Startseite) statt dunkelblauer Datenkarte.
   Genutzt von: motoren-lexikon.html, motor-info.html, lexikon-admin.html,
   lexikon-raster.js (Startseite + Suche).
   size: "klein" = Karte im Raster (wie ein Inserat)
         "gross" = große Karte auf der Detailseite */
(function () {
  "use strict";

  var ICONS = {
    auto: '<path d="M5 17h14M3 17v-4l2-5h14l2 5v4M7 17v2M17 17v2"/><circle cx="7.5" cy="13.5" r="1"/><circle cx="16.5" cy="13.5" r="1"/>',
    lkw: '<path d="M2 16V6h11v10M13 9h5l3 4v3h-8"/><circle cx="6" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
    zweirad: '<circle cx="5.5" cy="16" r="3.5"/><circle cx="18.5" cy="16" r="3.5"/><path d="M5.5 16l4-7h5l4 7M9.5 9h-2M14.5 9l1.5-3h2"/>',
    boot: '<path d="M3 15l2 4h14l2-4H3zM12 4v11M12 4l6 9h-6"/>',
    agrar: '<circle cx="7" cy="16" r="4"/><circle cx="18" cy="17" r="2.5"/><path d="M7 12V6h6l2 6h3v5M13 6v6"/>',
    bau: '<path d="M3 18h10v-5H3zM13 15h3l5-8-3-2-5 7M5 18v1M11 18v1"/>',
    industrie: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
    flug: '<path d="M2 13l8-1 4-8h2l-2 8 6 1v2l-6 1 2 6h-2l-4-6-8-1z"/>',
    motor: '<path d="M4 9h3l2-2h6v3h2l1-1h2v7h-2l-1-1h-2v3H9l-2-2H4zM4 9v8M10 7V5h4v2"/>',
  };
  var BUCH = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M8 7h7M8 11h5"/></svg>';
  var PFEIL = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  function gruppe(kat) {
    var t = (kat || "").toLowerCase();
    if (/lkw|bus/.test(t)) return "lkw";
    if (/motorrad|roller|e-bike|quad/.test(t)) return "zweirad";
    if (/boot|außenbord|innenbord|schiff|jetski/.test(t)) return "boot";
    if (/traktor|landmaschine|rasen|mäher/.test(t)) return "agrar";
    if (/bau|bagger|stapler|kran/.test(t)) return "bau";
    if (/flug|turbine|drohne/.test(t)) return "flug";
    if (/industrie|drehstrom|servo|getriebe|generator|pumpe|kompressor|lüfter|aufzug/.test(t)) return "industrie";
    if (/auto|diesel|benzin|hybrid/.test(t)) return "auto";
    return "motor";
  }

  function icon(kat, size) {
    return '<svg viewBox="0 0 24 24" width="' + (size || 28) + '" height="' + (size || 28) +
      '" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      ICONS[gruppe(kat)] + "</svg>";
  }

  function esc(v) {
    return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function zahl(n, stellen) {
    if (n == null || n === "") return null;
    return Number(n).toLocaleString("de-DE", { maximumFractionDigits: stellen == null ? 0 : stellen });
  }

  function ps(kw) { return kw ? Math.round(Number(kw) * 1.35962) : null; }

  /* Die wichtigsten Kennzahlen in sinnvoller Reihenfolge */
  function kennzahlen(e) {
    var out = [];
    if (e.leistung_kw) out.push(["Leistung", zahl(e.leistung_kw, 1) + " kW", zahl(ps(e.leistung_kw)) + " PS"]);
    if (e.hubraum_ccm) out.push(["Hubraum", zahl(e.hubraum_ccm) + " cm³", (Number(e.hubraum_ccm) / 1000).toLocaleString("de-DE", { maximumFractionDigits: 1 }) + " Liter"]);
    if (e.drehmoment_nm) out.push(["Drehmoment", zahl(e.drehmoment_nm) + " Nm", ""]);
    if (e.zylinder) out.push(["Zylinder", String(e.zylinder), e.bauart || ""]);
    else if (e.bauart) out.push(["Bauart", e.bauart, ""]);
    if (e.spannung_v) out.push(["Spannung", e.spannung_v, ""]);
    if (e.drehzahl) out.push(["Drehzahl", e.drehzahl, ""]);
    if (e.kraftstoff && out.length < 4) out.push(["Antrieb", e.kraftstoff, ""]);
    return out.slice(0, 4);
  }

  function titel(e) {
    return [e.hersteller, e.modell].filter(Boolean).join(" ") || "Motor";
  }

  /* „Preiszeile“ der Karte: die wichtigste Kennzahl – kein Preis, kein Angebot */
  function hauptwert(e) {
    if (e.leistung_kw) return zahl(e.leistung_kw, 1) + " kW · " + zahl(ps(e.leistung_kw)) + " PS";
    if (e.hubraum_ccm) return zahl(e.hubraum_ccm) + " cm³";
    if (e.drehmoment_nm) return zahl(e.drehmoment_nm) + " Nm";
    if (e.spannung_v) return String(e.spannung_v);
    return "Technische Daten";
  }

  /* Grüne Zeile unter der Kennzahl (wie „Gebraucht“ beim Inserat) */
  function unterzeile(e) {
    var t = [];
    if (e.zylinder) t.push(e.zylinder + " Zylinder");
    else if (e.bauart) t.push(e.bauart);
    if (e.leistung_kw && e.hubraum_ccm) t.push((Number(e.hubraum_ccm) / 1000).toLocaleString("de-DE", { maximumFractionDigits: 1 }) + " Liter");
    if (e.drehmoment_nm && t.length < 2) t.push(zahl(e.drehmoment_nm) + " Nm");
    if (!t.length && e.kraftstoff) t.push(e.kraftstoff);
    return t.slice(0, 2).join(" · ") || "Produktinformation";
  }

  function fotoStil(e) {
    return e.bild_url ? ' style="background-image:url(\'' + encodeURI(e.bild_url).replace(/'/g, "%27") + '\')"' : "";
  }

  function renderKlein(e) {
    var langTitel = titel(e) + (e.kraftstoff ? " – " + e.kraftstoff : "") + (e.motorcode && e.motorcode !== e.modell ? " – Motorcode " + e.motorcode : "");
    var meta = [e.hersteller, e.motorcode, e.baujahre].filter(Boolean).slice(0, 3);
    return '' +
      '<div class="lxc lxc-klein' + (e.bild_url ? " lxc-mitfoto" : "") + '">' +
        '<div class="lxc-img"' + fotoStil(e) + (e.bild_url ? ' role="img" aria-label="' + esc(titel(e)) + '"' : "") + '>' +
          (e.kategorie ? '<span class="lxc-badge">' + esc(e.kategorie) + '</span>' : "") +
          '<span class="lxc-book" title="Motorenlexikon">' + BUCH + '</span>' +
          (e.bild_url ? "" : '<span class="lxc-ico">' + icon(e.kategorie, 54) + '</span>') +
        '</div>' +
        '<div class="lxc-body">' +
          '<div class="lxc-title">' + esc(langTitel) + '</div>' +
          (meta.length ? '<div class="lxc-meta">' + meta.map(function (m) { return '<span>' + esc(m) + '</span>'; }).join("") + '</div>' : "") +
          '<div class="lxc-price">' + esc(hauptwert(e)) + '</div>' +
          '<div class="lxc-sub">' + esc(unterzeile(e)) + '</div>' +
          '<div class="lxc-seller"><span><b class="lxc-1a">1A</b> Motorenlexikon</span><span class="lxc-go">Daten ansehen ' + PFEIL + '</span></div>' +
        '</div>' +
      '</div>';
  }

  function renderGross(e) {
    var k = kennzahlen(e);
    var chips = [e.kategorie, e.kraftstoff, e.motorcode ? "Motorcode " + e.motorcode : null].filter(Boolean);
    return '' +
      '<div class="lxc lxc-gross' + (e.bild_url ? " lxc-mitfoto" : "") + '">' +
        '<div class="lxc-img"' + fotoStil(e) + (e.bild_url ? ' role="img" aria-label="' + esc(titel(e)) + '"' : "") + '>' +
          (e.kategorie ? '<span class="lxc-badge">' + esc(e.kategorie) + '</span>' : "") +
          '<span class="lxc-book" title="Motorenlexikon">' + BUCH + '</span>' +
          (e.bild_url ? "" : '<span class="lxc-ico">' + icon(e.kategorie, 72) + '</span>') +
        '</div>' +
        '<div class="lxc-body">' +
          '<div class="lxc-maker">' + esc(e.hersteller || "") + '</div>' +
          '<div class="lxc-bigtitle">' + esc(e.modell || titel(e)) + '</div>' +
          '<div class="lxc-meta">' + chips.map(function (c) { return '<span>' + esc(c) + '</span>'; }).join("") + '</div>' +
          (k.length ? '<div class="lxc-grid">' + k.map(function (r) {
            return '<div class="lxc-kv"><div class="lxc-k">' + esc(r[0]) + '</div><div class="lxc-v">' + esc(r[1]) +
              '</div>' + (r[2] ? '<div class="lxc-s">' + esc(r[2]) + '</div>' : "") + '</div>';
          }).join("") + '</div>' : '<div class="lxc-empty">Technische Daten folgen</div>') +
          '<div class="lxc-seller"><span><b class="lxc-1a">1A</b> Motorenlexikon</span><span>Produktinformation – kein Angebot</span></div>' +
        '</div>' +
      '</div>';
  }

  function render(e, size) { return size === "klein" ? renderKlein(e) : renderGross(e); }

  /* Pflichtangabe für freie Fotos: Urheber, Lizenz, Quelle */
  function bildnachweis(e) {
    if (!e.bild_url) return "";
    var lizenz = e.bild_lizenz_url
      ? '<a href="' + esc(e.bild_lizenz_url) + '" target="_blank" rel="noopener nofollow">' + esc(e.bild_lizenz || "Lizenz") + '</a>'
      : esc(e.bild_lizenz || "");
    var quelle = e.bild_seite
      ? '<a href="' + esc(e.bild_seite) + '" target="_blank" rel="noopener nofollow">Wikimedia Commons</a>'
      : "Wikimedia Commons";
    return 'Foto: ' + esc(e.bild_urheber || "unbekannt") + (lizenz ? ' · ' + lizenz : "") + ' · via ' + quelle;
  }

  /* Gleiche Maße und Farben wie .listing-card auf der Startseite */
  var CSS = '' +
    '.lxc{position:relative;display:flex;flex-direction:column;height:100%;background:#fff;color:#0d1b2a;border:1px solid #e0e9f2;' +
      'border-radius:12px;overflow:hidden;font-family:Outfit,Arial,sans-serif;line-height:1.5;text-align:left;' +
      'box-shadow:0 2px 16px rgba(13,27,42,.08);transition:transform .2s,box-shadow .2s,border-color .2s}' +
    'a:hover>.lxc,.lxc:hover{transform:translateY(-3px);box-shadow:0 8px 40px rgba(13,27,42,.14);border-color:#b3d3f0}' +
    '.lxc-img{position:relative;height:190px;flex-shrink:0;display:flex;align-items:center;justify-content:center;' +
      'background:linear-gradient(135deg,#dce8f5,#f0f6fd) center/cover no-repeat;color:#7fa6cc}' +
    '.lxc-mitfoto .lxc-img{background-color:#e7eef6}' +
    '.lxc-ico{display:flex;opacity:.9}' +
    '.lxc-badge{position:absolute;top:10px;left:10px;z-index:2;background:rgba(13,27,42,.72);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);' +
      'color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:6px;max-width:calc(100% - 64px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.lxc-book{position:absolute;top:10px;right:10px;z-index:2;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.92);' +
      'border:1px solid #e0e9f2;display:grid;place-items:center;color:#1a5fa8}' +
    '.lxc-body{display:flex;flex-direction:column;flex:1;padding:14px 16px}' +
    '.lxc-title{font-size:14px;font-weight:700;color:#0d1b2a;margin-bottom:6px;line-height:1.4;min-height:40px;' +
      'display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word}' +
    '.lxc-meta{display:flex;flex-wrap:wrap;gap:6px;font-size:12px;color:#7a93ae;margin-bottom:8px}' +
    '.lxc-meta span{background:#f4f7fb;padding:2px 8px;border-radius:4px}' +
    '.lxc-price{font-size:21px;font-weight:900;color:#1a5fa8;margin-bottom:4px;letter-spacing:-.2px}' +
    '.lxc-sub{font-size:12px;color:#10b981;font-weight:600;margin-bottom:10px}' +
    '.lxc-seller{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:12px;color:#7a93ae;' +
      'border-top:1px solid #e0e9f2;padding-top:10px;margin-top:auto}' +
    '.lxc-1a{display:inline-block;background:linear-gradient(145deg,#1b2d42,#2a4a6b);color:#fff;font-size:9.5px;font-weight:900;border-radius:4px;padding:1px 4px;margin-right:3px;vertical-align:1px}' +
    '.lxc-go{display:inline-flex;align-items:center;gap:4px;color:#2176c7;font-weight:700;white-space:nowrap}' +
    /* große Karte (Detailseite) */
    '.lxc-gross .lxc-img{height:280px}' +
    '.lxc-gross .lxc-body{padding:22px 24px 20px}' +
    '.lxc-maker{font-size:13px;font-weight:700;color:#2176c7;text-transform:uppercase;letter-spacing:.06em}' +
    '.lxc-bigtitle{font-size:30px;line-height:1.1;font-weight:900;margin:4px 0 12px;letter-spacing:-.4px;word-break:break-word}' +
    '.lxc-gross .lxc-meta{margin-bottom:16px}' +
    '.lxc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:16px}' +
    '.lxc-kv{background:#f4f7fb;border:1px solid #e0e9f2;border-radius:10px;padding:10px 12px}' +
    '.lxc-k{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#7a93ae;font-weight:600}' +
    '.lxc-v{font-size:20px;font-weight:900;margin-top:2px;color:#0d1b2a}' +
    '.lxc-s{font-size:12px;color:#1a5fa8;font-weight:600;margin-top:1px}' +
    '.lxc-empty{font-size:13px;color:#7a93ae;padding:6px 0 14px}' +
    /* Rahmen von lexikon-raster.js neutralisieren – die Karte bringt Schatten selbst mit */
    '.lxr-tile.lxr-tile,.lxr-tile.lxr-tile:hover{box-shadow:none;transform:none;border-radius:12px}' +
    '.lx-tile.lx-tile:hover{transform:none}';

  var alt = document.getElementById("lxc-css");
  if (alt) alt.remove();
  var st = document.createElement("style");
  st.id = "lxc-css";
  st.textContent = CSS;
  document.head.appendChild(st);

  window.LexikonCard = { render: render, bildnachweis: bildnachweis, icon: icon, esc: esc, zahl: zahl, ps: ps, titel: titel, kennzahlen: kennzahlen, hauptwert: hauptwert };
})();
