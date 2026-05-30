export interface Transaction {
  date: string;
  amount: string;
  currency: string;
  amount_eur: string;
  recipient_name: string;
  transaction_number: string;
  email_subject: string;
  country: string;
  sort_key: string;
}

export interface ExtractResponse {
  transactions: Transaction[];
  eur_rates: Record<string, number>;
  saved: number;
  stats: Stats;
}

export interface Stats {
  total: number;
  recipients: string[];
  year_range: [number, number] | null;
}

export interface ReportPayload {
  transactions: Transaction[];
  eur_rates: Record<string, number>;
  recipient_name: string;
  start_year: number;
  end_year: number;
  lang: string;
}
