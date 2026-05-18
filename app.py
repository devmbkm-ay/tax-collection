"""
WorldRemit Tax Report — Streamlit web application.
Run with: streamlit run app.py
"""

import io
import tempfile
from datetime import datetime
from pathlib import Path

import streamlit as st

from worldremit import WorldRemitExtractor
from worldremit.models import TRANSLATIONS
from worldremit.report import generate_pdf_report, save_json_backup

# ── Page config ─────────────────────────────────────────────────────────────

st.set_page_config(
    page_title="WorldRemit Tax Report",
    page_icon="🌍",
    layout="centered",
)

# ── Custom CSS (WorldRemit purple palette) ───────────────────────────────────

st.markdown("""
<style>
    /* Main background */
    .stApp { background-color: #f7f7fb; }

    /* Sidebar */
    [data-testid="stSidebar"] { background-color: #2b0d6e; }
    [data-testid="stSidebar"] * { color: #ffffff !important; }
    [data-testid="stSidebar"] .stSelectbox label,
    [data-testid="stSidebar"] .stTextInput label,
    [data-testid="stSidebar"] .stNumberInput label { color: #e0d4ff !important; }

    /* Primary button */
    .stButton > button {
        background-color: #6e2bff;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 0.6rem 1.8rem;
        font-size: 1rem;
        font-weight: 600;
        width: 100%;
        transition: background 0.2s;
    }
    .stButton > button:hover { background-color: #5a1fe0; }

    /* Download button */
    .stDownloadButton > button {
        background-color: #ffffff;
        color: #6e2bff;
        border: 2px solid #6e2bff;
        border-radius: 8px;
        font-weight: 600;
        width: 100%;
    }
    .stDownloadButton > button:hover { background-color: #f0e8ff; }

    /* Card-like containers */
    .metric-card {
        background: white;
        border-radius: 12px;
        padding: 1.2rem 1.5rem;
        box-shadow: 0 2px 8px rgba(110,43,255,0.08);
        text-align: center;
    }
    .metric-card .value {
        font-size: 1.8rem;
        font-weight: 700;
        color: #6e2bff;
    }
    .metric-card .label {
        font-size: 0.85rem;
        color: #666;
        margin-top: 0.2rem;
    }

    /* Header */
    .app-header {
        text-align: center;
        padding: 1.5rem 0 0.5rem;
    }
    .app-header h1 {
        color: #2b0d6e;
        font-size: 2rem;
        font-weight: 800;
        margin-bottom: 0.2rem;
    }
    .app-header p { color: #666; font-size: 1rem; }

    /* Status messages */
    .status-ok  { color: #1a8a4a; font-weight: 600; }
    .status-err { color: #c0392b; font-weight: 600; }
</style>
""", unsafe_allow_html=True)

# ── Header ───────────────────────────────────────────────────────────────────

logo_path = Path(__file__).parent / "worldremit_logo.png"
if logo_path.exists():
    col_l, col_c, col_r = st.columns([1, 2, 1])
    with col_c:
        st.image(str(logo_path), width=220)
else:
    st.markdown("""
    <div class="app-header">
        <h1>🌍 WorldRemit</h1>
    </div>
    """, unsafe_allow_html=True)

st.markdown("""
<div class="app-header">
    <h1>Rapport Fiscal de Transactions</h1>
    <p>Extrayez vos virements WorldRemit et générez un rapport PDF professionnel.</p>
</div>
""", unsafe_allow_html=True)

st.divider()

# ── Sidebar — configuration ───────────────────────────────────────────────────

with st.sidebar:
    st.markdown("## ⚙️ Configuration")
    st.markdown("---")

    st.markdown("### 📧 Connexion email")
    email_address = st.text_input("Adresse email", placeholder="vous@gmail.com")
    password      = st.text_input("Mot de passe d'application", type="password",
                                  help="Utilisez un mot de passe d'application, pas votre mot de passe habituel.")

    st.markdown("### 👤 Bénéficiaire")
    recipient_name = st.text_input("Nom du bénéficiaire", value="Patrick Kayombya")

    st.markdown("### 📅 Période")
    current_year = datetime.now().year
    col1, col2 = st.columns(2)
    with col1:
        start_year = st.number_input("De", min_value=2015, max_value=current_year,
                                     value=current_year - 1)
    with col2:
        end_year = st.number_input("À", min_value=2015, max_value=current_year,
                                   value=current_year - 1)

    if start_year > end_year:
        st.warning("L'année de début doit être ≤ l'année de fin.")

    st.markdown("### 🌐 Langue du rapport")
    lang = st.selectbox("Langue", options=["Français (fr)", "English (en)"],
                        index=0)
    lang_code = "fr" if lang.startswith("F") else "en"

    st.markdown("---")
    generate_btn = st.button("🚀 Générer le rapport")

# ── Session state ─────────────────────────────────────────────────────────────

if "transactions" not in st.session_state:
    st.session_state.transactions = []
if "eur_rates" not in st.session_state:
    st.session_state.eur_rates = {}
if "pdf_bytes" not in st.session_state:
    st.session_state.pdf_bytes = None
if "json_str" not in st.session_state:
    st.session_state.json_str = None

# ── Main action ───────────────────────────────────────────────────────────────

