/* auth.js – Stand 22.10.2026
   Änderung: Kontotypen heißen jetzt nur noch "Käufer" und "Verkäufer"
   (kein "Händler" mehr). registrieren.html?typ=kaeufer|verkaeufer wählt
   den Typ vor. Verkäufer landen nach der Registrierung direkt bei
   "Anzeige erstellen". Jeder Nutzer bekommt weiterhin ein Anbieterprofil. */

document.addEventListener("DOMContentLoaded", () => {
  setupRegisterForm();
  setupLoginForm();
  setupLogoutLinks();
});

// ── Kontotyp: nur Käufer / Verkäufer ─────────────────────────────────────────
const KONTOTYP_TEXT = {
  kaeufer:    { de: "Käufer",    en: "Buyer",  fr: "Acheteur", tr: "Alıcı"  },
  verkaeufer: { de: "Verkäufer", en: "Seller", fr: "Vendeur",  tr: "Satıcı" }
};

function kontotypLang() {
  const l = (window.I18n && window.I18n.lang) || "de";
  return KONTOTYP_TEXT.kaeufer[l] ? l : "de";
}

// Macht aus einer alten "Händler"-Option eine "Verkäufer"-Option und
// wählt den Typ aus der URL vor (?typ=kaeufer|verkaeufer, alt: ?type=dealer).
function setupKontotypSelect(select) {
  if (!select) return;
  const lang = kontotypLang();

  Array.from(select.options).forEach((opt) => {
    const v = (opt.value || "").trim();
    const t = (opt.textContent || "").trim();
    const key = opt.getAttribute("data-i18n") || "";
    if (v === "Händler" || t === "Händler" || key === "register.seller" || v === "Verkäufer") {
      opt.value = "Verkäufer";
      opt.textContent = KONTOTYP_TEXT.verkaeufer[lang];
      opt.removeAttribute("data-i18n");          // sonst setzt i18n.js wieder "Händler"
    } else if (v === "Käufer" || t === "Käufer" || key === "register.buyer") {
      opt.value = "Käufer";
      opt.textContent = KONTOTYP_TEXT.kaeufer[lang];
      opt.removeAttribute("data-i18n");
    }
  });

  const p = new URLSearchParams(window.location.search);
  const typ = (p.get("typ") || p.get("type") || "").toLowerCase();
  const wantSeller = ["verkaeufer", "verkäufer", "seller", "dealer", "haendler", "händler"].includes(typ);
  const wantBuyer  = ["kaeufer", "käufer", "buyer"].includes(typ);
  if (wantSeller || wantBuyer) {
    const target = wantSeller ? "Verkäufer" : "Käufer";
    const opt = Array.from(select.options).find((o) => o.value === target);
    if (opt) select.value = target;
  }
}

// ── Registrierung ─────────────────────────────────────────────────────────────
function setupRegisterForm() {
  const pageTitle = document.title.toLowerCase();
  if (!pageTitle.includes("registrieren")) return;

  const form = document.querySelector("form");
  const submitBtn = form?.querySelector('button[type="submit"]');
  if (!form) return;

  setupKontotypSelect(form.querySelector("select") || document.querySelector("select"));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const accountType = document.querySelector("select")?.value || "Käufer";
    const fullName    = document.querySelector('input[type="text"]')?.value?.trim() || "";
    const email       = document.querySelector('input[type="email"]')?.value?.trim() || "";
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    const password       = passwordInputs[0]?.value || "";
    const passwordRepeat = passwordInputs[1]?.value || "";

    if (!fullName || !email || !password) {
      showMsg(form, "Bitte alle Pflichtfelder ausfüllen.", "error"); return;
    }
    if (password.length < 6) {
      showMsg(form, "Passwort muss mindestens 6 Zeichen haben.", "error"); return;
    }
    if (password !== passwordRepeat) {
      showMsg(form, "Die Passwörter stimmen nicht überein.", "error"); return;
    }

    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Wird registriert..."; }

    // "Händler" nur noch für alte Formulare – zählt als Verkäufer
    const isSeller = accountType === "Verkäufer" || accountType === "Händler";
    const role = isSeller ? "seller" : "buyer";

    // 1. Registrierung
    const { data, error } = await supabaseClient.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, role } }
    });

    console.log("SIGNUP DATA:", data);
    console.log("SIGNUP ERROR:", error);

    if (error) {
      showMsg(form, "Registrierung fehlgeschlagen: " + error.message, "error");
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Registrieren"; }
      return;
    }

    // 2. Direkt einloggen
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (loginError) {
      showMsg(form, "Registriert! Bitte jetzt einloggen.", "success");
      setTimeout(() => { window.location.href = "login.html"; }, 2000);
      return;
    }

    const user = loginData?.user;

    // 3. Anbieterprofil für ALLE anlegen – jeder darf inserieren.
    //    Fehlt es trotzdem mal, legt anzeige-erstellen es beim ersten Inserat an.
    if (user) {
      const { error: profileError } = await supabaseClient
        .from("seller_profiles")
        .upsert([{
          user_id:      user.id,
          company_name: fullName,
          email:        email,
          city:         "",
          country:      "DE"
        }], { onConflict: "user_id" });

      if (profileError) console.warn("Profil wird beim ersten Inserat angelegt:", profileError);
    }

    showMsg(form, "Registrierung erfolgreich! Du wirst weitergeleitet...", "success");
    // Verkäufer direkt zum ersten Inserat, Käufer ins Dashboard
    const ziel = isSeller ? "anzeige-erstellen.html" : "dashboard.html";
    setTimeout(() => { window.location.href = ziel; }, 1500);
  });
}

