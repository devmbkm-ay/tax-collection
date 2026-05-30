import type { ExtractResponse, ReportPayload } from "./types";

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

export async function downloadPdf(payload: ReportPayload): Promise<Blob> {
  const res = await fetch(`${BASE}/api/report/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Génération PDF échouée");
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
