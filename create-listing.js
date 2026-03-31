document.addEventListener("DOMContentLoaded", async () => {
  console.log("create-listing.js wurde geladen");

  const form = document.querySelector("form");
  const fileInput = document.getElementById("bilder");
  const previewGrid = document.querySelector(".preview-grid");
  const pageTitle = document.querySelector(".page-head h1");
  const submitBtn = form?.querySelector(".btn-primary");

  if (!form) {
    console.log("Kein Formular gefunden");
    return;
  }

  // ── Loading-UI Hilfsfunktionen ──────────────────────────────────────────
  function setLoading(isLoading, statusText = "") {
    if (!submitBtn) return;
    if (isLoading) {
      submitBtn.disabled = true;
      submitBtn.dataset.originalText = submitBtn.dataset.originalText || submitBtn.textContent;
      submitBtn.textContent = statusText || "Wird gespeichert…";
      submitBtn.style.opacity = "0.7";
      submitBtn.style.cursor = "not-allowed";
    } else {
      submitBtn.disabled = false;
      submitBtn.textContent = submitBtn.dataset.originalText || "Anzeige veröffentlichen";
      submitBtn.style.opacity = "";
      submitBtn.style.cursor = "";
    }
  }

  function showStatusBanner(message, type) {
    var t = type || "info";
    var banner = document.getElementById("create-status-banner");
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "create-status-banner";
      banner.style.cssText = [
        "position:fixed",
        "top:80px",
        "left:50%",
        "transform:translateX(-50%)",
        "z-index:9999",
        "padding:14px 24px",
        "border-radius:12px",
        "font-size:15px",
        "font-weight:700",
        "box-shadow:0 8px 30px rgba(0,0,0,0.15)",
        "max-width:480px",
        "text-align:center",
        "transition:opacity 0.3s ease"
      ].join(";");
      document.body.appendChild(banner);
    }

    var colors = {
      info:    { bg: "#eef6ff", color: "#123a63",  border: "#c3daf5" },
      success: { bg: "#eaf8f0", color: "#0f7a45",  border: "#b2e8ce" },
      error:   { bg: "#fff0f0", color: "#c0392b",  border: "#f5c6c3" }
    };
    var c = colors[t] || colors.info;
    banner.style.background = c.bg;
    banner.style.color      = c.color;
    banner.style.border     = "1px solid " + c.border;
    banner.style.opacity    = "1";
    banner.textContent      = message;

    if (t === "success") {
      setTimeout(function () {
        banner.style.opacity = "0";
        setTimeout(function () { banner.remove(); }, 400);
      }, 3000);
    }
  }

  function removeStatusBanner() {
    var banner = document.getElementById("create-status-banner");
    if (banner) banner.remove();
  }

  // ── Session mit Retry ───────────────────────────────────────────────────
  async function getSessionWithRetry(maxRetries) {
    maxRetries = maxRetries || 3;
    for (var attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        var sessionResult = await supabaseClient.auth.getSession();
        var user = sessionResult && sessionResult.data && sessionResult.data.session
          ? sessionResult.data.session.user
          : null;
        if (user) return user;

        var refreshed = await supabaseClient.auth.refreshSession();
        if (refreshed.data && refreshed.data.session && refreshed.data.session.user) {
          return refreshed.data.session.user;
        }
        console.warn("Session-Versuch " + attempt + " fehlgeschlagen");
      } catch (err) {
        console.warn("Session-Versuch " + attempt + " Exception:", err);
      }
      if (attempt < maxRetries) {
        await new Promise(function (r) { setTimeout(r, 600 * attempt); });
      }
    }
    return null;
  }

  // ── Edit-Modus ──────────────────────────────────────────────────────────
  var params = new URLSearchParams(window.location.search);
  var editListingId = params.get("edit");
  var existingImageUrls = [];

  if (editListingId) {
    console.log("Bearbeitungsmodus aktiv. Listing-ID:", editListingId);
    if (pageTitle) pageTitle.textContent = "Anzeige bearbeiten";
    existingImageUrls = await loadListingForEdit(editListingId);
  }

  setupImagePreview(fileInput, previewGrid);

  // ── Form Submit ─────────────────────────────────────────────────────────
  var isSubmitting = false;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (isSubmitting) {
      console.log("Submit bereits in Gang – ignoriert.");
      return;
    }

    isSubmitting = true;
    removeStatusBanner();

    try {
      // 1. Session holen
      setLoading(true, "Anmeldung wird geprüft…");
      var user = await getSessionWithRetry();

      if (!user) {
        showStatusBanner("Du musst eingeloggt sein, um eine Anzeige zu erstellen.", "error");
        setLoading(false);
        isSubmitting = false;
        return;
      }

      // 2. Felder lesen
      var title        = (document.getElementById("titel")?.value || "").trim();
      var categorySlug = (document.getElementById("kategorie")?.value || "").trim();
      var manufacturer = (document.getElementById("hersteller")?.value || "").trim();
      var model        = (document.getElementById("modell")?.value || "").trim();
      var condition    = (document.getElementById("zustand")?.value || "Gebraucht").trim();
      var price        = Number(document.getElementById("preis")?.value || 0);
      var year         = parseInt(document.getElementById("baujahr")?.value || "0", 10) || null;
      var location     = (document.getElementById("standort")?.value || "").trim();
      var description  = (document.getElementById("beschreibung")?.value || "").trim();

      if (!title || !categorySlug || !price) {
        showStatusBanner("Bitte Titel, Kategorie und Preis ausfüllen.", "error");
        setLoading(false);
        isSubmitting = false;
        return;
      }

      // 3. Kategorie laden
      setLoading(true, "Kategorie wird geladen…");
      var catResult = await supabaseClient
        .from("categories")
        .select("id, name, slug")
        .eq("slug", categorySlug);

      if (catResult.error || !catResult.data || catResult.data.length === 0) {
        console.error("CATEGORY ERROR:", catResult.error);
        showStatusBanner("Kategorie nicht gefunden. Bitte erneut versuchen.", "error");
        setLoading(false);
        isSubmitting = false;
        return;
      }

      var category = catResult.data[0];

      // 4. Verkäuferprofil laden
      setLoading(true, "Profil wird geladen…");
      var sellerResult = await supabaseClient
        .from("seller_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      console.log("SELLER RESULT:", sellerResult);

      if (sellerResult.error) {
        console.error("SELLER RESULT ERROR:", sellerResult.error);
        showStatusBanner("Fehler beim Laden des Verkäuferprofils.", "error");
        setLoading(false);
        isSubmitting = false;
        return;
      }

      if (!sellerResult.data) {
        showStatusBanner("Kein Verkäuferprofil gefunden. Bitte mit Händlerkonto einloggen.", "error");
        setLoading(false);
        isSubmitting = false;
        return;
      }

      // 5. Bilder hochladen mit Fortschrittsanzeige
      var files = Array.from(fileInput ? fileInput.files : []);
      var newUploadedImageUrls = [];

      if (files.length > 0) {
        setLoading(true, "Bilder werden hochgeladen (0 / " + files.length + ")…");
        newUploadedImageUrls = await uploadListingImages(
          fileInput.files,
          user.id,
          function (done, total) {
            setLoading(true, "Bilder werden hochgeladen (" + done + " / " + total + ")…");
          }
        );
      }

      var finalImageUrls = existingImageUrls.concat(newUploadedImageUrls);

      // 6. Anzeige speichern
      setLoading(true, editListingId ? "Anzeige wird aktualisiert…" : "Anzeige wird gespeichert…");

      var payload = {
        seller_id:   sellerResult.data.id,
        category_id: category.id,
        title:       title,
        manufacturer: manufacturer,
        model:       model,
        condition:   condition,
        price:       price,
        year:        year,
        location:    location,
        description: description,
        status:      "Freigegeben",
        image_urls:  finalImageUrls
      };

      var result;

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
        showStatusBanner("Fehler beim Speichern. Bitte erneut versuchen.", "error");
        setLoading(false);
        isSubmitting = false;
        return;
      }

      // 7. Erfolg
      showStatusBanner(
        editListingId ? "✅ Anzeige wurde aktualisiert!" : "✅ Anzeige wurde veröffentlicht!",
        "success"
      );
      form.reset();
      existingImageUrls = [];
      resetPreview(previewGrid);

      setTimeout(function () {
        window.location.href = "meine-anzeigen.html";
      }, 1200);

    } catch (err) {
      console.error("UNCAUGHT ERROR IN CREATE-LISTING:", err);
      showStatusBanner("Ein unerwarteter Fehler ist aufgetreten. Bitte die Seite neu laden.", "error");
      setLoading(false);
      isSubmitting = false;
    }
  });

  // ── Edit: Felder befüllen ───────────────────────────────────────────────
  async function loadListingForEdit(listingId) {
    var res = await supabaseClient
      .from("listings")
      .select("id, title, manufacturer, model, condition, price, year, location, description, image_urls, categories(slug)")
      .eq("id", listingId)
      .single();

    console.log("EDIT LISTING RESULT:", res.data);

    if (res.error || !res.data) {
      showStatusBanner("Anzeige zum Bearbeiten konnte nicht geladen werden.", "error");
      return [];
    }

    var listing = res.data;
    document.getElementById("titel").value        = listing.title || "";
    document.getElementById("kategorie").value    = Array.isArray(listing.categories)
      ? (listing.categories[0] ? listing.categories[0].slug : "")
      : (listing.categories ? listing.categories.slug : "");
    document.getElementById("hersteller").value   = listing.manufacturer || "";
    document.getElementById("modell").value       = listing.model || "";
    document.getElementById("zustand").value      = listing.condition || "Gebraucht";
    document.getElementById("preis").value        = listing.price || "";
    document.getElementById("baujahr").value      = listing.year || "";
    document.getElementById("standort").value     = listing.location || "";
    document.getElementById("beschreibung").value = listing.description || "";

    var imageUrls = Array.isArray(listing.image_urls) ? listing.image_urls : [];
    renderExistingImages(previewGrid, imageUrls);
    return imageUrls;
  }
});

