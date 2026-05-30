import type { Transaction } from "./types";

export const COUNTRY_CODE: Record<string, string> = {
  Uganda: "UG",
  Sénégal: "SN",
  Kenya: "KE",
  Maroc: "MA",
};

export interface Summary {
  byCountry: Record<string, number>;
  byMonth: Record<string, number>;
  byRecipient: Record<string, number>;
  byCurrency: Record<string, number>;
  totalEur: number;
  count: number;
}

export function summarize(txns: Transaction[]): Summary {
  const byCountry: Record<string, number> = {};
  const byMonth: Record<string, number> = {};
  const byRecipient: Record<string, number> = {};
  const byCurrency: Record<string, number> = {};
  let totalEur = 0;

  txns.forEach((t) => {
    const eur = parseFloat(t.amount_eur) || 0;
    totalEur += eur;
    byCountry[t.country] = (byCountry[t.country] || 0) + eur;
    byRecipient[t.recipient_name] = (byRecipient[t.recipient_name] || 0) + eur;
    byCurrency[t.currency] = (byCurrency[t.currency] || 0) + eur;
    const month = t.sort_key.slice(0, 7);
    byMonth[month] = (byMonth[month] || 0) + eur;
  });

  return { byCountry, byMonth, byRecipient, byCurrency, totalEur, count: txns.length };
}

export function formatEUR(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatEURp(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatAmount(n: string, cur: string): string {
  const v = parseFloat(n) || 0;
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(v) + " " + cur;
}

export const I18N = {
  fr: {
    brand: "FiscalFlow",
    tagline: "Vos transferts d'argent, prêts pour le fisc.",
    sub: "Importez vos reçus, on prépare votre déclaration.",
    import_title: "Importer vos transferts",
    import_sub: "Connectez votre boîte mail pour extraire vos virements WorldRemit.",
    method_email: "Connecter ma boîte mail",
    method_email_d: "Outlook · Hotmail · Gmail. Connexion IMAP sécurisée.",
    method_json: "Importer un fichier JSON",
    method_json_d: "Le fichier généré par l'extracteur en ligne de commande.",
    method_eml: "Déposer des e-mails .eml",
    method_eml_d: "Glissez-déposez les reçus exportés depuis votre messagerie.",
    cta_continue: "Continuer",
    cta_back: "Retour",
    cta_export: "Exporter le rapport PDF",
    cta_connect: "Se connecter",
    step1: "Source",
    step2: "Connexion",
    step3: "Récapitulatif",
    email_label: "Adresse e-mail",
    pw_label: "Mot de passe d'application",
    pw_hint: "Pas votre mot de passe habituel — un mot de passe d'application à 16 caractères.",
    year_label: "Année",
    recipient_label: "Nom du bénéficiaire",
    scanning: "Lecture de votre messagerie…",
    dash_title: "Année fiscale",
    total_eur: "Total équivalent EUR",
    transfers: "transferts",
    recipients: "bénéficiaires",
    countries: "pays",
    by_country: "Par pays de destination",
    by_recipient: "Par bénéficiaire",
    by_month: "Par mois",
    by_currency: "Par devise",
    transactions: "Transactions",
    col_date: "Date",
    col_amount: "Montant",
    col_eur: "≈ EUR",
    col_recipient: "Bénéficiaire",
    col_country: "Pays",
    col_txn: "Référence",
    disclaimer:
      "Les valeurs en EUR sont approximatives et peuvent différer des taux applicables au moment du transfert.",
    pdf_ready: "Rapport prêt — case 2042-K à compléter.",
    drag_drop: "Glissez vos fichiers ici",
    or_browse: "ou cliquez pour parcourir",
    empty: "Aucun transfert importé",
    saved: (n: number) => `${n} nouvelle(s) transaction(s) sauvegardée(s)`,
  },
  en: {
    brand: "FiscalFlow",
    tagline: "Your remittances, ready for the tax office.",
    sub: "Import your receipts — we'll prepare the declaration.",
    import_title: "Import your transfers",
    import_sub: "Connect your inbox to extract your WorldRemit transfers.",
    method_email: "Connect my mailbox",
    method_email_d: "Outlook · Hotmail · Gmail. Secure IMAP connection.",
    method_json: "Upload a JSON file",
    method_json_d: "The file produced by the command-line extractor.",
    method_eml: "Drop .eml files",
    method_eml_d: "Drag and drop receipts exported from your mail client.",
    cta_continue: "Continue",
    cta_back: "Back",
    cta_export: "Export PDF report",
    cta_connect: "Connect",
    step1: "Source",
    step2: "Connect",
    step3: "Summary",
    email_label: "Email address",
    pw_label: "App password",
    pw_hint: "Not your regular password — a 16-character app password.",
    year_label: "Year",
    recipient_label: "Recipient name",
    scanning: "Scanning your inbox…",
    dash_title: "Tax year",
    total_eur: "Total EUR equivalent",
    transfers: "transfers",
    recipients: "recipients",
    countries: "countries",
    by_country: "By destination country",
    by_recipient: "By recipient",
    by_month: "By month",
    by_currency: "By currency",
    transactions: "Transactions",
    col_date: "Date",
    col_amount: "Amount",
    col_eur: "≈ EUR",
    col_recipient: "Recipient",
    col_country: "Country",
    col_txn: "Reference",
    disclaimer:
      "EUR values are approximate and may differ from the rates applicable when each transfer was made.",
    pdf_ready: "Report ready — for use with form 2042-K.",
    drag_drop: "Drop files here",
    or_browse: "or click to browse",
    empty: "No transfers imported",
    saved: (n: number) => `${n} new transaction(s) saved`,
  },
} as const;

export type Lang = "fr" | "en";
export type I18NKeys = keyof typeof I18N.fr;

// Structural type that accepts both fr and en translations
export interface Translation {
  brand: string; tagline: string; sub: string;
  import_title: string; import_sub: string;
  method_email: string; method_email_d: string;
  method_json: string; method_json_d: string;
  method_eml: string; method_eml_d: string;
  cta_continue: string; cta_back: string; cta_export: string; cta_connect: string;
  step1: string; step2: string; step3: string;
  email_label: string; pw_label: string; pw_hint: string;
  year_label: string; recipient_label: string;
  scanning: string; dash_title: string;
  total_eur: string; transfers: string; recipients: string; countries: string;
  by_country: string; by_recipient: string; by_month: string; by_currency: string;
  transactions: string;
  col_date: string; col_amount: string; col_eur: string; col_recipient: string;
  col_country: string; col_txn: string;
  disclaimer: string; pdf_ready: string; drag_drop: string; or_browse: string; empty: string;
  saved: (n: number) => string;
}
