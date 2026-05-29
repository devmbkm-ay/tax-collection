"use client";

import { useState } from "react";
import { extractTransactions, downloadPdf, downloadCsv, triggerDownload } from "@/lib/api";
import type { Transaction, ExtractResponse } from "@/lib/types";
import { type Translation, summarize, formatEUR, formatEURp, formatAmount, COUNTRY_CODE, I18N, type Lang } from "@/lib/theme-utils";

const F = {
  bg: "#FBF4EC", card: "#FFFFFF", cream: "#F5E9DA",
  peach: "#F8B79B", peachDeep: "#E8896A", coral: "#D55F4B",
  sage: "#A8B89A", sageDeep: "#5F7A5F",
  ink: "#2A2520", muted: "#7B6F62", line: "#EADDC8", sun: "#E8B958",
};
const FONT = `'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif`;
const NUM  = `'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif`;

// ── atoms ─────────────────────────────────────────────────────────────────────
const Pill = ({ children, color = F.peach, fg = F.ink }: { children: React.ReactNode; color?: string; fg?: string }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, background: color, color: fg, fontSize: 12, fontWeight: 600, letterSpacing: 0.1 }}>{children}</span>
);

const Btn = ({ children, onClick, kind = "primary", style = {}, disabled = false }: {
  children: React.ReactNode; onClick?: () => void; kind?: string;
  style?: React.CSSProperties; disabled?: boolean;
}) => {
  const s: Record<string, React.CSSProperties> = {
    primary: { background: F.coral, color: "#FFF8F2", border: "1.5px solid " + F.coral },
    ghost:   { background: "transparent", color: F.ink, border: "1.5px solid " + F.line },
    soft:    { background: F.cream, color: F.ink, border: "1.5px solid " + F.line },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...(s[kind] || s.primary), padding: "12px 20px", borderRadius: 14, fontFamily: FONT,
      fontWeight: 600, fontSize: 14, cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.4 : 1, ...style,
    }}>{children}</button>
  );
};

const Flag = ({ code, size = 22 }: { code?: string; size?: number }) => {
  const colors: Record<string, string[]> = {
    UG: ["#000", "#FCDC04", "#D90000"], SN: ["#00853F", "#FDEF42", "#E31B23"],
    KE: ["#000", "#BB0000", "#006600"], MA: ["#C1272D", "#006233"],
  };
  const c = code ? (colors[code] || ["#888"]) : ["#888"];
  return (
    <div style={{ display: "flex", flexDirection: "column", width: size, height: size * 0.66, borderRadius: 4, overflow: "hidden", border: "1px solid " + F.line }}>
      {c.map((col, i) => <div key={i} style={{ flex: 1, background: col }} />)}
    </div>
  );
};

const Card = ({ title, children, style = {} }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: F.card, borderRadius: 20, padding: 22, border: "1.5px solid " + F.line, ...style }}>
    <div style={{ fontSize: 11, color: F.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{title}</div>
    {children}
  </div>
);

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <label style={{ display: "block" }}>
    <div style={{ fontSize: 12, fontWeight: 600, color: F.ink, marginBottom: 6 }}>{label}</div>
    {children}
    {hint && <div style={{ fontSize: 11, color: F.muted, marginTop: 6 }}>{hint}</div>}
  </label>
);

const Step = ({ n, t, d }: { n: number; t: string; d: string }) => (
  <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
    <div style={{ width: 24, height: 24, borderRadius: 99, background: F.coral, color: "#fff", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{n}</div>
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: F.ink }}>{t}</div>
      <div style={{ fontSize: 12, color: F.muted, marginTop: 2 }}>{d}</div>
    </div>
  </div>
);

const inp: React.CSSProperties = {
  width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid " + F.line,
  background: F.card, fontFamily: FONT, fontSize: 14, color: F.ink, outline: "none", boxSizing: "border-box",
};

