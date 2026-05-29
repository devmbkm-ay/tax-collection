"use client";

import { useState } from "react";
import { extractTransactions, downloadPdf, downloadCsv, triggerDownload } from "@/lib/api";
import type { Transaction, ExtractResponse } from "@/lib/types";
import { type Translation, summarize, formatEUR, formatEURp, formatAmount, COUNTRY_CODE, I18N, type Lang } from "@/lib/theme-utils";

const C = {
  bg: "#F1E7D4", paper: "#FAF5E8", card: "#FFFFFF",
  clay: "#B8553A", clayDk: "#8C3D27", ochre: "#D8A23B", ochreLt: "#F0CF7E",
  moss: "#5C6E3F", ink: "#1F1A14", inkSoft: "#3D352C", muted: "#7D6E5C",
  rule: "#D6C5A4", softrule: "#E7D9B8",
};
const SERIF = `'Instrument Serif','Source Serif Pro',Georgia,serif`;
const SANS  = `'Public Sans',ui-sans-serif,system-ui,-apple-system,sans-serif`;
const MONO  = `'DM Mono','JetBrains Mono',ui-monospace,monospace`;

// ── atoms ─────────────────────────────────────────────────────────────────────
const Btn = ({ children, onClick, kind = "primary", style = {}, disabled = false }: {
  children: React.ReactNode; onClick?: () => void; kind?: string;
  style?: React.CSSProperties; disabled?: boolean;
}) => {
  const s: Record<string, React.CSSProperties> = {
    primary: { background: C.ink, color: C.bg, border: "1px solid " + C.ink },
    ghost:   { background: "transparent", color: C.ink, border: "1px solid " + C.rule },
    ochre:   { background: C.ochre, color: C.ink, border: "1px solid " + C.ochre },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...(s[kind] || s.primary), padding: "10px 18px", borderRadius: 4, fontFamily: SANS,
      fontWeight: 600, fontSize: 13, cursor: disabled ? "default" : "pointer", letterSpacing: 0.2,
      textTransform: "uppercase", opacity: disabled ? 0.5 : 1, ...style,
    }}>{children}</button>
  );
};

const Stamp = ({ children, color = C.clay, rotate = -8 }: { children: React.ReactNode; color?: string; rotate?: number }) => (
  <span style={{
    display: "inline-block", padding: "5px 10px", border: "2px solid " + color,
    color, fontFamily: SANS, fontWeight: 800, fontSize: 11, letterSpacing: 2,
    textTransform: "uppercase", transform: `rotate(${rotate}deg)`, borderRadius: 2,
  }}>{children}</span>
);

const Flag = ({ code, size = 22 }: { code?: string; size?: number }) => {
  const colors: Record<string, string[]> = {
    UG: ["#000", "#FCDC04", "#D90000"], SN: ["#00853F", "#FDEF42", "#E31B23"],
    KE: ["#000", "#BB0000", "#006600"], MA: ["#C1272D", "#006233"],
  };
  const c = code ? (colors[code] || ["#888"]) : ["#888"];
  return (
    <div style={{ display: "flex", flexDirection: "column", width: size, height: size * 0.66, borderRadius: 2, overflow: "hidden", border: "1px solid " + C.rule }}>
      {c.map((col, i) => <div key={i} style={{ flex: 1, background: col }} />)}
    </div>
  );
};

const CCard = ({ title, children, style = {} }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: C.card, border: "1px solid " + C.rule, borderRadius: 4, padding: 22, ...style }}>
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid " + C.softrule }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: C.muted, letterSpacing: 2, textTransform: "uppercase" }}>{title}</div>
    </div>
    {children}
  </div>
);

