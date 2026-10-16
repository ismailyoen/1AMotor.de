/**
 * 1A Motor — mobile.js  (v2 · App-Oberfläche)
 * ----------------------------------------------------------------
 * Ersetzt die alte mobile.js komplett. Arbeitet nur bis 900px Breite;
 * am Desktop wird alles wieder abgebaut und die Seite bleibt wie sie ist.
 *
 *  1. App-Header: Suchfeld-Pille + Menü-Knopf (alter Hamburger bleibt versteckt)
 *  2. Bottom-Tabbar: Start · Suche · Inserieren · Nachrichten · Konto
 *  3. Menü als Bottom-Sheet (nutzt das vorhandene #mob-nav, inkl. Sprachwahl)
 *  4. Filter (#sidebar) als Bottom-Sheet, ersetzt toggleSidebar() mobil
 *  5. Vollbild-Suche mit Kategorien + letzten Suchen
 *  6. Wisch-Galerie auf der Inseratsdetailseite
 *  7. PWA: Manifest/Theme-Color einbinden, Service Worker, Install-Hinweis
 *
 * Kein HTML muss angepasst werden — Datei einfach austauschen.
 */
(function () {
  "use strict";
  if (window.__maLoaded) return;
  window.__maLoaded = true;

  var MQ = window.matchMedia("(max-width: 900px)");
  var D = document;
  var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  if (page === "" || page === "/") page = "index.html";

  /* ── Texte (de/en/fr/tr, folgt i18n.js) ──────────────────────── */
  var TXT = {
    de: { search: "Motor, Hersteller, Teilenummer…", start: "Start", find: "Suche", sell: "Inserieren", msgs: "Nachrichten", acc: "Konto",
          menu: "Menü", filter: "Filter & Kategorien", show: "Ergebnisse anzeigen", reset: "Zurücksetzen", cats: "Kategorien",
          recent: "Zuletzt gesucht", lang: "Sprache", cancel: "Abbrechen", instT: "1A Motor als App", instS: "Schneller öffnen, direkt vom Startbildschirm.",
          instY: "Installieren", instIos: "Tippe auf Teilen ⎋ und dann „Zum Home-Bildschirm“.", ok: "OK", close: "Schließen" },
    en: { search: "Engine, manufacturer, part no.…", start: "Home", find: "Search", sell: "Sell", msgs: "Messages", acc: "Account",
          menu: "Menu", filter: "Filters & categories", show: "Show results", reset: "Reset", cats: "Categories",
          recent: "Recent searches", lang: "Language", cancel: "Cancel", instT: "1A Motor as an app", instS: "Open faster, right from your home screen.",
          instY: "Install", instIos: "Tap Share ⎋, then “Add to Home Screen”.", ok: "OK", close: "Close" },
    fr: { search: "Moteur, fabricant, référence…", start: "Accueil", find: "Recherche", sell: "Vendre", msgs: "Messages", acc: "Compte",
          menu: "Menu", filter: "Filtres & catégories", show: "Voir les résultats", reset: "Réinitialiser", cats: "Catégories",
          recent: "Recherches récentes", lang: "Langue", cancel: "Annuler", instT: "1A Motor en application", instS: "Ouvrez plus vite depuis l’écran d’accueil.",
          instY: "Installer", instIos: "Touchez Partager ⎋ puis « Sur l’écran d’accueil ».", ok: "OK", close: "Fermer" },
    tr: { search: "Motor, üretici, parça no…", start: "Ana sayfa", find: "Ara", sell: "İlan ver", msgs: "Mesajlar", acc: "Hesap",
          menu: "Menü", filter: "Filtreler ve kategoriler", show: "Sonuçları göster", reset: "Sıfırla", cats: "Kategoriler",
          recent: "Son aramalar", lang: "Dil", cancel: "Vazgeç", instT: "Uygulama olarak 1A Motor", instS: "Ana ekrandan daha hızlı açın.",
          instY: "Yükle", instIos: "Paylaş ⎋ simgesine, sonra „Ana Ekrana Ekle“ye dokunun.", ok: "Tamam", close: "Kapat" }
  };
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function lang() {
    var l = (window.I18n && (window.I18n.lang || (window.I18n.getLang && window.I18n.getLang()))) || ls("1amotor_lang") || D.documentElement.lang || "de";
    l = String(l).slice(0, 2);
    return TXT[l] ? l : "de";
  }
  function t(k) { return TXT[lang()][k]; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function el(tag, cls, html) { var n = D.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }

  var ICON = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.8A8 8 0 1 1 21 12z"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>'
  };

  /* ── Overlay-Steuerung (ein offenes Sheet zur Zeit, iOS-sicherer Scroll-Lock) */
  var backdrop, openSheet = null, scrollY = 0;
  function lock() {
    scrollY = window.scrollY;
    D.body.style.position = "fixed"; D.body.style.top = -scrollY + "px"; D.body.style.left = "0"; D.body.style.right = "0";
    D.body.classList.add("ma-locked");
  }
  function unlock() {
    D.body.style.position = ""; D.body.style.top = ""; D.body.style.left = ""; D.body.style.right = "";
    D.body.classList.remove("ma-locked");
    window.scrollTo(0, scrollY);
  }
  function open(node) {
    if (openSheet === node) return;
    if (openSheet) close(true);
    openSheet = node;
    lock();
    node.classList.add("open");
    if (node.classList.contains("ma-sheet")) backdrop.classList.add("open");
    history.pushState({ ma: 1 }, "");
  }
  function close(silent) {
    if (!openSheet) return;
    openSheet.classList.remove("open");
    backdrop.classList.remove("open");
    var was = openSheet; openSheet = null;
    unlock();
    if (was === filterSheet) restoreSidebar();
    if (!silent && history.state && history.state.ma) history.back();
  }
  /* Zurück-Taste (Android) schließt erst das Sheet statt die Seite */
  window.addEventListener("popstate", function () { if (openSheet) close(true); });
  D.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

  function sheet(cls, title) {
    var s = el("div", "ma-sheet " + cls);
    s.setAttribute("role", "dialog"); s.setAttribute("aria-modal", "true"); s.setAttribute("aria-label", title);
    s.innerHTML = '<div class="ma-sheet-grip"></div><div class="ma-sheet-head"><b>' + esc(title) + '</b>' +
      '<button class="ma-icon-btn" type="button" aria-label="' + esc(t("close")) + '">' + ICON.close + '</button></div><div class="ma-sheet-body"></div>';
    s.querySelector(".ma-icon-btn").addEventListener("click", function () { close(); });
    dragToClose(s);
    D.body.appendChild(s);
    return s;
  }
  function dragToClose(s) {
    var y0 = null, dy = 0, grip = s.querySelector(".ma-sheet-grip"), head = s.querySelector(".ma-sheet-head");
    function start(e) { y0 = e.touches[0].clientY; dy = 0; s.style.transition = "none"; }
    function move(e) { if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); s.style.transform = "translateY(" + dy + "px)"; }
    function end() { if (y0 == null) return; s.style.transition = ""; s.style.transform = ""; if (dy > 90) close(); y0 = null; }
    [grip, head].forEach(function (h) { h.addEventListener("touchstart", start, { passive: true }); h.addEventListener("touchmove", move, { passive: true }); h.addEventListener("touchend", end); });
  }

  /* ── 1. App-Header ──────────────────────────────────────────── */
  var headerBits = [];
  function buildHeader() {
    var inner = D.querySelector(".header .header-inner");
    if (!inner || inner.querySelector(".ma-search-pill")) return;
    var pill = el("button", "ma-search-pill", ICON.search + "<span>" + esc(t("search")) + "</span>");
    pill.type = "button"; pill.setAttribute("aria-label", t("find"));
    pill.addEventListener("click", openSearch);
    var mb = el("button", "ma-icon-btn ma-menu-btn", ICON.menu);
    mb.type = "button"; mb.setAttribute("aria-label", t("menu"));
    mb.addEventListener("click", function () { open(menuSheet); });
    var logo = inner.querySelector(".logo");
    if (logo && logo.nextSibling) inner.insertBefore(pill, logo.nextSibling); else inner.appendChild(pill);
    inner.appendChild(mb);
    headerBits.push(pill, mb);
  }

  /* ── 2. Tabbar ──────────────────────────────────────────────── */
  var tabbar;
  function buildTabbar() {
    if (D.querySelector(".ma-tabbar")) return;
    var on = function (list) { return list.indexOf(page) !== -1 ? " on" : ""; };
    tabbar = el("nav", "ma-tabbar");
    tabbar.setAttribute("aria-label", "Hauptnavigation");
    tabbar.innerHTML =
      '<a class="ma-tab' + on(["index.html"]) + '" href="index.html">' + ICON.home + "<span>" + esc(t("start")) + "</span></a>" +
      '<a class="ma-tab' + on(["suche.html", "kategorie.html"]) + '" href="suche.html">' + ICON.search + "<span>" + esc(t("find")) + "</span></a>" +
      '<a class="ma-tab" href="anzeige-erstellen.html" aria-label="' + esc(t("sell")) + '"><span class="ma-tab-fab">' + ICON.plus + "</span><span>" + esc(t("sell")) + "</span></a>" +
      '<a class="ma-tab' + on(["meine-anfragen.html", "anfragen.html"]) + '" href="meine-anfragen.html">' + ICON.chat + "<span>" + esc(t("msgs")) + "</span></a>" +
      '<a class="ma-tab' + on(["dashboard.html", "meine-anzeigen.html", "profil.html", "login.html", "registrieren.html"]) + '" href="dashboard.html">' + ICON.user + "<span>" + esc(t("acc")) + "</span></a>";
    D.body.appendChild(tabbar);
  }

  /* ── 3. Menü-Sheet ──────────────────────────────────────────── */
  var menuSheet, navHome = null;
  function buildMenu() {
    if (menuSheet) return;
    menuSheet = sheet("ma-menu-sheet", t("menu"));
    var body = menuSheet.querySelector(".ma-sheet-body");
    var nav = D.getElementById("mob-nav") || D.getElementById("mobile-nav");
    if (nav) {
      navHome = { parent: nav.parentNode, next: nav.nextSibling };
      nav.classList.remove("open");
      body.appendChild(nav);
      nav.addEventListener("click", function (e) { var a = e.target.closest("a"); if (a && a.getAttribute("href") && a.getAttribute("href") !== "#") close(true); });
    }
    body.appendChild(el("div", "ma-sec-label", esc(t("lang"))));
    var row = el("div", "ma-lang");
    [["de", "DE"], ["en", "EN"], ["fr", "FR"], ["tr", "TR"]].forEach(function (p) {
      var b = el("button", p[0] === lang() ? "on" : "", p[1]); b.type = "button";
      b.addEventListener("click", function () {
        if (window.I18n && typeof window.I18n.setLang === "function") window.I18n.setLang(p[0]);
        else { ls("1amotor_lang", p[0]); location.reload(); }
        Array.prototype.forEach.call(row.children, function (c) { c.classList.toggle("on", c === b); });
        setTimeout(relabel, 50);
      });
      row.appendChild(b);
    });
    body.appendChild(row);
  }

  /* ── 4. Filter-Sheet (#sidebar wird nur geliehen, nicht kopiert) ─ */
  var filterSheet, sbHome = null, sidebar = null;
  function findSidebar() {
    var s = D.getElementById("sidebar") || D.querySelector(".filter-sidebar") || D.querySelector(".se-filters");
    /* Navigations-Sidebars (Dashboard, Konto) bleiben wie sie sind */
    if (s && (s.closest(".layout,.dash-layout,.page-layout") || /dashboard|profil|meine-|anfragen/.test(page))) return null;
    return s;
  }
  function buildFilter() {
    sidebar = findSidebar();
    var btn = D.getElementById("mob-filter-btn") || D.querySelector(".mob-filter-btn");
    if (!sidebar || filterSheet) return;
    sidebar.classList.add("ma-sheeted");
    if (!btn) {                                   /* Seite ohne eigenen Filter-Knopf → einen erzeugen */
      btn = el("button", "mob-filter-btn ma-made", esc(t("filter"))); btn.type = "button";
      var grid = D.querySelector("#search-listing-grid,.se-grid,.listing-grid");
      var host = grid ? (grid.closest(".panel,.se-results,.results") || grid) : sidebar;
      host.parentNode.insertBefore(btn, host);
    }
    filterSheet = sheet("ma-filter-sheet", t("filter"));
    var foot = el("div", "ma-sheet-foot");
    var reset = el("button", "ma-btn ma-btn-ghost", esc(t("reset"))); reset.type = "button";
    var go = el("button", "ma-btn ma-btn-primary", esc(t("show"))); go.type = "button";
    reset.addEventListener("click", function () {
      sidebar.querySelectorAll("input[type=checkbox],input[type=radio]").forEach(function (i) { if (i.checked) { i.checked = false; i.dispatchEvent(new Event("change", { bubbles: true })); } });
      sidebar.querySelectorAll("input[type=number],input[type=text],input[type=search]").forEach(function (i) { if (i.value) { i.value = ""; i.dispatchEvent(new Event("input", { bubbles: true })); } });
      sidebar.querySelectorAll("select").forEach(function (s) { if (s.selectedIndex > 0) { s.selectedIndex = 0; s.dispatchEvent(new Event("change", { bubbles: true })); } });
    });
    go.addEventListener("click", function () {
      var apply = sidebar.querySelector("[id*=apply],.filter-apply,.apply-btn,button[type=submit]");
      if (apply) apply.click();
      close();
      var grid = D.querySelector(".listing-grid,#search-listing-grid,.se-grid");
      if (grid) setTimeout(function () { grid.scrollIntoView({ behavior: "smooth", block: "start" }); }, 250);
    });
    foot.appendChild(reset); foot.appendChild(go); filterSheet.appendChild(foot);
    if (btn && !btn.querySelector("#mob-filter-label")) btn.textContent = t("filter");
  }
  function openFilter() {
    if (!filterSheet || !sidebar) return;
    sbHome = { parent: sidebar.parentNode, next: sidebar.nextSibling };
    sidebar.classList.remove("open");
    sidebar.classList.add("ma-in-sheet");
    filterSheet.querySelector(".ma-sheet-body").appendChild(sidebar);
    open(filterSheet);
  }
  function restoreSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove("ma-in-sheet");
    if (sbHome && sidebar.parentNode !== sbHome.parent) sbHome.parent.insertBefore(sidebar, sbHome.next);
  }
  /* Klicks auf alte Knöpfe abfangen, bevor Inline-Handler (onclick=toggleSidebar(), alter Hamburger) feuern */
  window.addEventListener("click", function (e) {
    if (!MQ.matches) return;
    var f = e.target.closest && e.target.closest("#mob-filter-btn,.mob-filter-btn");
    var m = e.target.closest && e.target.closest("#mob-toggle,.mob-toggle");
    if (!f && !m) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (f) openFilter(); else open(menuSheet);
  }, true);

  /* ── 5. Vollbild-Suche ──────────────────────────────────────── */
  var searchBox;
  function buildSearch() {
    if (searchBox) return;
    searchBox = el("div", "ma-search");
    searchBox.setAttribute("role", "dialog"); searchBox.setAttribute("aria-modal", "true");
    searchBox.innerHTML =
      '<form class="ma-search-top" role="search">' +
        '<button type="button" class="ma-icon-btn ma-s-back" aria-label="' + esc(t("cancel")) + '">' + ICON.back + "</button>" +
        '<label class="ma-search-field">' + ICON.search + '<input type="search" enterkeyhint="search" autocomplete="off" placeholder="' + esc(t("search")) + '"></label>' +
      "</form>" +
      '<div class="ma-search-body"><div class="ma-sec-label ma-r-l">' + esc(t("recent")) + '</div><div class="ma-recent"></div>' +
      '<div class="ma-sec-label">' + esc(t("cats")) + '</div><div class="ma-chips"></div></div>';
    D.body.appendChild(searchBox);
    var form = searchBox.querySelector("form"), input = searchBox.querySelector("input");
    searchBox.querySelector(".ma-s-back").addEventListener("click", function () { close(); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = input.value.trim();
      if (q) {
        var r = recent().filter(function (x) { return x.toLowerCase() !== q.toLowerCase(); });
        r.unshift(q); ls("ma_recent", JSON.stringify(r.slice(0, 6)));
      }
      location.href = q ? "suche.html?q=" + encodeURIComponent(q) : "suche.html";
    });
  }
  function recent() { try { return JSON.parse(ls("ma_recent") || "[]"); } catch (e) { return []; } }
  function openSearch() {
    var rc = searchBox.querySelector(".ma-recent"), list = recent();
    rc.innerHTML = list.map(function (q) { return '<a href="suche.html?q=' + encodeURIComponent(q) + '">' + esc(q) + "</a>"; }).join("");
    searchBox.querySelector(".ma-r-l").style.display = list.length ? "" : "none";
    /* Kategorien aus dem vorhandenen Auswahlfeld bzw. der Kategorie-Leiste übernehmen */
    var chips = [], sel = D.getElementById("home-category-select");
    if (sel) Array.prototype.forEach.call(sel.options, function (o) { if (o.value) chips.push(o.value); });
    if (!chips.length) D.querySelectorAll("#home-category-links a").forEach(function (a) { var c = new URLSearchParams(a.search).get("category"); if (c) chips.push(c); });
    searchBox.querySelector(".ma-chips").innerHTML = chips.slice(0, 40).map(function (c) {
      var label = window.I18n && window.I18n.term ? window.I18n.term(c) : c;
      return '<a class="ma-chip" href="suche.html?category=' + encodeURIComponent(c) + '">' + esc(label) + "</a>";
    }).join("");
    open(searchBox);
    setTimeout(function () { searchBox.querySelector("input").focus(); }, 60);
  }

  /* ── 6. Wisch-Galerie (Detailseite) ─────────────────────────── */
  function swipeGallery() {
    var img = D.getElementById("main-image") || D.querySelector(".main-img-area,.ld-gallery-main");
    if (!img || img.__maSwipe) return;
    img.__maSwipe = true;
    var x0 = null;
    img.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    img.addEventListener("touchend", function (e) {
      if (x0 == null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) < 40) return;
      var btn = D.querySelector(dx < 0 ? ".gal-next,.ld-next,[data-gallery-next]" : ".gal-prev,.ld-prev,[data-gallery-prev]");
      if (btn) return btn.click();
      var thumbs = D.querySelectorAll(".thumb,.ld-thumb"), act = D.querySelector(".thumb.active,.ld-thumb.active");
      var i = Array.prototype.indexOf.call(thumbs, act), n = thumbs[i + (dx < 0 ? 1 : -1)];
      if (n) n.click();
    }, { passive: true });
  }

  /* ── 7. PWA ─────────────────────────────────────────────────── */
  function headTag(sel, tag, attrs) {
    if (D.head.querySelector(sel)) return;
    var n = D.createElement(tag); Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); }); D.head.appendChild(n);
  }
  function pwaHead() {
    headTag('link[rel="manifest"]', "link", { rel: "manifest", href: "manifest.webmanifest" });
    headTag('meta[name="theme-color"]', "meta", { name: "theme-color", content: "#1b2d42" });
    headTag('meta[name="apple-mobile-web-app-capable"]', "meta", { name: "apple-mobile-web-app-capable", content: "yes" });
    headTag('meta[name="mobile-web-app-capable"]', "meta", { name: "mobile-web-app-capable", content: "yes" });
    headTag('meta[name="apple-mobile-web-app-status-bar-style"]', "meta", { name: "apple-mobile-web-app-status-bar-style", content: "default" });
    headTag('meta[name="apple-mobile-web-app-title"]', "meta", { name: "apple-mobile-web-app-title", content: "1A Motor" });
    var ati = D.head.querySelector('link[rel="apple-touch-icon"]');
    if (ati) ati.setAttribute("href", "app-icon-180.png"); else headTag('link[rel="apple-touch-icon"]', "link", { rel: "apple-touch-icon", href: "app-icon-180.png" });
    var vp = D.head.querySelector('meta[name="viewport"]');
    if (vp && vp.content.indexOf("viewport-fit") === -1) vp.content += ", viewport-fit=cover";
    if ("serviceWorker" in navigator && location.protocol === "https:") {
      window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
    }
  }
  var deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferredPrompt = e; setTimeout(installHint, 4000); });
  function standalone() { return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; }
  function installHint() {
    if (!MQ.matches || standalone() || D.querySelector(".ma-install")) return;
    var last = +ls("ma_install_dismissed") || 0;
    if (Date.now() - last < 14 * 864e5) return;                       // höchstens alle 14 Tage
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
    if (!deferredPrompt && !ios) return;
    var box = el("div", "ma-install",
      '<span class="ma-ico">1A</span><p><b>' + esc(t("instT")) + "</b>" + esc(ios ? t("instIos") : t("instS")) + "</p>" +
      (ios ? "" : '<button class="ma-yes" type="button">' + esc(t("instY")) + "</button>") +
      '<button class="ma-no" type="button" aria-label="' + esc(t("close")) + '">✕</button>');
    D.body.appendChild(box);
    requestAnimationFrame(function () { box.classList.add("show"); });
    function gone() { ls("ma_install_dismissed", String(Date.now())); box.classList.remove("show"); setTimeout(function () { box.remove(); }, 300); }
    box.querySelector(".ma-no").addEventListener("click", gone);
    var y = box.querySelector(".ma-yes");
    if (y) y.addEventListener("click", function () { deferredPrompt.prompt(); deferredPrompt.userChoice.finally(function () { deferredPrompt = null; gone(); }); });
  }

  /* ── Sprache wechseln → Beschriftungen nachziehen ───────────── */
  function relabel() {
    var pill = D.querySelector(".ma-search-pill span"); if (pill) pill.textContent = t("search");
    if (tabbar) { tabbar.remove(); tabbar = null; buildTabbar(); }
    if (searchBox) searchBox.querySelector("input").placeholder = t("search");
  }

  /* ── Auf- und Abbau je nach Breite ──────────────────────────── */
  var built = false;
  function build() {
    if (built) return; built = true;
    D.documentElement.classList.add("ma-app");
    if (!backdrop) {
      backdrop = el("div", "ma-backdrop");
      backdrop.addEventListener("click", function () { close(); });
    }
    D.body.appendChild(backdrop);
    buildHeader(); buildTabbar(); buildMenu(); buildFilter(); buildSearch(); swipeGallery();
    var old = D.getElementById("1am-bottom-nav"); if (old) old.remove();
  }
  function teardown() {
    if (!built) return; built = false;
    close(true);
    D.documentElement.classList.remove("ma-app");
    headerBits.forEach(function (n) { n.remove(); }); headerBits = [];
    var nav = D.getElementById("mob-nav") || D.getElementById("mobile-nav");
    if (nav && navHome) navHome.parent.insertBefore(nav, navHome.next);
    restoreSidebar();
    if (sidebar) sidebar.classList.remove("ma-sheeted");
    D.querySelectorAll(".mob-filter-btn.ma-made").forEach(function (b) { b.remove(); });
    [tabbar, menuSheet, filterSheet, searchBox, backdrop].forEach(function (n) { if (n && n.parentNode) n.parentNode.removeChild(n); });
    tabbar = menuSheet = filterSheet = searchBox = null;
  }
  function sync() { MQ.matches ? build() : teardown(); }

  function init() {
    pwaHead(); sync();
    if (MQ.addEventListener) MQ.addEventListener("change", sync); else MQ.addListener(sync);
    if (window.I18n && typeof window.I18n.setLang === "function" && !window.I18n.__maHooked) {
      var orig = window.I18n.setLang.bind(window.I18n);
      window.I18n.setLang = function (l) { var r = orig(l); setTimeout(relabel, 30); return r; };
      window.I18n.__maHooked = true;
    }
    setTimeout(installHint, 8000);
  }
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", init); else init();
})();
