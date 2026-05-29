// ────────────────────────────────────────────────────────────────────────────
// Atlas · Contemporary fintech / app shell
// Sidebar nav, oversized variable display type, warm bone neutrals,
// single hot accent (warm coral), monospace tabular figures.
// ────────────────────────────────────────────────────────────────────────────
(function () {
  const { useState } = React;

  const A = {
    bg: "#F4F1EA", // warm bone
    surface: "#FFFFFF",
    surface2: "#EDE8DD",
    ink: "#0F0E0C",
    inkSoft: "#3A3631",
    muted: "#8B8378",
    line: "#DDD6C5",
    lineSoft: "#E8E1CF",
    accent: "#FF5A36", // hot warm coral
    accentSoft: "#FFE4DA",
    good: "#3F7A4F",
    warn: "#C58A1F"
  };

  const DISPLAY = `'Bricolage Grotesque', 'Plus Jakarta Sans', system-ui, sans-serif`;
  const SANS = `'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif`;
  const MONO = `'JetBrains Mono', ui-monospace, monospace`;

  // ── atoms ────────────────────────────────────────────────────────────────
  const Btn = ({ children, onClick, kind = "primary", size = "md", style = {} }) => {
    const styles = {
      primary: { background: A.ink, color: A.bg, border: "1px solid " + A.ink },
      accent: { background: A.accent, color: "#fff", border: "1px solid " + A.accent },
      ghost: { background: "transparent", color: A.ink, border: "1px solid " + A.line },
      soft: { background: A.surface2, color: A.ink, border: "1px solid " + A.line }
    }[kind];
    const pad = size === "sm" ? "7px 12px" : "10px 18px";
    const fs = size === "sm" ? 12 : 13;
    return (
      <button onClick={onClick} style={{
        ...styles, padding: pad, borderRadius: 8, fontFamily: SANS,
        fontWeight: 600, fontSize: fs, cursor: "pointer", letterSpacing: -0.1, ...style
      }}>{children}</button>);

  };

  const Flag = ({ code, size = 22 }) => {
    const colors = {
      UG: ["#000", "#FCDC04", "#D90000"],
      SN: ["#00853F", "#FDEF42", "#E31B23"],
      KE: ["#000", "#BB0000", "#006600"],
      MA: ["#C1272D", "#006233"]
    }[code] || ["#888"];
    return (
      <div style={{ display: "flex", flexDirection: "column", width: size, height: size * 0.66, borderRadius: 3, overflow: "hidden", border: "1px solid " + A.line }}>
        {colors.map((c, i) => <div key={i} style={{ flex: 1, background: c }}></div>)}
      </div>);

  };

  const Tag = ({ children, color = A.ink, bg = A.surface2 }) =>
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 8px",
    borderRadius: 99, background: bg, color: color,
    fontSize: 10.5, fontWeight: 600, fontFamily: MONO, letterSpacing: 0.5, textTransform: "uppercase"
  }}>{children}</span>;


  const Dot = ({ color = A.accent }) =>
  <span style={{ width: 6, height: 6, borderRadius: 99, background: color, display: "inline-block" }}></span>;


  // ── Sidebar ──────────────────────────────────────────────────────────────
  function Sidebar({ screen, go, lang, setLang }) {
    const items = lang === 'fr' ?
    [['start', 'Importer', '01'], ['dashboard', 'Aperçu', '02'], ['recipients', 'Bénéficiaires', '03'], ['pdf', 'Rapport', '04']] :
    [['start', 'Import', '01'], ['dashboard', 'Overview', '02'], ['recipients', 'Recipients', '03'], ['pdf', 'Report', '04']];

    return (
      <aside style={{
        width: 220, background: A.surface, borderRight: "1px solid " + A.line,
        display: "flex", flexDirection: "column", padding: "22px 18px 18px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, background: A.ink, display: "grid", placeItems: "center"
          }}>
            <div style={{ width: 12, height: 12, background: A.accent, borderRadius: 2, transform: "rotate(45deg)" }}></div>
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 700, color: A.ink, letterSpacing: -0.5 }}>Atlas</div>
        </div>

        <div style={{ fontFamily: MONO, fontSize: 9.5, color: A.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10, paddingLeft: 4 }}>
          {lang === 'fr' ? 'Navigation' : 'Workspace'}
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {items.map(([k, label, n]) => {
            const active = screen === k || k === 'start' && ['start', 'email', 'json', 'eml'].includes(screen) || k === 'dashboard' && ['dashboard', 'loading', 'demo'].includes(screen);
            return (
              <button key={k} onClick={() => go(k)} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8,
                background: active ? A.surface2 : "transparent",
                border: "1px solid " + (active ? A.line : "transparent"),
                cursor: "pointer", fontFamily: SANS, fontSize: 13.5,
                color: active ? A.ink : A.muted, fontWeight: active ? 600 : 500, textAlign: "left"
              }}>
                <span style={{ fontFamily: MONO, fontSize: 10, color: active ? A.accent : A.muted, width: 18 }}>{n}</span>
                <span style={{ flex: 1 }}>{label}</span>
                {active && <Dot />}
              </button>);

          })}
        </nav>

        <div style={{ marginTop: "auto" }}>
          <div style={{
            background: A.surface2, borderRadius: 12, padding: 14, border: "1px solid " + A.line, marginBottom: 14
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <Dot color={A.good} />
              <div style={{ fontSize: 10.5, fontFamily: MONO, color: A.good, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>
                {lang === 'fr' ? 'Local' : 'Local'}
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: A.muted, lineHeight: 1.5 }}>
              {lang === 'fr' ? 'Tout reste sur votre appareil.' : 'Everything stays on your device.'}
            </div>
          </div>

          <div style={{ display: "flex", gap: 4, background: A.surface2, padding: 3, borderRadius: 99, border: "1px solid " + A.line }}>
            {['fr', 'en'].map((l) =>
            <button key={l} onClick={() => setLang(l)} style={{
              flex: 1, border: "none", padding: "5px 10px", borderRadius: 99, cursor: "pointer",
              background: lang === l ? A.ink : "transparent",
              color: lang === l ? A.bg : A.muted,
              fontFamily: MONO, fontWeight: 700, fontSize: 10, letterSpacing: 1
            }}>{l.toUpperCase()}</button>
            )}
          </div>
        </div>
      </aside>);

  }

  // ── Page chrome ──────────────────────────────────────────────────────────
  function PageHeader({ eyebrow, title, sub, right }) {
    return (
      <header style={{ padding: "32px 40px 24px", borderBottom: "1px solid " + A.line, background: A.bg }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 32 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Dot />
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: A.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>{eyebrow}</span>
            </div>
            <h1 style={{ fontFamily: DISPLAY, fontSize: 44, fontWeight: 600, color: A.ink, margin: 0, lineHeight: 1.05, letterSpacing: -1.2 }}>
              {title}
            </h1>
            {sub && <p style={{ fontSize: 14, color: A.muted, marginTop: 12, maxWidth: 520, lineHeight: 1.55 }}>{sub}</p>}
          </div>
          {right}
        </div>
      </header>);

  }

  // ── Screen 1: Import sources ─────────────────────────────────────────────
  function ScreenStart({ T, go, lang }) {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        <PageHeader
          eyebrow={(lang === 'fr' ? 'Étape 01 · Import' : 'Step 01 · Import') + ' · 2024'}
          title={<>{T.import_title}<span style={{ color: A.accent }}>.</span></>}
          sub={T.import_sub} />
        
        <div style={{ padding: "28px 40px 32px", display: "flex", flexDirection: "column", gap: 22, flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            <Source num="01" tag={lang === 'fr' ? 'IMAP' : 'IMAP'} title={T.method_email} desc={T.method_email_d} onClick={() => go('email')} primary />
            <Source num="02" tag="JSON" title={T.method_json} desc={T.method_json_d} onClick={() => go('json')} />
            <Source num="03" tag=".EML" title={T.method_eml} desc={T.method_eml_d} onClick={() => go('eml')} />
          </div>

          {/* Providers row */}
          <div style={{ background: A.surface, border: "1px solid " + A.line, borderRadius: 16, padding: "20px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontFamily: MONO, fontSize: 10.5, color: A.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>
                {lang === 'fr' ? 'Établissements pris en charge' : 'Supported providers'}
              </div>
              <Tag color={A.good} bg={A.surface2}><Dot color={A.good} /> 7 {lang === 'fr' ? 'connectés' : 'live'}</Tag>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12 }}>
              {['WorldRemit', 'Wise', 'Western Union', 'Remitly', 'MoneyGram', 'Skrill', 'Revolut'].map((p) =>
              <div key={p} style={{ padding: "12px 10px", border: "1px solid " + A.line, borderRadius: 10, textAlign: "center" }}>
                  <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 13, color: A.ink, letterSpacing: -0.3 }}>{p}</div>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 18, borderTop: "1px dashed " + A.line }}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: A.muted, letterSpacing: 1, textTransform: "uppercase" }}>
              {lang === 'fr' ? 'Conforme · 2042-K · 8UU' : 'Compliant · 2042-K · 8UU'}
            </div>
            <button onClick={() => go('dashboard')} style={{
              background: "none", border: "none", color: A.accent, fontFamily: SANS, fontSize: 13, fontWeight: 600, cursor: "pointer"
            }}>{lang === 'fr' ? 'Voir un exemple' : 'See an example'} →</button>
          </div>
        </div>
      </div>);

  }

  function Source({ num, tag, title, desc, onClick, primary }) {
    return (
      <button onClick={onClick} style={{
        textAlign: "left", padding: "22px 22px 20px", borderRadius: 16,
        background: primary ? A.ink : A.surface, color: primary ? A.bg : A.ink,
        border: "1px solid " + (primary ? A.ink : A.line),
        cursor: "pointer", fontFamily: SANS, display: "flex", flexDirection: "column", gap: 22,
        position: "relative", transition: "transform .15s, box-shadow .15s"
      }}
      onMouseEnter={(e) => {e.currentTarget.style.transform = "translateY(-2px)";e.currentTarget.style.boxShadow = "0 10px 24px -12px rgba(0,0,0,0.15)";}}
      onMouseLeave={(e) => {e.currentTarget.style.transform = "translateY(0)";e.currentTarget.style.boxShadow = "none";}}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: MONO, fontSize: 13, color: primary ? A.accent : A.muted, fontWeight: 600 }}>{num}</div>
          <Tag color={primary ? A.bg : A.ink} bg={primary ? "rgba(255,255,255,0.1)" : A.surface2}>{tag}</Tag>
        </div>
        <div>
          <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, lineHeight: 1.15, letterSpacing: -0.5, marginBottom: 8 }}>{title}</div>
          <div style={{ fontSize: 12.5, color: primary ? "rgba(255,255,255,0.65)" : A.muted, lineHeight: 1.55 }}>{desc}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
          <span style={{ fontFamily: MONO, fontSize: 11, color: primary ? A.accent : A.accent, fontWeight: 600, letterSpacing: 0.5 }}>
            → {primary ? "RECOMMANDÉ" : "OPTION"}
          </span>
          <span style={{ width: 28, height: 28, borderRadius: 99, border: "1px solid " + (primary ? "rgba(255,255,255,0.25)" : A.line), display: "grid", placeItems: "center", fontSize: 14 }}>↗</span>
        </div>
      </button>);

  }

  // ── Email screen ─────────────────────────────────────────────────────────
  function ScreenEmail({ T, go, lang }) {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        <PageHeader
          eyebrow={lang === 'fr' ? 'Source · IMAP' : 'Source · IMAP'}
          title={<>{lang === 'fr' ? 'Connecter votre messagerie' : 'Connect your inbox'}</>}
          sub={lang === 'fr' ? 'Lecture en lecture seule. Identifiants jamais transmis.' : 'Read-only access. Credentials never transmitted.'}
          right={<Btn kind="ghost" size="sm" onClick={() => go('start')}>← {T.cta_back}</Btn>} />
        
        <div style={{ padding: "26px 40px", flex: 1, display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 32, alignItems: "flex-start" }}>
          <div style={{ background: A.surface, border: "1px solid " + A.line, borderRadius: 16, padding: 28 }}>
            <div style={{ fontFamily: MONO, fontSize: 10.5, color: A.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14 }}>
              {lang === 'fr' ? 'Identifiants' : 'Credentials'}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <AInput label={T.email_label} val="marie.therese@outlook.fr" />
              <AInput label={T.pw_label} val="" type="password" placeholder="xxxx xxxx xxxx xxxx" hint={T.pw_hint} />
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12 }}>
                <AInput label={T.recipient_label} val="Patrick Kayombya" />
                <AInput label={T.year_label} val="2024" />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <Btn kind="accent" onClick={() => go('loading')}>{T.cta_connect} →</Btn>
                <Btn kind="ghost" onClick={() => go('start')}>{T.cta_back}</Btn>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: A.surface, border: "1px solid " + A.line, borderRadius: 16, padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Tag color="#fff" bg={A.good}>✓ {lang === 'fr' ? 'Chiffré' : 'Encrypted'}</Tag>
                <Tag color={A.ink}>SSL/IMAP</Tag>
              </div>
              <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, color: A.ink, marginBottom: 8, letterSpacing: -0.3 }}>
                {lang === 'fr' ? 'Trois étapes' : 'Three steps'}
              </div>
              <ol style={{ paddingLeft: 18, fontSize: 13, color: A.inkSoft, lineHeight: 1.7, margin: 0 }}>
                <li>{lang === 'fr' ? 'Activez la double authentification.' : 'Enable two-factor auth.'}</li>
                <li>{lang === 'fr' ? 'Générez un mot de passe d\'application.' : 'Generate an app password.'}</li>
                <li>{lang === 'fr' ? 'Activez IMAP dans les paramètres mail.' : 'Enable IMAP in mail settings.'}</li>
              </ol>
            </div>
            <div style={{ background: A.ink, color: A.bg, borderRadius: 16, padding: "18px 22px", fontFamily: MONO, fontSize: 11.5, lineHeight: 1.9 }}>
              <div style={{ color: A.muted, marginBottom: 6, letterSpacing: 1, textTransform: "uppercase", fontSize: 9.5 }}># servers</div>
              <div><span style={{ color: A.accent }}>›</span> imap.outlook.com:993</div>
              <div><span style={{ color: A.accent }}>›</span> imap.gmail.com:993</div>
              <div><span style={{ color: A.accent }}>›</span> imap.free.fr:993</div>
            </div>
          </div>
        </div>
      </div>);

  }

  function ScreenUpload({ T, go, lang, mode }) {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        <PageHeader
          eyebrow={lang === 'fr' ? 'Source · Fichier' : 'Source · File'}
          title={mode === 'json' ? T.method_json : T.method_eml}
          right={<Btn kind="ghost" size="sm" onClick={() => go('start')}>← {T.cta_back}</Btn>} />
        
        <div style={{ padding: "26px 40px", flex: 1, display: "flex" }}>
          <div style={{
            flex: 1, border: "2px dashed " + A.line, borderRadius: 16, background: A.surface,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14
          }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: A.surface2, border: "1px solid " + A.line, display: "grid", placeItems: "center" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={A.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 600, color: A.ink, letterSpacing: -0.5 }}>{T.drag_drop}</div>
            <div style={{ fontSize: 12, color: A.muted, fontFamily: MONO, letterSpacing: 0.5 }}>
              {mode === 'json' ? '.json — extracteur WorldRemit' : '.eml — n\'importe quelle messagerie'} · {T.or_browse}
            </div>
            <Btn kind="accent" onClick={() => go('loading')} style={{ marginTop: 8 }}>
              {lang === 'fr' ? 'Utiliser l\'exemple' : 'Use sample'} →
            </Btn>
          </div>
        </div>
      </div>);

  }

  function ScreenLoading({ T, go }) {
    React.useEffect(() => {const t = setTimeout(() => go('dashboard'), 1300);return () => clearTimeout(t);}, []);
    return (
      <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 48 }}>
        <div style={{ textAlign: "center" }}>
          <div className="atlas-spin" style={{ width: 56, height: 56, margin: "0 auto 22px", border: "2px solid " + A.line, borderTopColor: A.accent, borderRadius: "50%" }}></div>
          <div style={{ fontFamily: DISPLAY, fontSize: 24, color: A.ink, fontWeight: 600, letterSpacing: -0.5 }}>{T.scanning}</div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: A.muted, marginTop: 8, letterSpacing: 1 }}>SCAN · INBOX · IMAP</div>
        </div>
      </div>);

  }

  // ── Dashboard ────────────────────────────────────────────────────────────
  function Dashboard({ T, go, lang, layout }) {
    const s = window.summarize(window.TRANSACTIONS);
    const trend = "+12.4%";
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        <PageHeader
          eyebrow={(lang === 'fr' ? 'Année fiscale' : 'Tax year') + " · 2024"}
          title={<>{lang === 'fr' ? 'Aperçu de l\'année' : 'Yearly overview'}</>}
          right={<Btn kind="accent" onClick={() => go('pdf')}>{T.cta_export} →</Btn>} />
        

        <div style={{ padding: "24px 40px", display: "flex", flexDirection: "column", gap: 18, flex: 1 }}>
          {/* KPI row */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12 }}>
            <Kpi label={T.total_eur} value={window.formatEUR(s.totalEur)} trend={trend} accent />
            <Kpi label={T.transfers} value={s.count} />
            <Kpi label={T.recipients} value={Object.keys(s.byRecipient).length} />
            <Kpi label={T.countries} value={Object.keys(s.byCountry).length} />
          </div>

          {layout === 'cards' && <AtlasCards s={s} T={T} />}
          {layout === 'table' && <AtlasTable s={s} T={T} />}
          {layout === 'charts' && <AtlasCharts s={s} T={T} lang={lang} />}
        </div>
      </div>);

  }

  function Kpi({ label, value, trend, accent }) {
    return (
      <div style={{
        background: accent ? A.ink : A.surface, color: accent ? A.bg : A.ink,
        border: "1px solid " + (accent ? A.ink : A.line), borderRadius: 14, padding: "18px 20px",
        display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 110
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: 1.5, textTransform: "uppercase", color: accent ? "rgba(255,255,255,0.6)" : A.muted }}>{label}</div>
          {trend && <Tag color={A.accent} bg={accent ? "rgba(255,90,54,0.15)" : A.accentSoft}>↗ {trend}</Tag>}
        </div>
        <div style={{ fontFamily: DISPLAY, fontSize: accent ? 42 : 32, fontWeight: 600, letterSpacing: -1.2, marginTop: 8 }}>{value}</div>
      </div>);

  }

  function AtlasCards({ s, T }) {
    const countries = Object.entries(s.byCountry).sort((a, b) => b[1] - a[1]);
    const recipients = Object.entries(s.byRecipient).sort((a, b) => b[1] - a[1]);
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 14, flex: 1, minHeight: 0 }}>
        <APanel title={T.by_country}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
            {countries.map(([c, v]) => {
              const pct = v / s.totalEur * 100;
              return (
                <div key={c}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                    <Flag code={window.COUNTRY_CODE[c]} />
                    <span style={{ fontWeight: 600, fontSize: 14, color: A.ink, flex: 1, letterSpacing: -0.2 }}>{c}</span>
                    <span style={{ fontFamily: MONO, fontWeight: 600, fontSize: 13, color: A.ink, fontVariantNumeric: "tabular-nums" }}>{window.formatEUR(v)}</span>
                    <span style={{ fontFamily: MONO, fontSize: 10.5, color: A.muted, width: 42, textAlign: "right" }}>{pct.toFixed(1)}%</span>
                  </div>
                  <div style={{ height: 6, background: A.surface2, borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: pct + '%', height: '100%', background: A.ink, borderRadius: 99 }}></div>
                  </div>
                </div>);

            })}
          </div>
        </APanel>
        <APanel title={T.by_recipient}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
            {recipients.map(([r, v], i) =>
            <div key={r} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, background: i === 0 ? A.surface2 : "transparent", border: "1px solid " + (i === 0 ? A.line : "transparent") }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: A.ink, display: "grid", placeItems: "center", color: A.accent, fontFamily: MONO, fontWeight: 700, fontSize: 11 }}>
                  {r.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: A.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: -0.2 }}>{r}</div>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 600, color: A.ink, fontVariantNumeric: "tabular-nums" }}>{window.formatEUR(v)}</div>
              </div>
            )}
          </div>
        </APanel>
      </div>);

  }

  function AtlasTable({ s, T }) {
    const txns = window.TRANSACTIONS;
    return (
      <APanel title={T.transactions} style={{ flex: 1 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10, fontFamily: SANS, fontSize: 12.5 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid " + A.line }}>
              {[T.col_date, T.col_recipient, T.col_country, T.col_amount, T.col_eur, T.col_txn].map((h, i) =>
              <th key={i} style={{ textAlign: i >= 3 ? "right" : "left", padding: "9px 10px", fontFamily: MONO, fontSize: 10, color: A.muted, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 600 }}>{h}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {txns.slice(0, 13).map((t) =>
            <tr key={t.transaction_number} style={{ borderBottom: "1px solid " + A.lineSoft }}>
                <td style={atd}>{t.date}</td>
                <td style={{ ...atd, fontWeight: 600 }}>{t.recipient_name}</td>
                <td style={atd}><span style={{ display: 'inline-flex', alignItems: "center", gap: 8 }}><Flag code={window.COUNTRY_CODE[t.country]} size={16} />{t.country}</span></td>
                <td style={{ ...atd, textAlign: "right", fontFamily: MONO, fontVariantNumeric: "tabular-nums" }}>{window.formatAmount(t.amount, t.currency)}</td>
                <td style={{ ...atd, textAlign: "right", fontFamily: MONO, fontVariantNumeric: "tabular-nums", fontWeight: 600, color: A.ink }}>{window.formatEURp(parseFloat(t.amount_eur))}</td>
                <td style={{ ...atd, textAlign: "right", fontFamily: MONO, fontSize: 11, color: A.muted }}>{t.transaction_number}</td>
              </tr>
            )}
          </tbody>
        </table>
      </APanel>);

  }

  function AtlasCharts({ s, T, lang }) {
    const months = [...Array(12).keys()].map((i) => "2024-" + String(i + 1).padStart(2, '0'));
    const maxM = Math.max(...months.map((m) => s.byMonth[m] || 0));
    const countries = Object.entries(s.byCountry).sort((a, b) => b[1] - a[1]);
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14, flex: 1, minHeight: 0 }}>
        <APanel title={T.by_month}>
          <svg viewBox="0 0 600 240" width="100%" height="240" preserveAspectRatio="none" style={{ marginTop: 10 }}>
            <defs>
              <linearGradient id="atlasArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={A.accent} stopOpacity="0.25" />
                <stop offset="100%" stopColor={A.accent} stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 1, 2, 3].map((i) =>
            <line key={i} x1="30" x2="590" y1={30 + i * 55} y2={30 + i * 55} stroke={A.lineSoft} strokeWidth="1" />
            )}
            {(() => {
              const pts = months.map((m, i) => {
                const v = s.byMonth[m] || 0;
                const x = 36 + i * 548 / 11;
                const y = 210 - (maxM ? v / maxM * 170 : 0);
                return [x, y, v];
              });
              const linePath = pts.map(([x, y], i) => (i === 0 ? "M " : "L ") + x + " " + y).join(" ");
              const areaPath = linePath + ` L ${pts[pts.length - 1][0]} 210 L ${pts[0][0]} 210 Z`;
              return (
                <g>
                  <path d={areaPath} fill="url(#atlasArea)" />
                  <path d={linePath} fill="none" stroke={A.accent} strokeWidth="2.5" strokeLinejoin="round" />
                  {pts.map(([x, y, v], i) => v > 0 &&
                  <g key={i}>
                      <circle cx={x} cy={y} r="3.5" fill={A.bg} stroke={A.accent} strokeWidth="2" />
                    </g>
                  )}
                </g>);

            })()}
            {months.map((m, i) => {
              const x = 36 + i * 548 / 11;
              return <text key={m} x={x} y="232" textAnchor="middle" fontFamily={MONO} fontSize="10" fill={A.muted}>{String(i + 1).padStart(2, '0')}</text>;
            })}
          </svg>
        </APanel>
        <APanel title={T.by_country}>
          <AtlasDonut data={countries} total={s.totalEur} />
        </APanel>
      </div>);

  }

  function AtlasDonut({ data, total }) {
    const colors = [A.accent, A.ink, A.good, A.warn];
    const R = 60,C = 2 * Math.PI * R;
    let off = 0;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 16 }}>
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={R} fill="none" stroke={A.surface2} strokeWidth="18" />
          {data.map(([c, v], i) => {
            const frac = v / total;
            const seg = C * frac;
            const el = <circle key={c} cx="80" cy="80" r={R} fill="none" stroke={colors[i % colors.length]} strokeWidth="18" strokeDasharray={seg + " " + C} strokeDashoffset={-off} transform="rotate(-90 80 80)" />;
            off += seg;
            return el;
          })}
          <text x="80" y="78" textAnchor="middle" fontFamily={DISPLAY} fontWeight="700" fontSize="22" fill={A.ink}>{data.length}</text>
          <text x="80" y="96" textAnchor="middle" fontFamily={MONO} fontWeight="500" fontSize="9" fill={A.muted} letterSpacing="1.5">PAYS</text>
        </svg>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          {data.map(([c, v], i) =>
          <div key={c} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: colors[i % colors.length] }}></span>
              <span style={{ flex: 1, color: A.ink, fontWeight: 600 }}>{c}</span>
              <span style={{ fontFamily: MONO, color: A.muted, fontVariantNumeric: "tabular-nums" }}>{window.formatEUR(v)}</span>
            </div>
          )}
        </div>
      </div>);

  }

  // ── Recipients screen ────────────────────────────────────────────────────
  function Recipients({ T, lang }) {
    const s = window.summarize(window.TRANSACTIONS);
    const recipients = Object.entries(s.byRecipient).sort((a, b) => b[1] - a[1]).map(([name, total]) => {
      const txns = window.TRANSACTIONS.filter((t) => t.recipient_name === name);
      const country = txns[0].country;
      return { name, total, count: txns.length, country, currency: txns[0].currency };
    });
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        <PageHeader
          eyebrow={lang === 'fr' ? 'Bénéficiaires · 2024' : 'Recipients · 2024'}
          title={lang === 'fr' ? 'Bénéficiaires' : 'Recipients'}
          sub={lang === 'fr' ? 'Toutes les personnes auxquelles vous avez envoyé de l\'argent cette année.' : 'Everyone you sent money to this year.'} />
        
        <div style={{ padding: "26px 40px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
          {recipients.map((r) =>
          <div key={r.name} style={{ background: A.surface, border: "1px solid " + A.line, borderRadius: 16, padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: A.ink, color: A.accent, display: "grid", placeItems: "center", fontFamily: MONO, fontWeight: 700, fontSize: 16 }}>
                  {r.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, color: A.ink, letterSpacing: -0.3 }}>{r.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <Flag code={window.COUNTRY_CODE[r.country]} size={14} />
                    <span style={{ fontSize: 12, color: A.muted }}>{r.country} · {r.currency}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, color: A.ink, letterSpacing: -0.5 }}>{window.formatEUR(r.total)}</div>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: A.muted }}>{r.count} {T.transfers}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>);

  }

  // ── PDF preview ──────────────────────────────────────────────────────────
  function ScreenPdf({ T, go, lang }) {
    const s = window.summarize(window.TRANSACTIONS);
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        <PageHeader
          eyebrow={lang === 'fr' ? 'Rapport · 2024' : 'Report · 2024'}
          title={<>{lang === 'fr' ? 'Prêt à exporter' : 'Ready to export'}<span style={{ color: A.accent }}>.</span></>}
          right={<Btn kind="ghost" size="sm" onClick={() => go('dashboard')}>← {T.cta_back}</Btn>} />
        
        <div style={{ padding: "26px 40px", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 18, flex: 1, minHeight: 0 }}>
          <div style={{ background: A.surface, border: "1px solid " + A.line, borderRadius: 16, padding: 28, boxShadow: "0 12px 32px -18px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid " + A.line, paddingBottom: 14 }}>
              <div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: A.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>2024 · Annexe</div>
                <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, color: A.ink, letterSpacing: -0.5, marginTop: 4 }}>{lang === 'fr' ? 'Transferts internationaux' : 'International transfers'}</div>
              </div>
              <Tag color={A.good} bg={A.surface2}><Dot color={A.good} /> {T.pdf_ready}</Tag>
            </div>
            <div style={{ marginTop: 14 }}>
              <ARow k={lang === 'fr' ? 'Période' : 'Period'} v="01.01.2024 → 31.12.2024" />
              <ARow k={T.transfers} v={s.count} />
              <ARow k={T.recipients} v={Object.keys(s.byRecipient).length} />
              <ARow k={T.total_eur} v={window.formatEURp(s.totalEur)} strong />
            </div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: A.muted, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 18, marginBottom: 6 }}>{lang === 'fr' ? 'Par pays' : 'By country'}</div>
            <table style={{ width: "100%", fontSize: 13 }}>
              {Object.entries(s.byCountry).map(([c, v]) =>
              <tr key={c} style={{ borderBottom: "1px solid " + A.lineSoft }}>
                  <td style={{ padding: "8px 0", color: A.ink, fontWeight: 500 }}>{c}</td>
                  <td style={{ padding: "8px 0", textAlign: "right", fontFamily: MONO, color: A.ink, fontVariantNumeric: "tabular-nums" }}>{window.formatEURp(v)}</td>
                </tr>
              )}
            </table>
            <div style={{ marginTop: 16, fontSize: 11, color: A.muted, fontStyle: "italic", borderTop: "1px dashed " + A.line, paddingTop: 10 }}>{T.disclaimer}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <APanel title={lang === 'fr' ? 'Formats' : 'Formats'}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                <DLRow ext="PDF" name="rapport-2024.pdf" size="218 KB" primary />
                <DLRow ext="CSV" name="transferts.csv" size="14 KB" />
                <DLRow ext="JSON" name="transferts.json" size="22 KB" />
              </div>
            </APanel>
            <APanel title={lang === 'fr' ? 'Pour votre déclaration' : 'For your filing'}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
                <div style={{ padding: 14, background: A.surface2, borderRadius: 12, border: "1px solid " + A.line }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Tag color={A.bg} bg={A.ink}>2042-K</Tag>
                    <div style={{ fontSize: 12, color: A.muted, fontFamily: MONO }}>{lang === 'fr' ? 'Obligatoire' : 'Required'}</div>
                  </div>
                  <div style={{ fontSize: 13, color: A.ink, lineHeight: 1.5 }}>
                    {lang === 'fr' ? 'Reportez le total dans la déclaration complémentaire des revenus.' : 'Report the total in your supplementary income return.'}
                  </div>
                </div>
                <div style={{ padding: 14, background: A.surface2, borderRadius: 12, border: "1px solid " + A.line }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Tag color={A.warn} bg={A.surface}>8UU</Tag>
                    <div style={{ fontSize: 12, color: A.muted, fontFamily: MONO }}>{lang === 'fr' ? 'Si > 10 000 €' : 'If > €10,000'}</div>
                  </div>
                  <div style={{ fontSize: 13, color: A.ink, lineHeight: 1.5 }}>
                    {lang === 'fr' ? 'Comptes détenus à l\'étranger ou transferts importants.' : 'Foreign accounts or large transfers.'}
                  </div>
                </div>
              </div>
            </APanel>
          </div>
        </div>
      </div>);

  }

  // ── small atoms ──────────────────────────────────────────────────────────
  const atd = { padding: "11px 10px", color: A.ink, verticalAlign: "middle" };

  const AInput = ({ label, val, type = "text", placeholder, hint }) => {
    const [v, setV] = useState(val);
    return (
      <label>
        <div style={{ fontFamily: MONO, fontSize: 10, color: A.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
        <input value={v} type={type} placeholder={placeholder} onChange={(e) => setV(e.target.value)} style={{
          width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid " + A.line,
          background: A.bg, fontFamily: SANS, fontSize: 14, color: A.ink, outline: "none"
        }} />
        {hint && <div style={{ fontSize: 11.5, color: A.muted, marginTop: 6 }}>{hint}</div>}
      </label>);

  };

  const APanel = ({ title, children, style = {} }) =>
  <div style={{ background: A.surface, border: "1px solid " + A.line, borderRadius: 16, padding: 22, ...style }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: MONO, fontSize: 10.5, color: A.muted, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600 }}>{title}</div>
      </div>
      {children}
    </div>;


  const ARow = ({ k, v, strong }) =>
  <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid " + A.lineSoft, alignItems: "baseline" }}>
      <span style={{ fontSize: 13, color: A.muted }}>{k}</span>
      <span style={{ fontFamily: MONO, color: A.ink, fontWeight: strong ? 700 : 500, fontSize: strong ? 18 : 13, fontVariantNumeric: "tabular-nums" }}>{v}</span>
    </div>;


  const DLRow = ({ ext, name, size, primary }) =>
  <div style={{ ...{
      display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
      background: primary ? A.ink : A.bg, color: primary ? A.bg : A.ink,
      border: "1px solid " + (primary ? A.ink : A.line), borderRadius: 10
    }, background: "rgb(15, 14, 12)" }}>
      <div style={{ width: 30, height: 36, background: primary ? A.accent : A.surface2, border: "1px solid " + (primary ? A.accent : A.line), borderRadius: 6, display: "grid", placeItems: "center", fontFamily: MONO, fontSize: 9, fontWeight: 700, color: primary ? A.ink : A.ink }}>{ext}</div>
      <div style={{ flex: 1, fontFamily: MONO, fontSize: 12 }}>{name}</div>
      <div style={{ fontFamily: MONO, fontSize: 10, opacity: 0.6 }}>{size}</div>
      <button style={{ background: primary ? A.accent : A.ink, color: primary ? A.ink : A.bg, border: "none", padding: "5px 10px", fontFamily: MONO, fontSize: 10, cursor: "pointer", letterSpacing: 1, fontWeight: 700, borderRadius: 6 }}>↓</button>
    </div>;


  // ── root ─────────────────────────────────────────────────────────────────
  window.AtlasApp = function AtlasApp({ layout }) {
    const [screen, setScreen] = useState('start');
    const [lang, setLang] = useState('fr');
    const T = window.I18N[lang];
    return (
      <div style={{ background: A.bg, color: A.ink, fontFamily: SANS, height: "100%", width: "100%", display: "flex", overflow: "hidden" }}>
        <style>{`
          @keyframes atlasSpin { to { transform: rotate(360deg); } }
          .atlas-spin { animation: atlasSpin 0.9s linear infinite; }
        `}</style>
        <Sidebar screen={screen} go={setScreen} lang={lang} setLang={setLang} />
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: A.bg }}>
          {screen === 'start' && <ScreenStart T={T} go={setScreen} lang={lang} />}
          {screen === 'email' && <ScreenEmail T={T} go={setScreen} lang={lang} />}
          {screen === 'json' && <ScreenUpload T={T} go={setScreen} lang={lang} mode="json" />}
          {screen === 'eml' && <ScreenUpload T={T} go={setScreen} lang={lang} mode="eml" />}
          {screen === 'loading' && <ScreenLoading T={T} go={setScreen} />}
          {screen === 'dashboard' && <Dashboard T={T} go={setScreen} lang={lang} layout={layout} />}
          {screen === 'recipients' && <Recipients T={T} lang={lang} />}
          {screen === 'pdf' && <ScreenPdf T={T} go={setScreen} lang={lang} />}
        </main>
      </div>);

  };
})();