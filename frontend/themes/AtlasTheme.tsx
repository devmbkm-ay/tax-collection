"use client";

import { useState } from "react";
import { extractTransactions, downloadPdf, downloadCsv, triggerDownload, testConnection } from "@/lib/api";
import type { Transaction, ExtractResponse } from "@/lib/types";
import {
  type Translation,
  summarize, formatEUR, formatEURp, formatAmount,
  COUNTRY_CODE, I18N, type Lang,
} from "@/lib/theme-utils";

// ── Design tokens ────────────────────────────────────────────────────────────
const A = {
  bg: "#F4F1EA", surface: "#FFFFFF", surface2: "#EDE8DD",
  ink: "#0F0E0C", inkSoft: "#3A3631", muted: "#8B8378",
  line: "#DDD6C5", lineSoft: "#E8E1CF",
  accent: "#FF5A36", accentSoft: "#FFE4DA",
  good: "#3F7A4F", warn: "#C58A1F",
};
const DISPLAY = `'Bricolage Grotesque','Plus Jakarta Sans',system-ui,sans-serif`;
const SANS = `'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif`;
const MONO = `'JetBrains Mono',ui-monospace,monospace`;

// ── Tiny atoms ───────────────────────────────────────────────────────────────
const Dot = ({ color = A.accent }: { color?: string }) => (
  <span style={{ width: 6, height: 6, borderRadius: 99, background: color, display: "inline-block" }} />
);

const Tag = ({ children, color = A.ink, bg = A.surface2 }: {
  children: React.ReactNode; color?: string; bg?: string
}) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 8px",
    borderRadius: 99, background: bg, color,
    fontSize: 10.5, fontWeight: 600, fontFamily: MONO, letterSpacing: 0.5, textTransform: "uppercase",
  }}>{children}</span>
);

const Btn = ({ children, onClick, kind = "primary", size = "md", style = {}, disabled = false }: {
  children: React.ReactNode; onClick?: () => void; kind?: string; size?: string;
  style?: React.CSSProperties; disabled?: boolean;
}) => {
  const s: Record<string, React.CSSProperties> = {
    primary: { background: A.ink, color: A.bg, border: "1px solid " + A.ink },
    accent: { background: A.accent, color: "#fff", border: "1px solid " + A.accent },
    ghost: { background: "transparent", color: A.ink, border: "1px solid " + A.line },
    soft: { background: A.surface2, color: A.ink, border: "1px solid " + A.line },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...(s[kind] || s.primary),
      padding: size === "sm" ? "7px 12px" : "10px 18px",
      borderRadius: 8, fontFamily: SANS, fontWeight: 600,
      fontSize: size === "sm" ? 12 : 13, cursor: disabled ? "default" : "pointer",
      letterSpacing: -0.1, opacity: disabled ? 0.5 : 1, ...style,
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
    <div style={{ display: "flex", flexDirection: "column", width: size, height: size * 0.66, borderRadius: 3, overflow: "hidden", border: "1px solid " + A.line }}>
      {c.map((col, i) => <div key={i} style={{ flex: 1, background: col }} />)}
    </div>
  );
};

const APanel = ({ title, children, style = {} }: {
  title: string; children: React.ReactNode; style?: React.CSSProperties
}) => (
  <div style={{ background: A.surface, border: "1px solid " + A.line, borderRadius: 16, padding: 22, ...style }}>
    <div style={{ fontFamily: MONO, fontSize: 10.5, color: A.muted, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600 }}>{title}</div>
    {children}
  </div>
);

