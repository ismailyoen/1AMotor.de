/* ══════════════════════════════════════════════════════════════════
   1A Motor – Black Week Pop-up  (blackweek.js) · v1 · 14.11.2026
   ------------------------------------------------------------------
   Zeigt beim Besuch ein Pop-up zur Black Week und führt zu den
   Automotoren in der Suche.

   Regeln:
     • höchstens 2-mal pro Besucher, davon höchstens 1-mal je Sitzung
     • läuft bis einschließlich Black Friday (27.11.2026), danach
       verschwindet es von selbst und räumt seinen Speicher auf
     • erscheint erst, wenn der Cookie-Hinweis beantwortet ist
     • legt nichts ohne Zustimmung ab: nur ein Zähler im localStorage,
       technisch notwendig für „höchstens 2-mal"

   Einbinden am Ende von <body>:
     <script src="blackweek.js?v=1" defer></script>
   Soll es auch auf der Suche erscheinen, dieselbe Zeile in suche.html.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ── Einstellungen ─────────────────────────────────────────────── */
  var AKTION = {
    // Letzter Tag der Aktion (Black Friday 2026). Danach zeigt sich nichts mehr.
    letzterTag: new Date(2026, 10, 27),        // Monat 10 = November
    maxAnzeigen: 2,
    verzoegerungMs: 1400,                      // kurz warten, bis die Seite steht
    ziel: "suche.html?category=Automotor&sort=new",
    speicher: "1am_blackweek_2026"
  };

  var TXT = {
    de: {
      eyebrow: "Black Week",
      titel: "Entdecken Sie unsere neuen Automotoren",
      text: "Frisch eingetroffen auf 1A Motor – jetzt in Ruhe stöbern.",
      textN: "{n} Automotoren neu auf 1A Motor – jetzt in Ruhe stöbern.",
      cta: "Automotoren ansehen",
      spaeter: "Später",
      schliessen: "Hinweis schließen",
      tage: "Noch {n} Tage",
      einTag: "Nur noch 1 Tag",
      heute: "Endet heute"
    },
    en: {
      eyebrow: "Black Week",
      titel: "Discover our latest car engines",
      text: "Just added on 1A Motor – take your time and browse.",
      textN: "{n} car engines just added on 1A Motor – take your time and browse.",
      cta: "View car engines",
      spaeter: "Later",
      schliessen: "Close notice",
      tage: "{n} days left",
      einTag: "1 day left",
      heute: "Ends today"
    },
    fr: {
      eyebrow: "Black Week",
      titel: "Découvrez nos nouveaux moteurs automobiles",
      text: "Tout juste arrivés sur 1A Motor – prenez le temps de parcourir.",
      textN: "{n} moteurs automobiles tout juste arrivés sur 1A Motor.",
      cta: "Voir les moteurs",
      spaeter: "Plus tard",
      schliessen: "Fermer",
      tage: "Encore {n} jours",
      einTag: "Plus qu'un jour",
      heute: "Se termine aujourd'hui"
    },
    tr: {
      eyebrow: "Black Week",
      titel: "Yeni otomobil motorlarımızı keşfedin",
      text: "1A Motor'da yeni eklendi – acele etmeden inceleyin.",
      textN: "1A Motor'da {n} otomobil motoru yeni eklendi.",
      cta: "Motorları görüntüle",
      spaeter: "Daha sonra",
      schliessen: "Kapat",
      tage: "{n} gün kaldı",
      einTag: "Son 1 gün",
      heute: "Bugün sona eriyor"
    }
  };

  /* ── Hilfsmittel ───────────────────────────────────────────────── */
  function ls(key) { try { return window.localStorage.getItem(key); } catch (e) { return null; } }
  function lsSet(key, wert) { try { window.localStorage.setItem(key, wert); } catch (e) {} }
  function lsWeg(key) { try { window.localStorage.removeItem(key); } catch (e) {} }
  function ss(key) { try { return window.sessionStorage.getItem(key); } catch (e) { return null; } }
  function ssSet(key, wert) { try { window.sessionStorage.setItem(key, wert); } catch (e) {} }

  function sprache() {
    var l = (window.I18n && window.I18n.lang) || ls("1amotor_lang") || document.documentElement.lang || "de";
    l = String(l).slice(0, 2).toLowerCase();
    return TXT[l] ? l : "de";
  }
  var T = TXT[sprache()];

  function tagesBeginn(d) { var x = new Date(d.getTime()); x.setHours(0, 0, 0, 0); return x; }

  // Ganze Tage von heute bis zum letzten Aktionstag
  function tageOffen() {
    return Math.round((tagesBeginn(AKTION.letzterTag) - tagesBeginn(new Date())) / 86400000);
  }

  function restText() {
    var n = tageOffen();
    if (n > 1) return T.tage.replace("{n}", n);
    if (n === 1) return T.einTag;
    return T.heute;
  }

  /* ── Darf das Pop-up erscheinen? ───────────────────────────────── */
  function darfZeigen() {
    if (tageOffen() < 0) { lsWeg(AKTION.speicher); return false; }      // Aktion vorbei
    if (ss(AKTION.speicher)) return false;                               // in dieser Sitzung schon gezeigt
    var n = parseInt(ls(AKTION.speicher), 10);
    if (!isFinite(n) || n < 0) n = 0;
    return n < AKTION.maxAnzeigen;
  }

  function zaehlen() {
    var n = parseInt(ls(AKTION.speicher), 10);
    if (!isFinite(n) || n < 0) n = 0;
    lsSet(AKTION.speicher, String(n + 1));
    ssSet(AKTION.speicher, "1");
  }

  /* ── Aussehen ──────────────────────────────────────────────────── */
  var CSS =
    "#bw-root,#bw-root *{box-sizing:border-box;font-family:'Outfit',-apple-system,'Segoe UI',Arial,sans-serif;}" +
    "#bw-overlay{position:fixed;inset:0;z-index:90000;display:grid;place-items:center;padding:20px;" +
      "background:rgba(4,8,14,.72);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);" +
      "opacity:0;transition:opacity .25s ease;}" +
    "#bw-overlay.bw-show{opacity:1;}" +
    "#bw-card{position:relative;width:100%;max-width:470px;border-radius:22px;overflow:hidden;text-align:center;" +
      "padding:40px 32px 28px;color:#fff;" +
      "background:radial-gradient(120% 100% at 50% 0%,#17202b 0%,#0b1119 55%,#070b11 100%);" +
      "border:1px solid rgba(255,255,255,.12);" +
      "box-shadow:0 30px 80px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.07);" +
      "transform:translateY(18px) scale(.97);opacity:0;transition:transform .32s cubic-bezier(.2,.8,.3,1),opacity .32s ease;}" +
    "#bw-overlay.bw-show #bw-card{transform:none;opacity:1;}" +
    /* feine Lichtkante oben */
    "#bw-card::before{content:'';position:absolute;top:0;left:12%;right:12%;height:1px;" +
      "background:linear-gradient(90deg,transparent,#72b6ff,transparent);}" +
    /* einmaliger Lichtstreifen über die Karte */
    "#bw-card::after{content:'';position:absolute;top:-60%;left:-70%;width:45%;height:220%;pointer-events:none;" +
      "background:linear-gradient(90deg,transparent,rgba(255,255,255,.07),transparent);" +
      "transform:rotate(18deg);animation:bw-sheen 1.5s ease-out .45s 1 both;}" +
    "@keyframes bw-sheen{from{left:-70%;}to{left:140%;}}" +
    "#bw-close{position:absolute;top:12px;right:12px;width:36px;height:36px;border-radius:50%;cursor:pointer;" +
      "background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);color:#cfd9e6;" +
      "display:grid;place-items:center;padding:0;transition:background .15s,color .15s;}" +
    "#bw-close:hover{background:rgba(255,255,255,.14);color:#fff;}" +
    "#bw-close svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;}" +
    ".bw-eyebrow{display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:18px;}" +
    ".bw-eyebrow span{font-size:12px;font-weight:800;letter-spacing:.34em;text-transform:uppercase;" +
      "color:#fff;white-space:nowrap;}" +
    ".bw-eyebrow i{display:block;height:1px;width:46px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.45));}" +
    ".bw-eyebrow i:last-child{background:linear-gradient(90deg,rgba(255,255,255,.45),transparent);}" +
    "#bw-card h2{margin:0 0 12px;font-size:27px;line-height:1.2;font-weight:800;letter-spacing:-.4px;color:#fff;}" +
    "#bw-card p{margin:0 0 22px;font-size:14.5px;line-height:1.6;color:#aebfd2;}" +
    ".bw-chip{display:inline-flex;align-items:center;gap:7px;margin-bottom:24px;padding:7px 14px;border-radius:999px;" +
      "font-size:12.5px;font-weight:700;letter-spacing:.02em;color:#9ecbff;" +
      "background:rgba(114,182,255,.10);border:1px solid rgba(114,182,255,.26);}" +
    ".bw-chip svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}" +
    "#bw-cta{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;padding:15px 20px;" +
      "border-radius:999px;background:#fff;color:#0b1119;font-size:15px;font-weight:800;letter-spacing:-.1px;" +
      "text-decoration:none;border:0;cursor:pointer;transition:transform .14s ease,box-shadow .14s ease;}" +
    "#bw-cta:hover{transform:translateY(-1px);box-shadow:0 10px 26px rgba(255,255,255,.18);}" +
    "#bw-cta svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;}" +
    "#bw-later{display:block;width:100%;margin-top:14px;background:none;border:0;cursor:pointer;" +
      "color:#7f93aa;font-size:13px;font-weight:600;padding:6px;transition:color .15s;}" +
    "#bw-later:hover{color:#cfd9e6;text-decoration:underline;}" +
    "#bw-card:focus{outline:none;}" +
    "#bw-overlay a:focus-visible,#bw-overlay button:focus-visible{outline:2px solid #72b6ff;outline-offset:3px;}" +
    "@media(max-width:520px){#bw-card{padding:34px 22px 24px;border-radius:18px;}#bw-card h2{font-size:23px;}}" +
    "@media(prefers-reduced-motion:reduce){#bw-overlay,#bw-card{transition:none;}#bw-card::after{animation:none;display:none;}" +
      "#bw-cta:hover{transform:none;}}";

  var IC_CLOSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  var IC_CLOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
  var IC_ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  /* ── Aufbau ────────────────────────────────────────────────────── */
  var root = null, vorherFokus = null, scrollWar = "";

  function bauen() {
    var stil = document.createElement("style");
    stil.textContent = CSS;

    root = document.createElement("div");
    root.id = "bw-root";
    root.appendChild(stil);

    var overlay = document.createElement("div");
    overlay.id = "bw-overlay";

    var card = document.createElement("div");
    card.id = "bw-card";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-labelledby", "bw-titel");
    card.setAttribute("tabindex", "-1");

    var close = document.createElement("button");
    close.id = "bw-close";
    close.type = "button";
    close.setAttribute("aria-label", T.schliessen);
    close.innerHTML = IC_CLOSE;

    var eyebrow = document.createElement("div");
    eyebrow.className = "bw-eyebrow";
    eyebrow.innerHTML = "<i></i><span></span><i></i>";
    eyebrow.querySelector("span").textContent = T.eyebrow;

    var h2 = document.createElement("h2");
    h2.id = "bw-titel";
    h2.textContent = T.titel;

    var p = document.createElement("p");
    p.id = "bw-text";
    p.textContent = T.text;

    var chip = document.createElement("div");
    chip.className = "bw-chip";
    chip.innerHTML = IC_CLOCK + "<span></span>";
    chip.querySelector("span").textContent = restText();

    var cta = document.createElement("a");
    cta.id = "bw-cta";
    cta.href = AKTION.ziel;
    cta.innerHTML = "<span></span>" + IC_ARROW;
    cta.querySelector("span").textContent = T.cta;

    var later = document.createElement("button");
    later.id = "bw-later";
    later.type = "button";
    later.textContent = T.spaeter;

    card.appendChild(close);
    card.appendChild(eyebrow);
    card.appendChild(h2);
    card.appendChild(p);
    card.appendChild(chip);
    card.appendChild(cta);
    card.appendChild(later);
    overlay.appendChild(card);
    root.appendChild(overlay);
    document.body.appendChild(root);

    close.addEventListener("click", zu);
    later.addEventListener("click", zu);
    cta.addEventListener("click", function () { zu(true); });
    overlay.addEventListener("mousedown", function (e) { if (e.target === overlay) zu(); });
    document.addEventListener("keydown", taste, true);

    vorherFokus = document.activeElement;
    scrollWar = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    requestAnimationFrame(function () {
      overlay.classList.add("bw-show");
      try { card.focus({ preventScroll: true }); } catch (e) {}
    });

    anzahlNachtragen(p);
  }

  // Tabulator im Pop-up halten, Escape schließt
  function taste(e) {
    if (!root) return;
    if (e.key === "Escape") { e.preventDefault(); zu(); return; }
    if (e.key !== "Tab") return;
    var f = root.querySelectorAll("button, a[href]");
    if (!f.length) return;
    var erste = f[0], letzte = f[f.length - 1];
    if (e.shiftKey && document.activeElement === erste) { e.preventDefault(); letzte.focus(); }
    else if (!e.shiftKey && document.activeElement === letzte) { e.preventDefault(); erste.focus(); }
  }

  function zu(sofort) {
    if (!root) return;
    var r = root; root = null;
    document.removeEventListener("keydown", taste, true);
    document.body.style.overflow = scrollWar;
    var ov = r.querySelector("#bw-overlay");
    if (ov) ov.classList.remove("bw-show");
    try { if (vorherFokus && vorherFokus.focus) vorherFokus.focus({ preventScroll: true }); } catch (e) {}
    if (sofort) { r.remove(); return; }
    setTimeout(function () { r.remove(); }, 260);
  }

  /* ── Anzahl der Automotoren nachtragen (optional) ──────────────── */
  function anzahlNachtragen(pEl) {
    if (!window.supabaseClient || !T.textN) return;
    try {
      window.supabaseClient.from("categories").select("id").eq("slug", "automotor").maybeSingle()
        .then(function (k) {
          if (!k || !k.data || !k.data.id) return null;
          return window.supabaseClient.from("listings")
            .select("id", { count: "exact", head: true })
            .eq("status", "Freigegeben").eq("category_id", k.data.id);
        })
        .then(function (r) {
          if (!r || typeof r.count !== "number" || r.count < 50) return;
          if (!document.body.contains(pEl)) return;
          pEl.textContent = T.textN.replace("{n}", r.count.toLocaleString(sprache() === "de" ? "de-DE" : sprache()));
        })
        .catch(function () {});
    } catch (e) {}
  }

  /* ── Start: erst nach dem Cookie-Hinweis ───────────────────────── */
  function starten() {
    if (!darfZeigen()) return;
    zaehlen();
    setTimeout(function () { if (document.body) bauen(); }, AKTION.verzoegerungMs);
  }

  function aufConsentWarten() {
    if (!darfZeigen()) return;
    if (ls("1am_cookie_consent")) { starten(); return; }
    var fertig = false;
    function los() { if (fertig) return; fertig = true; clearInterval(timer); starten(); }
    window.addEventListener("cookieConsentUpdate", los);
    var timer = setInterval(function () { if (ls("1am_cookie_consent")) los(); }, 600);
    setTimeout(function () { clearInterval(timer); }, 120000);   // nach 2 Min aufgeben
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", aufConsentWarten);
  else aufConsentWarten();
})();
