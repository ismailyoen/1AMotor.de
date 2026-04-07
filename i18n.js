// ══════════════════════════════════════════════════════════════════
//  1A Motor – Mehrsprachigkeit DE / EN / FR
//  Einbinden in ALLE HTML-Seiten: <script src="i18n.js"></script>
// ══════════════════════════════════════════════════════════════════

const translations = {

  // ─────────────────────────────── DEUTSCH ──────────────────────────────────
  de: {
    // Navigation
    "nav.search":           "Motor suchen",
    "nav.sell":             "Anzeige erstellen",
    "nav.login":            "Einloggen",
    "nav.register":         "Registrieren",
    "nav.account":          "Mein Konto",
    "nav.inquiries":        "Nachrichten",
    "nav.listings":         "Meine Anzeigen",
    "nav.logout":           "Abmelden",
    "nav.contact":          "Hilfe & Kontakt",
    "nav.dealer":           "Händlerbereich",
    "nav.dashboard":        "Dashboard",
    "nav.back":             "← Zurück zur Startseite",

    // Hero
    "hero.title":           "Motoren kaufen & verkaufen.",
    "hero.subtitle":        "Fahrzeugmotoren, Industrieantriebe, Bootsmotoren und Spezialmotoren. Geprüfte Händler, direkte Anfragen, keine Provision.",
    "hero.cta.search":      "🔍 Jetzt suchen",
    "hero.cta.dealer":      "Als Händler starten",
    "hero.pill":            "⚙️ Deutschlands Motorenmarktplatz",

    // Suche / Search bar
    "search.placeholder":   "Motor, Hersteller, Modell oder Teilenummer suchen…",
    "search.btn":           "Suchen",
    "search.allcats":       "Alle Kategorien",

    // Listings
    "listings.title":       "Aktuelle Angebote",
    "listings.all":         "Alle ansehen →",
    "listings.newest":      "Neueste zuerst",
    "listings.cheapest":    "Preis ↑",
    "listings.dearest":     "Preis ↓",
    "listings.empty":       "Noch keine Angebote vorhanden.",
    "listings.loading":     "Angebote werden geladen…",
    "listings.count":       "aktuelle Angebote",

    // Sidebar Filter
    "filter.categories":    "Kategorien",
    "filter.condition":     "Zustand",
    "filter.price":         "Preis",
    "filter.dealers":       "Händler",
    "filter.all":           "Alle",
    "filter.new":           "Neu",
    "filter.used":          "Gebraucht",
    "filter.refurb":        "Generalüberholt",
    "filter.verified":      "Geprüfte Händler",
    "filter.toprated":      "Top-Bewertung",
    "filter.commercial":    "Gewerblich",
    "filter.tosearch":      "→ Zur Suche",
    "filter.show":          "☰ Filter anzeigen",

    // Features
    "feature.verified.title":   "Geprüfte Händler",
    "feature.verified.text":    "Verifizierte Verkäuferprofile und transparente Bewertungen für mehr Vertrauen.",
    "feature.cats.title":       "101+ Kategorien",
    "feature.cats.text":        "Fahrzeug-, Industrie-, Boots- und Spezialmotoren auf einer Plattform.",
    "feature.shipping.title":   "Speditionsoptionen",
    "feature.shipping.text":    "Europaweit. Ideal für schwere Motoren, Maschinen und Baugruppen.",
    "feature.nofee.title":      "Keine Provision",
    "feature.nofee.text":       "Direktkontakt zwischen Käufer und Händler. Keine versteckten Kosten.",

    // Newsletter
    "newsletter.title":     "Neue Angebote direkt erhalten",
    "newsletter.subtitle":  "Abonniere Preisupdates, neue Inserate und Sonderaktionen.",
    "newsletter.placeholder":"Deine E-Mail-Adresse",
    "newsletter.btn":       "Abonnieren",

    // Footer
    "footer.desc":          "Der spezialisierte Marktplatz für Motoren, Antriebe und Maschinentechnik in Deutschland und Europa.",
    "footer.buy":           "Kaufen",
    "footer.sell":          "Verkaufen",
    "footer.company":       "Unternehmen",
    "footer.legal":         "Rechtliches",
    "footer.rights":        "© 2026 1A Motor – Marktplatz für Motoren & Antriebstechnik",
    "footer.search":        "Motor suchen",
    "footer.create":        "Anzeige erstellen",
    "footer.dealer":        "Händlerkonto",
    "footer.messages":      "Nachrichten",

    // Listing Detail
    "detail.contact":       "Verkäufer kontaktieren",
    "detail.send":          "📨 Nachricht senden",
    "detail.name":          "Ihr Name",
    "detail.email":         "Ihre E-Mail",
    "detail.message":       "Ihre Nachricht…",
    "detail.success":       "✅ Anfrage gesendet! Der Händler meldet sich bald.",
    "detail.similar":       "🔍 Ähnliche Anzeigen",
    "detail.specs":         "Technische Daten",
    "detail.description":   "Beschreibung",
    "detail.seller":        "Über den Verkäufer",
    "detail.location":      "Standort:",
    "detail.published":     "Veröffentlicht",
    "detail.back":          "← Zurück zur Suche",

    // Suche Page
    "suche.title":          "Motor suchen",
    "suche.results":        "Suchergebnisse",
    "suche.noresults":      "Keine Anzeigen gefunden.",
    "suche.loading":        "Suche läuft…",
    "suche.filter.title":   "Suche verfeinern",

    // Login / Register
    "login.title":          "Willkommen zurück",
    "login.subtitle":       "Melde dich in deinem 1A Motor Konto an.",
    "login.email":          "E-Mail-Adresse",
    "login.password":       "Passwort",
    "login.forgot":         "Passwort vergessen?",
    "login.btn":            "Einloggen",
    "login.noreg":          "Noch kein Konto?",
    "login.register":       "Jetzt registrieren",
    "register.title":       "Konto erstellen",
    "register.subtitle":    "Registriere dich kostenlos auf 1A Motor.",
    "register.name":        "Vor- und Nachname",
    "register.btn":         "Jetzt registrieren",
    "register.hasaccount":  "Bereits ein Konto?",
    "register.login":       "Einloggen",
    "register.buyer":       "Käufer",
    "register.seller":      "Händler",

    // Dashboard
    "dashboard.title":      "Dashboard",
    "dashboard.welcome":    "Willkommen zurück",
    "dashboard.listings":   "Anzeigen",
    "dashboard.inquiries":  "Anfragen",
    "dashboard.new":        "+ Neue Anzeige",
    "dashboard.active":     "Aktive Anzeigen",
    "dashboard.drafts":     "Entwürfe",
    "dashboard.value":      "Gesamtwert",
    "dashboard.activity":   "Letzte Aktivitäten",

    // Meine Anzeigen
    "mylistings.title":     "Meine Anzeigen",
    "mylistings.subtitle":  "Verwalte und bearbeite deine Inserate.",
    "mylistings.new":       "＋ Neue Anzeige",
    "mylistings.search":    "🔍 Titel oder Hersteller suchen…",
    "mylistings.allstatus": "Alle Status",
    "mylistings.approved":  "Freigegeben",
    "mylistings.draft":     "Entwurf",
    "mylistings.view":      "Ansehen",
    "mylistings.edit":      "Bearbeiten",
    "mylistings.delete":    "Löschen",
    "mylistings.empty":     "Keine Anzeigen gefunden.",
    "mylistings.createfirst":"Erste Anzeige erstellen",

    // Anfragen / Messages
    "inquiries.title":      "Anfragen",
    "inquiries.subtitle":   "Nachrichten von Käufern zu deinen Inseraten.",
    "inquiries.all":        "Alle",
    "inquiries.new":        "Neu",
    "inquiries.read":       "Gelesen",
    "inquiries.done":       "Erledigt",
    "inquiries.reply":      "Antwort senden",
    "inquiries.placeholder":"Antwort schreiben…",
    "inquiries.empty":      "Noch keine Anfragen vorhanden.",
    "inquiries.re":         "Anfrage zu:",

    // Nachrichten (Käufer)
    "messages.title":       "Nachrichten",
    "messages.subtitle":    "Hier siehst du deine Anfragen und die Antworten der Verkäufer.",
    "messages.empty":       "Noch keine Nachrichten vorhanden.",
    "messages.send":        "Nachricht senden",
    "messages.placeholder": "Nachricht schreiben…",

    // Anzeige erstellen
    "create.title":         "Anzeige erstellen",
    "create.edit":          "Anzeige bearbeiten",
    "create.step1":         "Grunddaten",
    "create.step2":         "Preis & Ort",
    "create.step3":         "Technik",
    "create.step4":         "Beschreibung",
    "create.step5":         "Bilder",
    "create.publish":       "Anzeige veröffentlichen",
    "create.draft":         "Als Entwurf speichern",
    "create.type.sale":     "🏷️ Verkauf",
    "create.type.wanted":   "🔍 Gesuch",
    "create.type.sale.sub": "Ich biete einen Motor an",
    "create.type.wanted.sub":"Ich suche einen Motor",

    // Profil
    "profil.title":         "Profil",
    "profil.save":          "Profil speichern",
    "profil.delete":        "Konto löschen",
    "profil.company":       "Firmenname",
    "profil.contact":       "Ansprechpartner",

    // Allgemein
    "condition.new":        "Neu",
    "condition.used":       "Gebraucht",
    "condition.rebuilt":    "Generalüberholt",
    "status.live":          "Live",
    "status.draft":         "Entwurf",
    "btn.back":             "Zurück",
    "btn.save":             "Speichern",
    "btn.cancel":           "Abbrechen",
    "btn.delete":           "Löschen",
    "loading":              "Wird geladen…",
    "error.notfound":       "Anzeige nicht gefunden.",
    "topbar.contact":       "Hilfe & Kontakt",
    "topbar.dealer":        "Händlerbereich",
    "topbar.imprint":       "Impressum",
    "topbar.privacy":       "Datenschutz",
    "topbar.agb":           "AGB",
  },

  // ─────────────────────────────── ENGLISH ──────────────────────────────────
  en: {
    "nav.search":           "Search Motors",
    "nav.sell":             "Create Listing",
    "nav.login":            "Login",
    "nav.register":         "Register",
    "nav.account":          "My Account",
    "nav.inquiries":        "Messages",
    "nav.listings":         "My Listings",
    "nav.logout":           "Logout",
    "nav.contact":          "Help & Contact",
    "nav.dealer":           "Dealer Area",
    "nav.dashboard":        "Dashboard",
    "nav.back":             "← Back to Home",

    "hero.title":           "Buy & sell motors.",
    "hero.subtitle":        "Vehicle engines, industrial drives, boat motors and special engines. Verified dealers, direct inquiries, no commission.",
    "hero.cta.search":      "🔍 Search now",
    "hero.cta.dealer":      "Start as dealer",
    "hero.pill":            "⚙️ Germany's Motor Marketplace",

    "search.placeholder":   "Search motor, manufacturer, model or part number…",
    "search.btn":           "Search",
    "search.allcats":       "All Categories",

    "listings.title":       "Latest Listings",
    "listings.all":         "View all →",
    "listings.newest":      "Newest first",
    "listings.cheapest":    "Price ↑",
    "listings.dearest":     "Price ↓",
    "listings.empty":       "No listings available yet.",
    "listings.loading":     "Loading listings…",
    "listings.count":       "current listings",

    "filter.categories":    "Categories",
    "filter.condition":     "Condition",
    "filter.price":         "Price",
    "filter.dealers":       "Dealers",
    "filter.all":           "All",
    "filter.new":           "New",
    "filter.used":          "Used",
    "filter.refurb":        "Refurbished",
    "filter.verified":      "Verified Dealers",
    "filter.toprated":      "Top Rated",
    "filter.commercial":    "Commercial",
    "filter.tosearch":      "→ Go to Search",
    "filter.show":          "☰ Show Filters",

    "feature.verified.title":   "Verified Dealers",
    "feature.verified.text":    "Verified seller profiles and transparent ratings for more trust.",
    "feature.cats.title":       "101+ Categories",
    "feature.cats.text":        "Vehicle, industrial, marine and special motors on one platform.",
    "feature.shipping.title":   "Shipping Options",
    "feature.shipping.text":    "Europe-wide. Ideal for heavy motors, machines and assemblies.",
    "feature.nofee.title":      "No Commission",
    "feature.nofee.text":       "Direct contact between buyer and dealer. No hidden costs.",

    "newsletter.title":     "Receive new listings directly",
    "newsletter.subtitle":  "Subscribe to price updates, new listings and special offers.",
    "newsletter.placeholder":"Your email address",
    "newsletter.btn":       "Subscribe",

    "footer.desc":          "The specialized marketplace for motors, drives and machinery in Germany and Europe.",
    "footer.buy":           "Buy",
    "footer.sell":          "Sell",
    "footer.company":       "Company",
    "footer.legal":         "Legal",
    "footer.rights":        "© 2026 1A Motor – Motor & Drive Technology Marketplace",
    "footer.search":        "Search Motors",
    "footer.create":        "Create Listing",
    "footer.dealer":        "Dealer Account",
    "footer.messages":      "Messages",

    "detail.contact":       "Contact seller",
    "detail.send":          "📨 Send message",
    "detail.name":          "Your name",
    "detail.email":         "Your email",
    "detail.message":       "Your message…",
    "detail.success":       "✅ Inquiry sent! The dealer will get back to you soon.",
    "detail.similar":       "🔍 Similar listings",
    "detail.specs":         "Technical Details",
    "detail.description":   "Description",
    "detail.seller":        "About the seller",
    "detail.location":      "Location:",
    "detail.published":     "Published",
    "detail.back":          "← Back to search",

    "suche.title":          "Search Motors",
    "suche.results":        "Search Results",
    "suche.noresults":      "No listings found.",
    "suche.loading":        "Searching…",
    "suche.filter.title":   "Refine search",

    "login.title":          "Welcome back",
    "login.subtitle":       "Sign in to your 1A Motor account.",
    "login.email":          "Email address",
    "login.password":       "Password",
    "login.forgot":         "Forgot password?",
    "login.btn":            "Login",
    "login.noreg":          "No account yet?",
    "login.register":       "Register now",
    "register.title":       "Create account",
    "register.subtitle":    "Register for free on 1A Motor.",
    "register.name":        "First and last name",
    "register.btn":         "Register now",
    "register.hasaccount":  "Already have an account?",
    "register.login":       "Login",
    "register.buyer":       "Buyer",
    "register.seller":      "Dealer",

    "dashboard.title":      "Dashboard",
    "dashboard.welcome":    "Welcome back",
    "dashboard.listings":   "Listings",
    "dashboard.inquiries":  "Inquiries",
    "dashboard.new":        "+ New Listing",
    "dashboard.active":     "Active Listings",
    "dashboard.drafts":     "Drafts",
    "dashboard.value":      "Total Value",
    "dashboard.activity":   "Recent Activity",

    "mylistings.title":     "My Listings",
    "mylistings.subtitle":  "Manage and edit your listings.",
    "mylistings.new":       "＋ New Listing",
    "mylistings.search":    "🔍 Search title or manufacturer…",
    "mylistings.allstatus": "All Status",
    "mylistings.approved":  "Approved",
    "mylistings.draft":     "Draft",
    "mylistings.view":      "View",
    "mylistings.edit":      "Edit",
    "mylistings.delete":    "Delete",
    "mylistings.empty":     "No listings found.",
    "mylistings.createfirst":"Create first listing",

    "inquiries.title":      "Inquiries",
    "inquiries.subtitle":   "Messages from buyers about your listings.",
    "inquiries.all":        "All",
    "inquiries.new":        "New",
    "inquiries.read":       "Read",
    "inquiries.done":       "Done",
    "inquiries.reply":      "Send reply",
    "inquiries.placeholder":"Write a reply…",
    "inquiries.empty":      "No inquiries yet.",
    "inquiries.re":         "Inquiry about:",

    "messages.title":       "Messages",
    "messages.subtitle":    "Here you can see your inquiries and the sellers' replies.",
    "messages.empty":       "No messages yet.",
    "messages.send":        "Send message",
    "messages.placeholder": "Write a message…",

    "create.title":         "Create Listing",
    "create.edit":          "Edit Listing",
    "create.step1":         "Basic Info",
    "create.step2":         "Price & Location",
    "create.step3":         "Technical",
    "create.step4":         "Description",
    "create.step5":         "Images",
    "create.publish":       "Publish listing",
    "create.draft":         "Save as draft",
    "create.type.sale":     "🏷️ For Sale",
    "create.type.wanted":   "🔍 Wanted",
    "create.type.sale.sub": "I'm offering a motor",
    "create.type.wanted.sub":"I'm looking for a motor",

    "profil.title":         "Profile",
    "profil.save":          "Save Profile",
    "profil.delete":        "Delete Account",
    "profil.company":       "Company Name",
    "profil.contact":       "Contact Person",

    "condition.new":        "New",
    "condition.used":       "Used",
    "condition.rebuilt":    "Refurbished",
    "status.live":          "Live",
    "status.draft":         "Draft",
    "btn.back":             "Back",
    "btn.save":             "Save",
    "btn.cancel":           "Cancel",
    "btn.delete":           "Delete",
    "loading":              "Loading…",
    "error.notfound":       "Listing not found.",
    "topbar.contact":       "Help & Contact",
    "topbar.dealer":        "Dealer Area",
    "topbar.imprint":       "Imprint",
    "topbar.privacy":       "Privacy",
    "topbar.agb":           "Terms",
  },

  // ──────────────────────────────── FRANÇAIS ────────────────────────────────
  fr: {
    "nav.search":           "Rechercher un moteur",
    "nav.sell":             "Créer une annonce",
    "nav.login":            "Se connecter",
    "nav.register":         "S'inscrire",
    "nav.account":          "Mon compte",
    "nav.inquiries":        "Messages",
    "nav.listings":         "Mes annonces",
    "nav.logout":           "Se déconnecter",
    "nav.contact":          "Aide & Contact",
    "nav.dealer":           "Espace concessionnaire",
    "nav.dashboard":        "Tableau de bord",
    "nav.back":             "← Retour à l'accueil",

    "hero.title":           "Achetez & vendez des moteurs.",
    "hero.subtitle":        "Moteurs de véhicules, entraînements industriels, moteurs marins et moteurs spéciaux. Revendeurs vérifiés, demandes directes, sans commission.",
    "hero.cta.search":      "🔍 Rechercher",
    "hero.cta.dealer":      "Devenir revendeur",
    "hero.pill":            "⚙️ La marketplace moteurs d'Allemagne",

    "search.placeholder":   "Rechercher moteur, fabricant, modèle ou numéro de pièce…",
    "search.btn":           "Rechercher",
    "search.allcats":       "Toutes les catégories",

    "listings.title":       "Annonces récentes",
    "listings.all":         "Voir tout →",
    "listings.newest":      "Plus récent",
    "listings.cheapest":    "Prix ↑",
    "listings.dearest":     "Prix ↓",
    "listings.empty":       "Aucune annonce disponible.",
    "listings.loading":     "Chargement des annonces…",
    "listings.count":       "annonces actuelles",

    "filter.categories":    "Catégories",
    "filter.condition":     "État",
    "filter.price":         "Prix",
    "filter.dealers":       "Vendeurs",
    "filter.all":           "Tous",
    "filter.new":           "Neuf",
    "filter.used":          "Occasion",
    "filter.refurb":        "Reconditionné",
    "filter.verified":      "Vendeurs vérifiés",
    "filter.toprated":      "Meilleures notes",
    "filter.commercial":    "Professionnel",
    "filter.tosearch":      "→ Aller à la recherche",
    "filter.show":          "☰ Afficher les filtres",

    "feature.verified.title":   "Vendeurs vérifiés",
    "feature.verified.text":    "Profils de vendeurs vérifiés et évaluations transparentes pour plus de confiance.",
    "feature.cats.title":       "101+ catégories",
    "feature.cats.text":        "Moteurs de véhicules, industriels, marins et spéciaux sur une seule plateforme.",
    "feature.shipping.title":   "Options de livraison",
    "feature.shipping.text":    "Dans toute l'Europe. Idéal pour les moteurs lourds, machines et assemblages.",
    "feature.nofee.title":      "Sans commission",
    "feature.nofee.text":       "Contact direct entre acheteur et vendeur. Aucun coût caché.",

    "newsletter.title":     "Recevoir les nouvelles annonces",
    "newsletter.subtitle":  "Abonnez-vous aux mises à jour de prix, nouvelles annonces et offres spéciales.",
    "newsletter.placeholder":"Votre adresse e-mail",
    "newsletter.btn":       "S'abonner",

    "footer.desc":          "La marketplace spécialisée pour les moteurs, entraînements et machines en Allemagne et en Europe.",
    "footer.buy":           "Acheter",
    "footer.sell":          "Vendre",
    "footer.company":       "Entreprise",
    "footer.legal":         "Mentions légales",
    "footer.rights":        "© 2026 1A Motor – Marketplace Moteurs & Entraînements",
    "footer.search":        "Rechercher un moteur",
    "footer.create":        "Créer une annonce",
    "footer.dealer":        "Compte revendeur",
    "footer.messages":      "Messages",

    "detail.contact":       "Contacter le vendeur",
    "detail.send":          "📨 Envoyer un message",
    "detail.name":          "Votre nom",
    "detail.email":         "Votre e-mail",
    "detail.message":       "Votre message…",
    "detail.success":       "✅ Demande envoyée ! Le vendeur vous répondra bientôt.",
    "detail.similar":       "🔍 Annonces similaires",
    "detail.specs":         "Données techniques",
    "detail.description":   "Description",
    "detail.seller":        "À propos du vendeur",
    "detail.location":      "Localisation :",
    "detail.published":     "Publié",
    "detail.back":          "← Retour à la recherche",

    "suche.title":          "Rechercher un moteur",
    "suche.results":        "Résultats de recherche",
    "suche.noresults":      "Aucune annonce trouvée.",
    "suche.loading":        "Recherche en cours…",
    "suche.filter.title":   "Affiner la recherche",

    "login.title":          "Bon retour",
    "login.subtitle":       "Connectez-vous à votre compte 1A Motor.",
    "login.email":          "Adresse e-mail",
    "login.password":       "Mot de passe",
    "login.forgot":         "Mot de passe oublié ?",
    "login.btn":            "Se connecter",
    "login.noreg":          "Pas encore de compte ?",
    "login.register":       "S'inscrire maintenant",
    "register.title":       "Créer un compte",
    "register.subtitle":    "Inscrivez-vous gratuitement sur 1A Motor.",
    "register.name":        "Prénom et nom",
    "register.btn":         "S'inscrire maintenant",
    "register.hasaccount":  "Déjà un compte ?",
    "register.login":       "Se connecter",
    "register.buyer":       "Acheteur",
    "register.seller":      "Revendeur",

    "dashboard.title":      "Tableau de bord",
    "dashboard.welcome":    "Bon retour",
    "dashboard.listings":   "Annonces",
    "dashboard.inquiries":  "Demandes",
    "dashboard.new":        "+ Nouvelle annonce",
    "dashboard.active":     "Annonces actives",
    "dashboard.drafts":     "Brouillons",
    "dashboard.value":      "Valeur totale",
    "dashboard.activity":   "Activités récentes",

    "mylistings.title":     "Mes annonces",
    "mylistings.subtitle":  "Gérez et modifiez vos annonces.",
    "mylistings.new":       "＋ Nouvelle annonce",
    "mylistings.search":    "🔍 Rechercher titre ou fabricant…",
    "mylistings.allstatus": "Tous les statuts",
    "mylistings.approved":  "Approuvé",
    "mylistings.draft":     "Brouillon",
    "mylistings.view":      "Voir",
    "mylistings.edit":      "Modifier",
    "mylistings.delete":    "Supprimer",
    "mylistings.empty":     "Aucune annonce trouvée.",
    "mylistings.createfirst":"Créer la première annonce",

    "inquiries.title":      "Demandes",
    "inquiries.subtitle":   "Messages des acheteurs concernant vos annonces.",
    "inquiries.all":        "Tous",
    "inquiries.new":        "Nouveau",
    "inquiries.read":       "Lu",
    "inquiries.done":       "Traité",
    "inquiries.reply":      "Envoyer une réponse",
    "inquiries.placeholder":"Écrire une réponse…",
    "inquiries.empty":      "Aucune demande pour l'instant.",
    "inquiries.re":         "Demande concernant :",

    "messages.title":       "Messages",
    "messages.subtitle":    "Ici vous pouvez voir vos demandes et les réponses des vendeurs.",
    "messages.empty":       "Aucun message pour l'instant.",
    "messages.send":        "Envoyer un message",
    "messages.placeholder": "Écrire un message…",

    "create.title":         "Créer une annonce",
    "create.edit":          "Modifier l'annonce",
    "create.step1":         "Informations de base",
    "create.step2":         "Prix & Lieu",
    "create.step3":         "Technique",
    "create.step4":         "Description",
    "create.step5":         "Photos",
    "create.publish":       "Publier l'annonce",
    "create.draft":         "Enregistrer comme brouillon",
    "create.type.sale":     "🏷️ Vente",
    "create.type.wanted":   "🔍 Recherche",
    "create.type.sale.sub": "Je propose un moteur",
    "create.type.wanted.sub":"Je cherche un moteur",

    "profil.title":         "Profil",
    "profil.save":          "Enregistrer le profil",
    "profil.delete":        "Supprimer le compte",
    "profil.company":       "Nom de l'entreprise",
    "profil.contact":       "Personne de contact",

    "condition.new":        "Neuf",
    "condition.used":       "Occasion",
    "condition.rebuilt":    "Reconditionné",
    "status.live":          "En ligne",
    "status.draft":         "Brouillon",
    "btn.back":             "Retour",
    "btn.save":             "Enregistrer",
    "btn.cancel":           "Annuler",
    "btn.delete":           "Supprimer",
    "loading":              "Chargement…",
    "error.notfound":       "Annonce introuvable.",
    "topbar.contact":       "Aide & Contact",
    "topbar.dealer":        "Espace revendeur",
    "topbar.imprint":       "Mentions légales",
    "topbar.privacy":       "Confidentialité",
    "topbar.agb":           "CGV",
  }
};