const AInput = ({ label, value, onChange, type = "text", placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; hint?: string;
}) => (
  <label style={{ display: "block" }}>
    <div style={{ fontFamily: MONO, fontSize: 10, color: A.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
    <input value={value} type={type} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={{
      width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid " + A.line,
      background: A.bg, fontFamily: SANS, fontSize: 14, color: A.ink, outline: "none",
      boxSizing: "border-box",
    }} />
    {hint && <div style={{ fontSize: 11.5, color: A.muted, marginTop: 6 }}>{hint}</div>}
  </label>
);

// ── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ screen, go, lang, setLang }: {
  screen: string; go: (s: string) => void; lang: Lang; setLang: (l: Lang) => void
}) {
  const T = I18N[lang];
  const items: [string, string, string][] = lang === "fr"
    ? [["start", "Importer", "01"], ["dashboard", "Aperçu", "02"], ["pdf", "Rapport", "03"]]
    : [["start", "Import", "01"], ["dashboard", "Overview", "02"], ["pdf", "Report", "03"]];

  const isActive = (k: string) =>
    screen === k ||
    (k === "start" && ["start", "email"].includes(screen)) ||
    (k === "dashboard" && ["dashboard", "loading"].includes(screen));

  return (
    <aside style={{ width: 220, background: A.surface, borderRight: "1px solid " + A.line, display: "flex", flexDirection: "column", padding: "22px 18px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: A.ink, display: "grid", placeItems: "center" }}>
          <div style={{ width: 12, height: 12, background: A.accent, borderRadius: 2, transform: "rotate(45deg)" }} />
        </div>
        <div style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 700, color: A.ink, letterSpacing: -0.5 }}>Atlas</div>
      </div>

      <div style={{ fontFamily: MONO, fontSize: 9.5, color: A.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10, paddingLeft: 4 }}>
        {lang === "fr" ? "Navigation" : "Workspace"}
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map(([k, label, n]) => {
          const active = isActive(k);
          return (
            <button key={k} onClick={() => go(k)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8,
              background: active ? A.surface2 : "transparent", border: "1px solid " + (active ? A.line : "transparent"),
              cursor: "pointer", fontFamily: SANS, fontSize: 13.5,
              color: active ? A.ink : A.muted, fontWeight: active ? 600 : 500, textAlign: "left",
            }}>
              <span style={{ fontFamily: MONO, fontSize: 10, color: active ? A.accent : A.muted, width: 18 }}>{n}</span>
              <span style={{ flex: 1 }}>{label}</span>
              {active && <Dot />}
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: "auto" }}>
        <div style={{ background: A.surface2, borderRadius: 12, padding: 14, border: "1px solid " + A.line, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Dot color={A.good} />
            <div style={{ fontSize: 10.5, fontFamily: MONO, color: A.good, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>Local</div>
          </div>
          <div style={{ fontSize: 11.5, color: A.muted, lineHeight: 1.5 }}>
            {lang === "fr" ? "Identifiants jamais stockés." : "Credentials never stored."}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, background: A.surface2, padding: 3, borderRadius: 99, border: "1px solid " + A.line }}>
          {(["fr", "en"] as Lang[]).map((l) => (
            <button key={l} onClick={() => setLang(l)} style={{
              flex: 1, border: "none", padding: "5px 10px", borderRadius: 99, cursor: "pointer",
              background: lang === l ? A.ink : "transparent",
              color: lang === l ? A.bg : A.muted,
              fontFamily: MONO, fontWeight: 700, fontSize: 10, letterSpacing: 1,
            }}>{l.toUpperCase()}</button>
          ))}
        </div>
      </div>
    </aside>
  );
}

// ── Page header ───────────────────────────────────────────────────────────────
function PageHeader({ eyebrow, title, sub, right }: {
  eyebrow: string; title: React.ReactNode; sub?: string; right?: React.ReactNode
}) {
  return (
    <header style={{ padding: "32px 40px 24px", borderBottom: "1px solid " + A.line, background: A.bg }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 32 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Dot />
            <span style={{ fontFamily: MONO, fontSize: 10.5, color: A.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>{eyebrow}</span>
          </div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: 44, fontWeight: 600, color: A.ink, margin: 0, lineHeight: 1.05, letterSpacing: -1.2 }}>{title}</h1>
          {sub && <p style={{ fontSize: 14, color: A.muted, marginTop: 12, maxWidth: 520, lineHeight: 1.55 }}>{sub}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}

// ── Start screen ──────────────────────────────────────────────────────────────
function ScreenStart({ T, go, lang }: { T: Translation; go: (s: string) => void; lang: Lang }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <PageHeader
        eyebrow={lang === "fr" ? "Étape 01 · Import" : "Step 01 · Import"}
        title={<>{T.import_title}<span style={{ color: A.accent }}>.</span></>}
        sub={T.import_sub}
      />
      <div style={{ padding: "28px 40px 32px", display: "flex", flexDirection: "column", gap: 22, flex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          <SourceCard num="01" tag="IMAP" title={T.method_email} desc={T.method_email_d} onClick={() => go("email")} primary />
          <SourceCard num="02" tag="JSON" title={T.method_json} desc={T.method_json_d} onClick={() => { }} />
          <SourceCard num="03" tag=".EML" title={T.method_eml} desc={T.method_eml_d} onClick={() => { }} />
        </div>
      </div>
    </div>
  );
}

function SourceCard({ num, tag, title, desc, onClick, primary = false }: {
  num: string; tag: string; title: string; desc: string; onClick: () => void; primary?: boolean
}) {
  return (
    <button onClick={onClick} style={{
      textAlign: "left", padding: "22px 22px 20px", borderRadius: 16,
      background: primary ? A.ink : A.surface, color: primary ? A.bg : A.ink,
      border: "1px solid " + (primary ? A.ink : A.line),
      cursor: "pointer", fontFamily: SANS, display: "flex", flexDirection: "column", gap: 22,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: MONO, fontSize: 13, color: primary ? A.accent : A.muted, fontWeight: 600 }}>{num}</div>
        <Tag color={primary ? A.bg : A.ink} bg={primary ? "rgba(255,255,255,0.1)" : A.surface2}>{tag}</Tag>
      </div>
      <div>
        <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, lineHeight: 1.15, letterSpacing: -0.5, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: primary ? "rgba(255,255,255,0.65)" : A.muted, lineHeight: 1.55 }}>{desc}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
        <span style={{ fontFamily: MONO, fontSize: 11, color: A.accent, fontWeight: 600, letterSpacing: 0.5 }}>
          → {primary ? "RECOMMANDÉ" : "OPTION"}
        </span>
      </div>
    </button>
  );
}

// ── Email form ────────────────────────────────────────────────────────────────
function ScreenEmail({ T, go, lang, onExtract }: {
  T: Translation; go: (s: string) => void; lang: Lang;
  onExtract: (vals: { email: string; password: string; recipient_names: string[]; start_year: number; end_year: number }) => void;
}) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [recipients, setRecipients] = useState<string[]>([""]);
  const [startYear, setStartYear] = useState(String(new Date().getFullYear() - 1));
  const [endYear, setEndYear] = useState(String(new Date().getFullYear() - 1));
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [testMsg, setTestMsg] = useState("");

  const setRecipient = (i: number, v: string) => setRecipients(rs => rs.map((r, j) => j === i ? v : r));
  const addRecipient = () => setRecipients(rs => [...rs, ""]);
  const removeRecipient = (i: number) => setRecipients(rs => rs.length > 1 ? rs.filter((_, j) => j !== i) : [""]);

  const handleTest = async () => {
    setTestStatus("testing");
    setTestMsg("");
    try {
      const msg = await testConnection(email, pw);
      setTestMsg(msg);
      setTestStatus("ok");
    } catch (e) {
      setTestMsg(e instanceof Error ? e.message : "Erreur inconnue");
      setTestStatus("error");
    }
  };

  const submit = () => {
    if (!email || !pw) return;
    onExtract({ email, password: pw, recipient_names: recipients.map(r => r.trim()), start_year: Number(startYear), end_year: Number(endYear) });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <PageHeader
        eyebrow="Source · IMAP"
        title={lang === "fr" ? "Connecter votre messagerie" : "Connect your inbox"}
        sub={lang === "fr" ? "Lecture en lecture seule. Identifiants jamais transmis." : "Read-only access. Credentials never transmitted."}
        right={<Btn kind="ghost" size="sm" onClick={() => go("start")}>← {T.cta_back}</Btn>}
      />
      <div style={{ padding: "26px 40px", flex: 1, display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 32, alignItems: "flex-start" }}>
        <div style={{ background: A.surface, border: "1px solid " + A.line, borderRadius: 16, padding: 28 }}>
          <div style={{ fontFamily: MONO, fontSize: 10.5, color: A.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14 }}>
            {lang === "fr" ? "Identifiants" : "Credentials"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <AInput label={T.email_label} value={email} onChange={(v) => { setEmail(v); setTestStatus("idle"); }} placeholder="vous@gmail.com" />
            <AInput label={T.pw_label} value={pw} onChange={(v) => { setPw(v); setTestStatus("idle"); }} type="password" placeholder="xxxx xxxx xxxx xxxx" hint={T.pw_hint} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button
                onClick={handleTest}
                disabled={!email || !pw || testStatus === "testing"}
                style={{
                  background: "none",
                  border: "1px solid " + (testStatus === "ok" ? A.good : testStatus === "error" ? "#C00" : A.line),
                  borderRadius: 8, padding: "8px 14px", textAlign: "left",
                  fontFamily: MONO, fontSize: 11, letterSpacing: 0.5,
                  color: testStatus === "ok" ? A.good : testStatus === "error" ? "#C00" : A.ink,
                  cursor: (!email || !pw || testStatus === "testing") ? "default" : "pointer",
                  opacity: (!email || !pw) ? 0.4 : 1,
                  transition: "border-color 0.15s, color 0.15s",
                }}
              >
                {testStatus === "testing"
                  ? "Connexion en cours…"
                  : testStatus === "ok"
                  ? "✓ Connecté"
                  : testStatus === "error"
                  ? "✗ Échec — réessayer"
                  : "⚡ Tester la connexion"}
              </button>
              {(testStatus === "ok" || testStatus === "error") && (
                <div style={{ fontSize: 11, color: testStatus === "ok" ? A.good : "#C00", fontFamily: MONO, lineHeight: 1.5 }}>
                  {testMsg}
                </div>
              )}
            </div>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: A.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{T.recipient_label}</div>
              {recipients.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                  <input value={r} onChange={e => setRecipient(i, e.target.value)}
                    placeholder={i === 0 ? (lang === "fr" ? "Optionnel — détecté automatiquement" : "Optional — auto-detected") : (lang === "fr" ? "Autre bénéficiaire" : "Another recipient")}
                    style={{ flex: 1, background: A.bg, border: "1px solid " + A.line, borderRadius: 8, padding: "8px 10px", fontFamily: SANS, fontSize: 13, color: A.ink, outline: "none" }} />
                  {recipients.length > 1 && (
                    <button onClick={() => removeRecipient(i)} style={{ background: "none", border: "1px solid " + A.line, borderRadius: 8, padding: "0 10px", cursor: "pointer", color: A.muted, fontFamily: MONO, fontSize: 14 }}>×</button>
                  )}
                </div>
              ))}
              <button onClick={addRecipient} style={{ background: "none", border: "none", color: A.accent, fontFamily: MONO, fontSize: 11, cursor: "pointer", padding: 0, letterSpacing: 0.5 }}>
                + {lang === "fr" ? "Ajouter un bénéficiaire" : "Add a recipient"}
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <AInput label={lang === "fr" ? "De" : "From"} value={startYear} onChange={setStartYear} />
              <AInput label={lang === "fr" ? "À" : "To"} value={endYear} onChange={setEndYear} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <Btn kind="accent" onClick={submit}>{T.cta_connect} →</Btn>
              <Btn kind="ghost" onClick={() => go("start")}>{T.cta_back}</Btn>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: A.surface, border: "1px solid " + A.line, borderRadius: 16, padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Tag color="#fff" bg={A.good}>✓ {lang === "fr" ? "Chiffré" : "Encrypted"}</Tag>
              <Tag color={A.ink}>SSL/IMAP</Tag>
            </div>
            <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, color: A.ink, marginBottom: 8, letterSpacing: -0.3 }}>
              {lang === "fr" ? "Trois étapes" : "Three steps"}
            </div>
            <ol style={{ paddingLeft: 18, fontSize: 13, color: A.inkSoft, lineHeight: 1.7, margin: 0 }}>
              <li>{lang === "fr" ? "Activez la double authentification." : "Enable two-factor auth."}</li>
              <li>{lang === "fr" ? "Générez un mot de passe d'application." : "Generate an app password."}</li>
              <li>{lang === "fr" ? "Activez IMAP dans les paramètres mail." : "Enable IMAP in mail settings."}</li>
            </ol>
          </div>
          <div style={{ background: A.ink, color: A.bg, borderRadius: 16, padding: "18px 22px", fontFamily: MONO, fontSize: 11.5, lineHeight: 1.9 }}>
            <div style={{ color: A.muted, marginBottom: 6, letterSpacing: 1, textTransform: "uppercase", fontSize: 9.5 }}># servers</div>
            <div><span style={{ color: A.accent }}>›</span> imap.gmail.com:993</div>
            <div><span style={{ color: A.accent }}>›</span> imap.outlook.com:993</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Loading ───────────────────────────────────────────────────────────────────
function ScreenLoading({ T }: { T: Translation }) {
  return (
    <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 48 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 56, height: 56, margin: "0 auto 22px",
          border: "2px solid " + A.line, borderTopColor: A.accent,
          borderRadius: "50%", animation: "atlasSpin 0.9s linear infinite",
        }} />
        <div style={{ fontFamily: DISPLAY, fontSize: 24, color: A.ink, fontWeight: 600, letterSpacing: -0.5 }}>{T.scanning}</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: A.muted, marginTop: 8, letterSpacing: 1 }}>SCAN · INBOX · IMAP</div>
      </div>
      <style>{`@keyframes atlasSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Error ──────────────────────────────────────────────────────────────────────
function ScreenError({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 48 }}>
      <div style={{ background: A.surface, border: "1px solid " + A.line, borderRadius: 16, padding: 32, maxWidth: 480, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 20, color: A.ink, marginBottom: 12 }}>Erreur</div>
        <div style={{ fontSize: 14, color: A.muted, marginBottom: 20 }}>{message}</div>
        <Btn onClick={onBack}>← Retour</Btn>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
const A_PAGE_SIZE = 20;

function Dashboard({ T, go, lang, transactions, saved }: {
  T: Translation; go: (s: string) => void; lang: Lang;
  transactions: Transaction[]; saved: number;
}) {
  const [txPage, setTxPage] = useState(1);
  const s = summarize(transactions);
  const countries = Object.entries(s.byCountry).sort((a, b) => b[1] - a[1]);
  const recipients = Object.entries(s.byRecipient).sort((a, b) => b[1] - a[1]);
  const atd: React.CSSProperties = { padding: "11px 10px", color: A.ink, verticalAlign: "middle" };
  const sorted = transactions.slice().sort((a, b) => a.sort_key.localeCompare(b.sort_key));
  const totalPages = Math.ceil(sorted.length / A_PAGE_SIZE);
  const pageRows = sorted.slice((txPage - 1) * A_PAGE_SIZE, txPage * A_PAGE_SIZE);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <PageHeader
        eyebrow={lang === "fr" ? "Résultats de l'extraction" : "Extraction results"}
        title={lang === "fr" ? "Aperçu des transactions" : "Transactions overview"}
        right={<Btn kind="accent" onClick={() => go("pdf")}>{T.cta_export} →</Btn>}
      />
      <div style={{ padding: "24px 40px", display: "flex", flexDirection: "column", gap: 18, flex: 1, overflow: "auto" }}>
        {saved > 0 && (
          <div style={{ background: A.accentSoft, border: "1px solid " + A.accent, borderRadius: 10, padding: "10px 16px", fontSize: 13, color: A.ink }}>
            <Tag color={A.good} bg="transparent">✓</Tag> {T.saved(saved)}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12 }}>
          <Kpi label={T.total_eur} value={formatEUR(s.totalEur)} accent />
          <Kpi label={T.transfers} value={String(s.count)} />
          <Kpi label={T.recipients} value={String(recipients.length)} />
          <Kpi label={T.countries} value={String(countries.length)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 14 }}>
          <APanel title={T.by_country}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
              {countries.map(([c, v]) => {
                const pct = v / s.totalEur * 100;
                return (
                  <div key={c}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                      <Flag code={COUNTRY_CODE[c]} />
                      <span style={{ fontWeight: 600, fontSize: 14, color: A.ink, flex: 1, letterSpacing: -0.2 }}>{c}</span>
                      <span style={{ fontFamily: MONO, fontWeight: 600, fontSize: 13, color: A.ink }}>{formatEUR(v)}</span>
                      <span style={{ fontFamily: MONO, fontSize: 10.5, color: A.muted, width: 42, textAlign: "right" }}>{pct.toFixed(1)}%</span>
                    </div>
                    <div style={{ height: 6, background: A.surface2, borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ width: pct + "%", height: "100%", background: A.ink, borderRadius: 99 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </APanel>
          <APanel title={T.by_recipient}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
              {recipients.map(([r, v], i) => (
                <div key={r} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10,
                  background: i === 0 ? A.surface2 : "transparent", border: "1px solid " + (i === 0 ? A.line : "transparent"),
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: A.ink, display: "grid", placeItems: "center", color: A.accent, fontFamily: MONO, fontWeight: 700, fontSize: 11 }}>
                    {r.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </div>
                  <div style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: A.ink }}>{r}</div>
                  <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 600, color: A.ink }}>{formatEUR(v)}</div>
                </div>
              ))}
            </div>
          </APanel>
        </div>
        <APanel title={T.transactions}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10, fontFamily: SANS, fontSize: 12.5 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid " + A.line }}>
                  {[T.col_date, T.col_recipient, T.col_country, T.col_amount, T.col_eur, T.col_txn].map((h, i) => (
                    <th key={i} style={{ textAlign: i >= 3 ? "right" : "left", padding: "9px 10px", fontFamily: MONO, fontSize: 10, color: A.muted, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((t, i) => (
                  <tr key={`${t.sort_key}-${t.amount}-${t.currency}-${i}`} style={{ borderBottom: "1px solid " + A.lineSoft }}>
                    <td style={atd}>{t.date}</td>
                    <td style={{ ...atd, fontWeight: 600 }}>{t.recipient_name}</td>
                    <td style={atd}><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Flag code={COUNTRY_CODE[t.country]} size={16} />{t.country}</span></td>
                    <td style={{ ...atd, textAlign: "right", fontFamily: MONO }}>{formatAmount(t.amount, t.currency)}</td>
                    <td style={{ ...atd, textAlign: "right", fontFamily: MONO, fontWeight: 600 }}>{formatEURp(parseFloat(t.amount_eur))}</td>
                    <td style={{ ...atd, textAlign: "right", fontFamily: MONO, fontSize: 11, color: A.muted }}>{t.transaction_number}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, marginTop: 14, fontFamily: MONO, fontSize: 12 }}>
              <button onClick={() => setTxPage(p => Math.max(1, p - 1))} disabled={txPage === 1}
                style={{ background: "none", border: "1px solid " + A.line, borderRadius: 6, padding: "5px 12px", cursor: txPage === 1 ? "default" : "pointer", color: txPage === 1 ? A.muted : A.ink, fontFamily: MONO, fontSize: 12 }}>
                ←
              </button>
              <span style={{ color: A.muted }}>{txPage} / {totalPages}</span>
              <button onClick={() => setTxPage(p => Math.min(totalPages, p + 1))} disabled={txPage === totalPages}
                style={{ background: "none", border: "1px solid " + A.line, borderRadius: 6, padding: "5px 12px", cursor: txPage === totalPages ? "default" : "pointer", color: txPage === totalPages ? A.muted : A.ink, fontFamily: MONO, fontSize: 12 }}>
                →
              </button>
            </div>
          )}
        </APanel>
      </div>
    </div>
  );
}

function Kpi({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{
      background: accent ? A.ink : A.surface, color: accent ? A.bg : A.ink,
      border: "1px solid " + (accent ? A.ink : A.line), borderRadius: 14, padding: "18px 20px",
      display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 110,
    }}>
      <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: 1.5, textTransform: "uppercase", color: accent ? "rgba(255,255,255,0.6)" : A.muted }}>{label}</div>
      <div style={{ fontFamily: DISPLAY, fontSize: accent ? 42 : 32, fontWeight: 600, letterSpacing: -1.2, marginTop: 8 }}>{value}</div>
    </div>
  );
}

// ── PDF / Downloads ────────────────────────────────────────────────────────────
function ScreenPdf({ T, go, lang, transactions, eurRates, recipientNames, startYear, endYear }: {
  T: Translation; go: (s: string) => void; lang: Lang;
  transactions: Transaction[]; eurRates: Record<string, number>;
  recipientNames: string[]; startYear: number; endYear: number;
}) {
  const s = summarize(transactions);
  const [loading, setLoading] = useState<string | null>(null);
  const period = startYear === endYear ? String(startYear) : `${startYear}–${endYear}`;
  const recipientLabel = recipientNames.filter(Boolean).join(", ") || "—";
  const payload = { transactions, eur_rates: eurRates, recipient_name: recipientLabel, start_year: startYear, end_year: endYear, lang };

  const handlePdf = async () => { setLoading("pdf"); triggerDownload(await downloadPdf(payload), `rapport_${period}.pdf`); setLoading(null); };
  const handleCsv = async () => { setLoading("csv"); triggerDownload(await downloadCsv(payload), `transactions_${period}.csv`); setLoading(null); };
  const handleJson = () => { triggerDownload(new Blob([JSON.stringify(transactions, null, 2)], { type: "application/json" }), "transactions.json"); };

  const DLRow = ({ ext, name, onDl, primary = false }: { ext: string; name: string; onDl: () => void; primary?: boolean }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: primary ? A.ink : A.bg, color: primary ? A.bg : A.ink, border: "1px solid " + (primary ? A.ink : A.line), borderRadius: 10 }}>
      <div style={{ width: 30, height: 36, background: primary ? A.accent : A.surface2, border: "1px solid " + (primary ? A.accent : A.line), borderRadius: 6, display: "grid", placeItems: "center", fontFamily: MONO, fontSize: 9, fontWeight: 700, color: A.ink }}>{ext}</div>
      <div style={{ flex: 1, fontFamily: MONO, fontSize: 12 }}>{name}</div>
      <button onClick={onDl} disabled={loading !== null} style={{ background: primary ? A.accent : A.ink, color: primary ? A.ink : A.bg, border: "none", padding: "5px 10px", fontFamily: MONO, fontSize: 10, cursor: "pointer", letterSpacing: 1, fontWeight: 700, borderRadius: 6 }}>↓</button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <PageHeader
        eyebrow={`Rapport · ${period}`}
        title={<>{lang === "fr" ? "Prêt à exporter" : "Ready to export"}<span style={{ color: A.accent }}>.</span></>}
        right={<Btn kind="ghost" size="sm" onClick={() => go("dashboard")}>← {T.cta_back}</Btn>}
      />
      <div style={{ padding: "26px 40px", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 18, flex: 1, overflow: "auto" }}>
        <div style={{ background: A.surface, border: "1px solid " + A.line, borderRadius: 16, padding: 28 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: A.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>{period} · Annexe</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, color: A.ink, letterSpacing: -0.5, marginTop: 4 }}>
            {lang === "fr" ? "Transferts internationaux" : "International transfers"}
          </div>
          <div style={{ marginTop: 14 }}>
            {[
              [lang === "fr" ? "Bénéficiaire" : "Recipient", recipientLabel],
              [lang === "fr" ? "Période" : "Period", period],
              [T.transfers, s.count],
              [T.total_eur, formatEURp(s.totalEur)],
            ].map(([k, v]) => (
              <div key={String(k)} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid " + A.lineSoft }}>
                <span style={{ fontSize: 13, color: A.muted }}>{k}</span>
                <span style={{ fontFamily: MONO, color: A.ink, fontWeight: 500, fontSize: 13 }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, fontSize: 11, color: A.muted, fontStyle: "italic", borderTop: "1px dashed " + A.line, paddingTop: 10 }}>{T.disclaimer}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <APanel title={lang === "fr" ? "Formats" : "Formats"}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              <DLRow ext="PDF" name={`rapport_${period}.pdf`} onDl={handlePdf} primary />
              <DLRow ext="CSV" name={`transactions_${period}.csv`} onDl={handleCsv} />
              <DLRow ext="JSON" name="transactions.json" onDl={handleJson} />
            </div>
          </APanel>
        </div>
      </div>
    </div>
  );
}

// ── Root component ─────────────────────────────────────────────────────────────
export default function AtlasTheme() {
  const [screen, setScreen] = useState("start");
  const [lang, setLang] = useState<Lang>("fr");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [eurRates, setEurRates] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [formMeta, setFormMeta] = useState({ recipientNames: [] as string[], startYear: 2024, endYear: 2024 });

  const T = I18N[lang];

  const go = (s: string) => { setError(null); setScreen(s); };

  const handleExtract = async (vals: { email: string; password: string; recipient_names: string[]; start_year: number; end_year: number }) => {
    setFormMeta({ recipientNames: vals.recipient_names, startYear: vals.start_year, endYear: vals.end_year });
    setScreen("loading");
    try {
      const data: ExtractResponse = await extractTransactions({ ...vals, lang });
      if (data.transactions.length === 0) {
        setError("Aucune transaction trouvée pour cette période.");
        setScreen("email");
      } else {
        setTransactions(data.transactions);
        setEurRates(data.eur_rates);
        setSaved(data.saved);
        setScreen("dashboard");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de connexion.");
      setScreen("email");
    }
  };

  return (
    <div style={{ background: A.bg, color: A.ink, fontFamily: SANS, height: "100vh", width: "100%", display: "flex", overflow: "hidden" }}>
      <Sidebar screen={screen} go={go} lang={lang} setLang={setLang} />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: A.bg }}>
        {screen === "start" && <ScreenStart T={T} go={go} lang={lang} />}
        {screen === "email" && (
          <>
            {error && <div style={{ background: "#fee", borderBottom: "1px solid #fcc", padding: "10px 40px", fontSize: 13, color: "#c00" }}>⚠️ {error}</div>}
            <ScreenEmail T={T} go={go} lang={lang} onExtract={handleExtract} />
          </>
        )}
        {screen === "loading" && <ScreenLoading T={T} />}
        {screen === "dashboard" && <Dashboard T={T} go={go} lang={lang} transactions={transactions} saved={saved} />}
        {screen === "pdf" && (
          <ScreenPdf T={T} go={go} lang={lang} transactions={transactions} eurRates={eurRates}
            recipientNames={formMeta.recipientNames} startYear={formMeta.startYear} endYear={formMeta.endYear} />
        )}
      </main>
    </div>
  );
}