const BigStat = ({ label, v, accent }: { label: string; v: string | number; accent?: string }) => (
  <div style={{ borderLeft: "1px solid " + C.rule, paddingLeft: 18 }}>
    <div style={{ fontFamily: MONO, fontSize: 9.5, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>{label}</div>
    <div style={{ fontFamily: SERIF, fontSize: 26, color: accent || C.ink, marginTop: 4, letterSpacing: -0.3 }}>{v}</div>
  </div>
);

const CField = ({ label, value, onChange, type = "text", placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; hint?: string;
}) => (
  <label>
    <div style={{ fontFamily: MONO, fontSize: 10, color: C.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
    <input value={value} type={type} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={{
      width: "100%", padding: "11px 14px", border: "1px solid " + C.rule, background: C.card,
      fontFamily: SANS, fontSize: 14, color: C.ink, outline: "none", borderRadius: 2, boxSizing: "border-box",
    }} />
    {hint && <div style={{ fontFamily: SANS, fontSize: 11, color: C.muted, marginTop: 5 }}>{hint}</div>}
  </label>
);

// ── Top bar ────────────────────────────────────────────────────────────────────
function TopBar({ T, lang, setLang, step }: {
  T: Translation; lang: Lang; setLang: (l: Lang) => void; step: number
}) {
  return (
    <div style={{ background: C.paper, padding: "14px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid " + C.rule }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, border: "1.5px solid " + C.ink, borderRadius: 99, display: "grid", placeItems: "center", color: C.ink, fontFamily: SERIF, fontSize: 22, fontStyle: "italic" }}>F</div>
        <div>
          <div style={{ fontSize: 16, fontFamily: SERIF, color: C.ink, lineHeight: 1, fontStyle: "italic" }}>{T.brand}</div>
          <div style={{ fontSize: 9.5, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 2 }}>
            {lang === "fr" ? "Bureau des transferts" : "Transfer office"}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {[T.step1, T.step2, T.step3].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              width: 22, height: 22, borderRadius: 99,
              background: i <= step ? C.clay : "transparent",
              border: "1.5px solid " + (i <= step ? C.clay : C.rule),
              color: i <= step ? "#fff" : C.muted,
              display: "grid", placeItems: "center", fontFamily: MONO, fontSize: 10, fontWeight: 700,
            }}>{String(i + 1).padStart(2, "0")}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: i === step ? C.ink : C.muted, letterSpacing: 0.4, textTransform: "uppercase" }}>{s}</span>
            {i < 2 && <div style={{ width: 24, height: 1, background: C.rule, margin: "0 14px" }} />}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", border: "1px solid " + C.rule, borderRadius: 2, overflow: "hidden", fontFamily: MONO }}>
        {(["fr", "en"] as Lang[]).map((l) => (
          <button key={l} onClick={() => setLang(l)} style={{
            border: "none", padding: "5px 10px", cursor: "pointer",
            background: lang === l ? C.ink : "transparent",
            color: lang === l ? C.bg : C.muted, fontSize: 10, fontWeight: 700, letterSpacing: 1,
          }}>{l.toUpperCase()}</button>
        ))}
      </div>
    </div>
  );
}

// ── Screen 1 ───────────────────────────────────────────────────────────────────
function Screen1({ T, go, lang }: { T: Translation; go: (s: string) => void; lang: Lang }) {
  return (
    <div style={{ padding: "44px 48px", display: "flex", flexDirection: "column", gap: 32, flex: 1 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 56, alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: C.clay, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
            Dossier 01 · {lang === "fr" ? "Importation" : "Import"}
          </div>
          <h1 style={{ fontFamily: SERIF, fontSize: 56, fontWeight: 400, color: C.ink, margin: 0, lineHeight: 1.05, letterSpacing: -0.5 }}>
            <span style={{ fontStyle: "italic" }}>{lang === "fr" ? "Bonjour" : "Hello"}.</span>{" "}
            {lang === "fr" ? "Préparons votre déclaration." : "Let's prepare your filing."}
          </h1>
          <p style={{ fontFamily: SANS, fontSize: 15, color: C.inkSoft, marginTop: 18, lineHeight: 1.6, maxWidth: 460 }}>{T.import_sub}</p>
        </div>
        <div style={{ background: C.paper, border: "1px solid " + C.rule, borderRadius: 4, padding: 26, position: "relative" }}>
          <div style={{ position: "absolute", top: -14, right: 18 }}>
            <Stamp>✓ {lang === "fr" ? "Confidentiel" : "Private"}</Stamp>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>
            {lang === "fr" ? "Au guichet" : "At the counter"}
          </div>
          <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 22, color: C.ink, lineHeight: 1.35, margin: "10px 0 0", letterSpacing: -0.2 }}>
            {lang === "fr"
              ? "« Pour les transferts familiaux à l'étranger, vous devez les déclarer en case 2042-K. »"
              : '"Family transfers abroad must be declared in box 2042-K."'}
          </p>
          <div style={{ marginTop: 16, fontFamily: SANS, fontSize: 12, color: C.muted }}>— {lang === "fr" ? "Brochure DGFiP, 2024" : "DGFiP leaflet, 2024"}</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, border: "1px solid " + C.rule, background: C.card, borderRadius: 4, overflow: "hidden" }}>
        <Counter n="01" tag={lang === "fr" ? "Direct" : "Direct"} title={T.method_email} desc={T.method_email_d} cta={lang === "fr" ? "Connecter" : "Connect"} onClick={() => go("email")} accent={C.clay} />
        <div style={{ width: 1, background: C.rule }} />
        <Counter n="02" tag="JSON" title={T.method_json} desc={T.method_json_d} cta={lang === "fr" ? "Bientôt" : "Soon"} onClick={() => {}} accent={C.moss} />
        <div style={{ width: 1, background: C.rule }} />
        <Counter n="03" tag=".EML" title={T.method_eml} desc={T.method_eml_d} cta={lang === "fr" ? "Bientôt" : "Soon"} onClick={() => {}} accent={C.ochre} />
      </div>
    </div>
  );
}

