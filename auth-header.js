/* auth-header.js – Stand 05.11.2026
   Neu: Konto-Menü ohne Emojis – schlichte Linien-Icons, ein einheitliches
   Menü auf ALLEN Seiten (Startseite und Konto-Seiten zeigen dieselben Punkte),
   aktive Seite wird markiert. Seitenschutz funktioniert jetzt auch mit
   „sauberen“ URLs wie /dashboard (ohne .html).
   Merkliste im Menü + favorites.js wird weiterhin automatisch nachgeladen. */

// ── Geschützte Seiten ─────────────────────────────────────────────────────────
const PROTECTED_PAGES = [
  "dashboard.html",
  "anzeige-erstellen.html",
  "meine-anzeigen.html",
  "anfragen.html",
  "meine-anfragen.html",
  "profil.html",
  "pakete.html"
];

// /dashboard, /dashboard/ und /dashboard.html → "dashboard.html"
function currentPageName() {
  let p = window.location.pathname.replace(/\/+$/, "").split("/").pop() || "index.html";
  if (!/\.[a-z0-9]+$/i.test(p)) p += ".html";
  return p.toLowerCase();
}

// ── Linien-Icons (24er Raster, Strichstärke über CSS) ────────────────────────
const ICONS = {
  dashboard: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
  listings:  '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>',
  inbox:     '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  messages:  '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  heart:     '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/>',
  plus:      '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 8v8"/><path d="M8 12h8"/>',
  user:      '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
  logout:    '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  chevron:   '<path d="m6 9 6 6 6-6"/>'
};

