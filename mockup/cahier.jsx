// ────────────────────────────────────────────────────────────────────────────
// Cahier · Paper ledger / hand-kept notebook
// Cream paper, ruled lines, ink serif, terracotta stamps, monospace numbers.
// ────────────────────────────────────────────────────────────────────────────
(function () {
  const { useState } = React;

  const K = {
    paper:    "#F4EBD8",
    paperDk:  "#EADFC6",
    ink:      "#1B1610",
    inkSoft:  "#3D3326",
    muted:    "#7A6A55",
    rule:     "#C9B68A",
    softrule: "#DAC9A0",
    terra:    "#B14A2E",
    terraDk:  "#893821",
    moss:     "#5C6E3F",
    ochre:    "#C68A2C",
  };
  const SERIF = `'Newsreader', 'Source Serif Pro', Georgia, serif`;
  const HAND  = `'Caveat', 'Newsreader', cursive`;
  const MONO  = `'JetBrains Mono', 'Courier Prime', ui-monospace, monospace`;

  const ruled = {
    backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent 27px, ${K.softrule} 27px, ${K.softrule} 28px)`,
    backgroundPosition: "0 6px",
  };

  // ── atoms ────────────────────────────────────────────────────────────────
  const Btn = ({ children, onClick, kind = "primary", style = {} }) => {
    const styles = {
      primary: { background: K.ink, color: K.paper, border: "1.5px solid " + K.ink },
      ghost:   { background: "transparent", color: K.ink, border: "1.5px solid " + K.ink },
      terra:   { background: K.terra, color: K.paper, border: "1.5px solid " + K.terra },
    }[kind];
    return (
      <button onClick={onClick} style={{
        ...styles, padding: "10px 18px", borderRadius: 2,
        fontFamily: SERIF, fontWeight: 500, fontSize: 14, cursor: "pointer",
        letterSpacing: 0.2, ...style,
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
      <div style={{ display: "flex", flexDirection: "column", width: size, height: size * 0.66, overflow: "hidden", border: "1px solid " + K.ink }}>
        {colors.map((cc, i) => <div key={i} style={{ flex: 1, background: cc }}></div>)}
      </div>
    );
  };

  const Stamp = ({ children, color = K.terra, rotate = -6 }) => (
    <span style={{
      display: "inline-block", padding: "5px 10px", border: "1.5px solid " + color,
      color: color, fontFamily: MONO, fontWeight: 700, fontSize: 10, letterSpacing: 2,
      textTransform: "uppercase", transform: `rotate(${rotate}deg)`,
    }}>{children}</span>
  );

  // ── Top bar ──────────────────────────────────────────────────────────────
  function TopBar({ T, lang, setLang, step }) {
    return (
      <div style={{
        padding: "20px 44px 14px", display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid " + K.rule, background: K.paper,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            fontFamily: SERIF, fontStyle: "italic", fontSize: 30, color: K.ink, letterSpacing: -0.5,
          }}>Transfèr<span style={{ color: K.terra }}>·</span></div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: K.muted, letterSpacing: 1.5, textTransform: "uppercase", borderLeft: "1px solid " + K.rule, paddingLeft: 12 }}>
            Carnet · 2024
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {[T.step1, T.step2, T.step3].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: i === step ? K.terra : K.muted }}>{String(i + 1).padStart(2, '0')}</span>
              <span style={{ fontFamily: SERIF, fontSize: 14, fontStyle: i === step ? "italic" : "normal", color: i === step ? K.ink : K.muted, borderBottom: i === step ? "1.5px solid " + K.terra : "none", paddingBottom: 2 }}>{s}</span>
              {i < 2 && <span style={{ color: K.rule, marginLeft: 8 }}>·</span>}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 0, fontFamily: MONO }}>
          {['fr', 'en'].map((l, i) => (
            <button key={l} onClick={() => setLang(l)} style={{
              border: "none", padding: "6px 12px", cursor: "pointer",
              background: "transparent",
              color: lang === l ? K.ink : K.muted,
              borderBottom: lang === l ? "2px solid " + K.terra : "2px solid transparent",
              fontSize: 11, fontWeight: 700, letterSpacing: 1,
            }}>{l.toUpperCase()}</button>
          ))}
        </div>
      </div>
    );
  }

  // ── Screen 1 ──────────────────────────────────────────────────────────────
  function Screen1({ T, go, lang }) {
    return (
      <div style={{ padding: "40px 44px", flex: 1, display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 56, alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: K.terra, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>
              {lang === 'fr' ? 'Page un · ouverture du dossier' : 'Page one · opening the file'}
            </div>
            <h1 style={{
              fontFamily: SERIF, fontSize: 64, fontWeight: 400, color: K.ink, margin: 0,
              lineHeight: 1.02, letterSpacing: -1,
            }}>
              {lang === 'fr' ? (
                <>Le carnet de vos<br/><span style={{ fontStyle: "italic", color: K.terra }}>transferts</span>.</>
              ) : (
                <>The ledger of your<br/><span style={{ fontStyle: "italic", color: K.terra }}>remittances</span>.</>
              )}
            </h1>
            <p style={{ fontFamily: SERIF, fontSize: 17, color: K.inkSoft, marginTop: 20, lineHeight: 1.55, maxWidth: 500 }}>
              {lang === 'fr'
                ? 'Tenu à la main pendant des décennies, désormais reconstitué à partir de vos reçus. Sélectionnez une entrée pour commencer.'
                : 'Kept by hand for decades, now rebuilt from your receipts. Pick an entry to begin.'}
            </p>
          </div>

          <div style={{ background: K.paperDk, border: "1px solid " + K.rule, padding: 22, position: "relative", borderRadius: 2, ...ruled }}>
            <div style={{ position: "absolute", top: -10, right: -10 }}><Stamp rotate={8}>vu · 2024</Stamp></div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: K.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>{lang === 'fr' ? 'Rappel' : 'Reminder'}</div>
            <p style={{ fontFamily: SERIF, fontSize: 18, color: K.ink, margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
              {lang === 'fr'
                ? '« Les sommes envoyées à un proche à l\'étranger sont à déclarer en case 2042-K. Au-delà de 10 000 €, complétez aussi le formulaire 8UU. »'
                : '"Sums sent to relatives abroad must be declared in box 2042-K. Above €10,000, also fill 8UU."'}
            </p>
            <div style={{ fontFamily: MONO, fontSize: 10, color: K.muted, marginTop: 14, letterSpacing: 1 }}>
              — DGFiP · {lang === 'fr' ? 'guide pratique' : 'practical guide'}
            </div>
          </div>
        </div>

        {/* Entry rows */}
        <div style={{ background: K.paper, border: "1px solid " + K.rule, borderRadius: 2 }}>
          <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 1fr 1fr 90px", padding: "10px 22px", borderBottom: "1.5px solid " + K.ink, fontFamily: MONO, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: K.ink, fontWeight: 600 }}>
            <span>N°</span>
            <span>{lang === 'fr' ? 'Source' : 'Source'}</span>
            <span>{lang === 'fr' ? 'Nature' : 'Nature'}</span>
            <span>{lang === 'fr' ? 'Action requise' : 'Action required'}</span>
            <span style={{ textAlign: "right" }}>{lang === 'fr' ? 'Choisir' : 'Pick'}</span>
          </div>
          <Entry n="i" title={T.method_email}  nature={lang === 'fr' ? 'Lecture IMAP' : 'IMAP scan'}        action={lang === 'fr' ? 'Mot de passe d\'application' : 'App password'}       onClick={() => go('email')}/>
          <Entry n="ii" title={T.method_json}   nature={lang === 'fr' ? 'Fichier JSON' : 'JSON file'}       action={lang === 'fr' ? 'Téléverser le fichier' : 'Upload the file'}       onClick={() => go('json')}/>
          <Entry n="iii" title={T.method_eml}    nature={lang === 'fr' ? 'Reçus .eml' : '.eml receipts'}    action={lang === 'fr' ? 'Glisser-déposer' : 'Drag and drop'}            onClick={() => go('eml')}  last/>
        </div>

        <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px dashed " + K.rule, fontFamily: MONO, fontSize: 10, color: K.muted, letterSpacing: 1.2 }}>
          <span>{lang === 'fr' ? 'WORLDREMIT · WISE · WESTERN UNION · REMITLY · MONEYGRAM' : 'WORLDREMIT · WISE · WESTERN UNION · REMITLY · MONEYGRAM'}</span>
          <button onClick={() => go('demo')} style={{ background: "none", border: "none", color: K.terra, fontFamily: SERIF, fontStyle: "italic", fontSize: 14, cursor: "pointer", padding: 0 }}>
            {lang === 'fr' ? 'Voir un carnet déjà rempli' : 'See a completed ledger'} →
          </button>
        </div>
      </div>
    );
  }

  function Entry({ n, title, nature, action, onClick, last }) {
    return (
      <button onClick={onClick} style={{
        display: "grid", gridTemplateColumns: "70px 1fr 1fr 1fr 90px", padding: "18px 22px",
        background: "transparent", border: "none", borderBottom: last ? "none" : "1px dashed " + K.rule,
        cursor: "pointer", textAlign: "left", alignItems: "center", width: "100%",
        transition: "background .15s",
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = K.paperDk}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
      >
        <span style={{ fontFamily: SERIF, fontSize: 22, fontStyle: "italic", color: K.terra }}>{n}.</span>
        <span style={{ fontFamily: SERIF, fontSize: 19, color: K.ink, letterSpacing: -0.2 }}>{title}</span>
        <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 15, color: K.inkSoft }}>{nature}</span>
        <span style={{ fontFamily: SERIF, fontSize: 14, color: K.muted }}>{action}</span>
        <span style={{ textAlign: "right", fontFamily: HAND, fontSize: 24, color: K.terra }}>↝</span>
      </button>
    );
  }

  // ── email screen ──────────────────────────────────────────────────────────
  function ScreenEmail({ T, go, lang }) {
    return (
      <div style={{ padding: "32px 44px", flex: 1, display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 48 }}>
        <div>
          <button onClick={() => go('start')} style={back}>← {T.cta_back}</button>
          <h2 style={{ fontFamily: SERIF, fontSize: 42, fontWeight: 400, color: K.ink, margin: "10px 0 0", letterSpacing: -0.5, lineHeight: 1.1 }}>
            <span style={{ fontStyle: "italic", color: K.terra }}>i. </span>{lang === 'fr' ? 'Connecter votre messagerie' : 'Connect your inbox'}
          </h2>
          <p style={{ fontFamily: SERIF, fontSize: 15, color: K.inkSoft, marginTop: 10, lineHeight: 1.55, maxWidth: 460 }}>
            {lang === 'fr'
              ? 'Nous parcourons votre boîte à la recherche de reçus de transfert. Vos identifiants restent sur cet appareil.'
              : 'We scan your inbox for transfer receipts. Your credentials never leave this device.'}
          </p>

          <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 22 }}>
            <FF label={T.email_label} val="marie.therese@outlook.fr"/>
            <FF label={T.pw_label} val="" placeholder="xxxx · xxxx · xxxx · xxxx" type="password" hint={T.pw_hint}/>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
              <FF label={T.recipient_label} val="Patrick Kayombya"/>
              <FF label={T.year_label} val="2024"/>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <Btn kind="terra" onClick={() => go('loading')}>{T.cta_connect} →</Btn>
              <Btn kind="ghost" onClick={() => go('start')}>{T.cta_back}</Btn>
            </div>
          </div>
        </div>

        <div style={{ background: K.paperDk, border: "1px solid " + K.rule, padding: 24, ...ruled, position: "relative" }}>
          <div style={{ fontFamily: HAND, fontSize: 32, color: K.terra, transform: "rotate(-2deg)", position: "absolute", top: 18, right: 24 }}>important !</div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: K.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>{lang === 'fr' ? 'Notice' : 'Note'}</div>
          <h3 style={{ fontFamily: SERIF, fontSize: 22, color: K.ink, fontStyle: "italic", margin: 0, letterSpacing: -0.2 }}>
            {lang === 'fr' ? 'Mots de passe d\'application' : 'App passwords'}
          </h3>
          <p style={{ fontFamily: SERIF, fontSize: 14, color: K.inkSoft, lineHeight: 1.7, marginTop: 12 }}>
            {lang === 'fr'
              ? 'Activez la double authentification, puis générez un mot de passe d\'application à 16 caractères. C\'est lui — et lui seul — que nous utiliserons.'
              : 'Enable two-factor auth, then generate a 16-character app password. That — and only that — is what we\'ll use.'}
          </p>
          <div style={{ fontFamily: MONO, fontSize: 11, color: K.ink, lineHeight: 1.9, marginTop: 18, paddingTop: 14, borderTop: "1px dashed " + K.rule }}>
            <div><span style={{ color: K.terra }}>›</span> imap.outlook.com:993</div>
            <div><span style={{ color: K.terra }}>›</span> imap.gmail.com:993</div>
            <div><span style={{ color: K.terra }}>›</span> imap.free.fr:993</div>
          </div>
        </div>
      </div>
    );
  }

  function ScreenUpload({ T, go, lang, mode }) {
    return (
      <div style={{ padding: "32px 44px", flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
        <button onClick={() => go('start')} style={back}>← {T.cta_back}</button>
        <h2 style={{ fontFamily: SERIF, fontSize: 42, fontWeight: 400, color: K.ink, margin: "10px 0 0", letterSpacing: -0.5 }}>
          <span style={{ fontStyle: "italic", color: K.terra }}>{mode === 'json' ? 'ii. ' : 'iii. '}</span>
          {mode === 'json' ? T.method_json : T.method_eml}
        </h2>
        <div style={{
          flex: 1, minHeight: 320, border: "2px dashed " + K.terra, background: K.paperDk,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16,
          ...ruled,
        }}>
          <div style={{ fontFamily: HAND, fontSize: 60, color: K.terra, transform: "rotate(-3deg)" }}>×</div>
          <div style={{ fontFamily: SERIF, fontSize: 28, color: K.ink, fontStyle: "italic" }}>{T.drag_drop}</div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: K.muted, letterSpacing: 1 }}>{mode === 'json' ? '.json' : '.eml'}  ·  {T.or_browse}</div>
          <Btn kind="terra" style={{ marginTop: 16 }} onClick={() => go('loading')}>{lang === 'fr' ? 'Utiliser l\'exemple' : 'Use sample'} →</Btn>
        </div>
      </div>
    );
  }

  function ScreenLoading({ T, go }) {
    React.useEffect(() => { const t = setTimeout(() => go('dashboard'), 1300); return () => clearTimeout(t); }, []);
    return (
      <div style={{ padding: 48, flex: 1, display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div className="cahier-wave" style={{ display: "flex", gap: 6, marginBottom: 22, justifyContent: "center" }}>
            <span></span><span></span><span></span><span></span><span></span>
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 28, color: K.ink, fontStyle: "italic" }}>{T.scanning}</div>
        </div>
      </div>
    );
  }

  // ── Dashboard ────────────────────────────────────────────────────────────
  function Dashboard({ T, go, lang, layout }) {
    const s = window.summarize(window.TRANSACTIONS);
    return (
      <div style={{ padding: "28px 44px", flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Page header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: 12, borderBottom: "2px solid " + K.ink }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: K.terra, letterSpacing: 2, textTransform: "uppercase" }}>
              {lang === 'fr' ? 'Récapitulatif annuel' : 'Annual ledger'}
            </div>
            <h2 style={{ fontFamily: SERIF, fontSize: 44, fontWeight: 400, margin: "6px 0 0", color: K.ink, letterSpacing: -0.6, lineHeight: 1 }}>
              <span style={{ fontStyle: "italic" }}>{lang === 'fr' ? 'Année' : 'Year'}</span> <span style={{ color: K.terra }}>2024</span>
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: K.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>{T.total_eur}</div>
              <div style={{ fontFamily: SERIF, fontSize: 38, color: K.ink, letterSpacing: -0.6 }}>{window.formatEUR(s.totalEur)}</div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: K.muted }}>{s.count} {T.transfers} · {Object.keys(s.byCountry).length} {T.countries}</div>
            </div>
            <Btn kind="terra" onClick={() => go('pdf')}>{T.cta_export} →</Btn>
          </div>
        </div>

        {layout === 'cards'  && <CahierCards  s={s} T={T}/>}
        {layout === 'table'  && <CahierTable  s={s} T={T}/>}
        {layout === 'charts' && <CahierCharts s={s} T={T} lang={lang}/>}
      </div>
    );
  }

  function CahierCards({ s, T }) {
    const countries = Object.entries(s.byCountry).sort((a, b) => b[1] - a[1]);
    const recipients = Object.entries(s.byRecipient).sort((a, b) => b[1] - a[1]);
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, flex: 1, minHeight: 0 }}>
        <div>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 22, color: K.ink, marginBottom: 12 }}>{T.by_country}</div>
          <div style={{ background: K.paper, ...ruled, padding: "6px 14px", border: "1px solid " + K.rule }}>
            {countries.map(([c, v], i) => (
              <div key={c} style={{ display: "grid", gridTemplateColumns: "30px 36px 1fr auto 60px", gap: 12, alignItems: "center", height: 56, borderBottom: i === countries.length - 1 ? "none" : "1px dashed " + K.softrule }}>
                <span style={{ fontFamily: SERIF, fontStyle: "italic", color: K.terra, fontSize: 18 }}>{['i', 'ii', 'iii', 'iv'][i]}.</span>
                <Flag code={window.COUNTRY_CODE[c]}/>
                <span style={{ fontFamily: SERIF, fontSize: 19, color: K.ink, letterSpacing: -0.2 }}>{c}</span>
                <span style={{ fontFamily: MONO, fontSize: 16, color: K.ink, fontWeight: 500 }}>{window.formatEUR(v)}</span>
                <span style={{ fontFamily: MONO, fontSize: 11, color: K.muted, textAlign: "right" }}>{Math.round(v / s.totalEur * 100)} %</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 22, color: K.ink, marginBottom: 12 }}>{T.by_recipient}</div>
          <div style={{ background: K.paper, ...ruled, padding: "6px 14px", border: "1px solid " + K.rule }}>
            {recipients.map(([r, v], i) => (
              <div key={r} style={{ display: "grid", gridTemplateColumns: "30px 1fr auto", gap: 14, alignItems: "center", height: 56, borderBottom: i === recipients.length - 1 ? "none" : "1px dashed " + K.softrule }}>
                <span style={{ fontFamily: HAND, fontSize: 26, color: K.terra }}>{i + 1}</span>
                <span style={{ fontFamily: SERIF, fontSize: 18, color: K.ink, letterSpacing: -0.2, fontStyle: i % 2 ? "italic" : "normal" }}>{r}</span>
                <span style={{ fontFamily: MONO, fontSize: 15, color: K.ink, fontWeight: 500 }}>{window.formatEUR(v)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function CahierTable({ s, T }) {
    const txns = window.TRANSACTIONS;
    return (
      <div style={{ flex: 1, background: K.paper, border: "1px solid " + K.rule, padding: "12px 20px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid " + K.ink }}>
              {[T.col_date, T.col_recipient, T.col_country, T.col_amount, T.col_eur, T.col_txn].map((h, i) => (
                <th key={i} style={{ textAlign: i >= 3 ? "right" : "left", padding: "10px 8px", fontFamily: MONO, fontSize: 10, color: K.ink, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {txns.slice(0, 13).map((t) => (
              <tr key={t.transaction_number} style={{ borderBottom: "1px dashed " + K.softrule }}>
                <td style={ktd}>{t.date}</td>
                <td style={{ ...ktd, fontFamily: SERIF, fontSize: 16, fontStyle: 'italic' }}>{t.recipient_name}</td>
                <td style={ktd}><span style={{ display: 'inline-flex', alignItems: "center", gap: 8 }}><Flag code={window.COUNTRY_CODE[t.country]} size={16}/>{t.country}</span></td>
                <td style={{ ...ktd, textAlign: "right", fontFamily: MONO }}>{window.formatAmount(t.amount, t.currency)}</td>
                <td style={{ ...ktd, textAlign: "right", fontFamily: MONO, fontWeight: 600, color: K.terra }}>{window.formatEURp(parseFloat(t.amount_eur))}</td>
                <td style={{ ...ktd, textAlign: "right", fontFamily: MONO, fontSize: 11, color: K.muted }}>{t.transaction_number}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function CahierCharts({ s, T, lang }) {
    const months = [...Array(12).keys()].map((i) => "2024-" + String(i + 1).padStart(2, '0'));
    const maxM = Math.max(...months.map((m) => s.byMonth[m] || 0));
    const countries = Object.entries(s.byCountry).sort((a, b) => b[1] - a[1]);
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24, flex: 1, minHeight: 0 }}>
        <div>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 22, color: K.ink, marginBottom: 8 }}>{T.by_month}</div>
          <div style={{ background: K.paper, border: "1px solid " + K.rule, padding: 18, height: 280 }}>
            <svg viewBox="0 0 600 220" width="100%" height="100%" preserveAspectRatio="none">
              <line x1="20" x2="580" y1="200" y2="200" stroke={K.ink} strokeWidth="1.5"/>
              {[0, 1, 2, 3].map((i) => (
                <line key={i} x1="20" x2="580" y1={20 + i * 45} y2={20 + i * 45} stroke={K.softrule} strokeWidth="0.6"/>
              ))}
              {months.map((m, i) => {
                const v = s.byMonth[m] || 0;
                const x = 30 + (i * 540) / 11;
                const h = maxM ? (v / maxM) * 170 : 0;
                return (
                  <g key={m}>
                    <line x1={x} x2={x} y1={200} y2={200 - h} stroke={K.terra} strokeWidth="2"/>
                    {v > 0 && <circle cx={x} cy={200 - h} r="3.5" fill={K.terra}/>}
                    <text x={x} y="215" textAnchor="middle" fontFamily={MONO} fontSize="9" fill={K.muted}>{String(i + 1).padStart(2, '0')}</text>
                  </g>
                );
              })}
              {/* connecting line */}
              <path d={months.map((m, i) => {
                const v = s.byMonth[m] || 0;
                const x = 30 + (i * 540) / 11;
                const h = maxM ? (v / maxM) * 170 : 0;
                return (i === 0 ? "M " : "L ") + x + " " + (200 - h);
              }).join(" ")} fill="none" stroke={K.terra} strokeWidth="1" strokeDasharray="3 3" opacity="0.5"/>
            </svg>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 22, color: K.ink, marginBottom: 8 }}>{T.by_country}</div>
          <div style={{ background: K.paper, border: "1px solid " + K.rule, padding: 18, height: 280 }}>
            <PieK data={countries} total={s.totalEur}/>
          </div>
        </div>
      </div>
    );
  }

  function PieK({ data, total }) {
    const colors = [K.terra, K.ochre, K.moss, K.terraDk];
    const cx = 80, cy = 80, R = 72;
    let acc = 0;
    const slices = data.map(([c, v], i) => {
      const start = acc / total * Math.PI * 2 - Math.PI / 2;
      acc += v;
      const end = acc / total * Math.PI * 2 - Math.PI / 2;
      const large = (end - start) > Math.PI ? 1 : 0;
      const x1 = cx + R * Math.cos(start), y1 = cy + R * Math.sin(start);
      const x2 = cx + R * Math.cos(end),   y2 = cy + R * Math.sin(end);
      return <path key={c} d={`M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`} fill={colors[i % colors.length]} stroke={K.ink} strokeWidth="1"/>;
    });
    return (
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <svg width="160" height="160" viewBox="0 0 160 160">{slices}</svg>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
          {data.map(([c, v], i) => (
            <div key={c}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: SERIF, fontSize: 14 }}>
                <span style={{ width: 11, height: 11, background: colors[i % colors.length], border: "1px solid " + K.ink }}></span>
                <span style={{ flex: 1, color: K.ink, fontStyle: "italic" }}>{c}</span>
                <span style={{ fontFamily: MONO, color: K.ink, fontSize: 12 }}>{window.formatEUR(v)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function ScreenPdf({ T, go, lang }) {
    const s = window.summarize(window.TRANSACTIONS);
    return (
      <div style={{ padding: "28px 44px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => go('dashboard')} style={back}>← {T.cta_back}</button>
          <Stamp color={K.moss} rotate={5}>✓ {T.pdf_ready}</Stamp>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 22, flex: 1, minHeight: 0 }}>
          <div style={{ background: "#FFFCF5", border: "1px solid " + K.rule, padding: 32, ...ruled, boxShadow: "0 10px 30px -12px rgba(40,25,10,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid " + K.ink, paddingBottom: 8 }}>
              <div>
                <div style={{ fontFamily: MONO, fontSize: 9, color: K.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>{lang === 'fr' ? 'Récapitulatif' : 'Summary'} · 2024</div>
                <div style={{ fontFamily: SERIF, fontSize: 26, color: K.ink, fontStyle: "italic", letterSpacing: -0.2 }}>{lang === 'fr' ? 'Transferts internationaux' : 'International transfers'}</div>
              </div>
              <div style={{ fontFamily: HAND, fontSize: 28, color: K.terra, transform: "rotate(-4deg)" }}>2024</div>
            </div>
            <div style={{ marginTop: 12, fontFamily: SERIF, fontSize: 14 }}>
              <KRow k={lang === 'fr' ? 'Période' : 'Period'}    v="01.01.2024 → 31.12.2024"/>
              <KRow k={T.transfers}    v={s.count}/>
              <KRow k={T.recipients}   v={Object.keys(s.byRecipient).length}/>
              <KRow k={T.total_eur}    v={window.formatEURp(s.totalEur)} strong/>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 9, color: K.muted, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 18 }}>{lang === 'fr' ? 'Détail par pays' : 'By country'}</div>
            <table style={{ width: "100%", marginTop: 4 }}>
              {Object.entries(s.byCountry).map(([c, v], i) => (
                <tr key={c} style={{ borderBottom: "1px dashed " + K.softrule }}>
                  <td style={{ padding: "6px 0", fontFamily: SERIF, fontStyle: "italic", color: K.ink, fontSize: 15 }}>{['i', 'ii', 'iii', 'iv'][i]}. {c}</td>
                  <td style={{ padding: "6px 0", textAlign: "right", fontFamily: MONO, color: K.ink }}>{window.formatEURp(v)}</td>
                </tr>
              ))}
            </table>
            <div style={{ marginTop: 18, fontFamily: SERIF, fontStyle: "italic", fontSize: 12, color: K.muted, borderTop: "1px dashed " + K.rule, paddingTop: 8 }}>{T.disclaimer}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: K.paper, border: "1px solid " + K.rule, padding: 22 }}>
              <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 20, color: K.ink }}>{lang === 'fr' ? 'Téléchargements' : 'Downloads'}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
                <DL ext="PDF" name="rapport-2024.pdf"   size="218 KB"/>
                <DL ext="CSV" name="transferts.csv"     size="14 KB"/>
                <DL ext="JSON" name="transferts.json"   size="22 KB"/>
              </div>
            </div>
            <div style={{ background: K.paperDk, border: "1px solid " + K.rule, padding: 22, position: "relative" }}>
              <div style={{ fontFamily: HAND, fontSize: 28, color: K.terra, position: "absolute", top: 8, right: 16, transform: "rotate(2deg)" }}>note bene</div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: K.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>{lang === 'fr' ? 'Pour votre déclaration' : 'For your filing'}</div>
              <p style={{ fontFamily: SERIF, fontSize: 14, color: K.inkSoft, lineHeight: 1.65 }}>
                {lang === 'fr'
                  ? 'Reportez le total ci-contre en case 2042-K. Si vous avez envoyé plus de 10 000 € sur l\'année, complétez aussi le formulaire 8UU.'
                  : 'Report the total in box 2042-K. If you sent more than €10,000 over the year, also fill form 8UU.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function DL({ ext, name, size }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: K.paper, border: "1px solid " + K.rule }}>
        <div style={{ width: 34, height: 42, background: "#FFFCF5", border: "1.5px solid " + K.ink, display: "grid", placeItems: "center", fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.ink }}>{ext}</div>
        <div style={{ flex: 1, fontFamily: SERIF, fontSize: 14, fontStyle: "italic", color: K.ink }}>{name}</div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: K.muted }}>{size}</div>
        <button style={{ background: K.ink, color: K.paper, border: "none", padding: "5px 10px", fontFamily: MONO, fontSize: 10, cursor: "pointer", letterSpacing: 1, fontWeight: 700 }}>↓</button>
      </div>
    );
  }

  // ── shared ───────────────────────────────────────────────────────────────
  const back = { background: "none", border: "none", color: K.muted, fontFamily: SERIF, fontStyle: "italic", fontSize: 14, cursor: "pointer", padding: 0, alignSelf: "flex-start" };
  const ktd = { padding: "12px 8px", fontFamily: SERIF, fontSize: 14, color: K.ink, verticalAlign: "middle" };

  const FF = ({ label, val, type = "text", placeholder, hint }) => {
    const [v, setV] = useState(val);
    return (
      <label style={{ display: "block" }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: K.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
        <input value={v} type={type} placeholder={placeholder} onChange={(e) => setV(e.target.value)} style={{
          width: "100%", padding: "10px 0", border: "none", borderBottom: "1.5px solid " + K.ink,
          background: "transparent", fontFamily: SERIF, fontSize: 18, color: K.ink, outline: "none", fontStyle: "italic",
        }}/>
        {hint && <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 12, color: K.muted, marginTop: 4 }}>{hint}</div>}
      </label>
    );
  };

  const KRow = ({ k, v, strong }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px dashed " + K.softrule, alignItems: "baseline" }}>
      <span style={{ fontFamily: SERIF, fontStyle: "italic", color: K.muted }}>{k}</span>
      <span style={{ fontFamily: MONO, color: K.ink, fontWeight: strong ? 700 : 400, fontSize: strong ? 18 : 14 }}>{v}</span>
    </div>
  );

  // ── root ─────────────────────────────────────────────────────────────────
  window.CahierApp = function CahierApp({ layout }) {
    const [screen, setScreen] = useState('start');
    const [lang, setLang] = useState('fr');
    const T = window.I18N[lang];
    const step = { start: 0, email: 1, json: 1, eml: 1, loading: 1, dashboard: 2, pdf: 2, demo: 2 }[screen] || 0;
    return (
      <div style={{ background: K.paper, color: K.ink, fontFamily: SERIF, height: "100%", width: "100%", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        <style>{`
          @keyframes cahierWave { 0%,80%,100% { transform: scaleY(0.4); opacity: 0.4 } 40% { transform: scaleY(1); opacity: 1 } }
          .cahier-wave span { display: inline-block; width: 4px; height: 28px; background: ${K.terra}; animation: cahierWave 1.2s ease-in-out infinite; }
          .cahier-wave span:nth-child(2) { animation-delay: 0.1s }
          .cahier-wave span:nth-child(3) { animation-delay: 0.2s }
          .cahier-wave span:nth-child(4) { animation-delay: 0.3s }
          .cahier-wave span:nth-child(5) { animation-delay: 0.4s }
        `}</style>
        <TopBar T={T} lang={lang} setLang={setLang} step={step}/>
        {screen === 'start'     && <Screen1 T={T} go={setScreen} lang={lang}/>}
        {screen === 'email'     && <ScreenEmail T={T} go={setScreen} lang={lang}/>}
        {screen === 'json'      && <ScreenUpload T={T} go={setScreen} lang={lang} mode="json"/>}
        {screen === 'eml'       && <ScreenUpload T={T} go={setScreen} lang={lang} mode="eml"/>}
        {screen === 'loading'   && <ScreenLoading T={T} go={setScreen}/>}
        {screen === 'demo'      && <Dashboard T={T} go={setScreen} lang={lang} layout={layout}/>}
        {screen === 'dashboard' && <Dashboard T={T} go={setScreen} lang={lang} layout={layout}/>}
        {screen === 'pdf'       && <ScreenPdf T={T} go={setScreen} lang={lang}/>}
      </div>
    );
  };
})();
