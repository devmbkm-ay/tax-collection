"use client";

import { useState, useEffect } from "react";
import { streamExtraction, downloadPdf, downloadCsv, downloadXlsx, triggerDownload, testConnection, updateTransaction, fetchStats } from "@/lib/api";
import type { Transaction, ExtractionEvent } from "@/lib/types";
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

const AInput = ({ label, value, onChange, type = "text", placeholder, hint, tooltip }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; hint?: string; tooltip?: string;
}) => (
  <label style={{ display: "block" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 10, color: A.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>
      {label}
      {tooltip && <Tooltip text={tooltip} />}
    </div>
    <input value={value} type={type} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={{
      width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid " + A.line,
      background: A.bg, fontFamily: SANS, fontSize: 14, color: A.ink, outline: "none",
      boxSizing: "border-box",
    }} />
    {hint && <div style={{ fontSize: 11.5, color: A.muted, marginTop: 6 }}>{hint}</div>}
  </label>
);

const MONTH_NAMES_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
const MONTH_NAMES_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const AMonthYear = ({ label, month, year, onMonth, onYear, lang }: {
  label: string; month: number; year: number;
  onMonth: (m: number) => void; onYear: (y: number) => void; lang: Lang;
}) => {
  const months = lang === "fr" ? MONTH_NAMES_FR : MONTH_NAMES_EN;
  const sel: React.CSSProperties = {
    background: A.bg, border: "1px solid " + A.line, borderRadius: 8,
    padding: "11px 10px", fontFamily: SANS, fontSize: 14, color: A.ink, outline: "none",
  };
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: A.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 6 }}>
        <select value={month} onChange={e => onMonth(Number(e.target.value))} style={sel}>
          {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <input type="number" value={year} onChange={e => onYear(Number(e.target.value))}
          style={{ ...sel, padding: "11px 8px" }} />
      </div>
    </label>
  );
};

