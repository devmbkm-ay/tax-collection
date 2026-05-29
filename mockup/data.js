// Shared transactions + i18n for all three variations.
// Real WorldRemit JSON extended with a few additional recipients/countries
// so the dashboard layouts have variety to show.
(function () {
  const REAL = [
    { date: "27 January 2024",  amount: "80637.00",   currency: "UGX", amount_eur: "18.58",  recipient_name: "Patrick Kayombya", transaction_number: "187447079", country: "Uganda",  sort_key: "2024-01-27" },
    { date: "28 January 2024",  amount: "141115.00",  currency: "UGX", amount_eur: "32.52",  recipient_name: "Patrick Kayombya", transaction_number: "187546735", country: "Uganda",  sort_key: "2024-01-28" },
    { date: "17 February 2024", amount: "203597.00",  currency: "UGX", amount_eur: "46.92",  recipient_name: "Patrick Kayombya", transaction_number: "189425572", country: "Uganda",  sort_key: "2024-02-17" },
    { date: "23 February 2024", amount: "206247.00",  currency: "UGX", amount_eur: "47.53",  recipient_name: "Patrick Kayombya", transaction_number: "189895874", country: "Uganda",  sort_key: "2024-02-23" },
    { date: "04 March 2024",    amount: "310444.00",  currency: "UGX", amount_eur: "71.54",  recipient_name: "Patrick Kayombya", transaction_number: "190865819", country: "Uganda",  sort_key: "2024-03-04" },
    { date: "09 March 2024",    amount: "83303.00",   currency: "UGX", amount_eur: "19.20",  recipient_name: "Patrick Kayombya", transaction_number: "191371887", country: "Uganda",  sort_key: "2024-03-09" },
    { date: "18 March 2024",    amount: "1031862.00", currency: "UGX", amount_eur: "237.79", recipient_name: "Patrick Kayombya", transaction_number: "192147496", country: "Uganda",  sort_key: "2024-03-18" },
    { date: "25 March 2024",    amount: "1031707.00", currency: "UGX", amount_eur: "237.75", recipient_name: "Patrick Kayombya", transaction_number: "192767011", country: "Uganda",  sort_key: "2024-03-25" },
    { date: "04 April 2024",    amount: "408712.00",  currency: "UGX", amount_eur: "94.18",  recipient_name: "Patrick Kayombya", transaction_number: "193787738", country: "Uganda",  sort_key: "2024-04-04" },
    { date: "07 April 2024",    amount: "122130.00",  currency: "UGX", amount_eur: "28.14",  recipient_name: "Patrick Kayombya", transaction_number: "194075539", country: "Uganda",  sort_key: "2024-04-07" },
    { date: "30 June 2024",     amount: "116265.00",  currency: "UGX", amount_eur: "26.79",  recipient_name: "Patrick Kayombya", transaction_number: "201441150", country: "Uganda",  sort_key: "2024-06-30" },
  ];
  // A few extra recipients to make the dashboard interesting
  const EXTRA = [
    { date: "12 February 2024", amount: "150.00",    currency: "EUR", amount_eur: "150.00", recipient_name: "Aïcha Diop",      transaction_number: "188210044", country: "Sénégal", sort_key: "2024-02-12" },
    { date: "08 March 2024",    amount: "200.00",    currency: "EUR", amount_eur: "200.00", recipient_name: "Aïcha Diop",      transaction_number: "190944120", country: "Sénégal", sort_key: "2024-03-08" },
    { date: "14 May 2024",      amount: "180.00",    currency: "EUR", amount_eur: "180.00", recipient_name: "Aïcha Diop",      transaction_number: "198410022", country: "Sénégal", sort_key: "2024-05-14" },
    { date: "21 July 2024",     amount: "220.00",    currency: "EUR", amount_eur: "220.00", recipient_name: "Aïcha Diop",      transaction_number: "203992881", country: "Sénégal", sort_key: "2024-07-21" },
    { date: "03 February 2024", amount: "12500.00",  currency: "KES", amount_eur: "85.40",  recipient_name: "Grace Wanjiru",   transaction_number: "187980155", country: "Kenya",   sort_key: "2024-02-03" },
    { date: "29 April 2024",    amount: "18900.00",  currency: "KES", amount_eur: "129.10", recipient_name: "Grace Wanjiru",   transaction_number: "196720091", country: "Kenya",   sort_key: "2024-04-29" },
    { date: "15 August 2024",   amount: "22000.00",  currency: "KES", amount_eur: "150.32", recipient_name: "Grace Wanjiru",   transaction_number: "205881700", country: "Kenya",   sort_key: "2024-08-15" },
    { date: "02 May 2024",      amount: "1200.00",   currency: "MAD", amount_eur: "110.40", recipient_name: "Youssef El Idrissi", transaction_number: "197550441", country: "Maroc",   sort_key: "2024-05-02" },
    { date: "17 September 2024",amount: "950.00",    currency: "MAD", amount_eur: "87.40",  recipient_name: "Youssef El Idrissi", transaction_number: "208114209", country: "Maroc",   sort_key: "2024-09-17" },
    { date: "11 October 2024",  amount: "1500.00",   currency: "MAD", amount_eur: "138.00", recipient_name: "Youssef El Idrissi", transaction_number: "210440039", country: "Maroc",   sort_key: "2024-10-11" },
    { date: "22 November 2024", amount: "100.00",    currency: "EUR", amount_eur: "100.00", recipient_name: "Aïcha Diop",      transaction_number: "213882015", country: "Sénégal", sort_key: "2024-11-22" },
  ];

  window.TRANSACTIONS = [...REAL, ...EXTRA].sort((a, b) => a.sort_key.localeCompare(b.sort_key));

  window.COUNTRY_FLAGS = {
    "Uganda":  "🇺🇬",
    "Sénégal": "🇸🇳",
    "Kenya":   "🇰🇪",
    "Maroc":   "🇲🇦",
  };

  // Country -> rough 2-letter code we'll use for SVG flags (avoids emoji)
  window.COUNTRY_CODE = {
    "Uganda":  "UG",
    "Sénégal": "SN",
    "Kenya":   "KE",
    "Maroc":   "MA",
  };

  // Monthly totals helper
  window.summarize = function (txns) {
    const byCountry = {};
    const byMonth = {};
    const byRecipient = {};
    const byCurrency = {};
    let totalEur = 0;
    txns.forEach((t) => {
      const eur = parseFloat(t.amount_eur) || 0;
      totalEur += eur;
      byCountry[t.country]      = (byCountry[t.country]      || 0) + eur;
      byRecipient[t.recipient_name] = (byRecipient[t.recipient_name] || 0) + eur;
      byCurrency[t.currency]    = (byCurrency[t.currency]    || 0) + eur;
      const month = t.sort_key.slice(0, 7);
      byMonth[month]            = (byMonth[month]            || 0) + eur;
    });
    return { byCountry, byMonth, byRecipient, byCurrency, totalEur, count: txns.length };
  };

  window.I18N = {
    fr: {
      // Marketing / hero
      brand:           "Transfèr",
      tagline:         "Vos transferts d'argent, prêts pour le fisc.",
      sub:             "Importez vos reçus, on prépare votre déclaration.",
      // Import
      import_title:    "Importer vos transferts",
      import_sub:      "Choisissez une source. Tout reste sur votre appareil.",
      method_email:    "Connecter ma boîte mail",
      method_email_d:  "Outlook · Hotmail · Gmail. Connexion sécurisée par mot de passe d'application.",
      method_json:     "Importer un fichier JSON",
      method_json_d:   "Le fichier généré par l'extracteur en ligne de commande.",
      method_eml:      "Déposer des e-mails .eml",
      method_eml_d:    "Glissez-déposez les reçus exportés depuis votre messagerie.",
      // Common
      cta_continue:    "Continuer",
      cta_back:        "Retour",
      cta_export:      "Exporter le rapport PDF",
      cta_connect:     "Se connecter",
      step1:           "Source",
      step2:           "Vérification",
      step3:           "Récapitulatif",
      // Email form
      email_label:     "Adresse e-mail",
      pw_label:        "Mot de passe d'application",
      pw_hint:         "Pas votre mot de passe habituel — un mot de passe d'application à 16 caractères.",
      year_label:      "Année fiscale",
      recipient_label: "Nom du bénéficiaire",
      // Loading
      scanning:        "Lecture de votre messagerie…",
      // Dashboard
      dash_title:      "Année fiscale",
      total_eur:       "Total équivalent EUR",
      transfers:       "transferts",
      recipients:      "bénéficiaires",
      countries:       "pays",
      by_country:      "Par pays de destination",
      by_recipient:    "Par bénéficiaire",
      by_month:        "Par mois",
      by_currency:     "Par devise",
      transactions:    "Transactions",
      col_date:        "Date",
      col_amount:      "Montant",
      col_eur:         "≈ EUR",
      col_recipient:   "Bénéficiaire",
      col_country:     "Pays",
      col_txn:         "Référence",
      disclaimer:      "Les valeurs en EUR sont approximatives et peuvent différer des taux applicables au moment du transfert.",
      pdf_ready:       "Rapport prêt — case 2042-K à compléter.",
      drag_drop:       "Glissez vos fichiers ici",
      or_browse:       "ou cliquez pour parcourir",
      empty:           "Aucun transfert importé",
    },
    en: {
      brand:           "Transfèr",
      tagline:         "Your remittances, ready for the tax office.",
      sub:             "Import your receipts — we'll prepare the declaration.",
      import_title:    "Import your transfers",
      import_sub:      "Pick a source. Everything stays on your device.",
      method_email:    "Connect my mailbox",
      method_email_d:  "Outlook · Hotmail · Gmail. Secure IMAP using an app password.",
      method_json:     "Upload a JSON file",
      method_json_d:   "The file produced by the command-line extractor.",
      method_eml:      "Drop .eml files",
      method_eml_d:    "Drag and drop receipts exported from your mail client.",
      cta_continue:    "Continue",
      cta_back:        "Back",
      cta_export:      "Export PDF report",
      cta_connect:     "Connect",
      step1:           "Source",
      step2:           "Review",
      step3:           "Summary",
      email_label:     "Email address",
      pw_label:        "App password",
      pw_hint:         "Not your regular password — a 16-character app password.",
      year_label:      "Tax year",
      recipient_label: "Recipient name",
      scanning:        "Scanning your inbox…",
      dash_title:      "Tax year",
      total_eur:       "Total EUR equivalent",
      transfers:       "transfers",
      recipients:      "recipients",
      countries:       "countries",
      by_country:      "By destination country",
      by_recipient:    "By recipient",
      by_month:        "By month",
      by_currency:     "By currency",
      transactions:    "Transactions",
      col_date:        "Date",
      col_amount:      "Amount",
      col_eur:         "≈ EUR",
      col_recipient:   "Recipient",
      col_country:     "Country",
      col_txn:         "Reference",
      disclaimer:      "EUR values are approximate and may differ from the rates applicable when each transfer was made.",
      pdf_ready:       "Report ready — for use with form 2042-K.",
      drag_drop:       "Drop files here",
      or_browse:       "or click to browse",
      empty:           "No transfers imported",
    },
  };

  window.formatEUR = function (n) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  };
  window.formatEURp = function (n) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n);
  };
  window.formatAmount = function (n, cur) {
    const v = parseFloat(n) || 0;
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(v) + ' ' + cur;
  };
})();
