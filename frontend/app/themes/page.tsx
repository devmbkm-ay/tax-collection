import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "FiscalFlow — Choisir un thème" };

const themes = [
  {
    slug: "atlas",
    name: "Atlas",
    desc: "Fintech contemporain · tons bone chauds · accent corail · sidebar",
    palette: ["#F4F1EA", "#FF5A36", "#0F0E0C"],
    font: "Bricolage Grotesque, Plus Jakarta Sans",
  },
  {
    slug: "comptoir",
    name: "Comptoir",
    desc: "Guichet civic chaleureux · argile + ocre + serif",
    palette: ["#F1E7D4", "#B8553A", "#1F1A14"],
    font: "Instrument Serif, Public Sans",
  },
  {
    slug: "foyer",
    name: "Foyer",
    desc: "Fintech moderne doux · pêche + sauge + formes arrondies",
    palette: ["#FBF4EC", "#D55F4B", "#2A2520"],
    font: "Plus Jakarta Sans",
  },
];

export default function ThemesPage() {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <header className="border-b border-stone-200 bg-white px-8 py-5">
        <Link href="/" className="text-sm text-stone-500 hover:text-stone-800 transition-colors">
          ← Retour à l&apos;app principale
        </Link>
        <h1 className="text-2xl font-bold text-stone-900 mt-3">Choisir un thème</h1>
        <p className="text-stone-500 text-sm mt-1">
          Trois designs, une seule API. Testez le thème qui vous convient.
        </p>
      </header>

      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {themes.map((t) => (
            <Link
              key={t.slug}
              href={`/themes/${t.slug}`}
              className="group block bg-white rounded-xl border border-stone-200 overflow-hidden
                hover:border-stone-400 hover:-translate-y-1 transition-all duration-150 shadow-sm hover:shadow-md"
            >
              {/* Colour swatch */}
              <div className="h-24 flex">
                {t.palette.map((c, i) => (
                  <div key={i} className="flex-1" style={{ background: c }} />
                ))}
              </div>

              <div className="p-5">
                <div className="text-lg font-bold text-stone-900">{t.name}</div>
                <div className="text-xs text-stone-400 mt-0.5 font-mono">{t.font}</div>
                <p className="text-sm text-stone-600 mt-2 leading-snug">{t.desc}</p>
                <div className="mt-4 text-sm font-semibold text-stone-800 group-hover:underline">
                  Ouvrir →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
