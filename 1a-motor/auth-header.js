// ── Geschützte Seiten ─────────────────────────────────────────────────────────
const PROTECTED_PAGES = [
  "dashboard.html",
  "anzeige-erstellen.html",
  "meine-anzeigen.html",
  "anfragen.html",
  "profil.html",
  "pakete.html"
];

// ── CSS für Avatar-Dropdown ───────────────────────────────────────────────────
const HEADER_STYLES = `
  .auth-nav { display:flex; align-items:center; gap:16px; font-size:14px; flex-wrap:wrap; }

  .auth-avatar-btn {
    display:flex; align-items:center; gap:10px;
    background:#f0f6ff; border:1px solid #d0e4f7;
    border-radius:999px; padding:7px 14px 7px 7px;
    cursor:pointer; font-size:14px; font-weight:700;
    color:#123a63; position:relative;
    transition: background .15s;
  }
  .auth-avatar-btn:hover { background:#dbeeff; }

  .auth-avatar-circle {
    width:32px; height:32px; border-radius:50%;
    background:linear-gradient(135deg,#123a63,#72b6ff);
    color:#fff; display:grid; place-items:center;
    font-size:13px; font-weight:800; flex-shrink:0;
  }

  .auth-avatar-name { max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

  .auth-dropdown {
    position:absolute; top:calc(100% + 10px); right:0;
    background:#fff; border:1px solid #dbe3ea;
    border-radius:16px; box-shadow:0 16px 40px rgba(18,58,99,0.14);
    min-width:210px; z-index:100; overflow:hidden;
    display:none;
  }
  .auth-dropdown.open { display:block; }

  .auth-dropdown-header {
    padding:14px 16px 12px;
    border-bottom:1px solid #dbe3ea;
    background:#f8fbff;
  }
  .auth-dropdown-header strong {
    display:block; font-size:14px; color:#123a63; margin-bottom:2px;
  }
  .auth-dropdown-header span { font-size:12px; color:#6b7280; }

  .auth-dropdown a, .auth-dropdown button {
    display:flex; align-items:center; gap:10px;
    width:100%; padding:12px 16px;
    font-size:14px; color:#334155; font-weight:600;
    background:none; border:none; cursor:pointer;
    text-decoration:none; text-align:left;
    transition: background .12s;
  }
  .auth-dropdown a:hover, .auth-dropdown button:hover { background:#f0f6ff; color:#123a63; }

  .auth-dropdown .divider { height:1px; background:#dbe3ea; margin:4px 0; }

  .auth-dropdown .logout-item { color:#d93025; }
  .auth-dropdown .logout-item:hover { background:#fff5f4; color:#d93025; }

  .auth-avatar-wrapper { position:relative; }

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

// ── Header neu rendern ────────────────────────────────────────────────────────
function renderGuestHeader(actionsEl) {
  actionsEl.innerHTML = `
    <nav class="guest-nav">
      <a href="suche.html">Suche</a>
      <a href="login.html" class="login-btn">Einloggen</a>
      <a href="registrieren.html" class="register-btn">Registrieren</a>
    </nav>
  `;
}

function renderAuthHeader(actionsEl, user, seller) {
  const displayName = seller?.company_name || user.email || "Mein Konto";
  const initials = displayName
    .split(" ").filter(Boolean).slice(0, 2)
    .map(w => w[0]).join("").toUpperCase() || "?";
  const email = user.email || "";

  actionsEl.innerHTML = `
    <nav class="auth-nav">
      <a href="suche.html" style="color:#334155;font-weight:600;">Suche</a>
      <div class="auth-avatar-wrapper">
        <button class="auth-avatar-btn" id="auth-avatar-btn" type="button">
          <span class="auth-avatar-circle">${initials}</span>
          <span class="auth-avatar-name">${escapeHtml(displayName)}</span>
          <span style="font-size:10px;margin-left:2px;">▾</span>
        </button>
        <div class="auth-dropdown" id="auth-dropdown">
          <div class="auth-dropdown-header">
            <strong>${escapeHtml(displayName)}</strong>
            <span>${escapeHtml(email)}</span>
          </div>
          <a href="dashboard.html">📊 Dashboard</a>
          <a href="meine-anzeigen.html">📋 Meine Anzeigen</a>
          <a href="anfragen.html">💬 Anfragen</a>
          <a href="anzeige-erstellen.html">➕ Anzeige erstellen</a>
          <a href="profil.html">⚙️ Profil</a>
          <div class="divider"></div>
          <button class="logout-item" id="auth-logout-btn">🚪 Abmelden</button>
        </div>
      </div>
    </nav>
  `;

  // Dropdown toggle
  const btn = document.getElementById("auth-avatar-btn");
  const dropdown = document.getElementById("auth-dropdown");

  btn?.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown?.classList.toggle("open");
  });

  document.addEventListener("click", () => {
    dropdown?.classList.remove("open");
  }, { capture: false });

  // Logout
  document.getElementById("auth-logout-btn")?.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "index.html";
  });
}

// ── Sidebar User-Box aktualisieren (Dashboard, Meine Anzeigen etc.) ───────────
function updateSidebar(user, seller) {
  const heading = document.querySelector(".user-box h2");
  const sub = document.querySelector(".user-box p");
  if (heading) heading.textContent = seller?.company_name || user.email || "Mein Konto";
  if (sub) sub.textContent = user.email || "Händlerkonto";
}

// ── Page Guard ────────────────────────────────────────────────────────────────
async function guardPage(user) {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  if (!PROTECTED_PAGES.includes(currentPage)) return;
  if (!user) {
    window.location.href = "login.html?redirect=" + encodeURIComponent(currentPage);
  }
}

// ── Login Redirect ────────────────────────────────────────────────────────────
function setupLoginRedirect() {
  const currentPage = window.location.pathname.split("/").pop() || "";
  if (currentPage !== "login.html") return;
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
  // Elemente ein-/ausblenden
  document.querySelectorAll("[data-guest-only]").forEach(el => {
    el.style.display = user ? "none" : "";
  });
  document.querySelectorAll("[data-auth-only]").forEach(el => {
    el.style.display = user ? "" : "none";
  });

  // Falls header-right existiert (index.html): Avatar-Button einfügen
  const headerRight = document.querySelector(".header-right");
  if (headerRight && user) {
    const displayName = seller?.company_name || user.email || "Konto";
    const initials = displayName.split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase() || "?";

    // Nur einmal einfügen
    if (!document.getElementById("hdr-avatar-btn")) {
      const avatarWrapper = document.createElement("div");
      avatarWrapper.className = "auth-avatar-wrapper";
      avatarWrapper.innerHTML = `
        <button class="auth-avatar-btn" id="hdr-avatar-btn" type="button">
          <span class="auth-avatar-circle">${initials}</span>
          <span class="auth-avatar-name">${escapeHtml(displayName)}</span>
          <span style="font-size:10px;margin-left:2px;">▾</span>
        </button>
        <div class="auth-dropdown" id="hdr-dropdown">
          <div class="auth-dropdown-header">
            <strong>${escapeHtml(displayName)}</strong>
            <span>${escapeHtml(user.email || "")}</span>
          </div>
          <a href="dashboard.html">📊 Dashboard</a>
          <a href="meine-anzeigen.html">📋 Meine Anzeigen</a>
          <a href="anfragen.html">💬 Anfragen</a>
          <a href="meine-anfragen.html">✉️ Nachrichten</a>
          <a href="anzeige-erstellen.html">➕ Anzeige erstellen</a>
          <a href="profil.html">⚙️ Profil</a>
          <div class="divider"></div>
          <button class="logout-item" id="hdr-logout-btn">🚪 Abmelden</button>
        </div>
      `;

      // Vor dem letzten Button (Anzeige erstellen) einfügen
      const lastBtn = headerRight.querySelector("a:last-of-type");
      headerRight.insertBefore(avatarWrapper, lastBtn);

      // Dropdown Toggle
      const btn = document.getElementById("hdr-avatar-btn");
      const dropdown = document.getElementById("hdr-dropdown");
      btn?.addEventListener("click", (e) => { e.stopPropagation(); dropdown?.classList.toggle("open"); });
      document.addEventListener("click", () => dropdown?.classList.remove("open"));

      // Logout
      document.getElementById("hdr-logout-btn")?.addEventListener("click", async () => {
        await supabaseClient.auth.signOut();
        window.location.href = "index.html";
      });
    }
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  injectStyles();
  setupLoginRedirect();

  const actionsEl = document.querySelector(".header-actions");

  // Session laden
  const { data: sessionData } = await supabaseClient.auth.getSession();
  const user = sessionData?.session?.user || null;

  await guardPage(user);

  let seller = null;
  if (user) {
    const { data } = await supabaseClient
      .from("seller_profiles")
      .select("id, company_name")
      .eq("user_id", user.id)
      .maybeSingle();
    seller = data || null;
  }

  // Für index.html: data-guest/auth-only steuern + Avatar einfügen
  applyAuthVisibility(user, seller);

  // Für andere Seiten: header-actions komplett neu rendern
  if (actionsEl) {
    if (user) {
      renderAuthHeader(actionsEl, user, seller);
    } else {
      renderGuestHeader(actionsEl);
    }
  }

  updateSidebar(user || {}, seller);

  // Auth-State-Änderungen (Login/Logout in anderem Tab)
  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    const currentUser = session?.user || null;
    let currentSeller = null;

    if (currentUser) {
      const { data } = await supabaseClient
        .from("seller_profiles")
        .select("id, company_name")
        .eq("user_id", currentUser.id)
        .maybeSingle();
      currentSeller = data || null;
    }

    applyAuthVisibility(currentUser, currentSeller);

    if (actionsEl) {
      if (currentUser) {
        renderAuthHeader(actionsEl, currentUser, currentSeller);
      } else {
        renderGuestHeader(actionsEl);
      }
    }

    updateSidebar(currentUser || {}, currentSeller);
  });
});
