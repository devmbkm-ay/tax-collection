"use client";

import { useState } from "react";
import type { ExtractResponse } from "@/lib/types";
import { downloadPdf, downloadCsv, triggerDownload } from "@/lib/api";
import TransactionTable from "./TransactionTable";

interface Props {
  result: ExtractResponse;
  recipientName: string;
  startYear: number;
  endYear: number;
  lang: "fr" | "en";
}

export default function ResultsPanel({
  result,
  recipientName,
  startYear,
  endYear,
  lang,
}: Props) {
  const [dlState, setDlState] = useState<"idle" | "pdf" | "csv" | "json">("idle");
  const { transactions, eur_rates, saved, stats } = result;

  const eurTotal = transactions.reduce((sum, t) => {
    const v = parseFloat(t.amount_eur);
    return sum + (isNaN(v) ? 0 : v);
  }, 0);

  const currencies = [...new Set(transactions.map((t) => t.currency))].sort().join(", ");
  const period = startYear === endYear ? String(startYear) : `${startYear}–${endYear}`;

  const reportPayload = {
    transactions,
    eur_rates,
    recipient_name: recipientName,
    start_year: startYear,
    end_year: endYear,
    lang,
  };

  const handlePdf = async () => {
    setDlState("pdf");
    try {
      const blob = await downloadPdf(reportPayload);
      triggerDownload(blob, `rapport_${period}.pdf`);
    } finally {
      setDlState("idle");
    }
  };

  const handleCsv = async () => {
    setDlState("csv");
    try {
      const blob = await downloadCsv(reportPayload);
      triggerDownload(blob, `transactions_${period}.csv`);
    } finally {
      setDlState("idle");
    }
  };

  const handleJson = () => {
    setDlState("json");
    const json = JSON.stringify(transactions, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    triggerDownload(blob, "worldremit_transactions.json");
    setDlState("idle");
  };

  const metricCls =
    "bg-white rounded border border-(--rule) p-4 flex flex-col items-center gap-1";

  return (
    <div className="flex flex-col gap-6">
      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className={metricCls}>
          <span className="text-2xl font-bold text-(--clay)">
            {transactions.length}
          </span>
          <span className="text-xs text-(--muted) uppercase tracking-wide">
            Transactions
          </span>
        </div>
        <div className={metricCls}>
          <span className="text-2xl font-bold text-(--clay)">
            {eurTotal.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
          </span>
          <span className="text-xs text-(--muted) uppercase tracking-wide">
            Total EUR
          </span>
        </div>
        <div className={metricCls}>
          <span className="text-lg font-bold text-(--clay)">{currencies}</span>
          <span className="text-xs text-(--muted) uppercase tracking-wide">
            Devise(s)
          </span>
        </div>
      </div>

      {/* DB info */}
      <p className="text-xs text-(--muted) bg-(--paper) border border-(--rule) rounded px-3 py-2">
        💾 <strong>{saved}</strong> nouvelle(s) transaction(s) sauvegardée(s) —{" "}
        <strong>{stats.total}</strong> au total dans la base de données.
      </p>

      {/* Downloads */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-(--muted) mb-2">
          Téléchargements
        </p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handlePdf}
            disabled={dlState !== "idle"}
            className="flex-1 min-w-[90px] py-2 px-3 text-sm font-semibold rounded
              bg-(--ink) text-(--bg) hover:bg-(--clay) transition-colors
              disabled:opacity-40"
          >
            {dlState === "pdf" ? "…" : "⬇ PDF"}
          </button>
          <button
            onClick={handleCsv}
            disabled={dlState !== "idle"}
            className="flex-1 min-w-[90px] py-2 px-3 text-sm font-semibold rounded
              border border-(--ink) text-(--ink) hover:bg-(--rule) transition-colors
              disabled:opacity-40"
          >
            {dlState === "csv" ? "…" : "⬇ CSV"}
          </button>
          <button
            onClick={handleJson}
            disabled={dlState !== "idle"}
            className="flex-1 min-w-[90px] py-2 px-3 text-sm font-semibold rounded
              border border-(--rule) text-(--muted) hover:bg-(--rule) transition-colors
              disabled:opacity-40"
          >
            {dlState === "json" ? "…" : "⬇ JSON"}
          </button>
        </div>
      </div>

      {/* Table */}
      <TransactionTable transactions={transactions} lang={lang} />
    </div>
  );
}
