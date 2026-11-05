/* create-listing.js – Stand 05.11.2026
   NEU 05.11.: Schneller Bild-Upload
   • Bilder werden im Browser verkleinert (max. 1920 px, WebP bzw. JPEG):
     aus 4–8 MB Handyfoto werden meist 200–500 KB. Nebenbei verschwinden die
     Standortdaten (GPS) aus den Fotos.
   • Der Upload startet sofort beim Auswählen – im Hintergrund, während man
     das Formular ausfüllt (3 Bilder gleichzeitig). Beim Klick auf
     „Veröffentlichen“ ist meist schon alles oben.
   • Jedes Vorschaubild zeigt seinen Stand (Optimiert… / Lädt… / ✓).
   • Echte Fortschrittsanzeige statt Zeitschätzung; das Fenster verschwindet
     nicht mehr nach 30 Sekunden, während noch hochgeladen wird.
   • Behoben: Per Drag & Drop abgelegte Bilder kamen nie an; mit ✕
     entfernte Bilder wurden trotzdem gespeichert; wer zweimal Bilder
     auswählte, bekam nur die zweite Auswahl gespeichert.
   • Bilder werden mit langer Cache-Zeit gespeichert → laden für Besucher schneller.
   Nur diese Datei ersetzen – anzeige-erstellen.html bleibt wie sie ist.

   Änderung 04.11.: Versandoptionen (DHL, DPD, Hermes, UPS, Spedition,
   Sonstiges) sind raus – der Block verschwindet beim Laden aus dem
   Formular und wird nicht mehr gespeichert.
   Stand 21.10.: Inserieren ohne Händlerkonto. Jeder eingeloggte Nutzer (privat
   oder gewerblich) kann Anzeigen hochladen – das Anbieterprofil wird bei
   Bedarf automatisch angelegt. "Als Entwurf speichern" speichert jetzt
   wirklich als Entwurf statt sofort zu veröffentlichen. */

// ── Versandoptionen aus dem Formular nehmen ──────────────────────────────────
// Läuft sofort (das Formular steht oberhalb dieses Skripts) und zur Sicherheit
// nochmal nach dem Laden – funktioniert mit jeder Version von anzeige-erstellen.html.
function removeShippingOptions() {
  const anchor = document.getElementById("ship-dhl") || document.getElementById("ship-pickup");
  const group = anchor ? anchor.closest(".form-group") : null;
  if (group) group.remove();

  // Häkchen „Europaweiter Versand“ unter „Optionen“ gehört auch dazu
  document.querySelectorAll("input[name='opt']").forEach(cb => {
    if (/versand/i.test(cb.value)) (cb.closest(".check-item") || cb).remove();
  });

  document.querySelectorAll(".section-head p").forEach(p => {
    if (/Preis,\s*Versand und Standort/i.test(p.textContent)) p.textContent = "Preis und Standort";
  });
  document.querySelectorAll(".tip-item").forEach(item => {
    if (/Versandoptionen/i.test(item.textContent)) {
      const dot = item.querySelector(".tip-dot");
      item.textContent = "Garantie und ein genauer Standort erhöhen die Anfragequalität.";
      if (dot) item.prepend(dot);
    }
  });
}
removeShippingOptions();
document.addEventListener("DOMContentLoaded", removeShippingOptions);