function Counter({ n, tag, title, desc, cta, onClick, accent }: {
  n: string; tag: string; title: string; desc: string; cta: string; onClick: () => void; accent: string
}) {
  return (
    <button onClick={onClick} style={{
      textAlign: "left", padding: "28px 24px 22px", background: "transparent", border: "none",
      cursor: "pointer", fontFamily: SANS, display: "flex", flexDirection: "column", gap: 12,
    }}
    onMouseEnter={(e) => (e.currentTarget.style.background = C.paper)}
    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span style={{ fontFamily: MONO, fontSize: 32, color: accent, fontWeight: 500 }}>{n}</span>
        <span style={{ fontSize: 10, color: C.muted, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>{tag}</span>
      </div>
      <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 400, color: C.ink, lineHeight: 1.2, letterSpacing: -0.2 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.55 }}>{desc}</div>
      <div style={{ marginTop: "auto", fontSize: 11, fontWeight: 700, color: accent, letterSpacing: 1.2, textTransform: "uppercase" }}>{cta} →</div>
    </button>
  );
}

// ── Email form ─────────────────────────────────────────────────────────────────
function ScreenEmail({ T, go, lang, onExtract }: {
  T: Translation; go: (s: string) => void; lang: Lang;
  onExtract: (v: { email: string; password: string; recipient_name: string; start_year: number; end_year: number }) => void;
}) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [recipient, setRecipient] = useState("");
  const [startYear, setStartYear] = useState(String(new Date().getFullYear() - 1));
  const [endYear, setEndYear] = useState(String(new Date().getFullYear() - 1));
  const back = { background: "none", border: "none", color: C.muted, fontFamily: SANS, fontSize: 12, cursor: "pointer", padding: 0, letterSpacing: 0.5 } as const;

  return (
    <div style={{ padding: "36px 48px", flex: 1, display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 48, alignContent: "flex-start" }}>
      <div>
        <button onClick={() => go("start")} style={back}>← {T.cta_back}</button>
        <div style={{ fontFamily: MONO, fontSize: 10, color: C.clay, letterSpacing: 2, textTransform: "uppercase", marginTop: 14 }}>Formulaire 01 · Connexion</div>
        <h2 style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 400, color: C.ink, margin: "8px 0 0", letterSpacing: -0.3 }}>
          <span style={{ fontStyle: "italic" }}>{lang === "fr" ? "Identification" : "Identification"}</span>
        </h2>
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 460 }}>
          <CField label={T.email_label} value={email} onChange={setEmail} placeholder="vous@gmail.com" />
          <CField label={T.pw_label} value={pw} onChange={setPw} type="password" placeholder="xxxx xxxx xxxx xxxx" hint={T.pw_hint} />
          <CField label={T.recipient_label} value={recipient} onChange={setRecipient} placeholder="Patrick Kayombya" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <CField label={lang === "fr" ? "De" : "From"} value={startYear} onChange={setStartYear} />
            <CField label={lang === "fr" ? "À" : "To"} value={endYear} onChange={setEndYear} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Btn onClick={() => onExtract({ email, password: pw, recipient_name: recipient, start_year: Number(startYear), end_year: Number(endYear) })}>{T.cta_connect} →</Btn>
            <Btn kind="ghost" onClick={() => go("start")}>{T.cta_back}</Btn>
          </div>
        </div>
      </div>
      <div style={{ background: C.paper, border: "1px solid " + C.rule, padding: 26, borderRadius: 4, position: "relative" }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>
          {lang === "fr" ? "Notice explicative" : "Help notice"}
        </div>
        <h3 style={{ fontFamily: SERIF, fontSize: 22, color: C.ink, margin: 0, letterSpacing: -0.2 }}>
          {lang === "fr" ? "Mot de passe d'application" : "App passwords"}
        </h3>
        <ol style={{ fontFamily: SANS, fontSize: 13, color: C.ink, lineHeight: 1.7, paddingLeft: 18, marginTop: 14 }}>
          <li>{lang === "fr" ? "Activez la double authentification." : "Enable two-factor authentication."}</li>
          <li>{lang === "fr" ? "Générez un mot de passe d'application." : "Generate an app password."}</li>
          <li>{lang === "fr" ? "Activez IMAP dans les paramètres." : "Enable IMAP in settings."}</li>
        </ol>
        <div style={{ borderTop: "1px dashed " + C.rule, marginTop: 18, paddingTop: 14, fontFamily: MONO, fontSize: 11, color: C.muted, lineHeight: 1.7 }}>
          <div>imap.gmail.com:993</div>
          <div>imap.outlook.com:993</div>
        </div>
      </div>
    </div>
  );
}

