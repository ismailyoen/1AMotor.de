/* ==========================================================================
   favorites.js — 1A Motor Merkliste
   --------------------------------------------------------------------------
   Gäste:      Favoriten liegen im localStorage ("1amotor-favs").
   Eingeloggt: Favoriten liegen in der Supabase-Tabelle "favorites" und werden
               beim Login einmalig mit den lokalen Favoriten zusammengeführt.

   Einbinden NACH supabase.js:
     <script src="supabase.js"></script>
     <script src="favorites.js?v=1"></script>

   API
     Favs.ready              Promise, erfüllt sobald der erste Abgleich durch ist
     Favs.has(id)            true/false
     Favs.toggle(id)         Promise<boolean>  neuer Zustand
     Favs.add(id) / remove(id)
     Favs.ids()              Array von Listing-IDs
     Favs.count()            Anzahl
     Favs.listings(limit)    Promise<Array>  volle Listing-Datensätze
     Favs.buttonHtml(id)     Herz-Button als HTML-String
     Favs.paint(root)        Zustand aller [data-fav] Buttons neu setzen
     Favs.onChange(fn)       Callback bei jeder Änderung
     Event: document.addEventListener("favs:change", e => e.detail.count)
   ========================================================================== */
(function (global) {
  "use strict";

  var LS_KEY = "1amotor-favs";
  var ids = new Set();
  var user = null;
  var listeners = [];
  var resolveReady;
  var ready = new Promise(function (res) { resolveReady = res; });

  var HEART =
    '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>' +
    '</svg>';

  function sb() { return global.supabaseClient || null; }

  /* ── lokaler Speicher ─────────────────────────────────────────────────── */
  function readLocal() {
    try {
      var raw = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
      return Array.isArray(raw) ? raw.map(String) : [];
    } catch (e) { return []; }
  }
  function writeLocal() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(Array.from(ids))); } catch (e) {}
  }

  /* ── Änderungen bekanntgeben ──────────────────────────────────────────── */
  function emit() {
    var detail = { ids: Array.from(ids), count: ids.size };
    paint(document);
    listeners.forEach(function (fn) { try { fn(detail); } catch (e) {} });
    try {
      document.dispatchEvent(new CustomEvent("favs:change", { detail: detail }));
    } catch (e) {}
  }

  /* ── Buttons und Zähler im DOM aktualisieren ──────────────────────────── */
  function paint(root) {
    root = root || document;
    if (!root.querySelectorAll) return;

    Array.prototype.forEach.call(root.querySelectorAll("[data-fav]"), function (el) {
      var on = ids.has(String(el.getAttribute("data-fav")));
      el.classList.toggle("on", on);
      el.setAttribute("aria-pressed", on ? "true" : "false");
      el.setAttribute("title", on ? "Aus der Merkliste entfernen" : "Zur Merkliste hinzufügen");
      el.setAttribute("aria-label", el.getAttribute("title"));
      var lbl = el.querySelector("[data-fav-label]");
      if (lbl) lbl.textContent = on ? "Gemerkt" : "Merken";
    });

    Array.prototype.forEach.call(root.querySelectorAll("[data-fav-count]"), function (el) {
      el.textContent = String(ids.size);
    });
  }

  /* ── Umschalten ───────────────────────────────────────────────────────── */
  function toggle(id) {
    id = String(id);
    return ids.has(id) ? remove(id) : add(id);
  }

  function add(id) {
    id = String(id);
    if (ids.has(id)) return Promise.resolve(true);
    ids.add(id); writeLocal(); emit();
    if (!user || !sb()) return Promise.resolve(true);

    return sb().from("favorites")
      .upsert({ user_id: user.id, listing_id: id }, { onConflict: "user_id,listing_id" })
      .then(function (r) {
        if (r.error) throw r.error;
        return true;
      })
      .catch(function (err) {
        ids.delete(id); writeLocal(); emit();
        console.warn("[Favs] Konnte nicht gespeichert werden:", err.message || err);
        return false;
      });
  }

  function remove(id) {
    id = String(id);
    if (!ids.has(id)) return Promise.resolve(false);
    ids.delete(id); writeLocal(); emit();
    if (!user || !sb()) return Promise.resolve(false);

    return sb().from("favorites")
      .delete().eq("user_id", user.id).eq("listing_id", id)
      .then(function (r) {
        if (r.error) throw r.error;
        return false;
      })
      .catch(function (err) {
        ids.add(id); writeLocal(); emit();
        console.warn("[Favs] Konnte nicht entfernt werden:", err.message || err);
        return true;
      });
  }

  /* ── Lokale Favoriten ins Konto übernehmen ────────────────────────────── */
  function sync() {
    var client = sb();
    if (!client || !user) return Promise.resolve();

    return client.from("favorites").select("listing_id").eq("user_id", user.id)
      .then(function (res) {
        if (res.error) throw res.error;
        var remote = new Set((res.data || []).map(function (r) { return String(r.listing_id); }));
        var pending = Array.from(ids).filter(function (i) { return !remote.has(i); });

        if (!pending.length) { ids = remote; writeLocal(); emit(); return; }

        var rows = pending.map(function (i) { return { user_id: user.id, listing_id: i }; });
        return client.from("favorites")
          .upsert(rows, { onConflict: "user_id,listing_id" })
          .then(function (ins) {
            if (!ins.error) pending.forEach(function (i) { remote.add(i); });
            ids = remote; writeLocal(); emit();
          });
      })
      .catch(function (err) {
        console.warn("[Favs] Abgleich mit dem Konto fehlgeschlagen:", err.message || err);
      });
  }

  /* ── Volle Listing-Daten zu den gemerkten IDs ─────────────────────────── */
  function listings(limit) {
    return ready.then(function () {
      var arr = Array.from(ids);
      var client = sb();
      if (!arr.length || !client) return [];

      return client.from("listings")
        .select("id,title,manufacturer,model,price,condition,year,location,status,created_at,image_urls,categories(name)")
        .in("id", arr)
        .then(function (res) {
          if (res.error) { console.warn("[Favs] Laden fehlgeschlagen:", res.error.message); return []; }
          var rows = res.data || [];
          rows.sort(function (a, b) {
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
          });
          return limit ? rows.slice(0, limit) : rows;
        });
    });
  }

  /* ── Klicks auf Herzen abfangen (einmalig, global) ────────────────────── */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("[data-fav]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    toggle(btn.getAttribute("data-fav"));
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var btn = e.target.closest && e.target.closest("[data-fav]");
    if (!btn) return;
    e.preventDefault();
    toggle(btn.getAttribute("data-fav"));
  });

  /* ── Merken-Button auf der Detailseite nachrüsten ─────────────────────── */
  function autoDetailButton() {
    if (!/listing-detail/i.test(location.pathname)) return;
    if (document.body.hasAttribute("data-fav-noauto")) return;
    if (document.querySelector("[data-fav]")) return;

    var id = new URLSearchParams(location.search).get("id");
    if (!id) return;

    var css = document.createElement("style");
    css.textContent =
      ".fav-float{position:fixed;right:20px;bottom:20px;z-index:900;display:inline-flex;align-items:center;gap:8px;" +
      "padding:11px 18px;border:1px solid rgba(0,0,0,.08);border-radius:999px;background:#fff;color:#334155;" +
      "font:600 14px/1 'Inter',system-ui,sans-serif;cursor:pointer;box-shadow:0 6px 22px rgba(0,0,0,.18);}" +
      ".fav-float svg{width:18px;height:18px;fill:none;stroke:#64748b;stroke-width:2;}" +
      ".fav-float.on{color:#b91c1c;border-color:rgba(239,68,68,.35);}" +
      ".fav-float.on svg{fill:#ef4444;stroke:#ef4444;}" +
      ".fav-float:focus-visible{outline:2px solid #1c6ea4;outline-offset:2px;}" +
      "@media(max-width:768px){.fav-float{right:14px;bottom:78px;padding:10px 15px;}}";
    document.head.appendChild(css);

    var btn = document.createElement("button");
    btn.className = "fav-float";
    btn.type = "button";
    btn.setAttribute("data-fav", id);
    btn.innerHTML = HEART + '<span data-fav-label>Merken</span>';
    document.body.appendChild(btn);
    paint(document);
  }

  /* ── Start ────────────────────────────────────────────────────────────── */
  function init() {
    readLocal().forEach(function (i) { ids.add(i); });
    paint(document);
    autoDetailButton();

    var client = sb();
    if (!client) { resolveReady(Array.from(ids)); emit(); return; }

    client.auth.getSession()
      .then(function (s) {
        user = (s && s.data && s.data.session && s.data.session.user) || null;
        return user ? sync() : null;
      })
      .catch(function () { user = null; })
      .then(function () {
        resolveReady(Array.from(ids));
        emit();
      });

    client.auth.onAuthStateChange(function (event, session) {
      var next = (session && session.user) || null;
      var prevId = user && user.id;
      user = next;

      if (event === "SIGNED_OUT") {
        ids = new Set();
        writeLocal();
        emit();
        return;
      }
      if (next && next.id !== prevId) sync();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* ── Öffentliche API ──────────────────────────────────────────────────── */
  global.Favs = {
    ready: ready,
    has: function (id) { return ids.has(String(id)); },
    toggle: toggle,
    add: add,
    remove: remove,
    ids: function () { return Array.from(ids); },
    count: function () { return ids.size; },
    listings: listings,
    paint: paint,
    mount: paint,
    onChange: function (fn) { if (typeof fn === "function") listeners.push(fn); },
    buttonHtml: function (id, className) {
      return '<button type="button" class="' + (className || "fav-btn") + '" data-fav="' +
        String(id).replace(/"/g, "&quot;") + '" aria-pressed="false">' + HEART + '</button>';
    },
    heartSvg: HEART
  };
})(window);