// ── Anbieterprofil sicherstellen ─────────────────────────────────────────────
// Jeder eingeloggte Nutzer darf inserieren – privat oder gewerblich.
// Fehlt das Profil, wird es hier still angelegt (kein Händlerkonto nötig).
// Gewerblich = company_type gesetzt (wie in suche.html), sonst Privatanbieter.
window.ensureSellerProfile = window.ensureSellerProfile || async function (user) {
  if (!user || !user.id) return { data: null, error: new Error("Nicht eingeloggt") };

  const COLS = "id, company_name, company_type";
  const load = () => supabaseClient
    .from("seller_profiles").select(COLS).eq("user_id", user.id).maybeSingle();

  let res = await load();
  // Falls es die Spalte company_type nicht gibt: ohne sie erneut laden
  if (res.error && /company_type/.test(res.error.message || "")) {
    res = await supabaseClient.from("seller_profiles")
      .select("id, company_name").eq("user_id", user.id).maybeSingle();
  }
  if (res.error) return { data: null, error: res.error };
  if (res.data) return res;

  const meta  = user.user_metadata || {};
  const email = user.email || "";
  const name  = (meta.company && String(meta.company).trim())
             || (meta.full_name && String(meta.full_name).trim())
             || [meta.first_name, meta.last_name].filter(Boolean).join(" ").trim()
             || email.split("@")[0]
             || "Privatanbieter";

  const ins = await supabaseClient
    .from("seller_profiles")
    .insert([{ user_id: user.id, email: email, company_name: name, city: "", country: "DE" }])
    .select("id, company_name")
    .single();

  // Doppelt angelegt (z. B. zwei Tabs gleichzeitig)? Dann einfach das vorhandene nehmen.
  if (ins.error && (ins.error.code === "23505" || /duplicate/i.test(ins.error.message || ""))) {
    return await load();
  }
  return ins;
};

// Profil nur einmal pro Seitenaufruf laden (Seitenstart + Absenden teilen sich das Ergebnis)
let sellerProfilePromise = null;
function getSellerProfile(user) {
  if (!sellerProfilePromise) {
    sellerProfilePromise = Promise.resolve(window.ensureSellerProfile(user)).then(r => {
      if (!r || r.error || !r.data) sellerProfilePromise = null;   // beim nächsten Mal neu versuchen
      return r || { data: null, error: new Error("Kein Profil") };
    }, err => {
      sellerProfilePromise = null;
      return { data: null, error: err };
    });
  }
  return sellerProfilePromise;
}

// ═════════════════════════════════════════════════════════════════════════════
//  Bilder: im Browser verkleinern und schon beim Auswählen hochladen
// ═════════════════════════════════════════════════════════════════════════════
const IMG_MAX_COUNT   = 12;            // Bilder pro Anzeige
const IMG_MAX_EDGE    = 1920;          // längste Kante in Pixel (Typenschild bleibt lesbar)
const IMG_QUALITY     = 0.8;           // WebP-Qualität (JPEG-Ersatz: 0.82)
const IMG_KEEP_BELOW  = 250 * 1024;    // kleinere Dateien bleiben unverändert
const UPLOAD_PARALLEL = 3;             // gleichzeitige Uploads
const IMG_BUCKET      = "listing-images";
const IMG_EXT_RE      = /\.(jpe?g|png|webp|heic|heif|avif|gif|bmp)$/i;

