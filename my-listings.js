/* my-listings.js – Stand 21.10.2026
   Änderung: Kein "Kein Händlerprofil gefunden" mehr. Fehlt das Profil,
   wird es automatisch angelegt – jeder kann inserieren. */

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

document.addEventListener("DOMContentLoaded", async () => {
  console.log("my-listings.js geladen");

  const grid         = document.getElementById("my-listings-grid");
  const filterSearch = document.getElementById("filter-search");
  const filterStatus = document.getElementById("filter-status");
  const filterCount  = document.getElementById("filter-count");

  if (!grid) return;

  // ── Session ───────────────────────────────────────────────────────────────
  const sessionResult = await supabaseClient.auth.getSession();
  const user = sessionResult?.data?.session?.user;

  if (!user) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-icon">🔒</div>
        <h3>Nicht eingeloggt</h3>
        <p>Bitte logge dich ein um deine Anzeigen zu sehen.</p>
        <a href="login.html" class="new-btn" style="display:inline-block;margin-top:12px;">Zum Login</a>
      </div>`;
    return;
  }

  // ── Anbieterprofil (wird bei Bedarf automatisch angelegt) ─────────────────
  const sellerResult = await window.ensureSellerProfile(user);
  const seller = sellerResult?.data;

  const displayName = (seller && seller.company_name) || user.email || "Mein Konto";
  const initials = displayName.split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase() || "?";
  const avatarEl = document.getElementById("sidebar-avatar");
  const nameEl   = document.querySelector(".user-box-name");
  const emailEl  = document.querySelector(".user-box-email");
  if (avatarEl) avatarEl.textContent = initials;
  if (nameEl)   nameEl.textContent   = displayName;
  if (emailEl)  emailEl.textContent  = user.email || "";

  if (!seller) {
    // Nur wenn die Datenbank wirklich nicht erreichbar war – kein Händler-Hinweis mehr
    console.error("PROFILE ERROR:", sellerResult?.error);
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-icon">📋</div>
        <h3>Noch keine Anzeigen</h3>
        <p>Leg einfach los – jeder kann kostenlos inserieren, privat oder gewerblich.</p>
        <a href="anzeige-erstellen.html" class="new-btn" style="display:inline-block;margin-top:12px;">Erste Anzeige erstellen</a>
      </div>`;
    if (filterCount) filterCount.textContent = "0 Anzeigen";
    return;
  }

  // ── Anzeigen laden ────────────────────────────────────────────────────────
  const { data: listings, error } = await supabaseClient
    .from("listings")
    .select("id, title, manufacturer, model, condition, price, year, location, status, created_at, image_urls, categories(name)")
    .eq("seller_id", seller.id)
    .order("created_at", { ascending: false });

  console.log("MY LISTINGS:", listings, error);

  if (error) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-icon">❌</div>
        <h3>Fehler beim Laden</h3>
        <p>Bitte Seite neu laden.</p>
      </div>`;
    if (filterCount) filterCount.textContent = "Fehler";
    return;
  }

  let allListings = listings || [];

  // ── Render ────────────────────────────────────────────────────────────────
  function renderListings(list) {
    if (filterCount) filterCount.textContent = list.length + " Anzeige" + (list.length === 1 ? "" : "n");

    if (!list.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-icon">📋</div>
          <h3>Keine Anzeigen gefunden</h3>
          <p>Du hast noch keine Anzeigen erstellt oder keine passen zum Filter.</p>
          <a href="anzeige-erstellen.html" class="new-btn" style="display:inline-block;margin-top:12px;">Erste Anzeige erstellen</a>
        </div>`;
      return;
    }

    grid.innerHTML = list.map(function(listing) {
      var category = Array.isArray(listing.categories)
        ? (listing.categories[0] ? listing.categories[0].name : "Unbekannt")
        : (listing.categories ? listing.categories.name : "Unbekannt");

      var price = Number(listing.price || 0).toLocaleString("de-DE", { style:"currency", currency:"EUR" });
      var date  = new Date(listing.created_at).toLocaleDateString("de-DE");
      var firstImage = Array.isArray(listing.image_urls) && listing.image_urls.length ? listing.image_urls[0] : null;
      var fallbackImg = window.getCategoryImage ? window.getCategoryImage(category) : null;
      var displayImage = firstImage || fallbackImg;
      var imageStyle = displayImage ? "background-image:url('" + displayImage + "');background-size:cover;background-position:center;" : "";
      var badgeClass = listing.status === "Freigegeben" ? "approved" : listing.status === "Entwurf" ? "draft" : "pending";

      return '<div class="listing-card">' +
        '<div class="card-image" style="' + imageStyle + '">' +
          (displayImage ? "" : "<span style='font-size:44px;'>⚙️</span>") +
          '<span class="badge ' + badgeClass + '">' + escapeHtml(listing.status || "-") + '</span>' +
        '</div>' +
        '<div class="card-body">' +
          '<div class="card-title">' + escapeHtml(listing.title || "Ohne Titel") + '</div>' +
          '<div class="card-meta">' +
            '<span>📦 ' + escapeHtml(category) + '</span>' +
            '<span>📍 ' + escapeHtml(listing.location || "-") + '</span>' +
            '<span>📅 ' + date + '</span>' +
          '</div>' +
          '<div class="card-price">' + price + '</div>' +
          '<div class="card-stats">' +
            '<span class="card-stat">🏭 ' + escapeHtml(listing.manufacturer || "-") + '</span>' +
            '<span class="card-stat">🔧 ' + escapeHtml(listing.condition || "-") + '</span>' +
          '</div>' +
          '<div class="card-actions">' +
            '<a href="listing-detail.html?id=' + listing.id + '" class="action-btn primary">Ansehen</a>' +
            '<a href="anzeige-erstellen.html?edit=' + listing.id + '" class="action-btn">Bearbeiten</a>' +
            '<button class="action-btn danger delete-listing-btn" data-id="' + listing.id + '">Löschen</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join("");

    // Delete Handler
    grid.querySelectorAll(".delete-listing-btn").forEach(function(btn) {
      btn.addEventListener("click", async function(e) {
        e.preventDefault();
        var listingId = btn.dataset.id;
        if (!confirm("Anzeige wirklich löschen? Alle zugehörigen Nachrichten werden ebenfalls gelöscht.")) return;

        btn.disabled = true;
        btn.textContent = "Wird gelöscht...";

        var inqResult = await supabaseClient.from("inquiries").select("id").eq("listing_id", listingId);
        var inquiryIds = (inqResult.data || []).map(function(i) { return i.id; });

        if (inquiryIds.length) {
          await supabaseClient.from("inquiry_messages").delete().in("inquiry_id", inquiryIds);
          await supabaseClient.from("inquiries").delete().in("id", inquiryIds);
        }

        var delResult = await supabaseClient.from("listings").delete().eq("id", listingId);

        if (delResult.error) {
          alert("Fehler beim Löschen. Bitte erneut versuchen.");
          btn.disabled = false;
          btn.textContent = "Löschen";
          return;
        }

        allListings = allListings.filter(function(l) { return l.id !== listingId; });
        applyFilter();
      });
    });
  }

  // ── Filter ────────────────────────────────────────────────────────────────
  function applyFilter() {
    var searchVal = (filterSearch ? filterSearch.value : "").toLowerCase().trim();
    var statusVal = filterStatus ? filterStatus.value : "";

    var filtered = allListings.filter(function(l) {
      var matchSearch = !searchVal ||
        (l.title || "").toLowerCase().includes(searchVal) ||
        (l.manufacturer || "").toLowerCase().includes(searchVal) ||
        (l.model || "").toLowerCase().includes(searchVal);
      var matchStatus = !statusVal || l.status === statusVal;
      return matchSearch && matchStatus;
    });

    renderListings(filtered);
  }

  if (filterSearch) filterSearch.addEventListener("input", applyFilter);
  if (filterStatus) filterStatus.addEventListener("change", applyFilter);

  renderListings(allListings);
});

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