const AAutocomplete = ({ value, onChange, suggestions, placeholder, style }: {
  value: string; onChange: (v: string) => void;
  suggestions: string[]; placeholder?: string; style?: React.CSSProperties;
}) => {
  const [open, setOpen] = useState(false);
  const matches = suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()) && s !== value);
  const inputStyle: React.CSSProperties = {
    flex: 1, background: A.bg, border: "1px solid " + A.line, borderRadius: 8,
    padding: "8px 10px", fontFamily: SANS, fontSize: 13, color: A.ink, outline: "none",
    ...style,
  };
  return (
    <div style={{ position: "relative", flex: 1 }}>
      <input
        value={value}
        placeholder={placeholder}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        style={inputStyle}
      />
      {open && matches.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
          background: A.surface, border: "1px solid " + A.line, borderRadius: 8,
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)", marginTop: 4, overflow: "hidden",
        }}>
          {matches.slice(0, 6).map(s => (
            <div
              key={s}
              onMouseDown={() => { onChange(s); setOpen(false); }}
              style={{
                padding: "9px 12px", fontFamily: SANS, fontSize: 13, color: A.ink,
                cursor: "pointer", borderBottom: "1px solid " + A.line,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = A.surface2)}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Provider onboarding ───────────────────────────────────────────────────────
interface ProviderInfo {
  name: string; icon: string; link: string;
  steps: Array<{ fr: string; en: string }>;
}

function getProviderInfo(email: string): ProviderInfo | null {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  if (!domain || domain.length < 3) return null;
  if (domain.includes("gmail")) return {
    name: "Gmail", icon: "G",
    link: "https://myaccount.google.com/apppasswords",
    steps: [
      { fr: "Activez la validation en 2 étapes sur votre compte Google", en: "Enable 2-Step Verification on your Google account" },
      { fr: "Créez un mot de passe d'application (lien ci-dessous)", en: "Create an app password (link below)" },
      { fr: "Activez IMAP : Paramètres → Voir tous les paramètres → Transfert et POP/IMAP", en: "Enable IMAP: Settings → See all settings → Forwarding and POP/IMAP" },
    ],
  };
  if (domain.includes("outlook") || domain.includes("hotmail") || domain.includes("live") || domain.includes("msn")) return {
    name: "Outlook", icon: "O",
    link: "https://account.microsoft.com/security",
    steps: [
      { fr: "Activez la vérification en deux étapes sur votre compte Microsoft", en: "Enable two-step verification on your Microsoft account" },
      { fr: "Activez IMAP : Outlook.com → Paramètres → Courrier → Synchroniser la messagerie → activer IMAP", en: "Enable IMAP: Outlook.com → Settings → Mail → Sync email → enable IMAP" },
      { fr: "Créez un mot de passe d'application via le lien ci-dessous (Options avancées de sécurité)", en: "Create an app password via the link below (Advanced security options)" },
    ],
  };
  return null;
}

function ProviderGuide({ email, lang }: { email: string; lang: Lang }) {
  const info = getProviderInfo(email);
  if (!info) return null;
  return (
    <div style={{ background: A.surface2, border: "1px solid " + A.line, borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ width: 18, height: 18, borderRadius: 4, background: A.ink, display: "grid", placeItems: "center", color: A.accent, fontFamily: MONO, fontWeight: 700, fontSize: 9.5 }}>
          {info.icon}
        </div>
        <span style={{ fontFamily: MONO, fontSize: 9.5, color: A.muted, letterSpacing: 1.2, textTransform: "uppercase" }}>
          {info.name} · IMAP Setup
        </span>
      </div>
      <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 5 }}>
        {info.steps.map((step, i) => (
          <li key={i} style={{ fontSize: 11.5, color: A.inkSoft, lineHeight: 1.55 }}>
            {lang === "fr" ? step.fr : step.en}
          </li>
        ))}
      </ol>
      <a href={info.link} target="_blank" rel="noopener noreferrer" style={{
        display: "inline-flex", alignItems: "center", gap: 4, marginTop: 10,
        fontSize: 11, fontFamily: MONO, color: A.accent, textDecoration: "none", letterSpacing: 0.3,
      }}>
        → {lang === "fr" ? "Générer un mot de passe d'application" : "Generate an app password"}
      </a>
    </div>
  );
}

function Tooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex", verticalAlign: "middle" }}>
      <span
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 13, height: 13, borderRadius: "50%",
          border: "1px solid " + A.line, color: A.muted,
          fontFamily: MONO, fontSize: 8.5, cursor: "default", userSelect: "none",
        }}
      >?</span>
      {visible && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
          transform: "translateX(-50%)",
          background: A.ink, color: A.bg, borderRadius: 8,
          padding: "9px 12px", fontSize: 11.5, lineHeight: 1.55,
          fontFamily: SANS, width: 220, zIndex: 200, pointerEvents: "none",
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
        }}>
          {text}
        </div>
      )}
    </span>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
type ToastKind = "ok" | "error" | "info";
interface ToastItem { id: number; kind: ToastKind; message: string }