const ListingImages = (() => {
  let items = [];          // { key, kind: "existing"|"new", url, file, preview, optimized, state, path, job, removed }
  let seq = 0;
  let userIdPromise = null;

  // Warteschlangen: Verkleinern nacheinander (schont Handy-Speicher), Hochladen 3 parallel
  function limiter(max) {
    let active = 0;
    const waiting = [];
    const next = () => {
      if (active >= max || !waiting.length) return;
      active++;
      const { task, resolve, reject } = waiting.shift();
      Promise.resolve().then(task).then(resolve, reject).finally(() => { active--; next(); });
    };
    return task => new Promise((resolve, reject) => { waiting.push({ task, resolve, reject }); next(); });
  }
  const compressQueue = limiter(1);
  const uploadQueue = limiter(UPLOAD_PARALLEL);

  const grid = () => document.getElementById("preview-grid") || document.querySelector(".preview-grid");
  const isImage = f => !!f && (String(f.type || "").startsWith("image/") || IMG_EXT_RE.test(f.name || ""));
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function getUserId() {
    if (!userIdPromise) {
      userIdPromise = supabaseClient.auth.getSession()
        .then(r => r?.data?.session?.user?.id || null)
        .catch(() => null)
        .then(id => { if (!id) userIdPromise = null; return id; });
    }
    return userIdPromise;
  }

  // ── Verkleinern ────────────────────────────────────────────────────────────
  function decodeImage(file) {
    // <img> beachtet die Drehung aus den Kameradaten (EXIF) in allen aktuellen Browsern
    return new Promise(resolve => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        const done = () => resolve({ img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) });
        if (img.decode) img.decode().then(done, done); else done();
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };   // z. B. HEIC im Desktop-Chrome
      img.src = url;
    });
  }
  let webpOk = null;
  function canWebp() {
    if (webpOk === null) {
      try { const c = document.createElement("canvas"); c.width = c.height = 1; webpOk = c.toDataURL("image/webp").indexOf("data:image/webp") === 0; }
      catch (e) { webpOk = false; }
    }
    return webpOk;
  }
  function toBlob(canvas, type, quality) {
    return new Promise(resolve => {
      try { canvas.toBlob(b => resolve(b), type, quality); } catch (e) { resolve(null); }
    });
  }
  async function compressImage(file) {
    try {
      if (!file || file.size < IMG_KEEP_BELOW || /gif|svg/i.test(file.type || "")) return file;
      const src = await decodeImage(file);
      if (!src || !src.width || !src.height) return file;
      const scale = Math.min(1, IMG_MAX_EDGE / Math.max(src.width, src.height));
      const w = Math.max(1, Math.round(src.width * scale));
      const h = Math.max(1, Math.round(src.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";                 // transparente PNGs bekommen weißen Grund
      ctx.fillRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(src.img, 0, 0, w, h);
      src.close();
      let blob = canWebp() ? await toBlob(canvas, "image/webp", IMG_QUALITY) : null;
      if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg", 0.82);   // Safari: JPEG
      canvas.width = canvas.height = 0;          // Speicher sofort freigeben
      if (!blob || blob.size >= file.size) return file;
      const ext = blob.type === "image/webp" ? "webp" : "jpg";
      const base = String(file.name || "bild").replace(/\.[^.]+$/, "") || "bild";
      return new File([blob], base + "." + ext, { type: blob.type, lastModified: Date.now() });
    } catch (e) {
      console.warn("Bild-Optimierung übersprungen:", e);
      return file;                               // im Zweifel Original hochladen wie bisher
    }
  }

  // ── Hochladen ──────────────────────────────────────────────────────────────
  function extOf(file) {
    if (file.type === "image/webp") return "webp";
    if (file.type === "image/jpeg") return "jpg";
    if (file.type === "image/png") return "png";
    const m = /\.([a-z0-9]{2,5})$/i.exec(file.name || "");
    return m ? m[1].toLowerCase() : "jpg";
  }
  async function uploadFile(file, userId, index) {
    const path = `${userId}/${Date.now()}-${index}-${Math.random().toString(36).slice(2)}.${extOf(file)}`;
    for (let attempt = 1; attempt <= 2; attempt++) {
      const { error } = await supabaseClient.storage.from(IMG_BUCKET).upload(path, file, {
        cacheControl: "31536000",               // 1 Jahr: Dateinamen sind eindeutig, Bild ändert sich nie
        contentType: file.type || undefined,
        upsert: false
      });
      // „existiert schon“ beim 2. Versuch = 1. Versuch kam doch an
      if (!error || (attempt > 1 && /exist|duplicate/i.test(String(error.message || error.error || "")))) {
        const { data } = supabaseClient.storage.from(IMG_BUCKET).getPublicUrl(path);
        return data && data.publicUrl ? { url: data.publicUrl, path } : null;
      }
      console.error("UPLOAD ERROR:", error, file.name);
      if (attempt === 1) await sleep(800);
    }
    return null;
  }
  function removeFromStorage(path) {
    if (!path) return;
    try {
      Promise.resolve(supabaseClient.storage.from(IMG_BUCKET).remove([path])).catch(() => {});
    } catch (e) { /* Aufräumen ist nur nett, nie wichtig */ }
  }

  async function run(it) {
    try {
      if (!it.optimized) {
        setState(it, "optimize");
        it.optimized = await compressQueue(() => (it.removed ? it.file : compressImage(it.file)));
        if (it.optimized !== it.file && !it.removed) {
          const old = it.preview;
          it.preview = URL.createObjectURL(it.optimized);
          const g = grid();
          const img = g && g.querySelector('[data-key="' + it.key + '"] img');
          if (img) img.src = it.preview;
          setTimeout(() => { try { URL.revokeObjectURL(old); } catch (e) {} }, 1500);
        }
      }
      if (it.removed) return null;
      const userId = await getUserId();
      if (!userId) { setState(it, "wait"); return null; }   // Upload dann beim Absenden
      setState(it, "upload");
      const res = await uploadQueue(() => (it.removed ? null : uploadFile(it.optimized, userId, it.index)));
      if (it.removed) { if (res) removeFromStorage(res.path); return null; }
      if (!res) { setState(it, "error"); return null; }
      it.url = res.url;
      it.path = res.path;
      setState(it, "done");
      return it.url;
    } catch (e) {
      console.error("BILD-FEHLER:", e);
      setState(it, "error");
      return null;
    }
  }

  // ── Liste verwalten ────────────────────────────────────────────────────────
  function add(fileList) {
    const files = Array.from(fileList || []).filter(isImage);
    if (!files.length) return;
    const free = IMG_MAX_COUNT - items.length;
    if (free <= 0) { alert("Maximal " + IMG_MAX_COUNT + " Bilder pro Anzeige."); return; }
    const added = files.slice(0, free).map(file => {
      const it = { key: "n" + (++seq), index: seq, kind: "new", file, preview: URL.createObjectURL(file), state: "wait" };
      items.push(it);
      return it;
    });
    render();
    added.forEach(it => { it.job = run(it); });
    if (files.length > free) alert("Es wurden nur " + free + " Bilder übernommen – maximal " + IMG_MAX_COUNT + " pro Anzeige.");
  }
  function remove(key) {
    const i = items.findIndex(x => x.key === key);
    if (i < 0) return;
    const it = items[i];
    items.splice(i, 1);
    it.removed = true;
    if (it.kind === "new") {
      if (it.path) removeFromStorage(it.path);   // war schon oben → wieder löschen
      setTimeout(() => { try { URL.revokeObjectURL(it.preview); } catch (e) {} }, 0);
    }
    render();
  }
  function setExisting(urls) {
    const fresh = items.filter(x => x.kind === "new");
    items = (urls || []).filter(Boolean).map(url => ({ key: "e" + (++seq), kind: "existing", url, state: "done" })).concat(fresh);
    render();
  }
  function clear() {
    items.forEach(it => { it.removed = true; if (it.preview) { try { URL.revokeObjectURL(it.preview); } catch (e) {} } });
    items = [];
    render();
  }
  function pendingCount() { return items.filter(it => it.kind === "new" && !it.url).length; }

  // Beim Absenden: laufende Uploads abwarten, Fehlgeschlagene noch einmal versuchen
  async function finish(onProgress) {
    const fresh = items.filter(it => it.kind === "new");
    const total = fresh.length;
    const report = () => { if (onProgress) onProgress(fresh.filter(it => it.url).length, total); };
    report();
    await Promise.all(fresh.map(it => Promise.resolve(it.job).then(report)));
    const again = fresh.filter(it => !it.url && !it.removed);
    if (again.length) {
      again.forEach(it => { it.job = run(it); });
      await Promise.all(again.map(it => it.job.then(report)));
    }
    return {
      urls: items.map(it => it.url).filter(Boolean),          // Reihenfolge wie in der Vorschau
      failed: items.filter(it => it.kind === "new" && !it.url).length
    };
  }

  // ── Vorschau ───────────────────────────────────────────────────────────────
  const STATE_TEXT = { wait: "", optimize: "Optimiert…", upload: "Lädt…", done: "✓", error: "Fehler" };
  function setState(it, state) {
    it.state = state;
    const g = grid();
    const box = g && g.querySelector('[data-key="' + it.key + '"]');
    if (!box) return;
    const el = box.querySelector(".img-state");
    const busy = state === "optimize" || state === "upload";
    box.classList.toggle("is-busy", busy);
    if (!el) return;
    el.textContent = it.kind === "existing" ? "" : (STATE_TEXT[state] || "");
    el.className = "img-state" + (el.textContent ? " on" : "") + (busy ? " busy" : "") +
      (state === "done" ? " ok" : "") + (state === "error" ? " err" : "");
    if (state === "error") el.title = "Wird beim Veröffentlichen nochmal versucht";
  }
  function render() {
    const g = grid();
    if (!g) return;
    g.innerHTML = "";
    items.forEach((it, i) => {
      const box = document.createElement("div");
      box.className = "preview-item" + (i === 0 ? " main-img" : "");
      box.setAttribute("data-key", it.key);
      const img = document.createElement("img");
      img.src = it.kind === "new" ? it.preview : it.url;
      img.alt = "Bild " + (i + 1);
      img.decoding = "async";
      const btn = document.createElement("button");
      btn.type = "button";                       // kein Absenden des Formulars mehr
      btn.className = "remove-img";
      btn.setAttribute("data-key", it.key);
      btn.title = "Entfernen";
      btn.setAttribute("aria-label", "Bild " + (i + 1) + " entfernen");
      btn.textContent = "✕";
      const st = document.createElement("span");
      st.className = "img-state";
      st.setAttribute("aria-live", "polite");
      box.append(img, btn, st);
      g.appendChild(box);
      setState(it, it.state);
    });
    if (typeof window.updateProgress === "function") { try { window.updateProgress(); } catch (e) {} }
  }

  return { add, remove, setExisting, clear, finish, pendingCount, compressImage, uploadFile };
})();
window.ListingImages = ListingImages;

