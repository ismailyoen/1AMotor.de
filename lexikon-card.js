/* lexikon-card.js – 1A Motor Motorenlexikon
   Gemeinsame „Datenkarte“ statt Platzhalterbild.
   Wird von motoren-lexikon.html, motor-info.html und lexikon-admin.html genutzt. */
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

  /* size: "gross" (Detailseite) oder "klein" (Liste) */
  function render(e, size) {
    var k = kennzahlen(e);
    var chips = [e.kategorie, e.kraftstoff, e.motorcode ? "Motorcode " + e.motorcode : null]
      .filter(Boolean).slice(0, size === "klein" ? 2 : 3);
    return '' +
      '<div class="lxc lxc-' + (size || "gross") + '">' +
        '<div class="lxc-top">' +
          '<span class="lxc-icon">' + icon(e.kategorie, size === "klein" ? 22 : 28) + '</span>' +
          '<span class="lxc-brand"><b>1A</b> Motorenlexikon</span>' +
        '</div>' +
        '<div class="lxc-maker">' + esc(e.hersteller || "") + '</div>' +
        '<div class="lxc-title">' + esc(e.modell || titel(e)) + '</div>' +
        '<div class="lxc-chips">' + chips.map(function (c) { return '<span>' + esc(c) + '</span>'; }).join("") + '</div>' +
        (k.length ? '<div class="lxc-grid">' + k.map(function (r) {
          return '<div class="lxc-kv"><div class="lxc-k">' + esc(r[0]) + '</div><div class="lxc-v">' + esc(r[1]) +
            '</div>' + (r[2] && size !== "klein" ? '<div class="lxc-s">' + esc(r[2]) + '</div>' : "") + '</div>';
        }).join("") + '</div>' : '<div class="lxc-empty">Technische Daten folgen</div>') +
      '</div>';
  }

  var CSS = '' +
    '.lxc{position:relative;overflow:hidden;border-radius:18px;color:#fff;font-family:Outfit,Arial,sans-serif;' +
    'background:radial-gradient(120% 90% at 100% 0%,rgba(77,166,255,.35) 0%,rgba(77,166,255,0) 55%),linear-gradient(150deg,#1b2d42 0%,#0d1b2a 100%);' +
    'box-shadow:0 18px 40px -18px rgba(13,27,42,.55)}' +
    '.lxc:after{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);background-size:22px 22px;pointer-events:none}' +
    '.lxc>*{position:relative;z-index:1}' +
    '.lxc-gross{padding:26px 26px 24px;min-height:300px}' +
    '.lxc-klein{padding:16px 16px 14px;display:flex;flex-direction:column}' +
    '.lxc-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}' +
    '.lxc-icon{display:inline-flex;width:44px;height:44px;border-radius:12px;align-items:center;justify-content:center;background:rgba(255,255,255,.1);color:#9fd0ff}' +
    '.lxc-klein .lxc-icon{width:34px;height:34px;border-radius:10px}' +
    '.lxc-brand{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.55)}' +
    '.lxc-brand b{display:inline-block;background:#fff;color:#1b2d42;border-radius:5px;padding:0 5px;margin-right:4px;font-weight:800}' +
    '.lxc-maker{font-size:13px;font-weight:600;color:#9fd0ff;text-transform:uppercase;letter-spacing:.06em}' +
    '.lxc-title{font-size:30px;line-height:1.1;font-weight:800;margin:4px 0 12px;word-break:break-word}' +
    '.lxc-klein .lxc-title{font-size:19px;margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
    '.lxc-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:18px}' +
    '.lxc-klein .lxc-chips{margin-bottom:4px}' +
    '.lxc-chips span{font-size:12px;font-weight:600;padding:4px 10px;border-radius:99px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.14)}' +
    '.lxc-klein .lxc-chips span{font-size:11px;padding:3px 8px}' +
    '.lxc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}' +
    '.lxc-klein .lxc-grid{gap:6px;margin-top:10px}' +
    '.lxc-kv{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:10px 12px}' +
    '.lxc-klein .lxc-kv{padding:6px 8px;border-radius:9px}' +
    '.lxc-k{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.55)}' +
    '.lxc-v{font-size:20px;font-weight:800;margin-top:2px}' +
    '.lxc-klein .lxc-k{font-size:9.5px}.lxc-klein .lxc-v{font-size:14px}' +
    '.lxc-s{font-size:12px;color:#9fd0ff;margin-top:1px}' +
    '.lxc-empty{font-size:13px;color:rgba(255,255,255,.6);padding:10px 0}';

  if (!document.getElementById("lxc-css")) {
    var st = document.createElement("style");
    st.id = "lxc-css";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  window.LexikonCard = { render: render, icon: icon, esc: esc, zahl: zahl, ps: ps, titel: titel, kennzahlen: kennzahlen };
})();
