import type { ExtractResponse, ExtractionEvent, ReportPayload } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function testConnection(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE}/api/test-connection`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({ detail: res.statusText }));
  if (!res.ok) throw new Error(data.detail ?? "Test de connexion échoué");
  return data.message;
}

export async function fetchStats(): Promise<{ recipients: string[]; year_range: [number, number] | null; total: number }> {
  const res = await fetch(`${BASE}/api/stats`).catch(() => null);
  if (!res?.ok) return { recipients: [], year_range: null, total: 0 };
  return res.json();
}

export async function* streamExtraction(payload: {
  email: string;
  password: string;
  recipient_names: string[];
  start_year: number;
  start_month: number;
  end_year: number;
  end_month: number;
  lang: string;
}): AsyncGenerator<ExtractionEvent> {
  const res = await fetch(`${BASE}/api/extract/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Extraction échouée");
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop()!;
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        yield JSON.parse(line.slice(6)) as ExtractionEvent;
      }
    }
  }
}

export async function extractTransactions(payload: {
  email: string;
  password: string;
  recipient_names: string[];
  start_year: number;
  end_year: number;
  lang: string;
}): Promise<ExtractResponse> {
  const res = await fetch(`${BASE}/api/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Extraction échouée");
  }

  return res.json();
}

export async function updateTransaction(
  key: { sort_key: string; amount: string; currency: string; transaction_number: string },
  patch: { recipient_name?: string; country?: string; amount_eur?: string },
): Promise<void> {
  const res = await fetch(`${BASE}/api/transactions`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...key, ...patch }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Mise à jour échouée");
  }
}

export async function downloadPdf(payload: ReportPayload): Promise<Blob> {
  const res = await fetch(`${BASE}/api/report/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Génération PDF échouée");
  return res.blob();
}

export async function downloadXlsx(payload: ReportPayload): Promise<Blob> {
  const res = await fetch(`${BASE}/api/report/xlsx`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Export Excel échoué");
  return res.blob();
}

export async function downloadCsv(payload: ReportPayload): Promise<Blob> {
  const res = await fetch(`${BASE}/api/report/csv`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Export CSV échoué");
  return res.blob();
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
