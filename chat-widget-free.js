/* 1A Motor – Motor-Finder (kostenloses Widget, KEINE KI-API)
 * Einbinden:  <script src="chat-widget-free.js" defer></script>
 * Durchsucht direkt die Supabase-Listings. Kein API-Key, keine Kosten.
 */
(function () {
  "use strict";

  var SUPABASE_URL = "https://xaqfptumjkmulobdbfid.supabase.co";
  var PUBLIC_KEY = "sb_publishable_FK-FiDrd5gjFEj7LxVPZIg_5WXkNvgG";
  var SITE = "https://1amotor.de";

  var GREETING =
    "Moin! 👋 Ich helf dir, den passenden Motor zu finden. Schreib einfach was du suchst – z.B. \u201eAu\u00dfenbordmotor bis 2000\u20ac\u201c oder \u201eDeutz Diesel\u201c. Oder frag: \u201eWie kann ich selbst inserieren?\u201c";

  // Kategorien werden einmalig geladen (für Kategorie-Erkennung)
  var categories = [];
  var busy = false;

  var STOPWORDS = [
    "ich","suche","brauche","einen","eine","einer","ein","der","die","das",
    "und","oder","mit","für","fuer","bis","unter","max","maximal","höchstens",
    "hoechstens","um","zu","in","am","auf","von","bitte","hallo","hi","hey",
    "moin","motor","motoren","gebraucht","neu","günstig","guenstig","billig",
    "€","eur","euro","preis","kaufen","finden","gibt","es","habt","ihr","noch",
  ];

  // ---- Styles (identisch zum KI-Widget) ------------------------------------
  var css = `
  .mochat-fab{position:fixed;right:20px;bottom:20px;z-index:99998;width:60px;height:60px;border:none;border-radius:50%;
    background:linear-gradient(135deg,var(--blue,#1a5fa8),var(--blue2,#2176c7));color:#fff;cursor:pointer;
    box-shadow:0 8px 24px rgba(13,27,42,.28);display:flex;align-items:center;justify-content:center;
    transition:transform .18s ease,box-shadow .18s ease;font-family:inherit}
  .mochat-fab:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(13,27,42,.34)}
  .mochat-fab svg{width:28px;height:28px}
  .mochat-fab .mochat-dot{position:absolute;top:6px;right:6px;width:12px;height:12px;border-radius:50%;
    background:#4da6ff;border:2px solid #fff}
  .mochat-panel{position:fixed;right:20px;bottom:92px;z-index:99999;width:380px;max-width:calc(100vw - 32px);
    height:560px;max-height:calc(100vh - 120px);background:#fff;border:1px solid var(--border,#e0e9f2);
    border-radius:16px;box-shadow:0 20px 60px rgba(13,27,42,.28);display:none;flex-direction:column;overflow:hidden;
    font-family:'Outfit',Arial,sans-serif}
  .mochat-panel.mochat-open{display:flex;animation:mochatIn .2s ease}
  @keyframes mochatIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
  .mochat-head{background:var(--navy,#1b2d42);color:#fff;padding:16px 18px;display:flex;align-items:center;gap:12px;flex-shrink:0}
  .mochat-head .mochat-av{width:36px;height:36px;border-radius:10px;background:linear-gradient(145deg,var(--blue,#1a5fa8),var(--sky,#4da6ff));
    display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .mochat-head .mochat-av svg{width:20px;height:20px;color:#fff}
  .mochat-head h4{margin:0;font-size:15px;font-weight:800}
  .mochat-head p{margin:2px 0 0;font-size:12px;color:rgba(255,255,255,.7)}
  .mochat-close{margin-left:auto;background:transparent;border:none;color:rgba(255,255,255,.8);cursor:pointer;
    font-size:22px;line-height:1;padding:4px}
  .mochat-close:hover{color:#fff}
  .mochat-body{flex:1;overflow-y:auto;padding:16px;background:var(--bg,#f4f7fb);display:flex;flex-direction:column;gap:10px}
  .mochat-msg{max-width:85%;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.5;word-wrap:break-word}
  .mochat-bot{align-self:flex-start;background:#fff;color:var(--dark,#0d1b2a);border:1px solid var(--border,#e0e9f2);border-bottom-left-radius:4px}
  .mochat-user{align-self:flex-end;background:var(--blue,#1a5fa8);color:#fff;border-bottom-right-radius:4px}
  .mochat-msg a{color:var(--blue2,#2176c7);font-weight:700;text-decoration:none}
  .mochat-user a{color:#fff;text-decoration:underline}
  .mochat-msg a:hover{text-decoration:underline}
  .mochat-card{display:block;background:#fff;border:1px solid var(--border,#e0e9f2);border-radius:12px;padding:10px 12px;
    margin-top:6px;text-decoration:none;transition:border-color .15s,transform .15s}
  .mochat-card:hover{border-color:var(--blue2,#2176c7);transform:translateY(-1px)}
  .mochat-card .mc-title{font-size:14px;font-weight:700;color:var(--dark,#0d1b2a);margin:0 0 2px}
  .mochat-card .mc-meta{font-size:12px;color:#5a6b7d;margin:0}
  .mochat-card .mc-price{font-size:14px;font-weight:800;color:var(--blue,#1a5fa8);margin-top:4px}
  .mochat-typing{align-self:flex-start;background:#fff;border:1px solid var(--border,#e0e9f2);border-radius:14px;
    border-bottom-left-radius:4px;padding:12px 16px;display:flex;gap:4px}
  .mochat-typing span{width:7px;height:7px;border-radius:50%;background:var(--sky,#4da6ff);animation:mochatBounce 1.2s infinite}
  .mochat-typing span:nth-child(2){animation-delay:.2s}
  .mochat-typing span:nth-child(3){animation-delay:.4s}
  @keyframes mochatBounce{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-5px);opacity:1}}
  .mochat-foot{flex-shrink:0;padding:12px;border-top:1px solid var(--border,#e0e9f2);background:#fff;display:flex;gap:8px}
  .mochat-foot input{flex:1;border:1.5px solid var(--border,#e0e9f2);border-radius:10px;padding:10px 12px;font-size:14px;
    font-family:inherit;color:var(--dark,#0d1b2a);outline:none;min-width:0}
  .mochat-foot input:focus{border-color:var(--blue2,#2176c7)}
  .mochat-send{border:none;border-radius:10px;background:var(--navy,#1b2d42);color:#fff;width:44px;flex-shrink:0;cursor:pointer;
    display:flex;align-items:center;justify-content:center}
  .mochat-send:hover{background:var(--blue,#1a5fa8)}
  .mochat-send:disabled{opacity:.5;cursor:not-allowed}
  .mochat-send svg{width:20px;height:20px}
  @media(max-width:480px){
    .mochat-panel{right:8px;left:8px;bottom:84px;width:auto;height:calc(100vh - 100px)}
    .mochat-fab{right:16px;bottom:16px}
  }`;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // ---- Text-Analyse --------------------------------------------------------
  function parsePreisMax(text) {
    // "bis 2000", "unter 2.000 €", "max 2000 euro"
    var m = text.match(/(?:bis|unter|max(?:imal)?|höchstens|hoechstens)\s*([\d.]+)\s*(?:€|eur|euro)?/i);
    if (!m) m = text.match(/([\d.]+)\s*(?:€|eur|euro)/i); // "2000€"
    if (!m) return null;
    var n = parseInt(m[1].replace(/\./g, ""), 10);
    return isFinite(n) && n > 0 ? n : null;
  }

  function matchKategorie(text) {
    var low = text.toLowerCase();
    for (var i = 0; i < categories.length; i++) {
      var name = (categories[i].name || "").toLowerCase();
      if (!name) continue;
      if (low.indexOf(name) !== -1) return categories[i].name;
      var first = name.split(/[\s-]/)[0];
      if (first.length > 3 && low.indexOf(first) !== -1) return categories[i].name;
    }
    return null;
  }

  function extractTokens(text, kategorie) {
    var cleaned = text.toLowerCase()
      .replace(/[\d.]+\s*(?:€|eur|euro)?/g, " ")
      .replace(/[^\wäöüß\s-]/gi, " ");
    if (kategorie) cleaned = cleaned.split(kategorie.toLowerCase()).join(" ");
    var words = cleaned.split(/\s+/).filter(function (w) {
      return w.length > 2 && STOPWORDS.indexOf(w) === -1;
    });
    // Duplikate raus, max. 4 Tokens
    var seen = {}, out = [];
    for (var i = 0; i < words.length && out.length < 4; i++) {
      if (!seen[words[i]]) { seen[words[i]] = 1; out.push(words[i]); }
    }
    return out;
  }

  // ---- Supabase-Suche (REST) ----------------------------------------------
  async function searchListings(tokens, kategorie, preisMax) {
    var p = new URLSearchParams();
    var sel = kategorie ? "categories!inner(name)" : "categories(name)";
    p.set("select", "id,title,manufacturer,model,condition,price,location," + sel);
    p.set("status", "eq.Freigegeben");
    p.set("order", "created_at.desc");
    p.set("limit", "6");

    if (tokens.length) {
      var ors = [];
      tokens.forEach(function (t) {
        var s = t.replace(/[*(),]/g, "");
        if (s) {
          ors.push("title.ilike.*" + s + "*");
          ors.push("manufacturer.ilike.*" + s + "*");
          ors.push("model.ilike.*" + s + "*");
        }
      });
      if (ors.length) p.set("or", "(" + ors.join(",") + ")");
    }
    if (kategorie) {
      var k = kategorie.replace(/[*(),]/g, "");
      p.set("categories.name", "ilike.*" + k + "*");
    }
    if (preisMax != null) p.set("price", "lte." + preisMax);

    var res = await fetch(SUPABASE_URL + "/rest/v1/listings?" + p.toString(), {
      headers: { apikey: PUBLIC_KEY, Authorization: "Bearer " + PUBLIC_KEY },
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  }

  async function loadCategories() {
    try {
      var res = await fetch(
        SUPABASE_URL + "/rest/v1/categories?select=id,name,slug&order=name.asc",
        { headers: { apikey: PUBLIC_KEY, Authorization: "Bearer " + PUBLIC_KEY } }
      );
      if (res.ok) categories = (await res.json()) || [];
    } catch (e) { /* egal – Kategorie-Erkennung ist optional */ }
  }

  // ---- Intent-Erkennung & Antworten ---------------------------------------
  function detectIntent(text) {
    var t = text.toLowerCase();
    if (/^\s*(hallo|hi|hey|moin|servus|guten tag)\b/.test(t)) return "gruss";
    if (/(inserier|anbiet|verkauf|einstell|reinstell|anzeige\s*erstell)/.test(t)) return "verkaufen";
    if (/(kontakt|anfrage|erreich|melden|anschreib|wie.*kauf|zahlung|bezahl)/.test(t)) return "kontakt";
    if (/(versand|liefer|transport|verschick|abhol)/.test(t)) return "versand";
    if (/(danke|super|top|passt|alles klar)\b/.test(t)) return "danke";
    return "suche";
  }

  async function respond(text) {
    var intent = detectIntent(text);

    if (intent === "gruss")
      return { text: "Moin! Wonach suchst du? Schreib z.B. \u201eIndustriemotor\u201c oder \u201eBMW N57 bis 3000\u20ac\u201c." };
    if (intent === "verkaufen")
      return { text: "Klar! Du kannst kostenlos inserieren – leg einfach ein Inserat an:\n[\u2192 Jetzt inserieren](" + SITE + "/anzeige-erstellen.html)\n(Ein kostenloser Account reicht.)" };
    if (intent === "kontakt")
      return { text: "Ganz einfach: \u00d6ffne das jeweilige Inserat und nutze dort die Anfrage-Funktion. Deine Nachricht geht direkt an den Verk\u00e4ufer, Kauf und Zahlung wickelt ihr dann untereinander ab." };
    if (intent === "versand")
      return { text: "Versand und Abholung regelt jeder Verk\u00e4ufer selbst – die Details stehen im Inserat oder du fragst \u00fcber die Anfrage-Funktion direkt nach." };
    if (intent === "danke")
      return { text: "Gerne! Wenn du noch was suchst, sag einfach Bescheid. 👍" };

    // --- Suche ---
    var preisMax = parsePreisMax(text);
    var kategorie = matchKategorie(text);
    var tokens = extractTokens(text, kategorie);

    var rows;
    try {
      rows = await searchListings(tokens, kategorie, preisMax);
    } catch (e) {
      return { text: "Die Suche h\u00e4ngt gerade – bitte gleich nochmal versuchen." };
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      var tipp = "Dazu hab ich aktuell leider nichts gefunden.";
      if (preisMax) tipp += " Vielleicht ist dein Preislimit zu niedrig?";
      tipp += "\nSchau mal in die [gesamte Suche](" + SITE + "/suche.html) oder gib ein Gesuch auf.";
      return { text: tipp };
    }

    var intro = rows.length === 1 ? "Das hab ich gefunden:" : "Ich hab " + rows.length + " passende Inserate gefunden:";
    return { text: intro, cards: rows };
  }

  // ---- DOM -----------------------------------------------------------------
  var panel, body, input, sendBtn;

  function build() {
    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    var fab = document.createElement("button");
    fab.className = "mochat-fab";
    fab.setAttribute("aria-label", "Motor-Finder öffnen");
    fab.innerHTML =
      '<span class="mochat-dot"></span>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
    fab.addEventListener("click", toggle);
    document.body.appendChild(fab);

    panel = document.createElement("div");
    panel.className = "mochat-panel";
    panel.innerHTML =
      '<div class="mochat-head">' +
      '<div class="mochat-av"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>' +
      '<div><h4>Motor-Finder</h4><p>Durchsucht alle Inserate</p></div>' +
      '<button class="mochat-close" aria-label="Schließen">&times;</button>' +
      "</div>" +
      '<div class="mochat-body" id="mochat-body"></div>' +
      '<div class="mochat-foot">' +
      '<input id="mochat-input" type="text" placeholder="Nach Motor suchen…" autocomplete="off">' +
      '<button class="mochat-send" id="mochat-send" aria-label="Senden"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>' +
      "</div>";
    document.body.appendChild(panel);

    body = panel.querySelector("#mochat-body");
    input = panel.querySelector("#mochat-input");
    sendBtn = panel.querySelector("#mochat-send");

    panel.querySelector(".mochat-close").addEventListener("click", toggle);
    sendBtn.addEventListener("click", send);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });

    addBot(GREETING);
    loadCategories();
  }

  function toggle() {
    panel.classList.toggle("mochat-open");
    if (panel.classList.contains("mochat-open"))
      setTimeout(function () { input.focus(); }, 100);
  }

  function renderText(text) {
    var out = esc(text);
    out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, function (_m, l, u) {
      return '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + l + "</a>";
    });
    return out.replace(/\n/g, "<br>");
  }

  function addUser(text) {
    var el = document.createElement("div");
    el.className = "mochat-msg mochat-user";
    el.textContent = text;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
  }

  function addBot(text, cards) {
    var el = document.createElement("div");
    el.className = "mochat-msg mochat-bot";
    el.innerHTML = renderText(text);

    if (cards && cards.length) {
      cards.forEach(function (r) {
        var cat = r.categories && r.categories.name ? r.categories.name : "";
        var meta = [r.manufacturer, r.model, r.location].filter(Boolean).join(" · ") || cat;
        var price = r.price != null
          ? Number(r.price).toLocaleString("de-DE") + " €"
          : "Preis auf Anfrage";
        var a = document.createElement("a");
        a.className = "mochat-card";
        a.href = SITE + "/listing-detail.html?id=" + encodeURIComponent(r.id);
        a.target = "_blank";
        a.rel = "noopener";
        a.innerHTML =
          '<p class="mc-title">' + esc(r.title || "Inserat") + "</p>" +
          '<p class="mc-meta">' + esc(meta) + "</p>" +
          '<p class="mc-price">' + esc(price) + "</p>";
        el.appendChild(a);
      });
    }
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
  }

  function showTyping() {
    var t = document.createElement("div");
    t.className = "mochat-typing";
    t.id = "mochat-typing";
    t.innerHTML = "<span></span><span></span><span></span>";
    body.appendChild(t);
    body.scrollTop = body.scrollHeight;
  }
  function hideTyping() {
    var t = document.getElementById("mochat-typing");
    if (t) t.remove();
  }

  async function send() {
    var text = (input.value || "").trim();
    if (!text || busy) return;
    input.value = "";
    busy = true;
    sendBtn.disabled = true;

    addUser(text);
    showTyping();
    await new Promise(function (r) { setTimeout(r, 350); }); // kurzer „Tipp"-Effekt

    try {
      var result = await respond(text);
      hideTyping();
      addBot(result.text, result.cards);
    } catch (e) {
      hideTyping();
      addBot("Ups, da ist was schiefgelaufen. Versuch's gleich nochmal.");
    } finally {
      busy = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", build);
  else build();
})();
