// ────────────────────────────────────────────────────────────────────────────
// Comptoir · Friendly civic counter
// Clay + cream + ochre + ink. Serif headlines, sans body, mono numbers.
// Structured like a friendly tax office, but warm.
// ────────────────────────────────────────────────────────────────────────────
(function () {
  const { useState } = React;

  const C = {
    bg:      "#F1E7D4",   // warm cream
    paper:   "#FAF5E8",
    card:    "#FFFFFF",
    clay:    "#B8553A",
    clayDk:  "#8C3D27",
    ochre:   "#D8A23B",
    ochreLt: "#F0CF7E",
    moss:    "#5C6E3F",
    ink:     "#1F1A14",
    inkSoft: "#3D352C",
    muted:   "#7D6E5C",
    rule:    "#D6C5A4",
    softrule:"#E7D9B8",
  };
  const SERIF = `'Instrument Serif', 'Source Serif Pro', Georgia, serif`;
  const SANS  = `'Public Sans', ui-sans-serif, system-ui, -apple-system, sans-serif`;
  const MONO  = `'DM Mono', 'JetBrains Mono', ui-monospace, monospace`;

  // ── atoms ────────────────────────────────────────────────────────────────
  const Btn = ({ children, onClick, kind = "primary", style = {} }) => {
    const styles = {
      primary: { background: C.ink,    color: C.bg,  border: "1px solid " + C.ink },
      ghost:   { background: "transparent", color: C.ink, border: "1px solid " + C.rule },
      ochre:   { background: C.ochre,  color: C.ink, border: "1px solid " + C.ochre },
    }[kind];
    return (
      <button onClick={onClick} style={{
        ...styles, padding: "10px 18px", borderRadius: 4, fontFamily: SANS,
        fontWeight: 600, fontSize: 13, cursor: "pointer", letterSpacing: 0.2,
        textTransform: "uppercase", ...style,
      }}>{children}</button>
    );
  };

  const Flag = ({ code, size = 22 }) => {
    const colors = {
      UG: ["#000", "#FCDC04", "#D90000"],
      SN: ["#00853F", "#FDEF42", "#E31B23"],
      KE: ["#000", "#BB0000", "#006600"],
      MA: ["#C1272D", "#006233"],
    }[code] || ["#888"];
    return (
      <div style={{ display: "flex", flexDirection: "column", width: size, height: size * 0.66, borderRadius: 2, overflow: "hidden", border: "1px solid " + C.rule }}>
        {colors.map((cc, i) => <div key={i} style={{ flex: 1, background: cc }}></div>)}
      </div>
    );
  };

  const Stamp = ({ children, color = C.clay, rotate = -8 }) => (
    <span style={{
      display: "inline-block", padding: "5px 10px", border: "2px solid " + color,
      color: color, fontFamily: SANS, fontWeight: 800, fontSize: 11, letterSpacing: 2,
      textTransform: "uppercase", transform: `rotate(${rotate}deg)`, borderRadius: 2,
    }}>{children}</span>
  );

  // ── Top bar ──────────────────────────────────────────────────────────────
  function TopBar({ T, lang, setLang, step }) {
    return (
      <div style={{
        background: C.paper, padding: "14px 40px", display: "flex", alignItems: "center",
        justifyContent: "space-between", borderBottom: "1px solid " + C.rule,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, border: "1.5px solid " + C.ink, borderRadius: 99,
            display: "grid", placeItems: "center", color: C.ink, fontFamily: SERIF,
            fontSize: 22, fontStyle: "italic",
          }}>T</div>
          <div>
            <div style={{ fontSize: 16, fontFamily: SERIF, color: C.ink, lineHeight: 1, fontStyle: "italic" }}>{T.brand}</div>
            <div style={{ fontSize: 9.5, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 2 }}>
              {lang === 'fr' ? 'Bureau des transferts' : 'Transfer office'}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {[T.step1, T.step2, T.step3].map((s, i) => (
            <React.Fragment key={i}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  width: 22, height: 22, borderRadius: 99,
                  background: i <= step ? C.clay : "transparent",
                  border: "1.5px solid " + (i <= step ? C.clay : C.rule),
                  color: i <= step ? "#fff" : C.muted,
                  display: "grid", placeItems: "center", fontFamily: MONO, fontSize: 10, fontWeight: 700,
                }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: i === step ? C.ink : C.muted, letterSpacing: 0.4, textTransform: "uppercase" }}>{s}</span>
              </div>
              {i < 2 && <div style={{ width: 24, height: 1, background: C.rule, margin: "0 14px" }}></div>}
            </React.Fragment>
          ))}
        </div>

        <div style={{ display: "flex", border: "1px solid " + C.rule, borderRadius: 2, overflow: "hidden", fontFamily: MONO }}>
          {['fr', 'en'].map((l) => (
            <button key={l} onClick={() => setLang(l)} style={{
              border: "none", padding: "5px 10px", cursor: "pointer",
              background: lang === l ? C.ink : "transparent",
              color: lang === l ? C.bg : C.muted,
              fontSize: 10, fontWeight: 700, letterSpacing: 1,
            }}>{l.toUpperCase()}</button>
          ))}
        </div>
      </div>
    );
  }

  // ── Screen 1: counter / source picker ────────────────────────────────────
  function Screen1({ T, go, lang }) {
    return (
      <div style={{ padding: "44px 48px", display: "flex", flexDirection: "column", gap: 32, flex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 56, alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: C.clay, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
              Dossier 01 · {lang === 'fr' ? 'Importation' : 'Import'}
            </div>
            <h1 style={{ fontFamily: SERIF, fontSize: 56, fontWeight: 400, color: C.ink, margin: 0, lineHeight: 1.05, letterSpacing: -0.5 }}>
              <span style={{ fontStyle: "italic" }}>{lang === 'fr' ? 'Bonjour' : 'Hello'}.</span> {lang === 'fr' ? 'Préparons votre déclaration.' : 'Let\'s prepare your filing.'}
            </h1>
            <p style={{ fontFamily: SANS, fontSize: 15, color: C.inkSoft, marginTop: 18, lineHeight: 1.6, maxWidth: 460 }}>
              {lang === 'fr'
                ? 'Indiquez par où nous devons commencer. Nous lisons vos reçus, convertissons en euros, et préparons un récapitulatif prêt pour le fisc.'
                : 'Tell us where to begin. We read your receipts, convert to euros, and prepare a tax-ready summary.'}
            </p>
          </div>

          <div style={{
            background: C.paper, border: "1px solid " + C.rule, borderRadius: 4, padding: 26, position: "relative",
          }}>
            <div style={{ position: "absolute", top: -14, right: 18 }}>
              <Stamp>✓ {lang === 'fr' ? 'Confidentiel' : 'Private'}</Stamp>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>{lang === 'fr' ? 'Au guichet' : 'At the counter'}</div>
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 22, color: C.ink, lineHeight: 1.35, margin: "10px 0 0", letterSpacing: -0.2 }}>
              {lang === 'fr'
                ? '« Pour les transferts familiaux à l\'étranger, vous devez les déclarer en case 2042-K. Apportez vos reçus. »'
                : '"Family transfers abroad must be declared in box 2042-K. Bring your receipts."'}
            </p>
            <div style={{ marginTop: 16, fontFamily: SANS, fontSize: 12, color: C.muted }}>
              — {lang === 'fr' ? 'Brochure de la DGFiP, 2024' : 'DGFiP leaflet, 2024'}
            </div>
          </div>
        </div>

        {/* numbered tabs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, border: "1px solid " + C.rule, background: C.card, borderRadius: 4, overflow: "hidden" }}>
          <Counter T={T} n="01" tag={lang === 'fr' ? 'Direct' : 'Direct'} title={T.method_email} desc={T.method_email_d} cta={lang === 'fr' ? 'Connecter' : 'Connect'} onClick={() => go('email')} accent={C.clay}/>
          <div style={{ width: 1, background: C.rule }}></div>
          <Counter T={T} n="02" tag={lang === 'fr' ? 'Fichier' : 'File'}  title={T.method_json}  desc={T.method_json_d}  cta={lang === 'fr' ? 'Téléverser' : 'Upload'}   onClick={() => go('json')} accent={C.moss}/>
          <div style={{ width: 1, background: C.rule }}></div>
          <Counter T={T} n="03" tag={lang === 'fr' ? 'Reçus' : 'Receipts'} title={T.method_eml}  desc={T.method_eml_d}   cta={lang === 'fr' ? 'Déposer' : 'Drop'}      onClick={() => go('eml')}  accent={C.ochre}/>
        </div>

        {/* footer line */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 18, borderTop: "1px dashed " + C.rule, marginTop: "auto" }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>
            {lang === 'fr' ? 'Établissements pris en charge' : 'Supported providers'}
          </div>
          <div style={{ display: "flex", gap: 22, fontFamily: SANS, fontSize: 12, color: C.inkSoft }}>
            <span>WorldRemit</span><span>·</span>
            <span>Wise</span><span>·</span>
            <span>Western Union</span><span>·</span>
            <span>Remitly</span><span>·</span>
            <span style={{ color: C.muted }}>+ 4</span>
          </div>
          <button onClick={() => go('demo')} style={{ background: "none", border: "none", color: C.clay, fontFamily: SANS, fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase" }}>
            {lang === 'fr' ? 'Voir un exemple' : 'See example'} →
          </button>
        </div>
      </div>
    );
  }

  function Counter({ n, tag, title, desc, cta, onClick, accent }) {
    return (
      <button onClick={onClick} style={{
        textAlign: "left", padding: "28px 24px 22px", background: "transparent", border: "none",
        cursor: "pointer", fontFamily: SANS, display: "flex", flexDirection: "column", gap: 12,
        transition: "background .15s",
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = C.paper}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
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

  // ── Email form ───────────────────────────────────────────────────────────
  function ScreenEmail({ T, go, lang }) {
    return (
      <div style={{ padding: "36px 48px", flex: 1, display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 48, alignContent: "flex-start" }}>
        <div>
          <button onClick={() => go('start')} style={back}>← {T.cta_back}</button>
          <div style={{ fontFamily: MONO, fontSize: 10, color: C.clay, letterSpacing: 2, textTransform: "uppercase", marginTop: 14 }}>Formulaire 01 · Connexion</div>
          <h2 style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 400, color: C.ink, margin: "8px 0 0", letterSpacing: -0.3 }}>
            <span style={{ fontStyle: "italic" }}>{lang === 'fr' ? 'Identification' : 'Identification'}</span>
          </h2>

          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 460 }}>
            <CField label={T.email_label} val="marie.therese@outlook.fr"/>
            <CField label={T.pw_label} val="" placeholder="xxxx · xxxx · xxxx · xxxx" type="password" hint={T.pw_hint}/>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12 }}>
              <CField label={T.recipient_label} val="Patrick Kayombya"/>
              <CField label={T.year_label} val="2024"/>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <Btn onClick={() => go('loading')}>{T.cta_connect} →</Btn>
              <Btn kind="ghost" onClick={() => go('start')}>{T.cta_back}</Btn>
            </div>
          </div>
        </div>

        <div style={{ background: C.paper, border: "1px solid " + C.rule, padding: 26, borderRadius: 4, position: "relative" }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>{lang === 'fr' ? 'Notice explicative' : 'Help notice'}</div>
          <h3 style={{ fontFamily: SERIF, fontSize: 22, color: C.ink, margin: 0, letterSpacing: -0.2 }}>
            {lang === 'fr' ? 'Mot de passe d\'application' : 'App passwords'}
          </h3>
          <p style={{ fontFamily: SANS, fontSize: 13, color: C.inkSoft, lineHeight: 1.6, marginTop: 10 }}>
            {lang === 'fr'
              ? 'Un mot de passe d\'application est un code à 16 caractères réservé aux outils tiers. Il ne donne pas accès au reste de votre compte.'
              : 'An app password is a 16-character code reserved for third-party tools. It does not grant access to anything else.'}
          </p>
          <ol style={{ fontFamily: SANS, fontSize: 13, color: C.ink, lineHeight: 1.7, paddingLeft: 18, marginTop: 14 }}>
            <li>{lang === 'fr' ? 'Activez la double authentification.' : 'Enable two-factor authentication.'}</li>
            <li>{lang === 'fr' ? 'Générez un mot de passe d\'application.' : 'Generate an app password.'}</li>
            <li>{lang === 'fr' ? 'Activez IMAP dans les paramètres.' : 'Enable IMAP in settings.'}</li>
          </ol>
          <div style={{ borderTop: "1px dashed " + C.rule, marginTop: 18, paddingTop: 14, fontFamily: MONO, fontSize: 11, color: C.muted, lineHeight: 1.7 }}>
            <div>imap.outlook.com:993</div>
            <div>imap.gmail.com:993</div>
          </div>
        </div>
      </div>
    );
  }

  function ScreenUpload({ T, go, lang, mode }) {
    return (
      <div style={{ padding: "36px 48px", flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
        <button onClick={() => go('start')} style={back}>← {T.cta_back}</button>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: C.clay, letterSpacing: 2, textTransform: "uppercase" }}>{lang === 'fr' ? 'Pièces à joindre' : 'Attachments'}</div>
          <h2 style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 400, color: C.ink, margin: "8px 0 0", letterSpacing: -0.3, fontStyle: "italic" }}>
            {mode === 'json' ? T.method_json : T.method_eml}
          </h2>
        </div>
        <div style={{
          flex: 1, minHeight: 320, border: "2px dashed " + C.clay, background: C.paper,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, borderRadius: 6,
        }}>
          <div style={{ width: 72, height: 90, border: "2px solid " + C.ink, background: C.card, position: "relative" }}>
            <div style={{ position: "absolute", top: -1, right: -1, width: 18, height: 18, background: C.bg, borderLeft: "2px solid " + C.ink, borderBottom: "2px solid " + C.ink }}></div>
            <div style={{ padding: "20px 8px 0", display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ height: 2, background: C.rule }}></div>
              <div style={{ height: 2, background: C.rule, width: "80%" }}></div>
              <div style={{ height: 2, background: C.rule, width: "60%" }}></div>
            </div>
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 24, color: C.ink, fontStyle: "italic" }}>{T.drag_drop}</div>
          <div style={{ fontFamily: SANS, fontSize: 12, color: C.muted, letterSpacing: 0.5 }}>{T.or_browse}</div>
          <Btn style={{ marginTop: 12 }} onClick={() => go('loading')}>{lang === 'fr' ? 'Utiliser l\'exemple' : 'Use sample'} →</Btn>
        </div>
      </div>
    );
  }

  function ScreenLoading({ T, go, lang }) {
    React.useEffect(() => { const t = setTimeout(() => go('dashboard'), 1300); return () => clearTimeout(t); }, []);
    return (
      <div style={{ padding: 48, flex: 1, display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div className="comptoir-rotate" style={{ width: 64, height: 64, margin: "0 auto 24px", border: "2px solid " + C.clay, borderTopColor: "transparent", borderRadius: "50%" }}></div>
          <div style={{ fontFamily: SERIF, fontSize: 24, color: C.ink, fontStyle: "italic" }}>{T.scanning}</div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: C.muted, marginTop: 10, letterSpacing: 1 }}>
            IMAP · INBOX · {lang === 'fr' ? 'CHERCHE' : 'SCAN'}
          </div>
        </div>
      </div>
    );
  }

  // ── Dashboard ────────────────────────────────────────────────────────────
  function Dashboard({ T, go, lang, layout }) {
    const s = window.summarize(window.TRANSACTIONS);
    return (
      <div style={{ padding: "28px 40px 32px", flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Receipt-like hero */}
        <div style={{ background: C.card, border: "1px solid " + C.rule, borderRadius: 4, padding: "22px 28px", display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr auto", gap: 24, alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: C.muted, letterSpacing: 2, textTransform: "uppercase" }}>{T.dash_title}</div>
            <div style={{ fontFamily: SERIF, fontSize: 44, color: C.ink, lineHeight: 1, marginTop: 4, letterSpacing: -1, fontStyle: "italic" }}>2024</div>
          </div>
          <BigStat label={T.total_eur} v={window.formatEUR(s.totalEur)} accent={C.clay}/>
          <BigStat label={T.transfers}   v={s.count}/>
          <BigStat label={T.countries}   v={Object.keys(s.byCountry).length}/>
          <Btn kind="ochre" onClick={() => go('pdf')}>{T.cta_export} →</Btn>
        </div>

        {layout === 'cards'  && <ComptoirCards   s={s} T={T} />}
        {layout === 'table'  && <ComptoirTable   s={s} T={T} />}
        {layout === 'charts' && <ComptoirCharts  s={s} T={T} />}
      </div>
    );
  }

  function BigStat({ label, v, accent }) {
    return (
      <div style={{ borderLeft: "1px solid " + C.rule, paddingLeft: 18 }}>
        <div style={{ fontFamily: MONO, fontSize: 9.5, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>{label}</div>
        <div style={{ fontFamily: SERIF, fontSize: 26, color: accent || C.ink, marginTop: 4, letterSpacing: -0.3 }}>{v}</div>
      </div>
    );
  }

  function ComptoirCards({ s, T }) {
    const countries = Object.entries(s.byCountry).sort((a, b) => b[1] - a[1]);
    const recipients = Object.entries(s.byRecipient).sort((a, b) => b[1] - a[1]);
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, flex: 1, minHeight: 0 }}>
        <CCard title={T.by_country}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {countries.map(([c, v], i) => (
              <div key={c} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderTop: i === 0 ? "none" : "1px dashed " + C.softrule }}>
                <Flag code={window.COUNTRY_CODE[c]}/>
                <div style={{ flex: 1, fontFamily: SERIF, fontSize: 19, color: C.ink, letterSpacing: -0.2 }}>{c}</div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>{Math.round(v / s.totalEur * 100)} %</div>
                <div style={{ fontFamily: MONO, fontSize: 16, color: C.ink, fontWeight: 500, minWidth: 90, textAlign: "right" }}>{window.formatEUR(v)}</div>
              </div>
            ))}
          </div>
        </CCard>
        <CCard title={T.by_recipient}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {recipients.map(([r, v], i) => (
              <div key={r} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderTop: i === 0 ? "none" : "1px dashed " + C.softrule }}>
                <div style={{ width: 36, height: 36, borderRadius: 99, border: "1.5px solid " + C.ink, background: C.paper, display: "grid", placeItems: "center", fontFamily: SERIF, fontSize: 14, fontStyle: "italic", color: C.ink }}>
                  {r.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                </div>
                <div style={{ flex: 1, fontFamily: SANS, fontSize: 13, color: C.ink, fontWeight: 600 }}>{r}</div>
                <div style={{ fontFamily: MONO, fontSize: 16, color: C.ink, minWidth: 90, textAlign: "right" }}>{window.formatEUR(v)}</div>
              </div>
            ))}
          </div>
        </CCard>
      </div>
    );
  }

  function ComptoirTable({ s, T }) {
    const txns = window.TRANSACTIONS;
    return (
      <CCard title={T.transactions} style={{ flex: 1 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 4 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid " + C.ink }}>
              {[T.col_date, T.col_recipient, T.col_country, T.col_amount, T.col_eur, T.col_txn].map((h, i) => (
                <th key={i} style={{ textAlign: i >= 3 ? "right" : "left", padding: "10px 8px", fontFamily: MONO, fontSize: 10, color: C.ink, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {txns.slice(0, 13).map((t, i) => (
              <tr key={t.transaction_number} style={{ borderBottom: "1px dashed " + C.softrule }}>
                <td style={ctd}>{t.date}</td>
                <td style={{ ...ctd, fontFamily: SERIF, fontSize: 14, fontStyle: 'italic' }}>{t.recipient_name}</td>
                <td style={ctd}><span style={{ display: 'inline-flex', alignItems: "center", gap: 8 }}><Flag code={window.COUNTRY_CODE[t.country]} size={16}/>{t.country}</span></td>
                <td style={{ ...ctd, textAlign: "right", fontFamily: MONO }}>{window.formatAmount(t.amount, t.currency)}</td>
                <td style={{ ...ctd, textAlign: "right", fontFamily: MONO, color: C.clay, fontWeight: 600 }}>{window.formatEURp(parseFloat(t.amount_eur))}</td>
                <td style={{ ...ctd, textAlign: "right", fontFamily: MONO, fontSize: 11, color: C.muted }}>#{t.transaction_number}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CCard>
    );
  }

  function ComptoirCharts({ s, T }) {
    const months = [...Array(12).keys()].map((i) => "2024-" + String(i + 1).padStart(2, '0'));
    const maxM = Math.max(...months.map((m) => s.byMonth[m] || 0));
    const countries = Object.entries(s.byCountry).sort((a, b) => b[1] - a[1]);
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18, flex: 1, minHeight: 0 }}>
        <CCard title={T.by_month}>
          <svg viewBox="0 0 600 220" width="100%" height="220" style={{ marginTop: 8 }} preserveAspectRatio="none">
            {[0, 1, 2, 3].map((i) => (
              <line key={i} x1="0" x2="600" y1={20 + i * 50} y2={20 + i * 50} stroke={C.softrule} strokeWidth="1" strokeDasharray="3 3"/>
            ))}
            {months.map((m, i) => {
              const v = s.byMonth[m] || 0;
              const x = 24 + (i * 552) / 11;
              const h = maxM ? (v / maxM) * 160 : 0;
              return (
                <g key={m}>
                  <rect x={x - 16} y={200 - h} width="32" height={h} fill={i % 2 ? C.clay : C.ochre} stroke={C.ink} strokeWidth="1"/>
                  {v > 0 && <text x={x} y={200 - h - 6} textAnchor="middle" fontFamily={MONO} fontSize="9" fill={C.ink}>{Math.round(v)}€</text>}
                  <text x={x} y={215} textAnchor="middle" fontFamily={MONO} fontSize="10" fill={C.muted}>{String(i + 1).padStart(2, '0')}</text>
                </g>
              );
            })}
          </svg>
        </CCard>
        <CCard title={T.by_country}>
          <PieClay data={countries} total={s.totalEur}/>
        </CCard>
      </div>
    );
  }

  function PieClay({ data, total }) {
    const colors = [C.clay, C.ochre, C.moss, C.clayDk];
    const cx = 90, cy = 90, R = 78;
    let acc = 0;
    const slices = data.map(([c, v], i) => {
      const start = acc / total * Math.PI * 2 - Math.PI / 2;
      acc += v;
      const end = acc / total * Math.PI * 2 - Math.PI / 2;
      const large = (end - start) > Math.PI ? 1 : 0;
      const x1 = cx + R * Math.cos(start), y1 = cy + R * Math.sin(start);
      const x2 = cx + R * Math.cos(end),   y2 = cy + R * Math.sin(end);
      return <path key={c} d={`M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`} fill={colors[i % colors.length]} stroke={C.ink} strokeWidth="1.5"/>;
    });
    return (
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 8 }}>
        <svg width="180" height="180" viewBox="0 0 180 180">{slices}</svg>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, fontFamily: SANS, fontSize: 12 }}>
          {data.map(([c, v], i) => (
            <div key={c} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 11, height: 11, background: colors[i % colors.length], border: "1px solid " + C.ink }}></span>
              <span style={{ flex: 1, fontFamily: SERIF, fontSize: 15, color: C.ink }}>{c}</span>
              <span style={{ fontFamily: MONO, color: C.muted }}>{window.formatEUR(v)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function ScreenPdf({ T, go, lang }) {
    const s = window.summarize(window.TRANSACTIONS);
    return (
      <div style={{ padding: "28px 40px 32px", flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => go('dashboard')} style={back}>← {T.cta_back}</button>
          <Stamp color={C.moss} rotate={4}>✓ {T.pdf_ready}</Stamp>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24, flex: 1, minHeight: 0 }}>
          <div style={{ background: C.card, border: "1px solid " + C.rule, borderRadius: 2, padding: 32, boxShadow: "0 10px 30px -15px rgba(50,30,15,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid " + C.ink, paddingBottom: 10 }}>
              <div>
                <div style={{ fontFamily: MONO, fontSize: 9, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>Formulaire annexe</div>
                <div style={{ fontFamily: SERIF, fontSize: 22, color: C.ink, fontStyle: "italic" }}>Récapitulatif 2024</div>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: C.muted, textAlign: "right" }}>
                <div>Réf : TX-2024-{Math.floor(Math.random() * 9999)}</div>
                <div>Page 01 / 03</div>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <PdfRow k="Période" v="01.01.2024 → 31.12.2024"/>
              <PdfRow k="Transferts" v={s.count}/>
              <PdfRow k="Bénéficiaires" v={Object.keys(s.byRecipient).length}/>
              <PdfRow k="Total équivalent EUR" v={window.formatEURp(s.totalEur)} strong/>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 9, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 18 }}>Par pays</div>
            <table style={{ width: "100%", marginTop: 6, fontSize: 12 }}>
              {Object.entries(s.byCountry).map(([c, v]) => (
                <tr key={c} style={{ borderBottom: "1px dashed " + C.softrule }}>
                  <td style={{ padding: "6px 0", fontFamily: SERIF, color: C.ink, fontSize: 14 }}>{c}</td>
                  <td style={{ padding: "6px 0", textAlign: "right", fontFamily: MONO, color: C.ink }}>{window.formatEURp(v)}</td>
                </tr>
              ))}
            </table>
            <div style={{ marginTop: 18, fontSize: 10, color: C.muted, fontStyle: "italic" }}>{T.disclaimer}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <CCard title={lang === 'fr' ? 'Téléchargements' : 'Downloads'}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                <DownloadRow icon="PDF" label="rapport-2024.pdf"  size="218 KB"/>
                <DownloadRow icon="CSV" label="transferts.csv"    size="14 KB"/>
                <DownloadRow icon="{ }" label="transferts.json"   size="22 KB"/>
              </div>
            </CCard>
            <CCard title={lang === 'fr' ? 'Pour votre déclaration' : 'For your filing'}>
              <p style={{ fontFamily: SANS, fontSize: 13, color: C.inkSoft, lineHeight: 1.6, marginTop: 8 }}>
                {lang === 'fr'
                  ? 'Reportez le total en case 2042-K. Si > 10 000 €, complétez aussi 8UU. Conservez vos reçus 3 ans.'
                  : 'Enter the total in box 2042-K. If > €10,000, also fill 8UU. Keep your receipts for 3 years.'}
              </p>
            </CCard>
          </div>
        </div>
      </div>
    );
  }

  function PdfRow({ k, v, strong }) {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}>
        <span style={{ fontFamily: SANS, color: C.muted }}>{k}</span>
        <span style={{ fontFamily: MONO, color: C.ink, fontWeight: strong ? 700 : 400, fontSize: strong ? 15 : 13 }}>{v}</span>
      </div>
    );
  }

  function DownloadRow({ icon, label, size }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: C.paper, border: "1px solid " + C.rule, borderRadius: 2 }}>
        <div style={{ width: 34, height: 42, background: C.card, border: "1.5px solid " + C.ink, display: "grid", placeItems: "center", fontFamily: MONO, fontSize: 9, fontWeight: 700, color: C.ink }}>{icon}</div>
        <div style={{ flex: 1, fontFamily: MONO, fontSize: 12, color: C.ink }}>{label}</div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: C.muted }}>{size}</div>
        <button style={{ background: C.ink, color: C.bg, border: "none", padding: "5px 10px", fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer", borderRadius: 2 }}>↓</button>
      </div>
    );
  }

  // ── shared atoms ─────────────────────────────────────────────────────────
  const back = { background: "none", border: "none", color: C.muted, fontFamily: SANS, fontSize: 12, cursor: "pointer", padding: 0, letterSpacing: 0.5, alignSelf: "flex-start" };

  const ctd = { padding: "12px 8px", fontFamily: SANS, fontSize: 13, color: C.ink, verticalAlign: "middle" };

  const CField = ({ label, val, type = "text", placeholder, hint }) => {
    const [v, setV] = useState(val);
    return (
      <label>
        <div style={{ fontFamily: MONO, fontSize: 10, color: C.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
        <input value={v} type={type} placeholder={placeholder} onChange={(e) => setV(e.target.value)} style={{
          width: "100%", padding: "11px 14px", border: "1px solid " + C.rule, background: C.card, fontFamily: SANS, fontSize: 14, color: C.ink, outline: "none", borderRadius: 2,
        }}/>
        {hint && <div style={{ fontFamily: SANS, fontSize: 11, color: C.muted, marginTop: 5 }}>{hint}</div>}
      </label>
    );
  };

  const CCard = ({ title, children, style = {} }) => (
    <div style={{ background: C.card, border: "1px solid " + C.rule, borderRadius: 4, padding: 22, ...style }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid " + C.softrule }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: C.muted, letterSpacing: 2, textTransform: "uppercase" }}>{title}</div>
      </div>
      {children}
    </div>
  );

  // ── root ─────────────────────────────────────────────────────────────────
  window.ComptoirApp = function ComptoirApp({ layout }) {
    const [screen, setScreen] = useState('start');
    const [lang, setLang] = useState('fr');
    const T = window.I18N[lang];
    const stepFromScreen = { start: 0, email: 1, json: 1, eml: 1, loading: 1, dashboard: 2, pdf: 2, demo: 2 }[screen] || 0;
    return (
      <div style={{ background: C.bg, color: C.ink, fontFamily: SANS, height: "100%", width: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <style>{`
          @keyframes comptoirRotate { to { transform: rotate(360deg); } }
          .comptoir-rotate { animation: comptoirRotate 0.9s linear infinite; }
        `}</style>
        <TopBar T={T} lang={lang} setLang={setLang} step={stepFromScreen}/>
        {screen === 'start'     && <Screen1 T={T} go={setScreen} lang={lang}/>}
        {screen === 'email'     && <ScreenEmail T={T} go={setScreen} lang={lang}/>}
        {screen === 'json'      && <ScreenUpload T={T} go={setScreen} lang={lang} mode="json"/>}
        {screen === 'eml'       && <ScreenUpload T={T} go={setScreen} lang={lang} mode="eml"/>}
        {screen === 'loading'   && <ScreenLoading T={T} go={setScreen} lang={lang}/>}
        {screen === 'demo'      && <Dashboard T={T} go={setScreen} lang={lang} layout={layout}/>}
        {screen === 'dashboard' && <Dashboard T={T} go={setScreen} lang={lang} layout={layout}/>}
        {screen === 'pdf'       && <ScreenPdf T={T} go={setScreen} lang={lang}/>}
      </div>
    );
  };
})();