function icon(name, cls = "am-ico") {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

// ── Menüpunkte – eine Liste für alle Seiten ──────────────────────────────────
const ACCOUNT_MENU = [
  { href: "dashboard.html",         label: "Dashboard",         icon: "dashboard" },
  { href: "meine-anzeigen.html",    label: "Meine Anzeigen",    icon: "listings"  },
  { href: "anfragen.html",          label: "Anfragen",          icon: "inbox"     },
  { href: "meine-anfragen.html",    label: "Nachrichten",       icon: "messages"  },
  { href: "favoriten.html",         label: "Merkliste",         icon: "heart", fav: true },
  { divider: true },
  { href: "anzeige-erstellen.html", label: "Anzeige erstellen", icon: "plus"      },
  { href: "profil.html",            label: "Profil",            icon: "user"      }
];

// ── CSS für Avatar-Dropdown ───────────────────────────────────────────────────
const HEADER_STYLES = `
  .auth-nav { display:flex; align-items:center; gap:16px; font-size:14px; flex-wrap:wrap; }

  .auth-avatar-wrapper { position:relative; }

  .auth-avatar-btn {
    display:flex; align-items:center; gap:10px;
    background:#f0f6ff; border:1px solid #d0e4f7;
    border-radius:999px; padding:6px 12px 6px 6px;
    cursor:pointer; font:inherit; font-size:14px; font-weight:700;
    color:#123a63; position:relative;
    transition: background .15s, border-color .15s;
  }
  .auth-avatar-btn:hover,
  .auth-avatar-btn[aria-expanded="true"] { background:#e3efff; border-color:#b9d5f2; }

  .auth-avatar-circle {
    width:32px; height:32px; border-radius:50%;
    background:linear-gradient(135deg,#123a63,#2a6db0);
    color:#fff; display:grid; place-items:center;
    font-size:13px; font-weight:700; flex-shrink:0;
  }
  .auth-avatar-name { max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

  .auth-avatar-btn .am-chev {
    width:16px; height:16px; stroke-width:2; color:#64748b;
    transition: transform .18s ease;
  }
  .auth-avatar-btn[aria-expanded="true"] .am-chev { transform:rotate(180deg); }

  .auth-dropdown {
    position:absolute; top:calc(100% + 8px); right:0;
    background:#fff; border:1px solid #e2e8f0;
    border-radius:14px; box-shadow:0 12px 32px rgba(15,23,42,0.12), 0 2px 6px rgba(15,23,42,0.05);
    min-width:236px; max-width:calc(100vw - 16px); z-index:1000; overflow:hidden;
    padding:6px; display:none;
    font-family:inherit; text-align:left;
  }
  .auth-dropdown.open { display:block; animation:amDrop .14s ease-out; }
  @keyframes amDrop { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:none; } }

  .auth-dropdown-header {
    padding:10px 10px 12px; margin-bottom:4px;
    border-bottom:1px solid #eef2f6;
  }
  .auth-dropdown-header strong {
    display:block; font-size:14px; font-weight:700; color:#0f2942; margin-bottom:2px;
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
  }
  .auth-dropdown-header span {
    display:block; font-size:12.5px; color:#64748b; font-weight:400;
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
  }

  .auth-dropdown a, .auth-dropdown button {
    display:flex; align-items:center; gap:11px;
    width:100%; padding:9px 10px; border-radius:9px;
    font:inherit; font-size:14px; font-weight:500; line-height:1.3;
    color:#334155; background:none; border:none; cursor:pointer;
    text-decoration:none; text-align:left;
    transition: background .12s, color .12s;
  }
  .auth-dropdown .am-ico {
    width:18px; height:18px; flex-shrink:0;
    stroke-width:1.75; color:#94a3b8;
    transition: color .12s;
  }
  .auth-dropdown a:hover, .auth-dropdown button:hover { background:#f4f7fb; color:#123a63; }
  .auth-dropdown a:hover .am-ico, .auth-dropdown button:hover .am-ico { color:#123a63; }

  .auth-dropdown a.is-active { background:#eef5ff; color:#123a63; font-weight:600; }
  .auth-dropdown a.is-active .am-ico { color:#2a6db0; }

  .auth-dropdown .auth-fav-count {
    margin-left:auto; min-width:22px; padding:1px 7px; border-radius:999px;
    background:#eef2f7; color:#475569; font-size:12px; font-weight:600; text-align:center;
  }

  .auth-dropdown .divider { height:1px; background:#eef2f6; margin:5px 4px; }

  .auth-dropdown .logout-item { color:#b42318; }
  .auth-dropdown .logout-item .am-ico { color:#d0453a; }
  .auth-dropdown .logout-item:hover { background:#fef3f2; color:#b42318; }
  .auth-dropdown .logout-item:hover .am-ico { color:#b42318; }

  .auth-dropdown a:focus-visible, .auth-dropdown button:focus-visible,
  .auth-avatar-btn:focus-visible { outline:2px solid #2a6db0; outline-offset:2px; }

  /* Nicht eingeloggt */
  .guest-nav { display:flex; align-items:center; gap:12px; font-size:14px; }
  .guest-nav a { color:#334155; font-weight:600; }
  .guest-nav .login-btn {
    background:#fff; border:1px solid #dbe3ea;
    padding:10px 16px; border-radius:999px; font-weight:700; color:#123a63;
  }
  .guest-nav .register-btn {
    background:#123a63; color:#fff;
    padding:10px 16px; border-radius:999px; font-weight:700;
  }
`;

function injectStyles() {
  if (document.getElementById("auth-header-styles")) return;
  const style = document.createElement("style");
  style.id = "auth-header-styles";
  style.textContent = HEADER_STYLES;
  document.head.appendChild(style);
}

// ── Menü-Bausteine ────────────────────────────────────────────────────────────
function displayNameOf(user, seller) {
  return seller?.company_name || user?.email || "Mein Konto";
}

function initialsOf(name) {
  return String(name).split(" ").filter(Boolean).slice(0, 2)
    .map(w => w[0]).join("").toUpperCase() || "?";
}

function menuItemsHTML() {
  const page = currentPageName();
  return ACCOUNT_MENU.map(item => {
    if (item.divider) return `<div class="divider" role="separator"></div>`;
    const active = item.href === page;
    const count = item.fav
      ? ` <span class="auth-fav-count" data-fav-count data-fav-count-hide-zero></span>`
      : "";
    return `<a href="${item.href}" role="menuitem"${active ? ' class="is-active" aria-current="page"' : ""}>${icon(item.icon)}<span>${item.label}</span>${count}</a>`;
  }).join("");
}

// Avatar-Knopf + Dropdown. prefix = "auth" (Konto-Seiten) oder "hdr" (Startseite)
function accountMenuHTML(prefix, user, seller) {
  const name = displayNameOf(user, seller);
  return `
    <button class="auth-avatar-btn" id="${prefix}-avatar-btn" type="button"
            aria-haspopup="menu" aria-expanded="false" aria-controls="${prefix}-dropdown">
      <span class="auth-avatar-circle">${escapeHtml(initialsOf(name))}</span>
      <span class="auth-avatar-name">${escapeHtml(name)}</span>
      ${icon("chevron", "am-chev")}
    </button>
    <div class="auth-dropdown" id="${prefix}-dropdown" role="menu">
      <div class="auth-dropdown-header">
        <strong>${escapeHtml(name)}</strong>
        <span>${escapeHtml(user?.email || "")}</span>
      </div>
      ${menuItemsHTML()}
      <div class="divider" role="separator"></div>
      <button class="logout-item" id="${prefix}-logout-btn" type="button" role="menuitem">${icon("logout")}<span>Abmelden</span></button>
    </div>
  `;
}

// Auf schmalen Bildschirmen nicht links aus dem Bild ragen lassen
function keepInViewport(dropdown) {
  dropdown.style.right = "0";
  const r = dropdown.getBoundingClientRect();
  if (r.left < 8) dropdown.style.right = `${Math.round(r.left - 8)}px`;
}

function closeAllMenus() {
  document.querySelectorAll(".auth-dropdown.open").forEach(d => d.classList.remove("open"));
  document.querySelectorAll('.auth-avatar-btn[aria-expanded="true"]')
    .forEach(b => b.setAttribute("aria-expanded", "false"));
}

function wireAccountMenu(prefix, root) {
  const btn = document.getElementById(`${prefix}-avatar-btn`);
  const dropdown = document.getElementById(`${prefix}-dropdown`);

  btn?.addEventListener("click", (e) => {
    e.stopPropagation();
    const willOpen = !dropdown?.classList.contains("open");
    closeAllMenus();
    if (willOpen && dropdown) {
      dropdown.classList.add("open");
      btn.setAttribute("aria-expanded", "true");
      keepInViewport(dropdown);
    }
  });
  dropdown?.addEventListener("click", (e) => e.stopPropagation());

  document.getElementById(`${prefix}-logout-btn`)?.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "index.html";
  });

  if (window.Favs) window.Favs.paint(root);
}

