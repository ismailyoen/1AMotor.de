/* ════════════════════════════════════════════════════════════════
   1A Motor – Cookie-Consent / EU User Consent Management
   ════════════════════════════════════════════════════════════════
   Einfaches, DSGVO/TTDSG- und Google-EU-User-Consent-Policy-konformes
   Consent-Banner. Einbindung auf JEDER Seite mit einer einzigen Zeile,
   VOR allen Werbe-/Analyse-Skripten:

     <script src="cookie-consent.js"></script>

   Funktionsweise:
   - Ohne gespeicherte Einwilligung wird beim ersten Seitenaufruf ein
     Banner angezeigt (Kategorien: Notwendig / Statistik / Werbung).
   - Skripte, die Statistik- oder Werbe-Cookies setzen (z. B. Google
     AdSense, Cloudflare Web Analytics), werden NICHT direkt geladen,
     sondern als <script type="text/plain" data-cookiecategory="marketing">
     bzw. data-cookiecategory="statistics" im HTML hinterlegt. Erst nach
     erteilter Einwilligung aktiviert dieses Skript sie automatisch.
   - Die Einwilligung wird in localStorage gespeichert (Schlüssel
     "1am_consent") und ist jederzeit über den unten eingeblendeten
     Link "Cookie-Einstellungen" (Footer) änderbar.
   - Stellt window.__1amConsent (aktueller Stand) sowie
     window.__1amOpenCookieSettings() (Banner erneut öffnen) bereit
     und feuert ein "1am-consent-changed"-Event bei jeder Änderung.
   ════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var STORAGE_KEY = "1am_consent";
  var VERSION = 1; // hochzählen, wenn sich die Kategorien/Zwecke ändern -> Banner erscheint erneut

  function readConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.v !== VERSION) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function writeConsent(consent) {
    var payload = {
      v: VERSION,
      necessary: true,
      statistics: !!consent.statistics,
      marketing: !!consent.marketing,
      ts: consent.ts || "stored"
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      /* localStorage nicht verfügbar (z. B. privater Modus) - Banner erscheint dann jedes Mal erneut */
    }
    window.__1amConsent = payload;
    activateScripts(payload);
    try {
      document.dispatchEvent(new CustomEvent("1am-consent-changed", { detail: payload }));
    } catch (e) {}
  }

  function activateScripts(consent) {
    var nodes = document.querySelectorAll('script[type="text/plain"][data-cookiecategory]');
    nodes.forEach(function (node) {
      var cat = node.getAttribute("data-cookiecategory");
      var allowed =
        cat === "necessary" ||
        (cat === "statistics" && consent.statistics) ||
        (cat === "marketing" && consent.marketing);
      if (!allowed || node.getAttribute("data-activated") === "1") return;

      var clone = document.createElement("script");
      for (var i = 0; i < node.attributes.length; i++) {
        var attr = node.attributes[i];
        if (attr.name === "type" || attr.name === "data-cookiecategory") continue;
        clone.setAttribute(attr.name, attr.value);
      }
      if (node.src) {
        clone.src = node.src;
      } else {
        clone.text = node.text;
      }
      node.setAttribute("data-activated", "1");
      node.parentNode.insertBefore(clone, node.nextSibling);
    });
  }

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "style") e.style.cssText = attrs[k];
        else if (k === "html") e.innerHTML = attrs[k];
        else e.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) {
      e.appendChild(c);
    });
    return e;
  }

  var styleTag = document.createElement("style");
  styleTag.textContent =
    "#amcc-banner{position:fixed;left:0;right:0;bottom:0;z-index:99999;" +
    "background:#0d1b2a;color:#eaf1f8;font-family:Arial,Helvetica,sans-serif;" +
    "box-shadow:0 -6px 24px rgba(0,0,0,.35);border-top:1px solid rgba(255,255,255,.08)}" +
    "#amcc-inner{max-width:1080px;margin:0 auto;padding:18px 20px 20px;" +
    "display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start}" +
    "#amcc-text{flex:1 1 320px;font-size:13.5px;line-height:1.55;color:#cfe0ee}" +
    "#amcc-text a{color:#7fb8f5;text-decoration:underline}" +
    "#amcc-text strong{color:#fff}" +
    "#amcc-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center;flex:0 0 auto}" +
    ".amcc-btn{border:0;border-radius:8px;padding:10px 16px;font-size:13px;font-weight:700;" +
    "cursor:pointer;font-family:inherit;white-space:nowrap}" +
    ".amcc-btn-accept{background:#2b6cb0;color:#fff}" +
    ".amcc-btn-accept:hover{background:#3a7dc4}" +
    ".amcc-btn-reject{background:rgba(255,255,255,.1);color:#eaf1f8}" +
    ".amcc-btn-reject:hover{background:rgba(255,255,255,.18)}" +
    ".amcc-btn-settings{background:transparent;color:#9fc4e8;text-decoration:underline;padding:10px 6px}" +
    "#amcc-panel{max-width:1080px;margin:0 auto;padding:0 20px 18px;display:none}" +
    "#amcc-panel.open{display:block}" +
    ".amcc-cat{display:flex;justify-content:space-between;align-items:center;gap:12px;" +
    "background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:10px;" +
    "padding:10px 14px;margin-bottom:8px;font-size:13px}" +
    ".amcc-cat b{display:block;color:#fff;font-size:13.5px;margin-bottom:2px}" +
    ".amcc-cat span{color:#aebfce;font-size:12px}" +
    ".amcc-switch{position:relative;width:40px;height:22px;flex-shrink:0}" +
    ".amcc-switch input{opacity:0;width:0;height:0}" +
    ".amcc-slider{position:absolute;inset:0;background:#3a4a5c;border-radius:22px;cursor:pointer;transition:.15s}" +
    ".amcc-slider:before{content:'';position:absolute;width:16px;height:16px;left:3px;top:3px;" +
    "background:#fff;border-radius:50%;transition:.15s}" +
    ".amcc-switch input:checked+.amcc-slider{background:#2b6cb0}" +
    ".amcc-switch input:checked+.amcc-slider:before{transform:translateX(18px)}" +
    ".amcc-switch input:disabled+.amcc-slider{opacity:.5;cursor:not-allowed}" +
    "#amcc-save{margin-top:4px}" +
    "@media (max-width:640px){#amcc-inner{flex-direction:column}#amcc-actions{width:100%}" +
    ".amcc-btn{flex:1 1 auto;text-align:center}}" +
    "#amcc-gear{position:fixed;left:16px;bottom:16px;z-index:99998;width:40px;height:40px;" +
    "border-radius:50%;background:#0d1b2a;color:#eaf1f8;display:none;place-items:center;" +
    "font-size:17px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.12)}";
  document.head.appendChild(styleTag);

  var panel, banner, gear;

  function categoryRow(key, title, desc, checked, locked) {
    var input = el("input", { type: "checkbox" });
    input.checked = checked;
    if (locked) input.disabled = true;
    input.id = "amcc-chk-" + key;
    var slider = el("span", { class: "amcc-slider" });
    var switchWrap = el("label", { class: "amcc-switch", for: input.id }, [input, slider]);
    var row = el("div", { class: "amcc-cat" }, [
      el("div", {}, [el("b", { html: title }), el("span", { html: desc })]),
      switchWrap
    ]);
    row.__input = input;
    return row;
  }

  function buildBanner() {
    var text = el("div", {
      id: "amcc-text",
      html:
        "🍪 <strong>Wir verwenden Cookies.</strong> Neben technisch notwendigen Cookies nutzen wir " +
        "– nur mit deiner Einwilligung – Statistik- und Werbe-Cookies (u.&nbsp;a. Google AdSense), " +
        "um die Seite zu verbessern und Anzeigen zu finanzieren. Details in unserer " +
        '<a href="datenschutz.html">Datenschutzerklärung</a>. Du kannst deine Auswahl jederzeit über ' +
        '"Cookie-Einstellungen" im Footer ändern.'
    });

    var statRow = categoryRow(
      "statistics",
      "Statistik",
      "Anonymisierte Reichweitenmessung (Cloudflare Web Analytics) zur Verbesserung der Seite.",
      false,
      false
    );
    var adRow = categoryRow(
      "marketing",
      "Werbung",
      "Google AdSense zeigt Anzeigen; kann personalisierte Werbung sowie Cookies von Google und " +
        "Werbepartnern setzen.",
      false,
      false
    );
    var necRow = categoryRow(
      "necessary",
      "Technisch notwendig",
      "Login-Session, Sicherheit, Grundfunktionen. Kann nicht deaktiviert werden.",
      true,
      true
    );

    panel = el("div", { id: "amcc-panel" }, [necRow, statRow, adRow]);

    var btnAcceptAll = el("button", { class: "amcc-btn amcc-btn-accept", type: "button", html: "Alle akzeptieren" });
    var btnRejectAll = el("button", { class: "amcc-btn amcc-btn-reject", type: "button", html: "Nur notwendige" });
    var btnSettings = el("button", { class: "amcc-btn amcc-btn-settings", type: "button", html: "Einstellungen" });
    var btnSave = el("button", {
      id: "amcc-save",
      class: "amcc-btn amcc-btn-accept",
      type: "button",
      html: "Auswahl speichern",
      style: "display:none"
    });

    btnSettings.addEventListener("click", function () {
      panel.classList.toggle("open");
      var isOpen = panel.classList.contains("open");
      btnSave.style.display = isOpen ? "inline-block" : "none";
    });
    btnSave.addEventListener("click", function () {
      writeConsent({
        statistics: statRow.__input.checked,
        marketing: adRow.__input.checked,
        ts: "custom"
      });
      closeBanner();
    });
    btnAcceptAll.addEventListener("click", function () {
      writeConsent({ statistics: true, marketing: true, ts: "accept_all" });
      closeBanner();
    });
    btnRejectAll.addEventListener("click", function () {
      writeConsent({ statistics: false, marketing: false, ts: "reject_all" });
      closeBanner();
    });

    var actions = el("div", { id: "amcc-actions" }, [btnRejectAll, btnSettings, btnSave, btnAcceptAll]);
    var inner = el("div", { id: "amcc-inner" }, [text, actions]);
    banner = el("div", { id: "amcc-banner", role: "dialog", "aria-label": "Cookie-Einstellungen" }, [inner, panel]);
    document.body.appendChild(banner);
  }

  function openBanner(prefill) {
    if (!banner) buildBanner();
    if (prefill) {
      var s = panel.querySelector("#amcc-chk-statistics");
      var m = panel.querySelector("#amcc-chk-marketing");
      if (s) s.checked = !!prefill.statistics;
      if (m) m.checked = !!prefill.marketing;
    }
    banner.style.display = "block";
    if (gear) gear.style.display = "none";
  }

  function closeBanner() {
    if (banner) banner.style.display = "none";
    ensureGear();
    gear.style.display = "grid";
  }

  function ensureGear() {
    if (gear) return;
    gear = el("div", { id: "amcc-gear", title: "Cookie-Einstellungen" }, [document.createTextNode("🍪")]);
    gear.addEventListener("click", function () {
      openBanner(readConsent());
    });
    document.body.appendChild(gear);
  }

  function wireFooterLinks() {
    // Optionaler Footer-Link: <a href="#" data-cookie-settings> oder id="cookie-settings-link"
    document
      .querySelectorAll('[data-cookie-settings], #cookie-settings-link')
      .forEach(function (a) {
        a.addEventListener("click", function (ev) {
          ev.preventDefault();
          openBanner(readConsent());
        });
      });
  }

  window.__1amOpenCookieSettings = function () {
    openBanner(readConsent());
  };

  function init() {
    var existing = readConsent();
    if (existing) {
      window.__1amConsent = existing;
      activateScripts(existing);
      ensureGear();
      gear.style.display = "grid";
    } else {
      openBanner(null);
    }
    wireFooterLinks();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();