// ── TopBar ────────────────────────────────────────────────────────────────────
function TopBar({ T, step, lang, setLang }: { T: Translation; step: number; lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: F.coral, display: "grid", placeItems: "center", color: "#fff", fontFamily: NUM, fontWeight: 800, fontSize: 18, letterSpacing: -0.5 }}>F</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: F.ink, letterSpacing: -0.3 }}>{T.brand}</div>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {[T.step1, T.step2, T.step3].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: i === step ? F.ink : F.muted, padding: "6px 12px", borderRadius: 99, background: i === step ? F.cream : "transparent", border: i === step ? "1px solid " + F.line : "1px solid transparent" }}>
              {i + 1}. {s}
            </div>
            {i < 2 && <div style={{ width: 14, height: 1, background: F.line }} />}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 4, background: F.cream, padding: 4, borderRadius: 99, border: "1px solid " + F.line }}>
        {(["fr", "en"] as Lang[]).map((l) => (
          <button key={l} onClick={() => setLang(l)} style={{
            border: "none", padding: "5px 12px", borderRadius: 99, cursor: "pointer",
            background: lang === l ? F.card : "transparent", color: lang === l ? F.ink : F.muted,
            fontWeight: 700, fontSize: 11, boxShadow: lang === l ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
          }}>{l.toUpperCase()}</button>
        ))}
      </div>
    </div>
  );
}

// ── Screen 1 ───────────────────────────────────────────────────────────────────
function Screen1({ T, go, lang, setLang }: { T: Translation; go: (s: string) => void; lang: Lang; setLang: (l: Lang) => void }) {
  const SourceCard = ({ icon, title, desc, onClick, accent }: { icon: string; title: string; desc: string; onClick: () => void; accent: string }) => (
    <button onClick={onClick} style={{
      position: "relative", textAlign: "left", padding: "26px 24px 22px", borderRadius: 22,
      border: "1.5px solid " + F.line, background: F.card, cursor: "pointer",
      fontFamily: FONT, display: "flex", flexDirection: "column", gap: 14,
    }}
    onMouseEnter={(e) => { e.currentTarget.style.borderColor = F.peachDeep; e.currentTarget.style.transform = "translateY(-2px)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.borderColor = F.line; e.currentTarget.style.transform = "translateY(0)"; }}>
      <div style={{ width: 52, height: 52, borderRadius: 16, background: accent, display: "grid", placeItems: "center", color: "#fff", fontSize: 24 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 17, fontWeight: 700, color: F.ink, marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 13, color: F.muted, lineHeight: 1.55 }}>{desc}</div>
      </div>
      <div style={{ marginTop: "auto", fontSize: 12, fontWeight: 600, color: F.coral }}>
        {lang === "fr" ? "Choisir cette source →" : "Choose this source →"}
      </div>
    </button>
  );

  return (
    <div style={{ padding: "44px 56px 56px", display: "flex", flexDirection: "column", gap: 32, height: "100%" }}>
      <TopBar T={T} step={0} lang={lang} setLang={setLang} />
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40 }}>
        <div>
          <div style={{ display: "inline-flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: F.sage }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: F.sageDeep, letterSpacing: 1.2, textTransform: "uppercase" }}>FiscalFlow 2024</span>
          </div>
          <h1 style={{ fontSize: 44, fontWeight: 700, lineHeight: 1.1, color: F.ink, margin: 0, maxWidth: 560, letterSpacing: -0.5 }}>
            {T.import_title}<span style={{ color: F.coral }}>.</span>
          </h1>
          <p style={{ fontSize: 16, color: F.muted, marginTop: 12, maxWidth: 480, lineHeight: 1.5 }}>{T.import_sub}</p>
        </div>
        <div style={{ background: F.cream, borderRadius: 18, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, border: "1.5px solid " + F.line }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: F.sage, display: "grid", placeItems: "center", color: "#fff" }}>🔒</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: F.ink }}>100% sécurisé</div>
            <div style={{ fontSize: 11, color: F.muted }}>{lang === "fr" ? "Identifiants jamais stockés." : "Credentials never stored."}</div>
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
        <SourceCard accent={F.peachDeep} icon="@" title={T.method_email} desc={T.method_email_d} onClick={() => go("email")} />
        <SourceCard accent={F.sage} icon="{ }" title={T.method_json} desc={T.method_json_d} onClick={() => {}} />
        <SourceCard accent={F.sun} icon="✉" title={T.method_eml} desc={T.method_eml_d} onClick={() => {}} />
      </div>
    </div>
  );
}

