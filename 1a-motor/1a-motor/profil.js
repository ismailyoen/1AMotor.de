document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("profil-form");
  if (!form) return;

  let sellerId   = null;
  let logoUrl    = null;

  // ── Auth ──────────────────────────────────────────────────────────────────
  const { data: sessionData } = await supabaseClient.auth.getSession();
  const user = sessionData?.session?.user;

  if (!user) { window.location.href = "login.html"; return; }

  // ── Seller laden ──────────────────────────────────────────────────────────
  const { data: seller, error } = await supabaseClient
    .from("seller_profiles").select("*").eq("user_id", user.id).single();

  if (error || !seller) {
    alert("Profil konnte nicht geladen werden.");
    return;
  }

  sellerId = seller.id;
  logoUrl  = seller.logo_url || null;

  // Felder befüllen
  const fields = ["company_name","contact_name","email","phone","website","street","zip","city","country","vat","company_type","description","specialization","response_time","languages"];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = seller[id] || "";
  });

  // Sidebar befüllen
  const displayName = seller.company_name || user.email || "Händler";
  const initials = displayName.split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase()||"?";
  const sidebarAvatar = document.getElementById("sidebar-avatar");
  const sidebarName   = document.getElementById("sidebar-name");
  const sidebarEmail  = document.getElementById("sidebar-email");
  if (sidebarAvatar) sidebarAvatar.textContent = initials;
  if (sidebarName)   sidebarName.textContent   = displayName;
  if (sidebarEmail)  sidebarEmail.textContent  = user.email || "";

  // Logo-Vorschau wenn vorhanden
  if (logoUrl) {
    const box = document.getElementById("logo-preview-box");
    const previewLogo = document.getElementById("preview-logo");
    if (box) box.innerHTML = `<img src="${logoUrl}" alt="Logo"><div class="overlay" onclick="document.getElementById('logo-upload').click()">📷</div>`;
    if (previewLogo) previewLogo.innerHTML = `<img src="${logoUrl}" alt="Logo" style="width:100%;height:100%;object-fit:cover;">`;
  } else {
    const logoInitials = document.getElementById("logo-initials");
    if (logoInitials) logoInitials.textContent = initials;
  }

  // Vorschau initial befüllen
  const pName     = document.getElementById("preview-name");
  const pSub      = document.getElementById("preview-sub");
  const pSpec     = document.getElementById("preview-spec");
  const pResponse = document.getElementById("preview-response");
  const pLang     = document.getElementById("preview-lang");
  const pWeb      = document.getElementById("preview-web");
  const pInitials = document.getElementById("preview-initials");
  if (pName)     pName.textContent     = seller.company_name || "Firmenname";
  if (pSub)      pSub.textContent      = `${seller.city||"–"}, ${seller.country||"Deutschland"}`;
  if (pSpec)     pSpec.textContent     = seller.specialization || "–";
  if (pResponse) pResponse.textContent = seller.response_time || "–";
  if (pLang)     pLang.textContent     = seller.languages || "–";
  if (pWeb)      pWeb.textContent      = seller.website || "–";
  if (pInitials) pInitials.textContent = initials;

  // ── Speichern ─────────────────────────────────────────────────────────────
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector(".btn-primary");
    const successEl = document.getElementById("save-success");
    btn.disabled = true;
    btn.textContent = "Speichert...";

    // Logo hochladen falls neu gewählt
    const logoFile = document.getElementById("logo-upload")?.files?.[0];
    if (logoFile) {
      const ext      = logoFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `logos/${user.id}/logo-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabaseClient.storage
        .from("listing-images").upload(fileName, logoFile, { upsert: true });

      if (!uploadErr) {
        const { data: urlData } = supabaseClient.storage.from("listing-images").getPublicUrl(fileName);
        logoUrl = urlData?.publicUrl || logoUrl;
      }
    }

    const payload = {};
    ["company_name","contact_name","email","phone","website","street","zip","city","country","vat","company_type","description","specialization","response_time","languages"].forEach(id => {
      const el = document.getElementById(id);
      if (el) payload[id] = el.value;
    });
    if (logoUrl) payload.logo_url = logoUrl;

    const { error: saveErr } = await supabaseClient
      .from("seller_profiles").update(payload).eq("id", sellerId);

    btn.disabled = false;
    btn.textContent = "Profil speichern";

    if (saveErr) {
      console.error("UPDATE ERROR:", saveErr);
      alert("Fehler beim Speichern: " + saveErr.message);
      return;
    }

    if (successEl) {
      successEl.style.display = "flex";
      setTimeout(() => { successEl.style.display = "none"; }, 3000);
    }
  });
});