// Stil für die Statusanzeige auf den Vorschaubildern
(function injectImageCss() {
  if (document.getElementById("cl-img-css")) return;
  const st = document.createElement("style");
  st.id = "cl-img-css";
  st.textContent = [
    ".preview-item img{width:100%;height:100%;object-fit:cover;display:block}",
    ".preview-item .remove-img{z-index:2}",
    ".preview-item.is-busy img{opacity:.7}",
    ".preview-item .img-state{position:absolute;top:4px;left:4px;z-index:2;display:none;align-items:center;gap:5px;max-width:calc(100% - 32px);background:rgba(15,17,23,.74);color:#fff;font-size:10.5px;font-weight:700;line-height:1.4;padding:2px 7px;border-radius:999px;white-space:nowrap}",
    ".preview-item .img-state.on{display:inline-flex}",
    ".preview-item .img-state.busy::before{content:'';width:8px;height:8px;border-radius:50%;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;animation:cl-spin .7s linear infinite;flex-shrink:0}",
    ".preview-item .img-state.ok{background:#10b981}",
    ".preview-item .img-state.err{background:#dc2626}",
    "@keyframes cl-spin{to{transform:rotate(360deg)}}"
  ].join("\n");
  (document.head || document.documentElement).appendChild(st);
})();

// Bild-Auswahl, Drag & Drop und ✕ übernimmt ab jetzt nur noch dieses Skript.
// (Läuft vor dem Skript in anzeige-erstellen.html und fängt die Ereignisse vorher ab.)
document.addEventListener("change", e => {
  const input = e.target;
  if (!input || input.id !== "bilder") return;
  e.stopPropagation();
  ListingImages.add(input.files);
  input.value = "";                              // gleiches Bild kann erneut gewählt werden
}, true);
document.addEventListener("dragover", e => {
  if (e.target && e.target.closest && e.target.closest("#upload-zone, .upload-zone")) e.preventDefault();
}, true);
document.addEventListener("drop", e => {
  const zone = e.target && e.target.closest ? e.target.closest("#upload-zone, .upload-zone") : null;
  if (!zone) return;
  e.preventDefault();
  e.stopPropagation();
  zone.classList.remove("drag-over");
  ListingImages.add(e.dataTransfer && e.dataTransfer.files);
}, true);
document.addEventListener("click", e => {
  const btn = e.target && e.target.closest ? e.target.closest(".preview-grid .remove-img, #preview-grid .remove-img") : null;
  if (!btn) return;
  e.preventDefault();                            // ✕ darf das Formular nie abschicken
  e.stopPropagation();
  ListingImages.remove(btn.getAttribute("data-key"));
}, true);