// ── Bild-Vorschau ─────────────────────────────────────────────────────────
function setupImagePreview(fileInput, previewGrid) {
  if (!fileInput || !previewGrid) return;

  fileInput.addEventListener("change", function () {
    var files = Array.from(fileInput.files || []);
    if (!files.length) return;

    previewGrid.innerHTML = "";

    files.slice(0, 12).forEach(function (file) {
      var reader = new FileReader();
      reader.onload = function (event) {
        var div = document.createElement("div");
        div.className = "preview-item";
        div.style.backgroundImage    = "url('" + event.target.result + "')";
        div.style.backgroundSize     = "cover";
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

  imageUrls.forEach(function (url) {
    var div = document.createElement("div");
    div.className = "preview-item";
    div.style.backgroundImage    = "url('" + url + "')";
    div.style.backgroundSize     = "cover";
    div.style.backgroundPosition = "center";
    div.textContent = "";
    previewGrid.appendChild(div);
  });
}

function resetPreview(previewGrid) {
  if (!previewGrid) return;
  previewGrid.innerHTML = [
    '<div class="preview-item">📷</div>',
    '<div class="preview-item">📷</div>',
    '<div class="preview-item">📷</div>',
    '<div class="preview-item">📷</div>'
  ].join("");
}

// ── Bild-Upload mit Fortschritts-Callback ────────────────────────────────
async function uploadListingImages(fileList, userId, onProgress) {
  var files = Array.from(fileList || []);
  if (!files.length) return [];

  var imageFiles = files.filter(function (f) {
    return f.type.startsWith("image/");
  }).slice(0, 12);

  var uploadedUrls = [];

  for (var i = 0; i < imageFiles.length; i++) {
    var file = imageFiles[i];
    var ext  = (file.name.split(".").pop() || "jpg").toLowerCase();
    var fileName = userId + "/" + Date.now() + "-" + i + "-" + Math.random().toString(36).slice(2) + "." + ext;

    var uploadResult = await supabaseClient.storage
      .from("listing-images")
      .upload(fileName, file);

    if (uploadResult.error) {
      console.error("UPLOAD ERROR:", uploadResult.error, file.name);
      if (onProgress) onProgress(i + 1, imageFiles.length);
      continue;
    }

    var publicUrlData = supabaseClient.storage
      .from("listing-images")
      .getPublicUrl(fileName);

    if (publicUrlData && publicUrlData.data && publicUrlData.data.publicUrl) {
      uploadedUrls.push(publicUrlData.data.publicUrl);
    }

    if (onProgress) onProgress(i + 1, imageFiles.length);
  }

  return uploadedUrls;
}
