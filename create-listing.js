/* create-listing.js – Stand 21.10.2026
   Änderung: Inserieren ohne Händlerkonto. Jeder eingeloggte Nutzer (privat
   oder gewerblich) kann Anzeigen hochladen – das Anbieterprofil wird bei
   Bedarf automatisch angelegt. "Als Entwurf speichern" speichert jetzt
   wirklich als Entwurf statt sofort zu veröffentlichen. */

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
  console.log("create-listing.js wurde geladen");

  const form = document.querySelector("form");
  const fileInput = document.getElementById("bilder");
  const previewGrid = document.querySelector(".preview-grid");
  const pageTitle = document.querySelector(".page-head h1");

  if (!form) {
    console.log("Kein Formular gefunden");
    return;
  }

  // Profil schon beim Öffnen der Seite anlegen + Kontotyp in der Sidebar zeigen
  setAccountLabel();

  const params = new URLSearchParams(window.location.search);
  const editListingId = params.get("edit");
  let existingImageUrls = [];

  if (editListingId) {
    console.log("Bearbeitungsmodus aktiv. Listing-ID:", editListingId);
    if (pageTitle) pageTitle.textContent = "Anzeige bearbeiten";
    existingImageUrls = await loadListingForEdit(editListingId);
  }

  setupImagePreview(fileInput, previewGrid);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("Formular wurde abgeschickt");

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

      // ── Versandoptionen einlesen ──────────────────────────────────────────
      const shippingOptions = [];
      const carriers = [
        { id: 'dhl',       label: 'DHL' },
        { id: 'dpd',       label: 'DPD' },
        { id: 'hermes',    label: 'Hermes' },
        { id: 'ups',       label: 'UPS' },
        { id: 'spedition', label: 'Spedition' },
      ];
      carriers.forEach(({ id, label }) => {
        const cb = document.getElementById('ship-' + id);
        if (cb?.checked) {
          const priceEl = document.getElementById('ship-' + id + '-price');
          const shipPrice = priceEl ? parseFloat(priceEl.value) || null : null;
          shippingOptions.push({ carrier: label, price: shipPrice });
        }
      });
      if (document.getElementById('ship-pickup')?.checked) {
        shippingOptions.push({ carrier: 'Abholung', price: 0 });
      }
      const customCb   = document.getElementById('ship-custom');
      const customName = document.getElementById('ship-custom-name')?.value?.trim();
      if (customCb?.checked && customName) {
        shippingOptions.push({ carrier: customName, price: null });
      }

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

      const { data: categories, error: categoryError } = await supabaseClient
        .from("categories")
        .select("id, name, slug")
        .eq("slug", categorySlug);

      if (categoryError || !categories || categories.length === 0) {
        console.error("CATEGORY ERROR:", categoryError);
        fail("Kategorie nicht gefunden.");
        return;
      }

      const category = categories[0];

      // ── Anbieterprofil: vorhanden nehmen oder automatisch anlegen ─────────
      // Kein Händlerkonto nötig – privat und gewerblich gleich behandelt.
      const sellerResult = await window.ensureSellerProfile(user);
      console.log("SELLER RESULT:", sellerResult);

      if (sellerResult.error || !sellerResult.data) {
        console.error("PROFILE ERROR:", sellerResult.error);
        fail("Dein Konto konnte gerade nicht vorbereitet werden. Bitte Seite neu laden und nochmal versuchen. " +
             "Bleibt der Fehler, melde dich bitte über kontakt.html.");
        return;
      }

      const newUploadedImageUrls = await uploadListingImages(fileInput?.files || [], user.id);
      const finalImageUrls = [...existingImageUrls, ...newUploadedImageUrls];

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
        image_urls: finalImageUrls,
        shipping_options: shippingOptions.length ? shippingOptions : null
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

      if (typeof window.onListingSuccess === "function") window.onListingSuccess();
      else alert(editListingId ? "Anzeige wurde aktualisiert!" : isDraft ? "Entwurf gespeichert!" : "Anzeige wurde veröffentlicht!");

      form.reset();
      existingImageUrls = [];
      resetPreview(previewGrid);

      setTimeout(() => { window.location.href = "meine-anzeigen.html"; }, 1200);
    } catch (err) {
      console.error("UNCAUGHT ERROR IN CREATE-LISTING:", err);
      fail("Es ist ein Fehler aufgetreten. Bitte Seite neu laden.");
    }
  });

  // Fehler anzeigen und das Lade-Overlay schließen
  function fail(msg) {
    if (typeof window.onListingError === "function") window.onListingError();
    alert(msg);
  }

  async function setAccountLabel() {
    try {
      const { data: sd } = await supabaseClient.auth.getSession();
      const user = sd?.session?.user;
      if (!user) return;
      const { data: seller } = await window.ensureSellerProfile(user);
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

    const imageUrls = Array.isArray(listing.image_urls) ? listing.image_urls : [];
    renderExistingImages(previewGrid, imageUrls);
    return imageUrls;
  }
});

function setupImagePreview(fileInput, previewGrid) {
  if (!fileInput || !previewGrid) return;

  fileInput.addEventListener("change", () => {
    const files = Array.from(fileInput.files || []);
    if (!files.length) return;

    previewGrid.innerHTML = "";

    files.slice(0, 12).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const div = document.createElement("div");
        div.className = "preview-item";
        div.style.backgroundImage = `url('${event.target.result}')`;
        div.style.backgroundSize = "cover";
        div.style.backgroundPosition = "center";
        div.textContent = "";
        previewGrid.appendChild(div);
      };
      reader.readAsDataURL(file);
    });
  });
}

function renderExistingImages(previewGrid, imageUrls) {
  if (!previewGrid) return;

  previewGrid.innerHTML = "";

  if (!imageUrls.length) {
    resetPreview(previewGrid);
    return;
  }

  imageUrls.forEach((url) => {
    const div = document.createElement("div");
    div.className = "preview-item";
    div.style.backgroundImage = `url('${url}')`;
    div.style.backgroundSize = "cover";
    div.style.backgroundPosition = "center";
    div.textContent = "";
    previewGrid.appendChild(div);
  });
}

function resetPreview(previewGrid) {
  if (!previewGrid) return;

  previewGrid.innerHTML = `
    <div class="preview-item">📷</div>
    <div class="preview-item">📷</div>
    <div class="preview-item">📷</div>
    <div class="preview-item">📷</div>
  `;
}

async function uploadListingImages(fileList, userId) {
  const files = Array.from(fileList || []);
  if (!files.length) return [];

  const imageFiles = files.filter(file => file.type.startsWith("image/")).slice(0, 12);
  const uploadedUrls = [];

  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${userId}/${Date.now()}-${i}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabaseClient.storage
      .from("listing-images")
      .upload(fileName, file);

    if (uploadError) {
      console.error("UPLOAD ERROR:", uploadError, file.name);
      continue;
    }

    const { data: publicUrlData } = supabaseClient.storage
      .from("listing-images")
      .getPublicUrl(fileName);

    if (publicUrlData?.publicUrl) {
      uploadedUrls.push(publicUrlData.publicUrl);
    }
  }

  return uploadedUrls;
}
