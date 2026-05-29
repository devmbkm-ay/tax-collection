// ────────────────────────────────────────────────────────────────────────────
// Foyer · Soft modern fintech
// Peach + cream + sage. Rounded shapes. Friendly geometric sans.
// ────────────────────────────────────────────────────────────────────────────
(function () {
  const { useState, useMemo } = React;

  // ── tokens ─────────────────────────────────────────────────────────────────
  const F = {
    bg:        "#FBF4EC",
    card:      "#FFFFFF",
    cream:     "#F5E9DA",
    peach:     "#F8B79B",
    peachDeep: "#E8896A",
    coral:     "#D55F4B",
    sage:      "#A8B89A",
    sageDeep:  "#5F7A5F",
    ink:       "#2A2520",
    muted:     "#7B6F62",
    line:      "#EADDC8",
    sun:       "#E8B958",
  };

  const FONT = `'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif`;
  const NUM  = `'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif`;

  // ── tiny atoms ────────────────────────────────────────────────────────────
  const Pill = ({ children, color = F.peach, fg = F.ink, style = {} }) => (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px",
      borderRadius: 999, background: color, color: fg, fontSize: 12, fontWeight: 600,
      letterSpacing: 0.1, ...style,
    }}>{children}</span>
  );

  const Btn = ({ children, onClick, kind = "primary", style = {}, disabled }) => {
    const styles = {
      primary: { background: F.coral,    color: "#FFF8F2", border: "1.5px solid " + F.coral },
      ghost:   { background: "transparent", color: F.ink,   border: "1.5px solid " + F.line  },
      soft:    { background: F.cream,    color: F.ink,     border: "1.5px solid " + F.line  },
    }[kind];
    return (
      <button onClick={onClick} disabled={disabled} style={{
        ...styles, padding: "12px 20px", borderRadius: 14, fontFamily: FONT,
        fontWeight: 600, fontSize: 14, cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1, transition: "transform .1s", ...style,
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
      <div style={{ display: "flex", flexDirection: "column", width: size, height: size * 0.66, borderRadius: 4, overflow: "hidden", border: "1px solid " + F.line }}>
        {colors.map((c, i) => <div key={i} style={{ flex: 1, background: c }}></div>)}
      </div>
    );
  };

  // ── source picker card ────────────────────────────────────────────────────
  const SourceCard = ({ icon, title, desc, onClick, accent }) => (
    <button onClick={onClick} style={{
      position: "relative", textAlign: "left", padding: "26px 24px 22px", borderRadius: 22,
      border: "1.5px solid " + F.line, background: F.card, cursor: "pointer",
      fontFamily: FONT, display: "flex", flexDirection: "column", gap: 14,
      transition: "transform .15s, border-color .15s",
    }}
    onMouseEnter={(e) => { e.currentTarget.style.borderColor = F.peachDeep; e.currentTarget.style.transform = "translateY(-2px)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.borderColor = F.line; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: 16, background: accent,
        display: "grid", placeItems: "center", color: "#fff", fontSize: 24,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 17, fontWeight: 700, color: F.ink, marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 13, color: F.muted, lineHeight: 1.55 }}>{desc}</div>
      </div>
      <div style={{ marginTop: "auto", fontSize: 12, fontWeight: 600, color: F.coral }}>
        Choisir cette source →
      </div>
    </button>
  );

  // ── screens ───────────────────────────────────────────────────────────────
  function Screen1({ T, go, lang, setLang }) {
    return (
      <div style={{ padding: "44px 56px 56px", display: "flex", flexDirection: "column", gap: 32, height: "100%" }}>
        <TopBar T={T} step={0} lang={lang} setLang={setLang} />
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40 }}>
          <div>
            <div style={{ display: "inline-flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: F.sage }}></span>
              <span style={{ fontSize: 12, fontWeight: 700, color: F.sageDeep, letterSpacing: 1.2, textTransform: "uppercase" }}>
                Déclaration {lang === 'fr' ? 'fiscale' : 'tax season'} 2024
              </span>
            </div>
            <h1 style={{ fontSize: 44, fontWeight: 700, lineHeight: 1.1, color: F.ink, margin: 0, maxWidth: 560, letterSpacing: -0.5 }}>
              {T.import_title}<span style={{ color: F.coral }}>.</span>
            </h1>
            <p style={{ fontSize: 16, color: F.muted, marginTop: 12, maxWidth: 480, lineHeight: 1.5 }}>{T.import_sub}</p>
          </div>
          <div style={{
            background: F.cream, borderRadius: 18, padding: "16px 20px", display: "flex",
            alignItems: "center", gap: 14, border: "1.5px solid " + F.line,
          }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: F.sage, display: "grid", placeItems: "center", color: "#fff" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 2L4 7v5c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V7l-8-5z"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: F.ink }}>100% local</div>
              <div style={{ fontSize: 11, color: F.muted }}>Aucune donnée n'est envoyée à un serveur.</div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginTop: 6 }}>
          <SourceCard accent={F.peachDeep} icon={"@"} title={T.method_email}   desc={T.method_email_d}   onClick={() => go('email')} />
          <SourceCard accent={F.sage}      icon={"{ }"} title={T.method_json}  desc={T.method_json_d}    onClick={() => go('json')} />
          <SourceCard accent={F.sun}       icon={"✉"} title={T.method_eml}    desc={T.method_eml_d}     onClick={() => go('eml')} />
        </div>

        <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 24, borderTop: "1px solid " + F.line }}>
          <div style={{ display: "flex", gap: 18, color: F.muted, fontSize: 12 }}>
            <span>✓ WorldRemit</span>
            <span>✓ Wise</span>
            <span>✓ Western Union</span>
            <span style={{ color: F.peachDeep }}>+ 4 autres</span>
          </div>
          <button onClick={() => go('demo')} style={{ background: "none", border: "none", color: F.coral, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {lang === 'fr' ? 'Voir un exemple →' : 'See an example →'}
          </button>
        </div>
      </div>
    );
  }

  function Screen2Email({ T, go, lang, setLang }) {
    const [email, setEmail] = useState("marie.therese@outlook.fr");
    const [pw, setPw] = useState("");
    const [year, setYear] = useState("2024");
    const [name, setName] = useState("Patrick Kayombya");
    return (
      <div style={{ padding: "44px 56px 56px", display: "flex", flexDirection: "column", gap: 28, height: "100%" }}>
        <TopBar T={T} step={1} lang={lang} setLang={setLang} />
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 40, alignItems: "flex-start" }}>
          <div>
            <button onClick={() => go('start')} style={{ background: "none", border: "none", color: F.muted, fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 16 }}>← {T.cta_back}</button>
            <h2 style={{ fontSize: 30, fontWeight: 700, color: F.ink, margin: 0, letterSpacing: -0.3 }}>
              {lang === 'fr' ? 'Connectez votre boîte mail' : 'Connect your inbox'}
            </h2>
            <p style={{ fontSize: 14, color: F.muted, marginTop: 8, lineHeight: 1.55, maxWidth: 380 }}>
              {lang === 'fr'
                ? 'Nous lisons uniquement les e-mails de vos services de transfert. Vos identifiants restent sur cet appareil.'
                : 'We only read messages from transfer providers. Your credentials never leave this device.'}
            </p>

            <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 16 }}>
              <Field label={T.email_label}>
                <input value={email} onChange={(e) => setEmail(e.target.value)} style={inp}/>
              </Field>
              <Field label={T.pw_label} hint={T.pw_hint}>
                <input value={pw} onChange={(e) => setPw(e.target.value)} type="password" placeholder="xxxx xxxx xxxx xxxx" style={inp}/>
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label={T.recipient_label}><input value={name} onChange={(e) => setName(e.target.value)} style={inp}/></Field>
                <Field label={T.year_label}><input value={year} onChange={(e) => setYear(e.target.value)} style={inp}/></Field>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <Btn onClick={() => go('loading')}>{T.cta_connect} →</Btn>
                <Btn kind="ghost" onClick={() => go('start')}>{T.cta_back}</Btn>
              </div>
            </div>
          </div>
          <div style={{
            background: "linear-gradient(135deg, #FFE6D6 0%, #F5E9DA 100%)", borderRadius: 22, padding: 28,
            border: "1.5px solid " + F.line, position: "relative", overflow: "hidden",
          }}>
            <Pill color={F.sage} fg="#fff">✓ {lang === 'fr' ? 'Sécurisé' : 'Secure'}</Pill>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: F.ink, marginTop: 16, marginBottom: 14 }}>
              {lang === 'fr' ? 'Comment ça marche' : 'How it works'}
            </h3>
            <Step n={1} t={lang === 'fr' ? 'Activez les mots de passe d\'application' : 'Enable app passwords'} d={lang === 'fr' ? 'Dans les paramètres de sécurité de votre messagerie.' : 'In your mail provider\'s security settings.'}/>
            <Step n={2} t={lang === 'fr' ? 'Collez le mot de passe à 16 caractères' : 'Paste the 16-character app password'} d={lang === 'fr' ? 'Pas votre mot de passe habituel.' : 'Not your regular password.'}/>
            <Step n={3} t={lang === 'fr' ? 'On lit vos reçus en IMAP' : 'We read receipts over IMAP'} d={lang === 'fr' ? 'Quelques secondes. Rien n\'est stocké en ligne.' : 'A few seconds. Nothing is stored online.'}/>
            <div style={{ position: "absolute", right: -40, bottom: -40, width: 180, height: 180, borderRadius: "50%", background: F.peach, opacity: 0.35 }}></div>
          </div>
        </div>
      </div>
    );
  }

  function Screen2Upload({ T, go, lang, setLang, mode }) {
    return (
      <div style={{ padding: "44px 56px 56px", display: "flex", flexDirection: "column", gap: 28, height: "100%" }}>
        <TopBar T={T} step={1} lang={lang} setLang={setLang} />
        <button onClick={() => go('start')} style={{ background: "none", border: "none", color: F.muted, fontSize: 13, cursor: "pointer", padding: 0, marginBottom: -8, alignSelf: "flex-start" }}>← {T.cta_back}</button>
        <h2 style={{ fontSize: 30, fontWeight: 700, color: F.ink, margin: 0, letterSpacing: -0.3 }}>
          {mode === 'json' ? T.method_json : T.method_eml}
        </h2>
        <div style={{
          flex: 1, border: "2.5px dashed " + F.peach, borderRadius: 24, background: F.cream,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14,
          minHeight: 320,
        }}>
          <div style={{ width: 80, height: 80, borderRadius: 28, background: F.card, display: "grid", placeItems: "center", border: "1.5px solid " + F.line }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={F.coral} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: F.ink }}>{T.drag_drop}</div>
          <div style={{ fontSize: 13, color: F.muted }}>{T.or_browse}</div>
          <div style={{ marginTop: 8, fontSize: 11, color: F.muted, letterSpacing: 0.5 }}>
            {mode === 'json' ? '.json — extracteur WorldRemit' : '.eml — n\'importe quelle messagerie'}
          </div>
          <Btn style={{ marginTop: 12 }} onClick={() => go('loading')}>
            {lang === 'fr' ? 'Utiliser l\'exemple' : 'Use sample'} →
          </Btn>
        </div>
      </div>
    );
  }

  function Loading({ T, go, lang, setLang }) {
    React.useEffect(() => { const t = setTimeout(() => go('dashboard'), 1400); return () => clearTimeout(t); }, []);
    return (
      <div style={{ padding: "44px 56px 56px", display: "flex", flexDirection: "column", gap: 28, height: "100%" }}>
        <TopBar T={T} step={1} lang={lang} setLang={setLang} />
        <div style={{ flex: 1, display: "grid", placeItems: "center" }}>
          <div style={{ textAlign: "center", maxWidth: 420 }}>
            <div style={{ position: "relative", width: 96, height: 96, margin: "0 auto 24px" }}>
              <div className="foyer-pulse" style={{ position: "absolute", inset: 0, borderRadius: "50%", background: F.peach, opacity: 0.4 }}></div>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: F.coral, display: "grid", placeItems: "center", color: "#fff", fontSize: 32 }}>✦</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: F.ink, marginBottom: 6 }}>{T.scanning}</div>
            <div style={{ fontSize: 13, color: F.muted }}>
              {lang === 'fr' ? 'Recherche des reçus WorldRemit, Wise, Western Union…' : 'Searching WorldRemit, Wise, Western Union receipts…'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function Dashboard({ T, go, lang, setLang, layout }) {
    const txns = window.TRANSACTIONS;
    const s = window.summarize(txns);
    const countries = Object.entries(s.byCountry).sort((a, b) => b[1] - a[1]);
    const months = [...Array(12).keys()].map((i) => "2024-" + String(i + 1).padStart(2, '0'));
    const maxM = Math.max(...months.map((m) => s.byMonth[m] || 0));
    const recipients = Object.entries(s.byRecipient).sort((a, b) => b[1] - a[1]);

    return (
      <div style={{ padding: "32px 48px 32px", display: "flex", flexDirection: "column", gap: 20, height: "100%" }}>
        <TopBar T={T} step={2} lang={lang} setLang={setLang} />

        {/* Hero block */}
        <div style={{
          background: "linear-gradient(120deg, " + F.peach + " 0%, " + F.cream + " 70%)",
          borderRadius: 24, padding: "26px 30px", display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center",
          border: "1.5px solid " + F.line,
        }}>
          <div>
            <Pill color={F.card} fg={F.ink}>{T.dash_title} · 2024</Pill>
            <div style={{ fontSize: 56, fontWeight: 700, color: F.ink, marginTop: 12, letterSpacing: -1, fontFamily: NUM }}>
              {window.formatEUR(s.totalEur)}
            </div>
            <div style={{ display: "flex", gap: 22, marginTop: 8, fontSize: 13, color: F.ink }}>
              <span><b>{s.count}</b> {T.transfers}</span>
              <span style={{ color: F.line }}>·</span>
              <span><b>{recipients.length}</b> {T.recipients}</span>
              <span style={{ color: F.line }}>·</span>
              <span><b>{countries.length}</b> {T.countries}</span>
            </div>
          </div>
          <Btn onClick={() => go('pdf')}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {T.cta_export}
            </span>
          </Btn>
        </div>

        {/* Layout-variant content */}
        {layout === 'cards' && <FoyerCardsLayout T={T} countries={countries} recipients={recipients} txns={txns} s={s}/>}
        {layout === 'table' && <FoyerTableLayout T={T} txns={txns} s={s}/>}
        {layout === 'charts' && <FoyerChartsLayout T={T} months={months} s={s} countries={countries} maxM={maxM} recipients={recipients}/>}
      </div>
    );
  }

  function FoyerCardsLayout({ T, countries, recipients, txns, s }) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16, minHeight: 0, flex: 1 }}>
        <Card title={T.by_country}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 10 }}>
            {countries.map(([c, v]) => {
              const code = window.COUNTRY_CODE[c];
              const pct = v / s.totalEur * 100;
              return (
                <div key={c}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                    <Flag code={code}/>
                    <span style={{ fontWeight: 600, fontSize: 14, color: F.ink, flex: 1 }}>{c}</span>
                    <span style={{ fontFamily: NUM, fontWeight: 700, fontSize: 14, color: F.ink }}>{window.formatEUR(v)}</span>
                    <span style={{ fontSize: 11, color: F.muted, width: 36, textAlign: "right" }}>{pct.toFixed(0)}%</span>
                  </div>
                  <div style={{ height: 8, background: F.cream, borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: pct + '%', height: '100%', background: F.peachDeep, borderRadius: 99 }}></div>
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
                  {r.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: F.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r}</div>
                  <div style={{ fontSize: 11, color: F.muted }}>{txns.filter((t) => t.recipient_name === r).length} {T.transfers}</div>
                </div>
                <div style={{ fontFamily: NUM, fontSize: 14, fontWeight: 700, color: F.ink }}>{window.formatEUR(v)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  function FoyerTableLayout({ T, txns, s }) {
    return (
      <Card title={T.transactions} style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ marginTop: 8, overflow: "hidden", borderRadius: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT, fontSize: 12 }}>
            <thead>
              <tr style={{ background: F.cream }}>
                {[T.col_date, T.col_recipient, T.col_country, T.col_amount, T.col_eur, T.col_txn].map((h, i) => (
                  <th key={i} style={{ textAlign: i >= 3 ? "right" : "left", padding: "10px 14px", fontSize: 11, fontWeight: 700, color: F.muted, textTransform: "uppercase", letterSpacing: 0.6 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txns.slice(0, 13).map((t, i) => (
                <tr key={t.transaction_number} style={{ borderTop: "1px solid " + F.line }}>
                  <td style={td}>{t.date}</td>
                  <td style={td}>{t.recipient_name}</td>
                  <td style={td}><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Flag code={window.COUNTRY_CODE[t.country]} size={18}/>{t.country}</span></td>
                  <td style={{ ...td, textAlign: "right", fontFamily: NUM }}>{window.formatAmount(t.amount, t.currency)}</td>
                  <td style={{ ...td, textAlign: "right", fontFamily: NUM, fontWeight: 700 }}>{window.formatEURp(parseFloat(t.amount_eur))}</td>
                  <td style={{ ...td, textAlign: "right", color: F.muted, fontFamily: NUM, fontSize: 11 }}>{t.transaction_number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  function FoyerChartsLayout({ T, months, s, countries, maxM, recipients }) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, minHeight: 0, flex: 1 }}>
        <Card title={T.by_month}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 220, marginTop: 24, paddingBottom: 24, borderBottom: "1px solid " + F.line }}>
            {months.map((m, i) => {
              const v = s.byMonth[m] || 0;
              const h = maxM > 0 ? (v / maxM) * 180 : 0;
              const label = new Date(m + "-01").toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');
              return (
                <div key={m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ fontSize: 10, color: F.muted, fontFamily: NUM, fontWeight: 600, opacity: v ? 1 : 0 }}>{window.formatEUR(v)}</div>
                  <div style={{
                    width: "100%", height: h, background: i % 2 ? F.peachDeep : F.peach, borderRadius: "8px 8px 4px 4px",
                    minHeight: v ? 3 : 0,
                  }}></div>
                  <div style={{ fontSize: 11, color: F.muted, fontWeight: 600 }}>{label}</div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card title={T.by_country}>
          <Donut data={countries} total={s.totalEur} />
        </Card>
      </div>
    );
  }

  // ── donut chart ───────────────────────────────────────────────────────────
  function Donut({ data, total }) {
    const colors = [F.peachDeep, F.sage, F.sun, F.coral];
    const R = 70, C = 2 * Math.PI * R;
    let off = 0;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 14 }}>
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle cx="90" cy="90" r={R} fill="none" stroke={F.cream} strokeWidth="20"/>
          {data.map(([c, v], i) => {
            const frac = v / total;
            const seg = C * frac;
            const el = <circle key={c} cx="90" cy="90" r={R} fill="none" stroke={colors[i % colors.length]} strokeWidth="20" strokeDasharray={seg + " " + C} strokeDashoffset={-off} transform="rotate(-90 90 90)" strokeLinecap="butt"/>;
            off += seg;
            return el;
          })}
          <text x="90" y="88" textAnchor="middle" fontFamily={FONT} fontWeight="700" fontSize="20" fill={F.ink}>{data.length}</text>
          <text x="90" y="106" textAnchor="middle" fontFamily={FONT} fontWeight="500" fontSize="11" fill={F.muted}>pays</text>
        </svg>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          {data.map(([c, v], i) => (
            <div key={c} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: 99, background: colors[i % colors.length] }}></span>
              <span style={{ flex: 1, color: F.ink, fontWeight: 600 }}>{c}</span>
              <span style={{ fontFamily: NUM, color: F.muted }}>{window.formatEUR(v)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── PDF preview screen ────────────────────────────────────────────────────
  function PdfPreview({ T, go, lang, setLang }) {
    const s = window.summarize(window.TRANSACTIONS);
    return (
      <div style={{ padding: "32px 48px 32px", display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
        <TopBar T={T} step={2} lang={lang} setLang={setLang} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
          <button onClick={() => go('dashboard')} style={{ background: "none", border: "none", color: F.muted, fontSize: 13, cursor: "pointer", padding: 0 }}>← {T.cta_back}</button>
          <Pill color={F.sage} fg="#fff">✓ {T.pdf_ready}</Pill>
        </div>
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, minHeight: 0 }}>
          <div style={{
            background: "#fff", border: "1.5px solid " + F.line, borderRadius: 18, padding: 28,
            boxShadow: "0 20px 40px -20px rgba(70, 40, 20, 0.15)", overflow: "hidden",
          }}>
            <div style={{ fontSize: 10, color: F.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>Rapport · 2024</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: F.ink, margin: "6px 0 14px", letterSpacing: -0.3 }}>
              Rapport de transferts internationaux
            </h3>
            <div style={{ borderTop: "1px solid " + F.line, paddingTop: 10, fontSize: 12 }}>
              <Row k="Période" v="01/01/2024 – 31/12/2024"/>
              <Row k="Bénéficiaires" v={Object.keys(s.byRecipient).length}/>
              <Row k="Transferts" v={s.count}/>
              <Row k="Total EUR" v={window.formatEUR(s.totalEur)} strong/>
            </div>
            <div style={{ marginTop: 14, fontSize: 10, fontWeight: 700, color: F.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>Récapitulatif par pays</div>
            <table style={{ width: "100%", marginTop: 6, fontSize: 11, borderCollapse: "collapse" }}>
              {Object.entries(s.byCountry).map(([c, v]) => (
                <tr key={c} style={{ borderTop: "1px solid " + F.cream }}>
                  <td style={{ padding: "6px 0", color: F.ink }}>{c}</td>
                  <td style={{ padding: "6px 0", textAlign: "right", fontFamily: NUM, color: F.ink, fontWeight: 600 }}>{window.formatEURp(v)}</td>
                </tr>
              ))}
            </table>
            <div style={{ marginTop: 16, fontSize: 9, color: F.muted, fontStyle: "italic", borderTop: "1px dashed " + F.line, paddingTop: 8 }}>{T.disclaimer}</div>
          </div>
          <div style={{ background: F.cream, borderRadius: 18, padding: 24, border: "1.5px solid " + F.line }}>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: F.ink, margin: 0 }}>{lang === 'fr' ? 'Et après ?' : 'What\'s next?'}</h4>
            <p style={{ fontSize: 13, color: F.muted, lineHeight: 1.55, marginTop: 10 }}>
              {lang === 'fr'
                ? 'Joignez ce rapport à votre déclaration 2042-K. Conservez-le 3 ans avec les reçus originaux en cas de contrôle.'
                : 'Attach this report to your 2042-K filing. Keep it for 3 years along with the original receipts.'}
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
              <Btn>📄 PDF</Btn>
              <Btn kind="soft">📊 CSV</Btn>
              <Btn kind="soft">{ } JSON</Btn>
            </div>
            <div style={{ marginTop: 22, padding: 14, background: F.card, borderRadius: 12, border: "1px solid " + F.line }}>
              <div style={{ fontSize: 11, color: F.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>Astuce</div>
              <div style={{ fontSize: 12, color: F.ink, lineHeight: 1.5 }}>
                {lang === 'fr'
                  ? 'Si vous envoyez plus de 10 000 € par an, déclarez aussi en case 8UU.'
                  : 'If you send more than €10,000 a year, declare in box 8UU too.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── shared sub-atoms ──────────────────────────────────────────────────────
  const inp = {
    width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid " + F.line,
    background: F.card, fontFamily: FONT, fontSize: 14, color: F.ink, outline: "none",
  };
  const td = { padding: "10px 14px", color: F.ink, fontSize: 12, verticalAlign: "middle" };

  const Field = ({ label, hint, children }) => (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: F.ink, marginBottom: 6 }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 11, color: F.muted, marginTop: 6 }}>{hint}</div>}
    </label>
  );

  const Step = ({ n, t, d }) => (
    <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
      <div style={{ width: 24, height: 24, borderRadius: 99, background: F.coral, color: "#fff", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{n}</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: F.ink }}>{t}</div>
        <div style={{ fontSize: 12, color: F.muted, marginTop: 2 }}>{d}</div>
      </div>
    </div>
  );

  const Card = ({ title, children, style = {} }) => (
    <div style={{ background: F.card, borderRadius: 20, padding: 22, border: "1.5px solid " + F.line, ...style }}>
      <div style={{ fontSize: 11, color: F.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{title}</div>
      {children}
    </div>
  );

  const Row = ({ k, v, strong }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid " + F.cream, fontSize: 12 }}>
      <span style={{ color: F.muted }}>{k}</span>
      <span style={{ color: F.ink, fontWeight: strong ? 700 : 500, fontFamily: NUM }}>{v}</span>
    </div>
  );

  function TopBar({ T, step, lang, setLang }) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: F.coral, display: "grid", placeItems: "center", color: "#fff", fontFamily: NUM, fontWeight: 800, fontSize: 18, letterSpacing: -0.5 }}>T</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: F.ink, letterSpacing: -0.3 }}>{T.brand}</div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {[T.step1, T.step2, T.step3].map((s, i) => (
            <React.Fragment key={i}>
              <div style={{
                fontSize: 12, fontWeight: 600, color: i === step ? F.ink : F.muted,
                padding: "6px 12px", borderRadius: 99,
                background: i === step ? F.cream : "transparent",
                border: i === step ? "1px solid " + F.line : "1px solid transparent",
              }}>{i + 1}. {s}</div>
              {i < 2 && <div style={{ width: 14, height: 1, background: F.line }}></div>}
            </React.Fragment>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4, background: F.cream, padding: 4, borderRadius: 99, border: "1px solid " + F.line }}>
          {['fr', 'en'].map((l) => (
            <button key={l} onClick={() => setLang(l)} style={{
              border: "none", padding: "5px 12px", borderRadius: 99, cursor: "pointer",
              background: lang === l ? F.card : "transparent",
              color: lang === l ? F.ink : F.muted, fontWeight: 700, fontSize: 11,
              boxShadow: lang === l ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
            }}>{l.toUpperCase()}</button>
          ))}
        </div>
      </div>
    );
  }

  // ── root ──────────────────────────────────────────────────────────────────
  window.FoyerApp = function FoyerApp({ layout }) {
    const [screen, setScreen] = useState('start');
    const [lang, setLang] = useState('fr');
    const T = window.I18N[lang];
    const go = (s) => setScreen(s);

    return (
      <div style={{
        background: F.bg, color: F.ink, fontFamily: FONT, height: "100%", width: "100%",
        position: "relative", overflow: "hidden",
      }}>
        <style>{`
          @keyframes foyerPulse { 0% { transform: scale(0.9); opacity: 0.5 } 50% { transform: scale(1.15); opacity: 0.2 } 100% { transform: scale(0.9); opacity: 0.5 } }
          .foyer-pulse { animation: foyerPulse 1.6s ease-in-out infinite; }
        `}</style>
        {screen === 'start'     && <Screen1 T={T} go={go} lang={lang} setLang={setLang}/>}
        {screen === 'email'     && <Screen2Email T={T} go={go} lang={lang} setLang={setLang}/>}
        {screen === 'json'      && <Screen2Upload T={T} go={go} lang={lang} setLang={setLang} mode="json"/>}
        {screen === 'eml'       && <Screen2Upload T={T} go={go} lang={lang} setLang={setLang} mode="eml"/>}
        {screen === 'demo'      && <Dashboard T={T} go={go} lang={lang} setLang={setLang} layout={layout}/>}
        {screen === 'loading'   && <Loading T={T} go={go} lang={lang} setLang={setLang}/>}
        {screen === 'dashboard' && <Dashboard T={T} go={go} lang={lang} setLang={setLang} layout={layout}/>}
        {screen === 'pdf'       && <PdfPreview T={T} go={go} lang={lang} setLang={setLang}/>}
      </div>
    );
  };
})();
