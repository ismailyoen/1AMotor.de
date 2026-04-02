document.addEventListener("DOMContentLoaded", async () => {
  const form = document.querySelector("form");

  const companyName = document.getElementById("company_name");
  const contactName = document.getElementById("contact_name");
  const email = document.getElementById("email");
  const phone = document.getElementById("phone");
  const website = document.getElementById("website");

  const street = document.getElementById("street");
  const zip = document.getElementById("zip");
  const city = document.getElementById("city");
  const country = document.getElementById("country");
  const vat = document.getElementById("vat");
  const companyType = document.getElementById("company_type");

  const description = document.getElementById("description");
  const specialization = document.getElementById("specialization");
  const responseTime = document.getElementById("response_time");
  const languages = document.getElementById("languages");

  let sellerId = null;

  // 🔐 User holen
  const session = await supabaseClient.auth.getSession();
  const user = session?.data?.session?.user;

  if (!user) {
    alert("Nicht eingeloggt");
    return;
  }

  // 🏢 Seller Profil laden
  const { data: seller, error } = await supabaseClient
    .from("seller_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error || !seller) {
    console.error("SELLER LOAD ERROR:", error);
    alert("Profil konnte nicht geladen werden");
    return;
  }

  sellerId = seller.id;

  // 🧾 Felder befüllen
  companyName.value = seller.company_name || "";
  contactName.value = seller.contact_name || "";
  email.value = seller.email || "";
  phone.value = seller.phone || "";
  website.value = seller.website || "";

  street.value = seller.street || "";
  zip.value = seller.zip || "";
  city.value = seller.city || "";
  country.value = seller.country || "";
  vat.value = seller.vat || "";
  companyType.value = seller.company_type || "GmbH";

  description.value = seller.description || "";
  specialization.value = seller.specialization || "";
  responseTime.value = seller.response_time || "";
  languages.value = seller.languages || "";

  // 💾 Speichern
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const btn = form.querySelector(".btn-primary");
    btn.disabled = true;
    btn.textContent = "Speichert...";

    const { error } = await supabaseClient
      .from("seller_profiles")
      .update({
        company_name: companyName.value,
        contact_name: contactName.value,
        email: email.value,
        phone: phone.value,
        website: website.value,

        street: street.value,
        zip: zip.value,
        city: city.value,
        country: country.value,
        vat: vat.value,
        company_type: companyType.value,

        description: description.value,
        specialization: specialization.value,
        response_time: responseTime.value,
        languages: languages.value
      })
      .eq("id", sellerId);

    btn.disabled = false;
    btn.textContent = "Profil speichern";

    if (error) {
      console.error("UPDATE ERROR:", error);
      alert("Fehler beim Speichern");
      return;
    }

    alert("Profil erfolgreich gespeichert ✅");
  });

  // ── Konto löschen ────────────────────────────────────────────────────────
  const deleteBtn        = document.getElementById("delete-account-btn");
  const deleteModal      = document.getElementById("delete-modal");
  const deleteCancelBtn  = document.getElementById("delete-modal-cancel");
  const deleteConfirmBtn = document.getElementById("delete-modal-confirm");
  const deletePassword   = document.getElementById("delete-confirm-password");
  const deleteError      = document.getElementById("delete-modal-error");

  function openDeleteModal() {
    deleteModal.style.display = "flex";
    deletePassword.value = "";
    deleteError.style.display = "none";
  }

  function closeDeleteModal() {
    deleteModal.style.display = "none";
  }

  if (deleteBtn)       deleteBtn.addEventListener("click", openDeleteModal);
  if (deleteCancelBtn) deleteCancelBtn.addEventListener("click", closeDeleteModal);

  // Modal schließen beim Klick auf den dunklen Hintergrund
  if (deleteModal) {
    deleteModal.addEventListener("click", (e) => {
      if (e.target === deleteModal) closeDeleteModal();
    });
  }

  if (deleteConfirmBtn) {
    deleteConfirmBtn.addEventListener("click", async () => {
      const password = deletePassword?.value?.trim();

      if (!password) {
        deleteError.textContent = "Bitte Passwort eingeben.";
        deleteError.style.display = "block";
        return;
      }

      deleteConfirmBtn.disabled = true;
      deleteConfirmBtn.textContent = "Wird gelöscht…";
      deleteError.style.display = "none";

      try {
        // 1. Passwort prüfen via Re-Login
        const { error: signInError } = await supabaseClient.auth.signInWithPassword({
          email: user.email,
          password: password
        });

        if (signInError) {
          deleteError.textContent = "Passwort falsch. Bitte erneut versuchen.";
          deleteError.style.display = "block";
          deleteConfirmBtn.disabled = false;
          deleteConfirmBtn.textContent = "Konto endgültig löschen";
          return;
        }

        // 2. Alle Anzeigen des Sellers laden
        const { data: listings } = await supabaseClient
          .from("listings")
          .select("id")
          .eq("seller_id", sellerId);

        const listingIds = (listings || []).map(l => l.id);

        // 3. Nachrichten zu Anzeigen löschen
        if (listingIds.length > 0) {
          const { data: inquiries } = await supabaseClient
            .from("inquiries")
            .select("id")
            .in("listing_id", listingIds);

          const inquiryIds = (inquiries || []).map(i => i.id);

          if (inquiryIds.length > 0) {
            await supabaseClient
              .from("inquiry_messages")
              .delete()
              .in("inquiry_id", inquiryIds);
          }

          await supabaseClient
            .from("inquiries")
            .delete()
            .in("listing_id", listingIds);
        }

        // 4. Eigene Nachrichten als Käufer löschen
        const { data: buyerInquiries } = await supabaseClient
          .from("inquiries")
          .select("id")
          .eq("buyer_user_id", user.id);

        const buyerInquiryIds = (buyerInquiries || []).map(i => i.id);

        if (buyerInquiryIds.length > 0) {
          await supabaseClient
            .from("inquiry_messages")
            .delete()
            .in("inquiry_id", buyerInquiryIds);

          await supabaseClient
            .from("inquiries")
            .delete()
            .in("id", buyerInquiryIds);
        }

        // 5. Anzeigen löschen
        if (listingIds.length > 0) {
          await supabaseClient
            .from("listings")
            .delete()
            .in("id", listingIds);
        }

        // 6. Seller-Profil löschen
        await supabaseClient
          .from("seller_profiles")
          .delete()
          .eq("id", sellerId);

        // 7. Auth-User löschen (Supabase Edge Function oder client delete)
        const { error: deleteUserError } = await supabaseClient.auth.admin?.deleteUser
          ? await supabaseClient.auth.admin.deleteUser(user.id)
          : await supabaseClient.rpc("delete_own_account");

        // Auch ohne Admin-Delete: ausloggen und weiterleiten
        await supabaseClient.auth.signOut();

        alert("Dein Konto wurde erfolgreich gelöscht. Du wirst jetzt zur Startseite weitergeleitet.");
        window.location.href = "index.html";

      } catch (err) {
        console.error("DELETE ACCOUNT ERROR:", err);
        deleteError.textContent = "Unerwarteter Fehler. Bitte die Seite neu laden und erneut versuchen.";
        deleteError.style.display = "block";
        deleteConfirmBtn.disabled = false;
        deleteConfirmBtn.textContent = "Konto endgültig löschen";
      }
    });
  }
});