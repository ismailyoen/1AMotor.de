document.addEventListener("DOMContentLoaded", async () => {
  const grid        = document.getElementById("my-listings-grid");
  const filterSearch = document.getElementById("filter-search");
  const filterStatus = document.getElementById("filter-status");
  const filterCount  = document.getElementById("filter-count");
  const avatarEl    = document.getElementById("sidebar-avatar");
  const nameEl      = document.querySelector(".user-box-name");
  const emailEl     = document.querySelector(".user-box-email");

  if (!grid) return;

  // ── Auth ──────────────────────────────────────────────────────────────────
  const { data: sessionData } = await supabaseClient.auth.getSession();
  const user = sessionData?.session?.user;

  if (!user) {
    showEmpty("Nicht eingeloggt", "Bitte melde dich an um deine Anzeigen zu sehen.", "🔒");
    return;
  }

  // ── Seller ────────────────────────────────────────────────────────────────
  const { data: seller } = await supabaseClient
    .from("seller_profiles").select("id, company_name")
    .eq("user_id", user.id).single();

  if (!seller) { showEmpty("Kein Händlerprofil", "Für diesen Account wurde kein Händlerprofil angelegt.", "⚠️"); return; }

  const displayName = seller.company_name || user.email || "Händler";
  const initials = displayName.split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase() || "?";
  if (avatarEl) avatarEl.textContent = initials;
  if (nameEl)   nameEl.textContent   = displayName;
  if (emailEl)  emailEl.textContent  = user.email || "";

  // ── Listings ──────────────────────────────────────────────────────────────
  const { data: listings, error } = await supabaseClient
    .from("listings")
    .select(`id, title, manufacturer, model, condition, price, year, location, status, created_at, image_urls, categories(name)`)
    .eq("seller_id", seller.id)
    .order("created_at", { ascending: false });

  if (error) { showEmpty("Fehler beim Laden", "Bitte Seite neu laden.", "❌"); return; }

  // ── Anfragen zählen ───────────────────────────────────────────────────────
  let inquiryCountMap = {};
  if (listings?.length) {
    const { data: inq } = await supabaseClient
      .from("inquiries").select("listing_id").in("listing_id", listings.map(l=>l.id));
    (inq || []).forEach(i => { inquiryCountMap[i.listing_id] = (inquiryCountMap[i.listing_id]||0)+1; });
  }

  let allListings = listings || [];

  function render() {
    const q      = (filterSearch?.value || "").toLowerCase().trim();
    const status = filterStatus?.value || "";

    let filtered = allListings;
    if (q)      filtered = filtered.filter(l => (l.title||"").toLowerCase().includes(q) || (l.manufacturer||"").toLowerCase().includes(q));
    if (status) filtered = filtered.filter(l => l.status === status);

    if (filterCount) filterCount.textContent = `${filtered.length} Anzeige${filtered.length !== 1 ? "n" : ""}`;

    if (!filtered.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">📋</div>
          <h3>${allListings.length === 0 ? "Noch keine Anzeigen" : "Keine Treffer"}</h3>
          <p>${allListings.length === 0 ? "Erstelle dein erstes Inserat." : "Passe den Filter an."}</p>
          ${allListings.length === 0 ? '<a href="anzeige-erstellen.html" style="display:inline-block;background:#1a3a52;color:#fff;padding:11px 20px;border-radius:999px;font-weight:700;font-size:14px;">Jetzt erstellen</a>' : ""}
        </div>`;
      return;
    }

    grid.innerHTML = filtered.map(listing => {
      const category = Array.isArray(listing.categories) ? listing.categories[0]?.name || "–" : listing.categories?.name || "–";
      const price    = Number(listing.price||0).toLocaleString("de-DE",{style:"currency",currency:"EUR"});
      const date     = new Date(listing.created_at).toLocaleDateString("de-DE");
      const badgeClass = listing.status === "Freigegeben" ? "approved" : listing.status === "Entwurf" ? "draft" : "pending";
      const inqCount = inquiryCountMap[listing.id] || 0;
      const firstImg = Array.isArray(listing.image_urls) && listing.image_urls.length ? listing.image_urls[0] : null;
      const imgStyle = firstImg ? `background-image:url('${encodeURI(firstImg)}');background-size:cover;background-position:center;` : "";
      const icon     = firstImg ? "" : `<span style="font-size:44px;">${getCategoryIcon(category)}</span>`;

      return `
        <article class="listing-card">
          <div class="card-image" style="${imgStyle}">
            <span class="badge ${badgeClass}">${escapeHtml(listing.status||"–")}</span>
            ${icon}
          </div>
          <div class="card-body">
            <div class="card-title">${escapeHtml(listing.title||"Ohne Titel")}</div>
            <div class="card-meta">
              <span>📂 ${escapeHtml(category)}</span>
              <span>🏭 ${escapeHtml(listing.manufacturer||"–")}</span>
              <span>📍 ${escapeHtml(listing.location||"–")}</span>
            </div>
            <div class="card-price">${price}</div>
            <div class="card-stats">
              <span class="card-stat">📅 ${date}</span>
              <span class="card-stat" style="color:${inqCount>0?'#059669':'#6b7280'}">💬 ${inqCount} Anfrage${inqCount!==1?"n":""}</span>
              <span class="card-stat">🔧 ${escapeHtml(listing.condition||"–")}</span>
            </div>
            <div class="card-actions">
              <a href="listing-detail.html?id=${listing.id}" class="action-btn primary">Ansehen</a>
              <a href="anzeige-erstellen.html?edit=${listing.id}" class="action-btn">Bearbeiten</a>
              <button class="action-btn danger delete-btn" data-id="${listing.id}">Löschen</button>
            </div>
          </div>
        </article>`;
    }).join("");
  }

  render();
  filterSearch?.addEventListener("input", render);
  filterStatus?.addEventListener("change", render);

  // ── Löschen ───────────────────────────────────────────────────────────────
  grid.addEventListener("click", async (e) => {
    const btn = e.target.closest(".delete-btn");
    if (!btn) return;
    const id = btn.getAttribute("data-id");
    if (!confirm("Anzeige wirklich löschen? Alle Anfragen werden ebenfalls gelöscht.")) return;
    btn.textContent = "..."; btn.disabled = true;
    await supabaseClient.from("inquiries").delete().eq("listing_id", id);
    const { error } = await supabaseClient.from("listings").delete().eq("id", id).eq("seller_id", seller.id);
    if (error) { alert("Fehler beim Löschen."); btn.textContent = "Löschen"; btn.disabled = false; return; }
    allListings = allListings.filter(l => l.id !== id);
    delete inquiryCountMap[id];
    render();
  });
});

function showEmpty(title, msg, icon) {
  const grid = document.getElementById("my-listings-grid");
  if (!grid) return;
  grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">${icon}</div><h3>${title}</h3><p>${msg}</p></div>`;
}
function getCategoryIcon(cat) {
  const m = {"Automotor":"🚗","LKW Motor":"🚛","Elektromotor Industrie":"⚙️","Bootsmotor":"🚤","Traktormotor":"🚜","Hydraulikmotor":"🛠️","E-Bike Motor":"🚲","Robotermotor":"🤖","Austauschmotor":"🔄"};
  return m[cat] || "📦";
}
function escapeHtml(v) { return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