if generate_btn:
    if not email_address or not password:
        st.error("Veuillez saisir votre adresse email et votre mot de passe d'application.")
    elif not recipient_name:
        st.error("Veuillez saisir le nom du bénéficiaire.")
    elif start_year > end_year:
        st.error("La période sélectionnée est invalide.")
    else:
        extractor = WorldRemitExtractor(email_address, password)

        with st.status("Connexion au serveur email…", expanded=True) as status:
            if not extractor.connect_to_email():
                status.update(label="❌ Connexion échouée.", state="error")
                st.stop()

            st.write("✅ Connecté.")
            st.write("📥 Récupération des taux de change EUR…")

            from worldremit.exchange import fetch_eur_rates
            st.session_state.eur_rates = fetch_eur_rates()

            period = str(start_year) if start_year == end_year else f"{start_year}–{end_year}"
            st.write(f"🔍 Recherche des emails WorldRemit pour **{recipient_name}** ({period})…")

            extractor.process_emails(recipient_name, int(start_year), int(end_year))
            extractor.disconnect()

            st.session_state.transactions = extractor.transactions
            st.session_state.eur_rates    = extractor.eur_rates

            if not extractor.transactions:
                status.update(label="⚠️ Aucune transaction trouvée.", state="error")
                st.stop()

            st.write(f"📄 Génération du rapport PDF…")

            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as pdf_tmp:
                generate_pdf_report(
                    extractor.transactions, extractor.eur_rates,
                    output_file=pdf_tmp.name,
                    recipient_name=recipient_name,
                    start_year=int(start_year),
                    end_year=int(end_year),
                    lang=lang_code,
                )
                st.session_state.pdf_bytes = Path(pdf_tmp.name).read_bytes()

            import json
            from dataclasses import asdict
            st.session_state.json_str = json.dumps(
                [asdict(t) for t in extractor.transactions],
                indent=2, ensure_ascii=False,
            )

            status.update(
                label=f"✅ {len(extractor.transactions)} transactions extraites avec succès !",
                state="complete",
            )

# ── Results ───────────────────────────────────────────────────────────────────

if st.session_state.transactions:
    txns     = st.session_state.transactions
    rates    = st.session_state.eur_rates

    # Metrics row
    eur_total = sum(
        float(t.amount_eur) for t in txns if t.amount_eur != 'N/A'
    )
    currencies = ", ".join(sorted({t.currency for t in txns}))

    c1, c2, c3 = st.columns(3)
    with c1:
        st.markdown(f"""
        <div class="metric-card">
            <div class="value">{len(txns)}</div>
            <div class="label">Transactions</div>
        </div>""", unsafe_allow_html=True)
    with c2:
        st.markdown(f"""
        <div class="metric-card">
            <div class="value">{eur_total:,.2f} €</div>
            <div class="label">Total équivalent EUR</div>
        </div>""", unsafe_allow_html=True)
    with c3:
        st.markdown(f"""
        <div class="metric-card">
            <div class="value">{currencies}</div>
            <div class="label">Devise(s)</div>
        </div>""", unsafe_allow_html=True)

    st.markdown("<br/>", unsafe_allow_html=True)

    # Transaction table
    import pandas as pd
    tr = TRANSLATIONS.get(lang_code, TRANSLATIONS['fr'])

    df = pd.DataFrame([{
        tr['col_date']:     t.date,
        tr['col_amount']:   t.amount,
        tr['col_currency']: t.currency,
        tr['col_eur']:      t.amount_eur,
        tr['col_txn']:      t.transaction_number,
        tr['col_country']:  t.country or '—',
    } for t in sorted(txns, key=lambda x: x.sort_key)])

    st.dataframe(df, use_container_width=True, hide_index=True)

    # Downloads
    st.markdown("### 📥 Téléchargements")
    dl1, dl2 = st.columns(2)
    with dl1:
        if st.session_state.pdf_bytes:
            period_label = (str(start_year) if start_year == end_year
                            else f"{start_year}-{end_year}")
            st.download_button(
                label="⬇️ Télécharger le PDF",
                data=st.session_state.pdf_bytes,
                file_name=f"worldremit_rapport_{period_label}.pdf",
                mime="application/pdf",
            )
    with dl2:
        if st.session_state.json_str:
            st.download_button(
                label="⬇️ Télécharger le JSON",
                data=st.session_state.json_str,
                file_name="worldremit_transactions.json",
                mime="application/json",
            )

else:
    # Empty state
    st.markdown("""
    <div style="text-align:center; padding: 3rem 0; color: #aaa;">
        <div style="font-size: 3rem;">📊</div>
        <p style="font-size: 1.1rem; margin-top: 0.5rem;">
            Remplissez vos informations dans le panneau de gauche<br/>
            et cliquez sur <b>Générer le rapport</b>.
        </p>
    </div>
    """, unsafe_allow_html=True)

# ── Footer ────────────────────────────────────────────────────────────────────

st.divider()
st.markdown("""
<p style="text-align:center; color:#aaa; font-size:0.8rem;">
    🔒 Vos identifiants ne sont jamais stockés — ils servent uniquement à la connexion IMAP.
</p>
""", unsafe_allow_html=True)
