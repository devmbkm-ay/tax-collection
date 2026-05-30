"use client";

import { useState } from "react";
import { extractTransactions } from "@/lib/api";
import type { ExtractResponse } from "@/lib/types";
import ExtractionForm from "@/components/ExtractionForm";
import ResultsPanel from "@/components/ResultsPanel";

interface FormValues {
  email: string;
  password: string;
  recipient_names: string[];
  start_year: number;
  end_year: number;
  lang: "fr" | "en";
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractResponse | null>(null);
  const [lastForm, setLastForm] = useState<FormValues | null>(null);

  const handleSubmit = async (values: FormValues) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setLastForm(values);

    try {
      const data = await extractTransactions(values);
      if (data.transactions.length === 0) {
        setError("Aucune transaction trouvée pour cette période et ce bénéficiaire.");
      } else {
        setResult(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="border-b border-(--rule) bg-(--paper) px-6 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full border-2 border-(--ink) flex items-center justify-center text-xl font-serif italic text-(--ink)">
          F
        </div>
        <div>
          <div className="text-base font-bold leading-none text-(--ink)">FiscalFlow</div>
          <div className="text-xs text-(--muted)">Rapport Fiscal WorldRemit</div>
        </div>
        <div className="ml-auto">
          <span className="text-xs bg-[#F0CF7E] text-(--ink) px-2 py-0.5 rounded font-semibold">
            Beta
          </span>
        </div>
      </header>

      {/* Main layout */}
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar — form */}
        <aside className="lg:w-80 xl:w-96 shrink-0 border-b lg:border-b-0 lg:border-r border-(--rule) bg-(--paper) p-6 flex flex-col gap-6">
          <div>
            <h1 className="text-xl font-bold text-(--ink)">Nouveau rapport</h1>
            <p className="text-sm text-(--muted) mt-1">
              Connectez-vous à votre boîte mail pour extraire vos virements WorldRemit.
            </p>
          </div>

          <ExtractionForm onSubmit={handleSubmit} loading={loading} />

          <p className="text-xs text-(--muted) border-t border-(--rule) pt-4">
            🔒 Vos identifiants ne sont jamais stockés — ils servent uniquement à la connexion IMAP.
          </p>
        </aside>

        {/* Content area */}
        <section className="flex-1 p-6 lg:p-8 overflow-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-(--muted)">
              <div className="w-10 h-10 border-4 border-(--rule) border-t-(--clay) rounded-full animate-spin" />
              <p className="text-sm">Connexion et extraction en cours…</p>
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 text-sm text-red-800">
              ⚠️ {error}
            </div>
          )}

          {!loading && result && lastForm && (
            <ResultsPanel
              result={result}
              recipientName={lastForm.recipient_names.filter(Boolean).join(", ")}
              startYear={lastForm.start_year}
              endYear={lastForm.end_year}
              lang={lastForm.lang}
            />
          )}

          {!loading && !error && !result && (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-(--muted)">
              <div className="text-5xl">📊</div>
              <p className="text-base text-center max-w-xs">
                Remplissez le formulaire et cliquez sur <strong>Générer le rapport</strong>.
              </p>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-(--rule) bg-(--paper) px-6 py-3 text-center text-xs text-(--muted)">
        FiscalFlow — WorldRemit Tax Report Generator
      </footer>
    </div>
  );
}