// ── Fortschrittsfenster: echte Werte statt Zeitschätzung ─────────────────────
// anzeige-erstellen.html blendet beim Absenden ein Fenster mit geschätztem
// Fortschritt ein und schließt es nach 30 s. Solange wir arbeiten, steuert
// dieses Skript das Fenster selbst.
let overlayOwned = false;
function takeOverOverlay() {
  if (window.__clOverlayHooked) return;
  if (typeof window.setOverlayProgress === "function") {
    const realSet = window.setOverlayProgress;
    window.__clSetOverlay = realSet;
    window.setOverlayProgress = function (pct, text) { if (!overlayOwned) return realSet(pct, text); };
  }
  if (typeof window.hideUploadOverlay === "function") {
    const realHide = window.hideUploadOverlay;
    window.hideUploadOverlay = function () { if (!overlayOwned) return realHide(); };
  }
  window.__clOverlayHooked = true;
}
function overlayProgress(pct, text) {
  if (typeof window.__clSetOverlay === "function") { try { window.__clSetOverlay(Math.round(pct), text); } catch (e) {} }
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log("create-listing.js wurde geladen");

  const form = document.querySelector("form");
  const pageTitle = document.querySelector(".page-head h1");

  if (!form) {
    console.log("Kein Formular gefunden");
    return;
  }

  // Bearbeiten-Modus: die Seite ersetzt den Knopf-Inhalt und löscht dabei das
  // Textfeld, das ihr Lade-Fenster braucht → wieder herstellen (sonst JS-Fehler)
  const pubBtn = document.getElementById("btn-publish");
  if (pubBtn && !document.getElementById("btn-publish-text")) {
    const label = (pubBtn.textContent || "").replace(/[^\p{L}\p{N} .–-]/gu, "").trim() || "Änderungen speichern";
    pubBtn.innerHTML = '<span class="btn-spinner"></span><span class="btn-icon">💾</span><span id="btn-publish-text"></span>';
    document.getElementById("btn-publish-text").textContent = label;
  }

  // Ganze Upload-Fläche anklickbar (nicht nur der Knopf)
  const zone = document.getElementById("upload-zone");
  const fileInput = document.getElementById("bilder");
  if (zone && fileInput) {
    zone.addEventListener("click", e => {
      if (e.target.closest("label, input, button, a")) return;
      fileInput.click();
    });
  }

  // Profil schon beim Öffnen der Seite anlegen + Kontotyp in der Sidebar zeigen
  setAccountLabel();

  const params = new URLSearchParams(window.location.search);
  const editListingId = params.get("edit");
  let submitting = false;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (submitting) return;                      // Doppelklick → keine doppelte Anzeige
    submitting = true;
    console.log("Formular wurde abgeschickt");

    takeOverOverlay();
    overlayOwned = true;
    overlayProgress(5, "Anmeldung wird geprüft…");

    try {
      const sessionResult = await supabaseClient.auth.getSession();
      const user = sessionResult?.data?.session?.user;

      if (!user) {
        fail("Bitte melde dich zuerst an – danach kannst du sofort inserieren.");
        window.location.href = "login.html?redirect=anzeige-erstellen.html";
        return;
      }

      const isDraft = !!document.getElementById("_draft_mode");

      const title = document.getElementById("titel")?.value?.trim() || "";
      const categorySlug = document.getElementById("kategorie")?.value?.trim() || "";
      const manufacturer = document.getElementById("hersteller")?.value?.trim() || "";
      const model = document.getElementById("modell")?.value?.trim() || "";
      const condition   = document.getElementById("zustand")?.value?.trim() || "Gebraucht";
      const listingType = document.querySelector("input[name='anzeigetyp']:checked")?.value || "Verkauf";
      const priceType   = document.getElementById("preisart")?.value || "Festpreis";
      const price = Number(document.getElementById("preis")?.value || 0);
      const year = parseInt(document.getElementById("baujahr")?.value || "0", 10) || null;
      const location = document.getElementById("standort")?.value?.trim() || "";
      const description = document.getElementById("beschreibung")?.value?.trim() || "";

      if (!title || !categorySlug) {
        fail("Bitte Titel und Kategorie ausfüllen.");
        return;
      }
      // Preis nur bei echter Verkaufsanzeige mit Festpreis/VB Pflicht
      const priceOptional = ["Zu verschenken", "Auf Anfrage"].includes(priceType);
      if (!isDraft && listingType === "Verkauf" && !price && !priceOptional) {
        fail("Bitte einen Preis eingeben.");
        return;
      }

      // Kategorie, Profil und Bilder gleichzeitig statt nacheinander
      overlayProgress(12, "Kategorie und Profil werden geladen…");
      const imagesDone = ListingImages.finish((done, total) => {
        if (!total) return;
        overlayProgress(20 + (done / total) * 65,
          done < total ? `Bilder werden hochgeladen … ${done} von ${total}` : "Bilder sind oben ✓");
      });
      const [categoryRes, sellerResult] = await Promise.all([
        supabaseClient.from("categories").select("id, name, slug").eq("slug", categorySlug),
        getSellerProfile(user)
      ]);

      const categories = categoryRes?.data;
      if (categoryRes?.error || !categories || categories.length === 0) {
        console.error("CATEGORY ERROR:", categoryRes?.error);
        fail("Kategorie nicht gefunden.");
        return;
      }
      const category = categories[0];

      // ── Anbieterprofil: vorhanden nehmen oder automatisch anlegen ─────────
      // Kein Händlerkonto nötig – privat und gewerblich gleich behandelt.
      console.log("SELLER RESULT:", sellerResult);
      if (sellerResult.error || !sellerResult.data) {
        console.error("PROFILE ERROR:", sellerResult.error);
        fail("Dein Konto konnte gerade nicht vorbereitet werden. Bitte Seite neu laden und nochmal versuchen. " +
             "Bleibt der Fehler, melde dich bitte über kontakt.html.");
        return;
      }

      const images = await imagesDone;
      if (images.failed > 0) {
        const ok = confirm(images.failed === 1
          ? "1 Bild konnte nicht hochgeladen werden. Trotzdem ohne dieses Bild speichern?"
          : images.failed + " Bilder konnten nicht hochgeladen werden. Trotzdem ohne diese Bilder speichern?");
        if (!ok) { fail(null); return; }
      }

      overlayProgress(88, isDraft ? "Entwurf wird gespeichert…" : "Anzeige wird gespeichert…");

      const payload = {
        seller_id: sellerResult.data.id,
        category_id: category.id,
        title,
        manufacturer,
        model,
        condition,
        price,
        year,
        location,
        description,
        status: isDraft ? "Entwurf" : "Freigegeben",
        listing_type: listingType,
        price_type: priceType,
        image_urls: images.urls
      };

      let result;

      if (editListingId) {
        result = await supabaseClient
          .from("listings")
          .update(payload)
          .eq("id", editListingId)
          .eq("seller_id", sellerResult.data.id)
          .select();
        console.log("UPDATE RESULT:", result);
      } else {
        result = await supabaseClient
          .from("listings")
          .insert([payload])
          .select();
        console.log("INSERT RESULT:", result);
      }

      if (result.error) {
        console.error("SAVE ERROR:", result.error);
        fail("Speichern hat nicht geklappt. Bitte nochmal versuchen.");
        return;
      }

      overlayOwned = false;
      if (typeof window.onListingSuccess === "function") window.onListingSuccess();
      else alert(editListingId ? "Anzeige wurde aktualisiert!" : isDraft ? "Entwurf gespeichert!" : "Anzeige wurde veröffentlicht!");

      form.reset();
      ListingImages.clear();

      setTimeout(() => { window.location.href = "meine-anzeigen.html"; }, 1200);
    } catch (err) {
      console.error("UNCAUGHT ERROR IN CREATE-LISTING:", err);
      fail("Es ist ein Fehler aufgetreten. Bitte Seite neu laden.");
    }
  });

  if (editListingId) {
    console.log("Bearbeitungsmodus aktiv. Listing-ID:", editListingId);
    if (pageTitle) pageTitle.textContent = "Anzeige bearbeiten";
    const existingImageUrls = await loadListingForEdit(editListingId);
    ListingImages.setExisting(existingImageUrls);
  }

  // Fehler anzeigen und das Lade-Fenster schließen
  function fail(msg) {
    overlayOwned = false;
    submitting = false;
    if (typeof window.onListingError === "function") window.onListingError();
    if (msg) alert(msg);
  }

  async function setAccountLabel() {
    try {
      const { data: sd } = await supabaseClient.auth.getSession();
      const user = sd?.session?.user;
      if (!user) return;
      const { data: seller } = await getSellerProfile(user);
      const label = seller && seller.company_type && String(seller.company_type).trim()
        ? "Gewerblicher Anbieter" : "Privatanbieter";
      document.querySelectorAll(".user-role").forEach(el => { el.textContent = label; });
    } catch (e) { /* nur Anzeige – darf nie das Inserieren blockieren */ }
  }

  async function loadListingForEdit(listingId) {
    const { data: listing, error } = await supabaseClient
      .from("listings")
      .select(`
        id,
        title,
        manufacturer,
        model,
        condition,
        price,
        year,
        location,
        description,
        image_urls,
        listing_type,
        price_type,
        categories(slug)
      `)
      .eq("id", listingId)
      .single();

    console.log("EDIT LISTING RESULT:", listing);
    console.log("EDIT LISTING ERROR:", error);

    if (error || !listing) {
      alert("Anzeige zum Bearbeiten konnte nicht geladen werden.");
      return [];
    }

    document.getElementById("titel").value = listing.title || "";
    document.getElementById("kategorie").value = Array.isArray(listing.categories)
      ? listing.categories[0]?.slug || ""
      : listing.categories?.slug || "";
    document.getElementById("hersteller").value = listing.manufacturer || "";
    document.getElementById("modell").value = listing.model || "";
    document.getElementById("zustand").value = listing.condition || "Gebraucht";
    document.getElementById("preis").value = listing.price || "";
    document.getElementById("baujahr").value = listing.year || "";
    document.getElementById("standort").value = listing.location || "";

    const preisartEl = document.getElementById("preisart");
    if (preisartEl && listing.price_type) preisartEl.value = listing.price_type;
    if (listing.listing_type === "Gesuch") {
      const r = document.getElementById("typ-gesuch");
      const b = document.getElementById("typ-btn-gesuch");
      if (r) r.checked = true;
      if (b) b.click();
    }
    document.getElementById("beschreibung").value = listing.description || "";

    return Array.isArray(listing.image_urls) ? listing.image_urls : [];
  }
});

// Für andere Seiten, die diese Funktion noch aufrufen: jetzt auch verkleinert + parallel
async function uploadListingImages(fileList, userId) {
  const files = Array.from(fileList || [])
    .filter(f => String(f.type || "").startsWith("image/") || IMG_EXT_RE.test(f.name || ""))
    .slice(0, IMG_MAX_COUNT);
  const uploads = [];
  for (let i = 0; i < files.length; i++) {
    const small = await ListingImages.compressImage(files[i]);
    uploads.push(ListingImages.uploadFile(small, userId, i).then(r => (r ? r.url : null), () => null));
  }
  return (await Promise.all(uploads)).filter(Boolean);
}
