/* ============================================================
   1A Motor – Cookie-Consent (self-hosted, dependency-frei)
   ------------------------------------------------------------
   - Kategorien: Notwendig (immer an) · Statistik · Marketing
   - Speicherung: localStorage "1am_cookie_consent" + Cookie
   - Google Consent Mode v2 vorbereitet (gtag consent default/update)
   - Öffentlich: window.openCookieSettings()  -> Panel erneut öffnen
   - Einbau: <script src="cookie-consent.js" defer></script> vor </body>
   - CSS ist unter #cc-root gescoped (kein Konflikt mit bestehenden Klassen)
   ============================================================ */
(function () {
  "use strict";

  var STORAGE_KEY = "1am_cookie_consent";
  var COOKIE_NAME = "1am_consent";
  var VERSION = 1; // erhöhen, wenn du Kategorien änderst -> Banner erscheint neu
  var PRIVACY_URL = "datenschutz.html";

  /* ---------- Google Consent Mode v2 (Default = alles verweigert) ---------- */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    functionality_storage: "granted",
    security_storage: "granted",
    wait_for_update: 500
  });

  /* ---------- Consent lesen/schreiben ---------- */
  function readConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var c = JSON.parse(raw);
      if (!c || c.v !== VERSION) return null;
      return c;
    } catch (e) { return null; }
  }

  function writeConsent(statistics, marketing) {
    var c = {
      v: VERSION,
      necessary: true,
      statistics: !!statistics,
      marketing: !!marketing,
      ts: Date.now()
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); } catch (e) {}
    // Cookie (1 Jahr) – falls Server/Edge es lesen soll
    var d = new Date(); d.setFullYear(d.getFullYear() + 1);
    document.cookie = COOKIE_NAME + "=" + encodeURIComponent(statistics ? "1" : "0") +
      (marketing ? "1" : "0") + "; expires=" + d.toUTCString() + "; path=/; SameSite=Lax";
    applyConsent(c);
    return c;
  }

  function applyConsent(c) {
    gtag("consent", "update", {
      ad_storage: c.marketing ? "granted" : "denied",
      ad_user_data: c.marketing ? "granted" : "denied",
      ad_personalization: c.marketing ? "granted" : "denied",
      analytics_storage: c.statistics ? "granted" : "denied"
    });
    // Event für andere Skripte (z.B. Statistik erst nach Zustimmung nachladen)
    try {
      window.dispatchEvent(new CustomEvent("cookieConsentUpdate", { detail: c }));
    } catch (e) {}
  }

  /* ---------- Styles ---------- */
  var CSS = "" +
  "#cc-root *{box-sizing:border-box;font-family:'Outfit',-apple-system,Segoe UI,Arial,sans-serif;}" +
  "#cc-overlay{position:fixed;inset:0;background:rgba(6,14,24,.55);z-index:99998;opacity:0;transition:opacity .2s;}" +
  "#cc-overlay.cc-show{opacity:1;}" +
  "#cc-banner{position:fixed;left:16px;right:16px;bottom:16px;max-width:560px;margin:0 auto;z-index:99999;" +
    "background:#0f2033;color:#e7eef7;border:1px solid #24405e;border-radius:16px;" +
    "box-shadow:0 18px 50px rgba(3,10,20,.55);padding:22px 22px 18px;transform:translateY(20px);opacity:0;" +
    "transition:transform .25s ease,opacity .25s ease;}" +
  "#cc-banner.cc-show{transform:translateY(0);opacity:1;}" +
  "#cc-banner h3{margin:0 0 8px;font-size:17px;font-weight:800;color:#fff;letter-spacing:-.2px;}" +
  "#cc-banner p{margin:0 0 16px;font-size:13.5px;line-height:1.6;color:#aebfd2;}" +
  "#cc-banner a{color:#72b6ff;text-decoration:none;}" +
  "#cc-banner a:hover{text-decoration:underline;}" +
  ".cc-actions{display:flex;flex-wrap:wrap;gap:10px;}" +
  ".cc-btn{flex:1 1 auto;min-width:130px;border:0;cursor:pointer;font-weight:700;font-size:14px;" +
    "padding:12px 16px;border-radius:10px;transition:filter .12s,background .12s;}" +
  ".cc-btn-primary{background:linear-gradient(135deg,#2b6cb0,#4a90d9);color:#fff;}" +
  ".cc-btn-primary:hover{filter:brightness(1.08);}" +
  ".cc-btn-ghost{background:#17293d;color:#cdd9e8;border:1px solid #2c4a68;}" +
  ".cc-btn-ghost:hover{background:#1d334a;}" +
  ".cc-settings-link{display:block;width:100%;background:none;border:0;color:#7f93aa;font-size:12.5px;" +
    "margin-top:12px;cursor:pointer;text-align:center;padding:4px;}" +
  ".cc-settings-link:hover{color:#aebfd2;text-decoration:underline;}" +
  /* Settings-Panel */
  ".cc-cat{display:flex;align-items:flex-start;gap:12px;padding:14px 0;border-top:1px solid #22384f;}" +
  ".cc-cat:first-of-type{border-top:0;}" +
  ".cc-cat-txt{flex:1;}" +
  ".cc-cat-txt strong{display:block;font-size:14px;color:#fff;margin-bottom:2px;}" +
  ".cc-cat-txt span{font-size:12.5px;color:#93a5bb;line-height:1.5;}" +
  ".cc-switch{position:relative;width:44px;height:24px;flex-shrink:0;margin-top:2px;}" +
  ".cc-switch input{opacity:0;width:0;height:0;}" +
  ".cc-slider{position:absolute;inset:0;background:#31465e;border-radius:24px;transition:.2s;cursor:pointer;}" +
  ".cc-slider:before{content:'';position:absolute;height:18px;width:18px;left:3px;top:3px;background:#fff;" +
    "border-radius:50%;transition:.2s;}" +
  ".cc-switch input:checked + .cc-slider{background:#2b6cb0;}" +
  ".cc-switch input:checked + .cc-slider:before{transform:translateX(20px);}" +
  ".cc-switch input:disabled + .cc-slider{background:#2b6cb0;opacity:.55;cursor:not-allowed;}" +
  "@media(max-width:560px){#cc-banner{left:0;right:0;bottom:0;border-radius:16px 16px 0 0;padding:20px 16px 16px;}" +
    ".cc-btn{min-width:100%;} }";

  function injectCSS() {
    if (document.getElementById("cc-style")) return;
    var s = document.createElement("style");
    s.id = "cc-style";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ---------- UI ---------- */
  var root, banner, overlay, showingSettings = false;

  function el(html) {
    var d = document.createElement("div");
    d.innerHTML = html.trim();
    return d.firstChild;
  }

  function bannerHTML() {
    return '' +
    '<h3>🍪 Cookies &amp; Datenschutz</h3>' +
    '<p>Wir nutzen technisch notwendige Cookies für Login und Betrieb. Optionale Cookies für ' +
    'Statistik und Werbung setzen wir nur mit deiner Einwilligung. Details in der ' +
    '<a href="' + PRIVACY_URL + '">Datenschutzerklärung</a>.</p>' +
    '<div class="cc-actions">' +
      '<button class="cc-btn cc-btn-primary" data-cc="all">Alle akzeptieren</button>' +
      '<button class="cc-btn cc-btn-ghost" data-cc="necessary">Nur notwendige</button>' +
    '</div>' +
    '<button class="cc-settings-link" data-cc="settings">Einstellungen anpassen</button>';
  }

  function settingsHTML(c) {
    var stat = c && c.statistics ? "checked" : "";
    var mark = c && c.marketing ? "checked" : "";
    return '' +
    '<h3>Cookie-Einstellungen</h3>' +
    '<p>Wähle selbst, welche Kategorien du erlaubst. Du kannst das jederzeit über den Link ' +
    '„Cookie-Einstellungen“ im Footer ändern.</p>' +
    '<div class="cc-cat">' +
      '<div class="cc-cat-txt"><strong>Notwendig</strong><span>Login-Session und ' +
      'Grundfunktionen. Immer aktiv – ohne diese funktioniert die Seite nicht.</span></div>' +
      '<label class="cc-switch"><input type="checkbox" checked disabled><span class="cc-slider"></span></label>' +
    '</div>' +
    '<div class="cc-cat">' +
      '<div class="cc-cat-txt"><strong>Statistik</strong><span>Anonyme Reichweitenmessung, ' +
      'damit wir die Seite verbessern können.</span></div>' +
      '<label class="cc-switch"><input type="checkbox" id="cc-stat" ' + stat + '><span class="cc-slider"></span></label>' +
    '</div>' +
    '<div class="cc-cat">' +
      '<div class="cc-cat-txt"><strong>Marketing</strong><span>Cookies für personalisierte ' +
      'Werbung (z.&nbsp;B. Google AdSense).</span></div>' +
      '<label class="cc-switch"><input type="checkbox" id="cc-mark" ' + mark + '><span class="cc-slider"></span></label>' +
    '</div>' +
    '<div class="cc-actions" style="margin-top:18px;">' +
      '<button class="cc-btn cc-btn-primary" data-cc="save">Auswahl speichern</button>' +
      '<button class="cc-btn cc-btn-ghost" data-cc="all">Alle akzeptieren</button>' +
    '</div>';
  }

  function build() {
    injectCSS();
    root = document.getElementById("cc-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "cc-root";
      document.body.appendChild(root);
    }
    overlay = el('<div id="cc-overlay"></div>');
    banner = el('<div id="cc-banner" role="dialog" aria-label="Cookie-Einwilligung"></div>');
    root.appendChild(overlay);
    root.appendChild(banner);
    banner.addEventListener("click", onClick);
    requestAnimationFrame(function () {
      overlay.classList.add("cc-show");
      banner.classList.add("cc-show");
    });
  }

  function renderBanner() { showingSettings = false; banner.innerHTML = bannerHTML(); }
  function renderSettings() { showingSettings = true; banner.innerHTML = settingsHTML(readConsent()); }

  function onClick(e) {
    var t = e.target.closest("[data-cc]");
    if (!t) return;
    var action = t.getAttribute("data-cc");
    if (action === "all") { writeConsent(true, true); close(); }
    else if (action === "necessary") { writeConsent(false, false); close(); }
    else if (action === "settings") { renderSettings(); }
    else if (action === "save") {
      var stat = document.getElementById("cc-stat");
      var mark = document.getElementById("cc-mark");
      writeConsent(stat && stat.checked, mark && mark.checked);
      close();
    }
  }

  function close() {
    if (!banner) return;
    overlay.classList.remove("cc-show");
    banner.classList.remove("cc-show");
    setTimeout(function () {
      if (root && root.parentNode) root.parentNode.removeChild(root);
      root = banner = overlay = null;
    }, 260);
  }

  /* ---------- Öffentliche API: erneut öffnen ---------- */
  window.openCookieSettings = function () {
    if (banner) { renderSettings(); return; }
    build();
    renderSettings();
  };

  /* ---------- Start ---------- */
  function init() {
    var c = readConsent();
    if (c) { applyConsent(c); return; } // schon entschieden -> kein Banner
    build();
    renderBanner();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