// ── Loading ────────────────────────────────────────────────────────────────────
function ScreenLoading({ T, lang }: { T: Translation; lang: Lang }) {
  return (
    <div style={{ padding: 48, flex: 1, display: "grid", placeItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 64, height: 64, margin: "0 auto 24px", border: "2px solid " + C.clay, borderTopColor: "transparent", borderRadius: "50%", animation: "cRotate 0.9s linear infinite" }} />
        <div style={{ fontFamily: SERIF, fontSize: 24, color: C.ink, fontStyle: "italic" }}>{T.scanning}</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: C.muted, marginTop: 10, letterSpacing: 1 }}>
          IMAP · INBOX · {lang === "fr" ? "CHERCHE" : "SCAN"}
        </div>
      </div>
      <style>{`@keyframes cRotate { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({ T, go, lang, transactions, saved }: {
  T: Translation; go: (s: string) => void; lang: Lang; transactions: Transaction[]; saved: number;
}) {
  const s = summarize(transactions);
  const countries = Object.entries(s.byCountry).sort((a, b) => b[1] - a[1]);
  const recipients = Object.entries(s.byRecipient).sort((a, b) => b[1] - a[1]);
  const ctd: React.CSSProperties = { padding: "12px 8px", fontFamily: SANS, fontSize: 13, color: C.ink, verticalAlign: "middle" };

  return (
    <div style={{ padding: "28px 40px 32px", flex: 1, display: "flex", flexDirection: "column", gap: 18, overflow: "auto" }}>
      <div style={{ background: C.card, border: "1px solid " + C.rule, borderRadius: 4, padding: "22px 28px", display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr auto", gap: 24, alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: C.muted, letterSpacing: 2, textTransform: "uppercase" }}>{T.dash_title}</div>
          <div style={{ fontFamily: SERIF, fontSize: 44, color: C.ink, lineHeight: 1, marginTop: 4, letterSpacing: -1, fontStyle: "italic" }}>
            {transactions[0]?.sort_key.slice(0, 4) || "—"}
          </div>
        </div>
        <BigStat label={T.total_eur} v={formatEUR(s.totalEur)} accent={C.clay} />
        <BigStat label={T.transfers} v={s.count} />
        <Btn kind="ochre" onClick={() => go("pdf")}>{T.cta_export} →</Btn>
      </div>

      {saved > 0 && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 4, padding: "10px 16px", fontSize: 13, color: "#166534" }}>
          ✓ {T.saved(saved)}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <CCard title={T.by_country}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {countries.map(([c, v], i) => (
              <div key={c} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderTop: i === 0 ? "none" : "1px dashed " + C.softrule }}>
                <Flag code={COUNTRY_CODE[c]} />
                <div style={{ flex: 1, fontFamily: SERIF, fontSize: 19, color: C.ink, letterSpacing: -0.2 }}>{c}</div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>{Math.round(v / s.totalEur * 100)} %</div>
                <div style={{ fontFamily: MONO, fontSize: 16, color: C.ink, fontWeight: 500, minWidth: 90, textAlign: "right" }}>{formatEUR(v)}</div>
              </div>
            ))}
          </div>
        </CCard>
        <CCard title={T.by_recipient}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {recipients.map(([r, v], i) => (
              <div key={r} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderTop: i === 0 ? "none" : "1px dashed " + C.softrule }}>
                <div style={{ width: 36, height: 36, borderRadius: 99, border: "1.5px solid " + C.ink, background: C.paper, display: "grid", placeItems: "center", fontFamily: SERIF, fontSize: 14, fontStyle: "italic", color: C.ink }}>
                  {r.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </div>
                <div style={{ flex: 1, fontFamily: SANS, fontSize: 13, color: C.ink, fontWeight: 600 }}>{r}</div>
                <div style={{ fontFamily: MONO, fontSize: 16, color: C.ink, minWidth: 90, textAlign: "right" }}>{formatEUR(v)}</div>
              </div>
            ))}
          </div>
        </CCard>
      </div>

      <CCard title={T.transactions} style={{ flex: 1 }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 4 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid " + C.ink }}>
                {[T.col_date, T.col_recipient, T.col_country, T.col_amount, T.col_eur, T.col_txn].map((h, i) => (
                  <th key={i} style={{ textAlign: i >= 3 ? "right" : "left", padding: "10px 8px", fontFamily: MONO, fontSize: 10, color: C.ink, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.slice().sort((a, b) => a.sort_key.localeCompare(b.sort_key)).map((t) => (
                <tr key={t.transaction_number + t.sort_key} style={{ borderBottom: "1px dashed " + C.softrule }}>
                  <td style={ctd}>{t.date}</td>
                  <td style={{ ...ctd, fontFamily: SERIF, fontSize: 14, fontStyle: "italic" }}>{t.recipient_name}</td>
                  <td style={ctd}><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Flag code={COUNTRY_CODE[t.country]} size={16} />{t.country}</span></td>
                  <td style={{ ...ctd, textAlign: "right", fontFamily: MONO }}>{formatAmount(t.amount, t.currency)}</td>
                  <td style={{ ...ctd, textAlign: "right", fontFamily: MONO, color: C.clay, fontWeight: 600 }}>{formatEURp(parseFloat(t.amount_eur))}</td>
                  <td style={{ ...ctd, textAlign: "right", fontFamily: MONO, fontSize: 11, color: C.muted }}>#{t.transaction_number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CCard>
    </div>
  );
}

// ── PDF ────────────────────────────────────────────────────────────────────────
function ScreenPdf({ T, go, lang, transactions, eurRates, recipientName, startYear, endYear }: {
  T: Translation; go: (s: string) => void; lang: Lang;
  transactions: Transaction[]; eurRates: Record<string, number>;
  recipientName: string; startYear: number; endYear: number;
}) {
  const s = summarize(transactions);
  const [loading, setLoading] = useState<string | null>(null);
  const period = startYear === endYear ? String(startYear) : `${startYear}–${endYear}`;
  const payload = { transactions, eur_rates: eurRates, recipient_name: recipientName, start_year: startYear, end_year: endYear, lang };
  const back = { background: "none", border: "none", color: C.muted, fontFamily: SANS, fontSize: 12, cursor: "pointer", padding: 0, letterSpacing: 0.5 } as const;

  const handlePdf = async () => { setLoading("pdf"); triggerDownload(await downloadPdf(payload), `rapport_${period}.pdf`); setLoading(null); };
  const handleCsv = async () => { setLoading("csv"); triggerDownload(await downloadCsv(payload), `transactions_${period}.csv`); setLoading(null); };
  const handleJson = () => { triggerDownload(new Blob([JSON.stringify(transactions, null, 2)], { type: "application/json" }), "transactions.json"); };

  const DLRow = ({ icon, label, size, onDl }: { icon: string; label: string; size: string; onDl: () => void }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: C.paper, border: "1px solid " + C.rule, borderRadius: 2 }}>
      <div style={{ width: 34, height: 42, background: C.card, border: "1.5px solid " + C.ink, display: "grid", placeItems: "center", fontFamily: MONO, fontSize: 9, fontWeight: 700, color: C.ink }}>{icon}</div>
      <div style={{ flex: 1, fontFamily: MONO, fontSize: 12, color: C.ink }}>{label}</div>
      <div style={{ fontFamily: MONO, fontSize: 10, color: C.muted }}>{size}</div>
      <button onClick={onDl} disabled={loading !== null} style={{ background: C.ink, color: C.bg, border: "none", padding: "5px 10px", fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer", borderRadius: 2 }}>↓</button>
    </div>
  );

  return (
    <div style={{ padding: "28px 40px 32px", flex: 1, display: "flex", flexDirection: "column", gap: 18, overflow: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={() => go("dashboard")} style={back}>← {T.cta_back}</button>
        <Stamp color={C.moss} rotate={4}>✓ {T.pdf_ready}</Stamp>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24 }}>
        <div style={{ background: C.card, border: "1px solid " + C.rule, borderRadius: 2, padding: 32 }}>
          <div style={{ fontFamily: MONO, fontSize: 9, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>Formulaire annexe</div>
          <div style={{ fontFamily: SERIF, fontSize: 22, color: C.ink, fontStyle: "italic" }}>Récapitulatif {period}</div>
          <div style={{ marginTop: 14 }}>
            {[[lang === "fr" ? "Bénéficiaire" : "Recipient", recipientName], [lang === "fr" ? "Période" : "Period", period], [T.transfers, s.count], [T.total_eur, formatEURp(s.totalEur)]].map(([k, v]) => (
              <div key={String(k)} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}>
                <span style={{ fontFamily: SANS, color: C.muted }}>{k}</span>
                <span style={{ fontFamily: MONO, color: C.ink }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, fontSize: 10, color: C.muted, fontStyle: "italic" }}>{T.disclaimer}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <CCard title={lang === "fr" ? "Téléchargements" : "Downloads"}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
              <DLRow icon="PDF" label={`rapport_${period}.pdf`} size="~220 KB" onDl={handlePdf} />
              <DLRow icon="CSV" label={`transactions_${period}.csv`} size="~15 KB" onDl={handleCsv} />
              <DLRow icon="{ }" label="transactions.json" size="~25 KB" onDl={handleJson} />
            </div>
          </CCard>
        </div>
      </div>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────
export default function ComptoirTheme() {
  const [screen, setScreen] = useState("start");
  const [lang, setLang] = useState<Lang>("fr");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [eurRates, setEurRates] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [formMeta, setFormMeta] = useState({ recipientName: "", startYear: 2024, endYear: 2024 });

  const T = I18N[lang];
  const step = { start: 0, email: 1, loading: 1, dashboard: 2, pdf: 2 }[screen] || 0;
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
    <div style={{ background: C.bg, color: C.ink, fontFamily: SANS, height: "100vh", width: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <TopBar T={T} lang={lang} setLang={setLang} step={step} />
      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        {error && <div style={{ background: "#fee", borderBottom: "1px solid #fcc", padding: "10px 40px", fontSize: 13, color: "#c00" }}>⚠️ {error}</div>}
        {screen === "start"     && <Screen1 T={T} go={go} lang={lang} />}
        {screen === "email"     && <ScreenEmail T={T} go={go} lang={lang} onExtract={handleExtract} />}
        {screen === "loading"   && <ScreenLoading T={T} lang={lang} />}
        {screen === "dashboard" && <Dashboard T={T} go={go} lang={lang} transactions={transactions} saved={saved} />}
        {screen === "pdf"       && <ScreenPdf T={T} go={go} lang={lang} transactions={transactions} eurRates={eurRates} recipientName={formMeta.recipientName} startYear={formMeta.startYear} endYear={formMeta.endYear} />}
      </div>
    </div>
  );
}