function ToastStack({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  if (!toasts.length) return null;
  const bg: Record<ToastKind, string> = { ok: A.good, error: "#C00", info: A.ink };
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, display: "flex", flexDirection: "column-reverse", gap: 8, zIndex: 9999, pointerEvents: "none" }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display: "flex", alignItems: "center", gap: 10,
          background: bg[t.kind], color: "#fff",
          padding: "10px 14px", borderRadius: 10,
          fontFamily: MONO, fontSize: 12, letterSpacing: 0.3, lineHeight: 1.4,
          boxShadow: "0 4px 20px rgba(0,0,0,0.22)", maxWidth: 340,
          animation: "toastIn 0.18s ease", pointerEvents: "all",
        }}>
          <span style={{ flex: 1 }}>{t.message}</span>
          <button onClick={() => onDismiss(t.id)} style={{
            background: "none", border: "none", color: "rgba(255,255,255,0.65)",
            cursor: "pointer", fontSize: 16, padding: 0, lineHeight: 1, flexShrink: 0,
          }}>×</button>
        </div>
      ))}
      <style>{`@keyframes toastIn { from { opacity:0; transform:translateX(12px); } to { opacity:1; transform:translateX(0); } }`}</style>
    </div>
  );
}

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
  onExtract: (vals: { email: string; password: string; recipient_names: string[]; start_year: number; start_month: number; end_year: number; end_month: number }) => void;
}) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [recipients, setRecipients] = useState<string[]>([""]);
  const [startYear, setStartYear] = useState(new Date().getFullYear() - 1);
  const [startMonth, setStartMonth] = useState(1);
  const [endYear, setEndYear] = useState(new Date().getFullYear() - 1);
  const [endMonth, setEndMonth] = useState(12);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [testMsg, setTestMsg] = useState("");
  const [knownRecipients, setKnownRecipients] = useState<string[]>([]);

  const setRecipient = (i: number, v: string) => setRecipients(rs => rs.map((r, j) => j === i ? v : r));

  useEffect(() => { fetchStats().then(s => setKnownRecipients(s.recipients.filter(Boolean))); }, []);
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
    onExtract({ email, password: pw, recipient_names: recipients.map(r => r.trim()), start_year: startYear, start_month: startMonth, end_year: endYear, end_month: endMonth });
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
            <ProviderGuide email={email} lang={lang} />
            <AInput
              label={T.pw_label} value={pw} type="password"
              onChange={(v) => { setPw(v); setTestStatus("idle"); }}
              placeholder="xxxx xxxx xxxx xxxx" hint={T.pw_hint}
              tooltip={lang === "fr"
                ? "Mot de passe spécifique à cette application — pas votre mot de passe habituel. Générez-en un depuis les paramètres de sécurité de Gmail ou Outlook."
                : "App-specific password — not your regular password. Generate one from Gmail or Outlook security settings."}
            />
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
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 10, color: A.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
                {T.recipient_label}
                <Tooltip text={lang === "fr"
                  ? "Optionnel — laissez vide pour détecter automatiquement le bénéficiaire depuis le contenu des emails WorldRemit."
                  : "Optional — leave blank to auto-detect the recipient name from WorldRemit email content."} />
              </div>
              {recipients.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                  <AAutocomplete
                    value={r}
                    onChange={v => setRecipient(i, v)}
                    suggestions={knownRecipients}
                    placeholder={i === 0 ? (lang === "fr" ? "Optionnel — détecté automatiquement" : "Optional — auto-detected") : (lang === "fr" ? "Autre bénéficiaire" : "Another recipient")}
                  />
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
              <AMonthYear label={lang === "fr" ? "De" : "From"} month={startMonth} year={startYear} onMonth={setStartMonth} onYear={setStartYear} lang={lang} />
              <AMonthYear label={lang === "fr" ? "À" : "To"} month={endMonth} year={endYear} onMonth={setEndMonth} onYear={setEndYear} lang={lang} />
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
            <div><span style={{ color: A.accent }}>›</span> outlook.office365.com:993</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Loading ───────────────────────────────────────────────────────────────────
const EXTRACT_STEPS: Array<{ key: string; fr: string; en: string }> = [
  { key: "connecting", fr: "Connexion à la boîte mail",   en: "Connecting to inbox" },
  { key: "rates",      fr: "Taux de change EUR",           en: "EUR exchange rates" },
  { key: "found",      fr: "Recherche des emails",         en: "Searching emails" },
  { key: "parsing",    fr: "Analyse des transactions",     en: "Parsing transactions" },
  { key: "saving",     fr: "Sauvegarde en base",           en: "Saving to database" },
];

const STEP_IDX: Record<string, number> = {
  connecting: 0, rates: 1, searching: 2, found: 2, parsing: 3, saving: 4,
};

function ScreenLoading({ lang, step, meta }: {
  lang: Lang;
  step: string;
  meta: { found?: number; current?: number; total?: number };
}) {
  const activeIdx = STEP_IDX[step] ?? -1;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 40px" }}>
      <div style={{ width: "100%", maxWidth: 340 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
          {EXTRACT_STEPS.map((s, idx) => {
            const isDone   = idx < activeIdx;
            const isActive = idx === activeIdx;
            const label    = lang === "fr" ? s.fr : s.en;

            let sub = "";
            if (s.key === "found"   && isActive && meta.found   !== undefined)
              sub = ` · ${meta.found} email${meta.found !== 1 ? "s" : ""}`;
            if (s.key === "parsing" && isActive && meta.total   !== undefined)
              sub = ` · ${meta.current}/${meta.total}`;

            return (
              <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  background: isDone ? A.good : isActive ? A.ink : A.surface2,
                  border: `1px solid ${isDone ? A.good : isActive ? A.ink : A.line}`,
                  display: "grid", placeItems: "center",
                }}>
                  {isDone   && <span style={{ color: "#fff", fontSize: 11, lineHeight: 1 }}>✓</span>}
                  {isActive && <div style={{ width: 7, height: 7, borderRadius: "50%", background: A.accent }} />}
                </div>
                <div>
                  <span style={{
                    fontFamily: MONO, fontSize: 12,
                    color: isDone ? A.good : isActive ? A.ink : A.muted,
                    fontWeight: isActive || isDone ? 600 : 400,
                  }}>{label}</span>
                  {sub && <span style={{ fontFamily: MONO, fontSize: 11, color: A.muted }}>{sub}</span>}
                </div>
              </div>
            );
          })}
        </div>

        {step === "parsing" && meta.total !== undefined && (
          <div style={{ height: 3, background: A.surface2, borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", background: A.accent, borderRadius: 99,
              width: `${((meta.current ?? 0) / meta.total) * 100}%`,
              transition: "width 0.1s ease",
            }} />
          </div>
        )}

        {!step && (
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <div style={{
              width: 36, height: 36, margin: "0 auto",
              border: `2px solid ${A.line}`, borderTopColor: A.accent,
              borderRadius: "50%", animation: "atlasSpin 0.9s linear infinite",
            }} />
          </div>
        )}
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

type TxKey = { sort_key: string; amount: string; currency: string; transaction_number: string };
type EditableField = "recipient_name" | "country" | "amount_eur";

function Dashboard({ T, go, lang, transactions, saved, onUpdate, onToast }: {
  T: Translation; go: (s: string) => void; lang: Lang;
  transactions: Transaction[]; saved: number;
  onUpdate: (key: TxKey, patch: Partial<Record<EditableField, string>>) => Promise<void>;
  onToast: (kind: ToastKind, message: string) => void;
}) {
  const [txPage, setTxPage] = useState(1);
  const [editing, setEditing] = useState<(TxKey & { field: EditableField; value: string }) | null>(null);
  const s = summarize(transactions);
  const countries = Object.entries(s.byCountry).sort((a, b) => b[1] - a[1]);
  const recipients = Object.entries(s.byRecipient).sort((a, b) => b[1] - a[1]);
  const atd: React.CSSProperties = { padding: "11px 10px", color: A.ink, verticalAlign: "middle" };

  const startEdit = (t: Transaction, field: EditableField) => {
    setEditing({ sort_key: t.sort_key, amount: t.amount, currency: t.currency, transaction_number: t.transaction_number, field, value: t[field] });
  };

  const commitEdit = async () => {
    if (!editing) return;
    const snap = editing;
    setEditing(null);
    try {
      await onUpdate(
        { sort_key: snap.sort_key, amount: snap.amount, currency: snap.currency, transaction_number: snap.transaction_number },
        { [snap.field]: snap.value },
      );
      onToast("ok", lang === "fr" ? "Modification enregistrée" : "Change saved");
    } catch (e) {
      onToast("error", e instanceof Error ? e.message : "Erreur de sauvegarde");
    }
  };

  const isEditing = (t: Transaction, field: EditableField) =>
    editing?.sort_key === t.sort_key && editing?.amount === t.amount &&
    editing?.currency === t.currency && editing?.transaction_number === t.transaction_number &&
    editing?.field === field;

  // Returns a <td> directly — plain function, not a React component, to avoid focus loss on re-render
  const editCell = (t: Transaction, field: EditableField, display: React.ReactNode, extraTdStyle: React.CSSProperties = {}) => {
    if (isEditing(t, field)) {
      return (
        <td style={atd}>
          <input
            autoFocus
            value={editing!.value}
            onChange={e => setEditing(ed => ed ? { ...ed, value: e.target.value } : null)}
            onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditing(null); }}
            onBlur={commitEdit}
            style={{
              background: A.accentSoft, border: "none", outline: `1.5px solid ${A.accent}`,
              borderRadius: 4, padding: "3px 6px", fontFamily: SANS, fontSize: 12.5,
              color: A.ink, width: "100%", minWidth: 80, boxSizing: "border-box",
            }}
          />
        </td>
      );
    }
    return (
      <td
        onClick={() => startEdit(t, field)}
        title={lang === "fr" ? "Cliquer pour modifier" : "Click to edit"}
        style={{ ...atd, cursor: "text", ...extraTdStyle }}
      >
        <span style={{ borderBottom: `1px dashed ${A.lineSoft}` }}>{display}</span>
      </td>
    );
  };
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
                    {editCell(t, "recipient_name", <span style={{ fontWeight: 600 }}>{t.recipient_name}</span>)}
                    {editCell(t, "country", <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Flag code={COUNTRY_CODE[t.country]} size={16} />{t.country}</span>)}
                    <td style={{ ...atd, textAlign: "right", fontFamily: MONO }}>{formatAmount(t.amount, t.currency)}</td>
                    {editCell(t, "amount_eur", <span style={{ fontFamily: MONO, fontWeight: 600 }}>{formatEURp(parseFloat(t.amount_eur))}</span>, { textAlign: "right" })}
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
function ScreenPdf({ T, go, lang, transactions, eurRates, recipientNames, startYear, startMonth, endYear, endMonth, onToast }: {
  T: Translation; go: (s: string) => void; lang: Lang;
  transactions: Transaction[]; eurRates: Record<string, number>;
  recipientNames: string[]; startYear: number; startMonth: number; endYear: number; endMonth: number;
  onToast: (kind: ToastKind, message: string) => void;
}) {
  const s = summarize(transactions);
  const [loading, setLoading] = useState<string | null>(null);
  const months = lang === "fr" ? MONTH_NAMES_FR : MONTH_NAMES_EN;
  const startLabel = `${months[startMonth - 1]} ${startYear}`;
  const endLabel = `${months[endMonth - 1]} ${endYear}`;
  const period = (startYear === endYear && startMonth === 1 && endMonth === 12)
    ? String(startYear)
    : startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
  const recipientLabel = recipientNames.filter(Boolean).join(", ") || "—";
  const payload = { transactions, eur_rates: eurRates, recipient_name: recipientLabel, start_year: startYear, end_year: endYear, lang };

  const handlePdf = async () => {
    setLoading("pdf");
    try {
      triggerDownload(await downloadPdf(payload), `rapport_${period}.pdf`);
      onToast("ok", lang === "fr" ? "PDF téléchargé" : "PDF downloaded");
    } catch {
      onToast("error", lang === "fr" ? "Génération PDF échouée" : "PDF generation failed");
    } finally { setLoading(null); }
  };
  const handleCsv = async () => {
    setLoading("csv");
    try {
      triggerDownload(await downloadCsv(payload), `transactions_${period}.csv`);
      onToast("ok", lang === "fr" ? "CSV téléchargé" : "CSV downloaded");
    } catch {
      onToast("error", lang === "fr" ? "Export CSV échoué" : "CSV export failed");
    } finally { setLoading(null); }
  };
  const handleXlsx = async () => {
    setLoading("xlsx");
    try {
      triggerDownload(await downloadXlsx(payload), `transactions_${period}.xlsx`);
      onToast("ok", lang === "fr" ? "Excel téléchargé" : "Excel downloaded");
    } catch {
      onToast("error", lang === "fr" ? "Export Excel échoué" : "Excel export failed");
    } finally { setLoading(null); }
  };
  const handleJson = () => {
    triggerDownload(new Blob([JSON.stringify(transactions, null, 2)], { type: "application/json" }), "transactions.json");
    onToast("info", "JSON téléchargé");
  };

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
              <DLRow ext="XLSX" name={`transactions_${period}.xlsx`} onDl={handleXlsx} />
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
  const [formMeta, setFormMeta] = useState({ recipientNames: [] as string[], startYear: 2024, startMonth: 1, endYear: 2024, endMonth: 12 });
  const [extractStep, setExtractStep] = useState<string>("");
  const [extractMeta, setExtractMeta] = useState<Pick<ExtractionEvent, "found" | "current" | "total">>({});
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (kind: ToastKind, message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, kind, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  };

  const T = I18N[lang];

  const go = (s: string) => { setError(null); setScreen(s); };

  const handleExtract = async (vals: { email: string; password: string; recipient_names: string[]; start_year: number; start_month: number; end_year: number; end_month: number }) => {
    setFormMeta({ recipientNames: vals.recipient_names, startYear: vals.start_year, startMonth: vals.start_month, endYear: vals.end_year, endMonth: vals.end_month });
    setExtractStep("connecting");
    setExtractMeta({});
    setScreen("loading");
    try {
      for await (const event of streamExtraction({ ...vals, lang })) {
        if (event.step === "error") {
          setError(event.message ?? "Erreur inconnue.");
          setScreen("email");
          return;
        }
        if (event.step === "done") {
          if (!event.transactions?.length) {
            setError("Aucune transaction trouvée pour cette période.");
            setScreen("email");
          } else {
            setTransactions(event.transactions);
            setEurRates(event.eur_rates!);
            setSaved(event.saved!);
            setScreen("dashboard");
            const n = event.transactions.length;
            addToast("ok", lang === "fr"
              ? `${n} transaction${n > 1 ? "s" : ""} extraite${n > 1 ? "s" : ""}`
              : `${n} transaction${n > 1 ? "s" : ""} extracted`);
          }
          return;
        }
        setExtractStep(event.step);
        if (event.step === "found") setExtractMeta({ found: event.found });
        if (event.step === "parsing") setExtractMeta(m => ({ ...m, current: event.current, total: event.total }));
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
        {screen === "loading" && <ScreenLoading lang={lang} step={extractStep} meta={extractMeta} />}
        {screen === "dashboard" && (
          <Dashboard
            T={T} go={go} lang={lang} transactions={transactions} saved={saved}
            onToast={addToast}
            onUpdate={async (key, patch) => {
              await updateTransaction(key, patch);
              setTransactions(prev => prev.map(t =>
                t.sort_key === key.sort_key && t.amount === key.amount &&
                t.currency === key.currency && t.transaction_number === key.transaction_number
                  ? { ...t, ...patch } : t
              ));
            }}
          />
        )}
        {screen === "pdf" && (
          <ScreenPdf T={T} go={go} lang={lang} transactions={transactions} eurRates={eurRates}
            recipientNames={formMeta.recipientNames} startYear={formMeta.startYear} startMonth={formMeta.startMonth} endYear={formMeta.endYear} endMonth={formMeta.endMonth}
            onToast={addToast} />
        )}
      </main>
      <ToastStack toasts={toasts} onDismiss={id => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  );
}
