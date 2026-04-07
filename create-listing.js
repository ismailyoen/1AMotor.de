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
      console.log("SESSION BEIM SUBMIT:", sessionResult);

      const user = sessionResult?.data?.session?.user;

      if (!user) {
        alert("Du musst eingeloggt sein.");
        return;
      }

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

      if (!title || !categorySlug || !price) {
        alert("Bitte Titel, Kategorie und Preis ausfüllen.");
        return;
      }

      const { data: categories, error: categoryError } = await supabaseClient
        .from("categories")
        .select("id, name, slug")
        .eq("slug", categorySlug);

      if (categoryError || !categories || categories.length === 0) {
        console.error("CATEGORY ERROR:", categoryError);
        alert("Kategorie nicht gefunden.");
        return;
      }

      const category = categories[0];

 const sellerResult = await supabaseClient
  .from("seller_profiles")
  .select("id")
  .eq("user_id", user.id)
  .maybeSingle();

console.log("SELLER RESULT:", sellerResult);

if (sellerResult.error) {
  console.error("SELLER RESULT ERROR:", sellerResult.error);
  alert("Fehler beim Laden des Verkäuferprofils.");
  return;
}

if (!sellerResult.data) {
  alert("Für dieses Konto wurde kein Verkäuferprofil gefunden. Bitte mit einem Händlerkonto einloggen.");
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
        status: "Freigegeben",
        listing_type: listingType,
        price_type: priceType,
        image_urls: finalImageUrls
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
        alert("Fehler beim Speichern. Schau in die Konsole.");
        return;
      }

      alert(editListingId ? "Anzeige wurde aktualisiert!" : "Anzeige wurde gespeichert!");
      form.reset();
      existingImageUrls = [];
      resetPreview(previewGrid);

      window.location.href = "meine-anzeigen.html";
    } catch (err) {
      console.error("UNCAUGHT ERROR IN CREATE-LISTING:", err);
      alert("Es gab einen JavaScript-Fehler. Schau in die Konsole.");
    }
  });

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

    // Preisart & Typ laden
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
    console.log("AUSGEWÄHLTE DATEIEN:", files);

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