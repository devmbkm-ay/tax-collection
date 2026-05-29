"use client";

import { useState } from "react";

interface FormValues {
  email: string;
  password: string;
  recipient_name: string;
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
  const [form, setForm] = useState<FormValues>({
    email: "",
    password: "",
    recipient_name: "",
    start_year: CURRENT_YEAR - 1,
    end_year: CURRENT_YEAR - 1,
    lang: "fr",
  });

  const set = (k: keyof FormValues, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const inputCls =
    "w-full px-3 py-2 rounded border border-(--rule) bg-(--paper) text-(--ink) text-sm focus:outline-none focus:border-(--clay) transition-colors";

  const labelCls = "block text-xs font-semibold text-(--muted) mb-1 uppercase tracking-wide";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Email */}
      <div>
        <label className={labelCls}>Adresse email</label>
        <input
          type="email"
          required
          placeholder="vous@gmail.com"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          className={inputCls}
        />
      </div>

      {/* App password */}
      <div>
        <label className={labelCls}>Mot de passe d&apos;application</label>
        <input
          type="password"
          required
          placeholder="xxxx xxxx xxxx xxxx"
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          className={inputCls}
        />
        <p className="mt-1 text-xs text-(--muted)">
          Générez un mot de passe d&apos;application dans les paramètres de sécurité Google.
        </p>
      </div>

      {/* Recipient */}
      <div>
        <label className={labelCls}>Nom du bénéficiaire</label>
        <input
          type="text"
          required
          placeholder="Patrick Kayombya"
          value={form.recipient_name}
          onChange={(e) => set("recipient_name", e.target.value)}
          className={inputCls}
        />
      </div>

      {/* Year range */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className={labelCls}>De</label>
          <input
            type="number"
            min={2015}
            max={CURRENT_YEAR}
            value={form.start_year}
            onChange={(e) => set("start_year", Number(e.target.value))}
            className={inputCls}
          />
        </div>
        <div className="flex-1">
          <label className={labelCls}>À</label>
          <input
            type="number"
            min={2015}
            max={CURRENT_YEAR}
            value={form.end_year}
            onChange={(e) => set("end_year", Number(e.target.value))}
            className={inputCls}
          />
        </div>
      </div>

      {/* Language */}
      <div>
        <label className={labelCls}>Langue du rapport</label>
        <select
          value={form.lang}
          onChange={(e) => set("lang", e.target.value)}
          className={inputCls}
        >
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 w-full py-3 rounded font-bold text-sm tracking-wider uppercase
          bg-(--ink) text-(--bg) hover:bg-(--clay) transition-colors
          disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "Extraction en cours…" : "Générer le rapport"}
      </button>
    </form>
  );
}