// Ein globaler Schließer (statt bei jedem Render einen neuen Listener)
let menuCloserReady = false;
function setupMenuCloser() {
  if (menuCloserReady) return;
  menuCloserReady = true;
  document.addEventListener("click", closeAllMenus);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAllMenus(); });
}

// ── Header neu rendern (Konto-Seiten) ─────────────────────────────────────────
function renderGuestHeader(actionsEl) {
  actionsEl.innerHTML = `
    <nav class="guest-nav">
      <a href="suche.html">Suche</a>
      <a href="favoriten.html">Merkliste</a>
      <a href="login.html" class="login-btn">Einloggen</a>
      <a href="registrieren.html" class="register-btn">Registrieren</a>
    </nav>
  `;
}

function renderAuthHeader(actionsEl, user, seller) {
  actionsEl.innerHTML = `
    <nav class="auth-nav">
      <a href="suche.html" style="color:#334155;font-weight:600;">Suche</a>
      <div class="auth-avatar-wrapper">${accountMenuHTML("auth", user, seller)}</div>
    </nav>
  `;
  wireAccountMenu("auth", actionsEl);
}

// ── Sidebar User-Box aktualisieren (Dashboard, Meine Anzeigen etc.) ───────────
function updateSidebar(user, seller) {
  const heading = document.querySelector(".user-box h2");
  const sub = document.querySelector(".user-box p");
  if (heading) heading.textContent = displayNameOf(user, seller);
  if (sub) sub.textContent = user.email || "Mein Konto";
}