// ══════════════════════════════════════════════════════════════════
//  Sprach-Engine
// ══════════════════════════════════════════════════════════════════
const I18n = {
  lang: localStorage.getItem("1amotor_lang") || "de",

  t(key) {
    return translations[this.lang]?.[key] || translations["de"]?.[key] || key;
  },

  setLang(lang) {
    this.lang = lang;
    localStorage.setItem("1amotor_lang", lang);
    this.apply();
    this.updateToggle();
  },

  apply() {
    // Text-Inhalte
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const attr = el.getAttribute("data-i18n-attr");
      if (attr) {
        el.setAttribute(attr, this.t(key));
      } else {
        el.textContent = this.t(key);
      }
    });

    // Placeholder
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      el.placeholder = this.t(el.getAttribute("data-i18n-placeholder"));
    });

    // HTML lang Attribut
    document.documentElement.lang = this.lang;
  },

  updateToggle() {
    const btn = document.getElementById("lang-toggle");
    if (!btn) return;
    const flags = { de: "🇩🇪", en: "🇬🇧", fr: "🇫🇷" };
    const labels = { de: "DE", en: "EN", fr: "FR" };
    btn.innerHTML = `${flags[this.lang]} ${labels[this.lang]} <span style="font-size:9px;opacity:.7;">▾</span>`;
  },

  injectToggle() {
    if (document.getElementById("lang-toggle")) return;

    // Wrapper
    const wrapper = document.createElement("div");
    wrapper.id = "lang-wrapper";
    wrapper.style.cssText = "position:relative;display:inline-block;";

    // Toggle Button
    const btn = document.createElement("button");
    btn.id = "lang-toggle";
    btn.style.cssText = `
      background:none; border:1.5px solid rgba(255,255,255,0.25);
      border-radius:8px; padding:7px 11px; font-size:13px; font-weight:700;
      cursor:pointer; color:#334155; transition:all .15s;
      font-family:inherit; white-space:nowrap; display:flex;
      align-items:center; gap:5px;
      background:#fff; border-color:#dbe3ea;
    `;

    // Dropdown
    const dropdown = document.createElement("div");
    dropdown.id = "lang-dropdown";
    dropdown.style.cssText = `
      display:none; position:absolute; top:calc(100% + 6px); right:0;
      background:#fff; border:1px solid #dbe3ea; border-radius:12px;
      box-shadow:0 8px 24px rgba(13,27,42,0.12); min-width:130px;
      z-index:1000; overflow:hidden;
    `;

    const langs = [
      { code: "de", flag: "🇩🇪", label: "Deutsch" },
      { code: "en", flag: "🇬🇧", label: "English" },
      { code: "fr", flag: "🇫🇷", label: "Français" },
    ];

    langs.forEach(l => {
      const item = document.createElement("button");
      item.style.cssText = `
        display:flex; align-items:center; gap:9px; width:100%;
        padding:11px 14px; border:none; background:none;
        font-size:14px; font-weight:600; color:#334155;
        cursor:pointer; text-align:left; font-family:inherit;
        transition:background .12s;
      `;
      item.innerHTML = `${l.flag} ${l.label}`;
      item.addEventListener("mouseenter", () => item.style.background = "#f0f4f8");
      item.addEventListener("mouseleave", () => item.style.background = "none");
      item.addEventListener("click", () => {
        this.setLang(l.code);
        dropdown.style.display = "none";
      });
      dropdown.appendChild(item);
    });

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
    });

    document.addEventListener("click", () => {
      dropdown.style.display = "none";
    });

    wrapper.appendChild(btn);
    wrapper.appendChild(dropdown);

    // In Header einfügen — mehrere mögliche Ziel-Elemente
    const targets = [
      document.querySelector(".header-right"),
      document.querySelector(".header-actions"),
      document.querySelector(".hdr-right"),
    ];
    const target = targets.find(t => t !== null);
    if (target) {
      target.insertBefore(wrapper, target.firstChild);
    }

    this.updateToggle();
  },

  init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.injectToggle();
        this.apply();
      });
    } else {
      this.injectToggle();
      this.apply();
    }
  }
};

I18n.init();
window.I18n = I18n;
