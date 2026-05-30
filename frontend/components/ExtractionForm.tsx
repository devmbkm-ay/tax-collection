"use client";

import { useState } from "react";

interface FormValues {
  email: string;
  password: string;
  recipient_names: string[];
  start_year: number;
  end_year: number;
  lang: "fr" | "en";
}

interface Props {
  onSubmit: (values: FormValues) => void;
  loading: boolean;
}

const CURRENT_YEAR = new Date().getFullYear();

export default function ExtractionForm({ onSubmit, loading }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recipients, setRecipients] = useState<string[]>([""]);
  const [startYear, setStartYear] = useState(CURRENT_YEAR - 1);
  const [endYear, setEndYear] = useState(CURRENT_YEAR - 1);
  const [lang, setLang] = useState<"fr" | "en">("fr");

  const setRecipient = (i: number, v: string) =>
    setRecipients((rs) => rs.map((r, j) => (j === i ? v : r)));
  const addRecipient = () => setRecipients((rs) => [...rs, ""]);
  const removeRecipient = (i: number) =>
    setRecipients((rs) => (rs.length > 1 ? rs.filter((_, j) => j !== i) : [""]));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ email, password, recipient_names: recipients.map((r) => r.trim()), start_year: startYear, end_year: endYear, lang });
  };

  const inputCls =
    "w-full px-3 py-2 rounded border border-(--rule) bg-(--paper) text-(--ink) text-sm focus:outline-none focus:border-(--clay) transition-colors";
  const labelCls = "block text-xs font-semibold text-(--muted) mb-1 uppercase tracking-wide";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label className={labelCls}>Adresse email</label>
        <input type="email" required placeholder="vous@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Mot de passe d&apos;application</label>
        <input type="password" required placeholder="xxxx xxxx xxxx xxxx" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
        <p className="mt-1 text-xs text-(--muted)">Générez un mot de passe d&apos;application dans les paramètres de sécurité Google.</p>
      </div>

      <div>
        <label className={labelCls}>Bénéficiaire(s)</label>
        <div className="flex flex-col gap-2">
          {recipients.map((r, i) => (
            <div key={i} className="flex gap-2">
              <input type="text" value={r} onChange={(e) => setRecipient(i, e.target.value)}
                placeholder={i === 0 ? "Optionnel — détecté automatiquement" : "Autre bénéficiaire"}
                className={inputCls} />
              {recipients.length > 1 && (
                <button type="button" onClick={() => removeRecipient(i)}
                  className="px-3 rounded border border-(--rule) text-(--muted) text-sm hover:border-(--clay) transition-colors">
                  ×
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addRecipient} className="text-xs text-(--clay) font-semibold text-left hover:underline">
            + Ajouter un bénéficiaire
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className={labelCls}>De</label>
          <input type="number" min={2015} max={CURRENT_YEAR} value={startYear} onChange={(e) => setStartYear(Number(e.target.value))} className={inputCls} />
        </div>
        <div className="flex-1">
          <label className={labelCls}>À</label>
          <input type="number" min={2015} max={CURRENT_YEAR} value={endYear} onChange={(e) => setEndYear(Number(e.target.value))} className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Langue du rapport</label>
        <select value={lang} onChange={(e) => setLang(e.target.value as "fr" | "en")} className={inputCls}>
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
      </div>

      <button type="submit" disabled={loading}
        className="mt-2 w-full py-3 rounded font-bold text-sm tracking-wider uppercase bg-(--ink) text-(--bg) hover:bg-(--clay) transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
        {loading ? "Extraction en cours…" : "Générer le rapport"}
      </button>
    </form>
  );
}
