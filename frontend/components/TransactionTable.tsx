"use client";

import type { Transaction } from "@/lib/types";

const COLS_FR = {
  date: "Date",
  amount: "Montant",
  currency: "Devise",
  amount_eur: "≈ EUR",
  transaction_number: "N° Transaction",
  country: "Pays",
};

const COLS_EN = {
  date: "Date",
  amount: "Amount",
  currency: "Cur.",
  amount_eur: "≈ EUR",
  transaction_number: "Transaction #",
  country: "Country",
};

interface Props {
  transactions: Transaction[];
  lang: "fr" | "en";
}

export default function TransactionTable({ transactions, lang }: Props) {
  const cols = lang === "fr" ? COLS_FR : COLS_EN;

  return (
    <div className="overflow-x-auto rounded border border-(--rule)">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-(--paper) border-b border-(--rule)">
            {Object.values(cols).map((h) => (
              <th
                key={h}
                className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-(--muted) whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {transactions
            .slice()
            .sort((a, b) => a.sort_key.localeCompare(b.sort_key))
            .map((t, i) => (
              <tr
                key={i}
                className="border-b border-(--rule) last:border-0 hover:bg-(--paper) transition-colors"
              >
                <td className="px-3 py-2 whitespace-nowrap">{t.date}</td>
                <td className="px-3 py-2 font-mono font-semibold text-(--clay)">
                  {t.amount}
                </td>
                <td className="px-3 py-2">{t.currency}</td>
                <td className="px-3 py-2 font-mono text-(--muted)">
                  {t.amount_eur !== "N/A" ? `${t.amount_eur} €` : "—"}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-(--muted)">
                  {t.transaction_number !== "N/A" ? t.transaction_number : "—"}
                </td>
                <td className="px-3 py-2">{t.country || "—"}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