// ── Email form ─────────────────────────────────────────────────────────────────
function ScreenEmail({ T, go, lang, setLang, onExtract }: {
  T: Translation; go: (s: string) => void; lang: Lang; setLang: (l: Lang) => void;
  onExtract: (v: { email: string; password: string; recipient_name: string; start_year: number; end_year: number }) => void;
}) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [startYear, setStartYear] = useState(String(new Date().getFullYear() - 1));
  const [endYear, setEndYear] = useState(String(new Date().getFullYear() - 1));

  return (
    <div style={{ padding: "44px 56px 56px", display: "flex", flexDirection: "column", gap: 28, height: "100%" }}>
      <TopBar T={T} step={1} lang={lang} setLang={setLang} />
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 40, alignItems: "flex-start" }}>
        <div>
          <button onClick={() => go("start")} style={{ background: "none", border: "none", color: F.muted, fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 16 }}>← {T.cta_back}</button>
          <h2 style={{ fontSize: 30, fontWeight: 700, color: F.ink, margin: 0, letterSpacing: -0.3 }}>
            {lang === "fr" ? "Connectez votre boîte mail" : "Connect your inbox"}
          </h2>
          <p style={{ fontSize: 14, color: F.muted, marginTop: 8, lineHeight: 1.55, maxWidth: 380 }}>
            {lang === "fr" ? "Identifiants jamais stockés. Lecture IMAP en lecture seule." : "Credentials never stored. Read-only IMAP scan."}
          </p>
          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label={T.email_label}><input value={email} onChange={(e) => setEmail(e.target.value)} style={inp} placeholder="vous@gmail.com" /></Field>
            <Field label={T.pw_label} hint={T.pw_hint}><input value={pw} onChange={(e) => setPw(e.target.value)} type="password" placeholder="xxxx xxxx xxxx xxxx" style={inp} /></Field>
            <Field label={T.recipient_label}><input value={name} onChange={(e) => setName(e.target.value)} style={inp} placeholder="Patrick Kayombya" /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label={lang === "fr" ? "De" : "From"}><input value={startYear} onChange={(e) => setStartYear(e.target.value)} style={inp} /></Field>
              <Field label={lang === "fr" ? "À" : "To"}><input value={endYear} onChange={(e) => setEndYear(e.target.value)} style={inp} /></Field>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <Btn onClick={() => onExtract({ email, password: pw, recipient_name: name, start_year: Number(startYear), end_year: Number(endYear) })}>{T.cta_connect} →</Btn>
              <Btn kind="ghost" onClick={() => go("start")}>{T.cta_back}</Btn>
            </div>
          </div>
        </div>
        <div style={{ background: "linear-gradient(135deg, #FFE6D6 0%, #F5E9DA 100%)", borderRadius: 22, padding: 28, border: "1.5px solid " + F.line, position: "relative", overflow: "hidden" }}>
          <Pill color={F.sage} fg="#fff">✓ {lang === "fr" ? "Sécurisé" : "Secure"}</Pill>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: F.ink, marginTop: 16, marginBottom: 14 }}>
            {lang === "fr" ? "Comment ça marche" : "How it works"}
          </h3>
          <Step n={1} t={lang === "fr" ? "Activez les mots de passe d'application" : "Enable app passwords"} d={lang === "fr" ? "Dans les paramètres de sécurité de votre messagerie." : "In your mail provider's security settings."} />
          <Step n={2} t={lang === "fr" ? "Collez le mot de passe à 16 caractères" : "Paste the 16-character app password"} d={lang === "fr" ? "Pas votre mot de passe habituel." : "Not your regular password."} />
          <Step n={3} t={lang === "fr" ? "On lit vos reçus en IMAP" : "We read receipts over IMAP"} d={lang === "fr" ? "Quelques secondes. Rien n'est stocké en ligne." : "A few seconds. Nothing stored online."} />
          <div style={{ position: "absolute", right: -40, bottom: -40, width: 180, height: 180, borderRadius: "50%", background: F.peach, opacity: 0.35 }} />
        </div>
      </div>
    </div>
  );
}

