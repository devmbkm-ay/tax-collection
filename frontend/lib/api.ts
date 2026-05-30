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

export async function* streamExtraction(payload: {
  email: string;
  password: string;
  recipient_names: string[];
  start_year: number;
  end_year: number;
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