// ── Page Guard ────────────────────────────────────────────────────────────────
async function guardPage(user) {
  const currentPage = currentPageName();
  if (!PROTECTED_PAGES.includes(currentPage)) return;
  if (!user) {
    window.location.href = "login.html?redirect=" + encodeURIComponent(currentPage);
  }
}

// ── Login Redirect ────────────────────────────────────────────────────────────
function setupLoginRedirect() {
  if (currentPageName() !== "login.html") return;
  const params = new URLSearchParams(window.location.search);
  const redirectTarget = params.get("redirect");
  if (!redirectTarget) return;
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session?.user) {
      window.location.href = decodeURIComponent(redirectTarget);
    }
  });
}

// ── Hilfsfunktion ─────────────────────────────────────────────────────────────
function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ── data-guest-only / data-auth-only direkt steuern (für index.html) ────────
function applyAuthVisibility(user, seller) {
  // Gast-Elemente: nur anzeigen wenn NICHT eingeloggt
  document.querySelectorAll("[data-guest-only]").forEach(el => {
    el.style.display = user ? "none" : "";
  });

  // Auth-Elemente in der TOPBAR anzeigen (Mein Konto / Nachrichten oben)
  // In .header-right bleiben sie versteckt – dort übernimmt der Avatar-Button
  document.querySelectorAll("[data-auth-only]").forEach(el => {
    if (el.closest(".header-right")) {
      el.style.display = "none";
    } else {
      el.style.display = user ? "" : "none";
    }
  });

  const headerRight = document.querySelector(".header-right");
  if (!headerRight) return;

  const existing = document.getElementById("hdr-avatar-btn")?.closest(".auth-avatar-wrapper");

  // Abgemeldet (z. B. in anderem Tab) → Avatar entfernen
  if (!user) { existing?.remove(); return; }

  // Startseite: Avatar-Button mit demselben Menü wie auf den Konto-Seiten
  if (existing) {
    existing.innerHTML = accountMenuHTML("hdr", user, seller);
    wireAccountMenu("hdr", existing);
    return;
  }

  const avatarWrapper = document.createElement("div");
  avatarWrapper.className = "auth-avatar-wrapper";
  avatarWrapper.innerHTML = accountMenuHTML("hdr", user, seller);

  // Vor dem letzten Button (Anzeige erstellen) einfügen
  const lastBtn = headerRight.querySelector("a:last-of-type");
  headerRight.insertBefore(avatarWrapper, lastBtn);

  wireAccountMenu("hdr", avatarWrapper);
}

// ── Merkliste (favorites.js) auf jeder Seite verfügbar machen ────────────────
// Läuft nach DOMContentLoaded, damit eine statisch eingebundene favorites.js
// (z. B. in suche.html) erkannt und nicht doppelt geladen wird.
function ensureFavorites() {
  if (window.Favs || document.querySelector('script[src*="favorites.js"]')) return;
  const s = document.createElement("script");
  s.src = "favorites.js?v=3";
  document.head.appendChild(s);
}

async function loadSeller(user) {
  if (!user) return null;
  const { data } = await supabaseClient
    .from("seller_profiles")
    .select("id, company_name")
    .eq("user_id", user.id)
    .maybeSingle();
  return data || null;
}

function renderAll(actionsEl, user, seller) {
  applyAuthVisibility(user, seller);
  if (actionsEl) {
    if (user) renderAuthHeader(actionsEl, user, seller);
    else renderGuestHeader(actionsEl);
  }
  updateSidebar(user || {}, seller);
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  injectStyles();
  setupMenuCloser();
  ensureFavorites();
  setupLoginRedirect();

  const actionsEl = document.querySelector(".header-actions");

  // Session laden
  const { data: sessionData } = await supabaseClient.auth.getSession();
  const user = sessionData?.session?.user || null;

  await guardPage(user);

  const seller = await loadSeller(user);
  renderAll(actionsEl, user, seller);

  // Auth-State-Änderungen (Login/Logout in anderem Tab)
  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    const currentUser = session?.user || null;
    const currentSeller = await loadSeller(currentUser);
    renderAll(actionsEl, currentUser, currentSeller);
  });
});