// ── Loading ────────────────────────────────────────────────────────────────────
function ScreenLoading({ T, lang, setLang }: { T: Translation; lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div style={{ padding: "44px 56px 56px", display: "flex", flexDirection: "column", gap: 28, height: "100%" }}>
      <TopBar T={T} step={1} lang={lang} setLang={setLang} />
      <div style={{ flex: 1, display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <div style={{ position: "relative", width: 96, height: 96, margin: "0 auto 24px" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: F.peach, opacity: 0.4, animation: "foyerPulse 1.6s ease-in-out infinite" }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: F.coral, display: "grid", placeItems: "center", color: "#fff", fontSize: 32 }}>✦</div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: F.ink, marginBottom: 6 }}>{T.scanning}</div>
          <div style={{ fontSize: 13, color: F.muted }}>
            {lang === "fr" ? "Recherche des reçus WorldRemit…" : "Searching WorldRemit receipts…"}
          </div>
        </div>
      </div>
      <style>{`@keyframes foyerPulse { 0%{transform:scale(0.9);opacity:0.5} 50%{transform:scale(1.15);opacity:0.2} 100%{transform:scale(0.9);opacity:0.5} }`}</style>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({ T, go, lang, setLang, transactions, saved }: {
  T: Translation; go: (s: string) => void; lang: Lang; setLang: (l: Lang) => void;
  transactions: Transaction[]; saved: number;
}) {
  const s = summarize(transactions);
  const countries = Object.entries(s.byCountry).sort((a, b) => b[1] - a[1]);
  const recipients = Object.entries(s.byRecipient).sort((a, b) => b[1] - a[1]);
  const td: React.CSSProperties = { padding: "10px 14px", color: F.ink, fontSize: 12, verticalAlign: "middle" };

  return (
    <div style={{ padding: "32px 48px 32px", display: "flex", flexDirection: "column", gap: 20, height: "100%", overflow: "auto" }}>
      <TopBar T={T} step={2} lang={lang} setLang={setLang} />
      <div style={{ background: `linear-gradient(120deg, ${F.peach} 0%, ${F.cream} 70%)`, borderRadius: 24, padding: "26px 30px", display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", border: "1.5px solid " + F.line }}>
        <div>
          <Pill color={F.card} fg={F.ink}>{T.dash_title} · {transactions[0]?.sort_key.slice(0, 4) || "—"}</Pill>
          <div style={{ fontSize: 56, fontWeight: 700, color: F.ink, marginTop: 12, letterSpacing: -1, fontFamily: NUM }}>{formatEUR(s.totalEur)}</div>
          <div style={{ display: "flex", gap: 22, marginTop: 8, fontSize: 13, color: F.ink }}>
            <span><b>{s.count}</b> {T.transfers}</span>
            <span style={{ color: F.line }}>·</span>
            <span><b>{recipients.length}</b> {T.recipients}</span>
            <span style={{ color: F.line }}>·</span>
            <span><b>{countries.length}</b> {T.countries}</span>
          </div>
        </div>
        <Btn onClick={() => go("pdf")}>{T.cta_export}</Btn>
      </div>

      {saved > 0 && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "10px 16px", fontSize: 13, color: "#166534" }}>
          ✓ {T.saved(saved)}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
        <Card title={T.by_country}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 10 }}>
            {countries.map(([c, v]) => {
              const pct = v / s.totalEur * 100;
              return (
                <div key={c}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                    <Flag code={COUNTRY_CODE[c]} />
                    <span style={{ fontWeight: 600, fontSize: 14, color: F.ink, flex: 1 }}>{c}</span>
                    <span style={{ fontFamily: NUM, fontWeight: 700, fontSize: 14, color: F.ink }}>{formatEUR(v)}</span>
                    <span style={{ fontSize: 11, color: F.muted, width: 36, textAlign: "right" }}>{pct.toFixed(0)}%</span>
                  </div>
                  <div style={{ height: 8, background: F.cream, borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: pct + "%", height: "100%", background: F.peachDeep, borderRadius: 99 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card title={T.by_recipient}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
            {recipients.map(([r, v]) => (
              <div key={r} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: F.cream, borderRadius: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 99, background: F.peachDeep, display: "grid", placeItems: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>
                  {r.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </div>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: F.ink }}>{r}</div>
                <div style={{ fontFamily: NUM, fontSize: 14, fontWeight: 700, color: F.ink }}>{formatEUR(v)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title={T.transactions} style={{ flex: 1 }}>
        <div style={{ overflowX: "auto", marginTop: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT, fontSize: 12 }}>
            <thead>
              <tr style={{ background: F.cream }}>
                {[T.col_date, T.col_recipient, T.col_country, T.col_amount, T.col_eur, T.col_txn].map((h, i) => (
                  <th key={i} style={{ textAlign: i >= 3 ? "right" : "left", padding: "10px 14px", fontSize: 11, fontWeight: 700, color: F.muted, textTransform: "uppercase", letterSpacing: 0.6 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.slice().sort((a, b) => a.sort_key.localeCompare(b.sort_key)).map((t) => (
                <tr key={t.transaction_number + t.sort_key} style={{ borderTop: "1px solid " + F.line }}>
                  <td style={td}>{t.date}</td>
                  <td style={td}>{t.recipient_name}</td>
                  <td style={td}><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Flag code={COUNTRY_CODE[t.country]} size={18} />{t.country}</span></td>
                  <td style={{ ...td, textAlign: "right", fontFamily: NUM }}>{formatAmount(t.amount, t.currency)}</td>
                  <td style={{ ...td, textAlign: "right", fontFamily: NUM, fontWeight: 700 }}>{formatEURp(parseFloat(t.amount_eur))}</td>
                  <td style={{ ...td, textAlign: "right", color: F.muted, fontFamily: NUM, fontSize: 11 }}>{t.transaction_number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── PDF ────────────────────────────────────────────────────────────────────────
function ScreenPdf({ T, go, lang, setLang, transactions, eurRates, recipientName, startYear, endYear }: {
  T: Translation; go: (s: string) => void; lang: Lang; setLang: (l: Lang) => void;
  transactions: Transaction[]; eurRates: Record<string, number>;
  recipientName: string; startYear: number; endYear: number;
}) {
  const s = summarize(transactions);
  const [loading, setLoading] = useState<string | null>(null);
  const period = startYear === endYear ? String(startYear) : `${startYear}–${endYear}`;
  const payload = { transactions, eur_rates: eurRates, recipient_name: recipientName, start_year: startYear, end_year: endYear, lang };

  const Row = ({ k, v, strong }: { k: string; v: string | number; strong?: boolean }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid " + F.cream, fontSize: 12 }}>
      <span style={{ color: F.muted }}>{k}</span>
      <span style={{ color: F.ink, fontWeight: strong ? 700 : 500, fontFamily: NUM }}>{v}</span>
    </div>
  );

  const handlePdf = async () => { setLoading("pdf"); triggerDownload(await downloadPdf(payload), `rapport_${period}.pdf`); setLoading(null); };
  const handleCsv = async () => { setLoading("csv"); triggerDownload(await downloadCsv(payload), `transactions_${period}.csv`); setLoading(null); };
  const handleJson = () => { triggerDownload(new Blob([JSON.stringify(transactions, null, 2)], { type: "application/json" }), "transactions.json"); };

  return (
    <div style={{ padding: "32px 48px 32px", display: "flex", flexDirection: "column", gap: 16, height: "100%", overflow: "auto" }}>
      <TopBar T={T} step={2} lang={lang} setLang={setLang} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
        <button onClick={() => go("dashboard")} style={{ background: "none", border: "none", color: F.muted, fontSize: 13, cursor: "pointer", padding: 0 }}>← {T.cta_back}</button>
        <Pill color={F.sage} fg="#fff">✓ {T.pdf_ready}</Pill>
      </div>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ background: "#fff", border: "1.5px solid " + F.line, borderRadius: 18, padding: 28, overflow: "hidden" }}>
          <div style={{ fontSize: 10, color: F.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>Rapport · {period}</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: F.ink, margin: "6px 0 14px", letterSpacing: -0.3 }}>
            {lang === "fr" ? "Rapport de transferts internationaux" : "International transfers report"}
          </h3>
          <div style={{ borderTop: "1px solid " + F.line, paddingTop: 10 }}>
            <Row k={lang === "fr" ? "Bénéficiaire" : "Recipient"} v={recipientName} />
            <Row k={lang === "fr" ? "Période" : "Period"} v={period} />
            <Row k={T.transfers} v={s.count} />
            <Row k={T.total_eur} v={formatEUR(s.totalEur)} strong />
          </div>
          <div style={{ marginTop: 16, fontSize: 10, color: F.muted, fontStyle: "italic", borderTop: "1px dashed " + F.line, paddingTop: 8 }}>{T.disclaimer}</div>
        </div>
        <div style={{ background: F.cream, borderRadius: 18, padding: 24, border: "1.5px solid " + F.line }}>
          <h4 style={{ fontSize: 16, fontWeight: 700, color: F.ink, margin: 0 }}>
            {lang === "fr" ? "Téléchargements" : "Downloads"}
          </h4>
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <Btn onClick={handlePdf} disabled={loading !== null}>📄 PDF</Btn>
            <Btn kind="soft" onClick={handleCsv} disabled={loading !== null}>📊 CSV</Btn>
            <Btn kind="soft" onClick={handleJson} disabled={loading !== null}>{"{ }"} JSON</Btn>
          </div>
          <div style={{ marginTop: 22, padding: 14, background: F.card, borderRadius: 12, border: "1px solid " + F.line }}>
            <div style={{ fontSize: 11, color: F.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>
              {lang === "fr" ? "Astuce" : "Tip"}
            </div>
            <div style={{ fontSize: 12, color: F.ink, lineHeight: 1.5 }}>
              {lang === "fr"
                ? "Si vous envoyez plus de 10 000 € par an, déclarez aussi en case 8UU."
                : "If you send more than €10,000 a year, declare in box 8UU too."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────
export default function FoyerTheme() {
  const [screen, setScreen] = useState("start");
  const [lang, setLang] = useState<Lang>("fr");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [eurRates, setEurRates] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [formMeta, setFormMeta] = useState({ recipientName: "", startYear: 2024, endYear: 2024 });

  const T = I18N[lang];
  const go = (s: string) => { setError(null); setScreen(s); };

  const handleExtract = async (vals: { email: string; password: string; recipient_name: string; start_year: number; end_year: number }) => {
    setFormMeta({ recipientName: vals.recipient_name, startYear: vals.start_year, endYear: vals.end_year });
    setScreen("loading");
    try {
      const data: ExtractResponse = await extractTransactions({ ...vals, lang });
      if (!data.transactions.length) {
        setError("Aucune transaction trouvée."); setScreen("email");
      } else {
        setTransactions(data.transactions); setEurRates(data.eur_rates); setSaved(data.saved); setScreen("dashboard");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de connexion."); setScreen("email");
    }
  };

  return (
    <div style={{ background: F.bg, color: F.ink, fontFamily: FONT, height: "100vh", width: "100%", overflow: "hidden", position: "relative" }}>
      {error && <div style={{ background: "#fee", borderBottom: "1px solid #fcc", padding: "10px 56px", fontSize: 13, color: "#c00" }}>⚠️ {error}</div>}
      {screen === "start"     && <Screen1 T={T} go={go} lang={lang} setLang={setLang} />}
      {screen === "email"     && <ScreenEmail T={T} go={go} lang={lang} setLang={setLang} onExtract={handleExtract} />}
      {screen === "loading"   && <ScreenLoading T={T} lang={lang} setLang={setLang} />}
      {screen === "dashboard" && <Dashboard T={T} go={go} lang={lang} setLang={setLang} transactions={transactions} saved={saved} />}
      {screen === "pdf"       && <ScreenPdf T={T} go={go} lang={lang} setLang={setLang} transactions={transactions} eurRates={eurRates} recipientName={formMeta.recipientName} startYear={formMeta.startYear} endYear={formMeta.endYear} />}
    </div>
  );
}
