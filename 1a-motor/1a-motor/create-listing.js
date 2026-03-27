document.addEventListener("DOMContentLoaded", async () => {
  console.log("create-listing.js wurde geladen");

  const form = document.getElementById("listing-form") || document.querySelector("form");
  const fileInput = document.getElementById("bilder");
  const previewGrid = document.getElementById("preview-grid") || document.querySelector(".preview-grid");
  const pageTitle = document.querySelector(".page-head h1");

  console.log("FORM GEFUNDEN:", form?.id || "querySelector");

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

  // Guard: verhindert doppeltes Absenden
  let isSubmitting = false;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (isSubmitting) {
      console.log("Upload läuft bereits — ignoriert");
      return;
    }

    isSubmitting = true;
    console.log("Formular wird abgeschickt");

    // Button sofort sperren
    const publishBtn = document.getElementById("btn-publish");
    if (publishBtn) {
      publishBtn.disabled = true;
      publishBtn.style.opacity = "0.6";
      publishBtn.style.cursor = "not-allowed";
      publishBtn.style.pointerEvents = "none";
    }
    const draftBtn = document.getElementById("btn-draft");
    if (draftBtn) draftBtn.disabled = true;

    try {
      // Session laden - mit Fallback auf getUser()
      let user = null;
      const sessionResult = await supabaseClient.auth.getSession();
      console.log("SESSION BEIM SUBMIT:", sessionResult);
      user = sessionResult?.data?.session?.user;

      // Fallback: direkt User abfragen
      if (!user) {
        const { data: userData } = await supabaseClient.auth.getUser();
        user = userData?.user || null;
        console.log("GETUSER FALLBACK:", user);
      }

      if (!user) {
        isSubmitting = false;
        if (publishBtn) { publishBtn.disabled = false; publishBtn.style.opacity = ""; publishBtn.style.cursor = ""; publishBtn.style.pointerEvents = ""; }
        if (typeof window.onListingError === 'function') window.onListingError();
        alert("Du musst eingeloggt sein.");
        window.location.href = "login.html";
        return;
      }

      const title = document.getElementById("titel")?.value?.trim() || "";
      const categorySlug = document.getElementById("kategorie")?.value?.trim() || "";
      const manufacturer = document.getElementById("hersteller")?.value?.trim() || "";
      const model = document.getElementById("modell")?.value?.trim() || "";
      const condition = document.getElementById("zustand")?.value?.trim() || "Gebraucht";
      const price = Number(document.getElementById("preis")?.value || 0);
      const year = parseInt(document.getElementById("baujahr")?.value || "0", 10) || null;
      const location = document.getElementById("standort")?.value?.trim() || "";
      const description = document.getElementById("beschreibung")?.value?.trim() || "";

      if (!title || !categorySlug || !price) {
        isSubmitting = false;
        if (publishBtn) { publishBtn.disabled = false; publishBtn.style.opacity = ""; publishBtn.style.cursor = ""; publishBtn.style.pointerEvents = ""; }
        if (draftBtn) draftBtn.disabled = false;
        alert("Bitte Titel, Kategorie und Preis ausfüllen.");
        return;
      }

      const normalizeSlug = (s) => s.toLowerCase().replace(/-/g, " ").trim();
      const normalizedInput = normalizeSlug(categorySlug);

      const { data: allCategories, error: categoryError } = await supabaseClient
        .from("categories").select("id, name, slug");

      if (categoryError || !allCategories || allCategories.length === 0) {
        console.error("CATEGORY ERROR:", categoryError);
        alert("Kategorien konnten nicht geladen werden.");
        return;
      }

      const category = allCategories.find(cat =>
        cat.slug === categorySlug ||
        normalizeSlug(cat.slug || "") === normalizedInput ||
        normalizeSlug(cat.name || "") === normalizedInput
      );

      if (!category) {
        console.error("CATEGORY NOT FOUND:", categorySlug);
        isSubmitting = false;
        if (publishBtn) { publishBtn.disabled = false; publishBtn.style.opacity = ""; publishBtn.style.cursor = ""; publishBtn.style.pointerEvents = ""; }
        if (draftBtn) draftBtn.disabled = false;
        if (typeof window.onListingError === 'function') window.onListingError();
        alert("Kategorie nicht gefunden. Bitte eine andere wählen.");
        return;
      }

      // Seller Profile laden — falls keins existiert automatisch anlegen
      let sellerResult = await supabaseClient
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

      // Kein Profil? Automatisch anlegen (für Käufer die auch verkaufen wollen)
      if (!sellerResult.data) {
        console.log("Kein Seller-Profil gefunden — wird automatisch angelegt...");
        const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Nutzer";
        const { data: newProfile, error: profileError } = await supabaseClient
          .from("seller_profiles")
          .upsert([{
            user_id:      user.id,
            company_name: fullName,
            email:        user.email || "",
            city:         "",
            country:      "DE"
          }], { onConflict: "user_id" })
          .select("id")
          .maybeSingle();

        if (profileError || !newProfile) {
          console.error("PROFILE CREATE ERROR:", profileError);
          alert("Profil konnte nicht erstellt werden. Bitte versuche es erneut.");
          return;
        }

        sellerResult = { data: newProfile };
        console.log("Seller-Profil automatisch angelegt:", newProfile);
      }

      // Bilder aus Drag&Drop (selectedFiles) ODER klassischem Input
      // Bilder aus neuem Drag&Drop UI oder klassischem Input
      let filesToUpload = [];
      try {
        if (typeof selectedFiles !== "undefined" && selectedFiles && selectedFiles.length > 0) {
          filesToUpload = selectedFiles;
          console.log("Bilder aus selectedFiles:", filesToUpload.length);
        } else if (fileInput?.files?.length > 0) {
          filesToUpload = Array.from(fileInput.files);
          console.log("Bilder aus fileInput:", filesToUpload.length);
        } else {
          console.log("Keine Bilder ausgewählt");
        }
      } catch(e) {
        console.log("Bilder-Fehler:", e);
        filesToUpload = [];
      }
      const newUploadedImageUrls = await uploadListingImages(filesToUpload, user.id);
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
        status: document.getElementById("_draft_mode")?.value || "Freigegeben",
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
        if (typeof window.onListingError === 'function') window.onListingError();
        alert("Fehler beim Speichern: " + result.error.message);
        return;
      }

      // Erfolg anzeigen
      if (typeof window.onListingSuccess === 'function') {
        window.onListingSuccess();
      }
      form.reset();
      existingImageUrls = [];
      resetPreview(previewGrid);
      setTimeout(() => {
        window.location.href = "meine-anzeigen.html";
      }, 1800);
    } catch (err) {
      console.error("UNCAUGHT ERROR IN CREATE-LISTING:", err);
      isSubmitting = false;
      if (publishBtn) {
        publishBtn.disabled = false;
        publishBtn.style.opacity = "";
        publishBtn.style.cursor = "";
        publishBtn.style.pointerEvents = "";
      }
      if (draftBtn) draftBtn.disabled = false;
      if (typeof window.onListingError === 'function') window.onListingError();
      alert("Es gab einen Fehler: " + (err.message || err));
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

// ── Bild komprimieren vor Upload ─────────────────────────────────────────────
async function compressImage(file, maxWidth = 1200, quality = 0.78) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // Skalieren wenn zu groß
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width  = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => resolve(blob || file),
          "image/jpeg",
          quality
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function uploadListingImages(fileList, userId) {
  const files = Array.isArray(fileList) ? fileList : Array.from(fileList || []);
  if (!files.length) return [];

  const imageFiles = files.filter(file => file.type.startsWith("image/")).slice(0, 12);
  const uploadedUrls = [];

  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];

    // Komprimieren — spart 70-90% Dateigröße
    let uploadFile = file;
    try {
      const compressed = await compressImage(file);
      console.log(`Bild ${i+1}: ${(file.size/1024).toFixed(0)}KB → ${(compressed.size/1024).toFixed(0)}KB`);
      uploadFile = compressed;
    } catch(e) {
      console.warn("Komprimierung fehlgeschlagen, lade Original hoch:", e);
    }

    const fileName = `${userId}/${Date.now()}-${i}-${Math.random().toString(36).slice(2)}.jpg`;

    const { error: uploadError } = await supabaseClient.storage
      .from("listing-images")
      .upload(fileName, uploadFile, { contentType: "image/jpeg" });

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