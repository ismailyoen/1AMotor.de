/* 1A Motor — Service Worker (App-Modus)
 * - Seiten (HTML): immer zuerst aus dem Netz → aktuelle Inserate; offline → letzte Version bzw. offline.html
 * - Eigene CSS/JS/Bilder: sofort aus dem Cache, im Hintergrund aktualisiert
 * - Fremde Anfragen (Supabase, Google AdSense, Fonts, Analytics) werden NICHT angefasst
 *   → Werbung und Live-Daten laufen exakt wie im Browser.
 * Bei jeder Änderung an dieser Datei VERSION hochzählen.
 */
const VERSION = "1am-v2";
const CORE = ["offline.html", "mobile.css", "mobile.js", "app-icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;           // Supabase, AdSense & Co. unberührt
  if (url.pathname.endsWith("sw.js") || url.pathname.endsWith("ads.txt")) return;

  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("offline.html")))
    );
    return;
  }

  if (/\.(css|js|png|jpe?g|webp|svg|ico|woff2?)$/i.test(url.pathname)) {
    e.respondWith(
      caches.open(VERSION).then((c) =>
        c.match(req).then((hit) => {
          const net = fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
          return hit || net;
        })
      )
    );
  }
});
