document.addEventListener("DOMContentLoaded", () => {
  setupRegisterForm();
  setupLoginForm();
  setupLogoutLinks();
});

// ── Registrierung ─────────────────────────────────────────────────────────────
function setupRegisterForm() {
  const pageTitle = document.title.toLowerCase();
  if (!pageTitle.includes("registrieren")) return;

  const form = document.querySelector("form");
  const submitBtn = form?.querySelector('button[type="submit"]');
  if (!form) return;

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

    const role = accountType === "Händler" ? "seller" : "buyer";

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

    // 3. Seller Profile anlegen wenn Händler
    if (role === "seller" && user) {
      const { error: profileError } = await supabaseClient
        .from("seller_profiles")
        .upsert([{
          user_id:      user.id,
          company_name: fullName,
          email:        email,
          city:         "",
          country:      "DE"
        }], { onConflict: "user_id" });

      if (profileError) console.warn("Seller profile error:", profileError);
    }

    showMsg(form, "Registrierung erfolgreich! Du wirst weitergeleitet...", "success");
    setTimeout(() => { window.location.href = "dashboard.html"; }, 1500);
  });
}

// ── Login ─────────────────────────────────────────────────────────────────────
function setupLoginForm() {
  const pageTitle = document.title.toLowerCase();
  if (!pageTitle.includes("login")) return;

  const form = document.querySelector("form");
  const submitBtn = form?.querySelector('button[type="submit"]');
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email    = document.querySelector('input[type="email"]')?.value?.trim() || "";
    const password = document.querySelector('input[type="password"]')?.value || "";

    if (!email || !password) {
      showMsg(form, "Bitte E-Mail und Passwort eingeben.", "error"); return;
    }

    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Einloggen..."; }

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    console.log("LOGIN DATA:", data);
    console.log("LOGIN ERROR:", error);

    if (error) {
      let msg = "Login fehlgeschlagen.";
      if (error.message.includes("Invalid login credentials")) {
        msg = "E-Mail oder Passwort falsch. Bitte erneut versuchen.";
      } else if (error.message.includes("Email not confirmed")) {
        msg = "E-Mail noch nicht bestätigt. Bitte prüfe deinen Posteingang.";
      }
      showMsg(form, msg, "error");
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Einloggen"; }
      return;
    }

    showMsg(form, "Login erfolgreich! Du wirst weitergeleitet...", "success");
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
function showMsg(form, text, type) {
  let el = document.getElementById("auth-msg");
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
  el.style.background = type === "error" ? "#fef2f2" : "#f0fdf4";
  el.style.color       = type === "error" ? "#dc2626"  : "#16a34a";
  el.style.border      = type === "error" ? "1px solid #fecaca" : "1px solid #bbf7d0";
}