// ── Login ─────────────────────────────────────────────────────────────────────
function setupLoginForm() {
  const pageTitle = document.title.toLowerCase();
  const isLoginPage = pageTitle.includes("login") ||
                      pageTitle.includes("einloggen") ||
                      window.location.pathname.includes("login");
  if (!isLoginPage) return;

  const form      = document.getElementById("login-form") || document.querySelector("form");
  const emailEl   = document.getElementById("login-email")    || document.querySelector('input[type="email"]');
  const passEl    = document.getElementById("login-password") || document.querySelector('input[type="password"]');
  const submitBtn = document.getElementById("login-btn")      || form?.querySelector('button[type="submit"]');
  const msgEl     = document.getElementById("login-msg");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email    = emailEl?.value?.trim() || "";
    const password = passEl?.value || "";

    if (!email || !password) {
      showMsg(form, "Bitte E-Mail und Passwort eingeben.", "error", msgEl); return;
    }

    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Einloggen..."; }

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
      let msg = "Login fehlgeschlagen.";
      if (error.message.includes("Invalid login credentials")) {
        msg = "E-Mail oder Passwort falsch.";
      } else if (error.message.includes("Email not confirmed")) {
        msg = "E-Mail noch nicht bestätigt. Bitte prüfe deinen Posteingang.";
      }
      showMsg(form, msg, "error", msgEl);
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Einloggen"; }
      return;
    }

    showMsg(form, "✅ Login erfolgreich! Du wirst weitergeleitet...", "success", msgEl);
    setTimeout(() => { window.location.href = "dashboard.html"; }, 1000);
  });
}

// ── Logout ────────────────────────────────────────────────────────────────────
function setupLogoutLinks() {
  const logoutLinks = Array.from(document.querySelectorAll('a[href="login.html"]'))
    .filter(link => link.textContent.toLowerCase().includes("abmelden") ||
                    link.textContent.toLowerCase().includes("logout") ||
                    link.getAttribute("data-logout") === "true");

  logoutLinks.forEach(link => {
    link.addEventListener("click", async (e) => {
      e.preventDefault();
      await supabaseClient.auth.signOut();
      window.location.href = "login.html";
    });
  });
}

// ── Hilfsfunktion: Nachricht anzeigen ─────────────────────────────────────────
function showMsg(form, text, type, customEl) {
  let el = customEl || document.getElementById("auth-msg");
  if (!el) {
    el = document.createElement("div");
    el.id = "auth-msg";
    el.style.cssText = `
      margin-top: 14px; padding: 12px 16px; border-radius: 10px;
      font-size: 14px; font-weight: 600; text-align: center;
    `;
    form.appendChild(el);
  }
  el.textContent = text;
  el.style.display    = "block";
  el.style.background = type === "error" ? "#fef2f2" : "#f0fdf4";
  el.style.color       = type === "error" ? "#dc2626"  : "#16a34a";
  el.style.border      = type === "error" ? "1px solid #fecaca" : "1px solid #bbf7d0";
}
