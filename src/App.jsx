import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { supabase } from "./supabase.js";

export default function App() {
  const bedrijven = [
    {
      naam: "Cafetaria Ten Beste Corner B.V.",
      adres: "Voorstraat 12",
      plaats: "3512 AN Utrecht",
      land: "Nederland",
      kvk: "98498762",
      btw: "NL868520895B01",
      iban: "NL85ABNA0120545004",
      startNummer: 14,
    },
    {
      naam: "Ten Beste Investment B.V.",
      adres: "",
      plaats: "",
      land: "Nederland",
      kvk: "98613375",
      btw: "NL868569021B01",
      iban: "NL03ABNA0149841159",
      startNummer: 4,
    },
  ];

  const [pagina, setPagina] = useState("dashboard");
  const [bedrijfIndex, setBedrijfIndex] = useState(0);
  const [klanten, setKlanten] = useState([]);
  const [facturen, setFacturen] = useState([]);
  const [factuurregels, setFactuurregels] = useState([]);

  const [klantForm, setKlantForm] = useState({
    bedrijfsnaam: "",
    adres: "",
    postcode: "",
    plaats: "",
    kvk: "",
    btw: "",
    voornaam: "",
    achternaam: "",
    email: "",
    telefoon: "",
  });

  const [factuurForm, setFactuurForm] = useState({
    klantId: "",
    regels: [
      { omschrijving: "", aantal: 1, prijs: "", btwPercentage: 21 },
    ],
  });

  const bedrijf = bedrijven[bedrijfIndex];

  useEffect(() => {
    laadData();
  }, []);

  async function laadData() {
    const klantenData = await supabase.from("klanten").select("*").order("id", { ascending: false });
    const facturenData = await supabase.from("facturen").select("*").order("id", { ascending: false });
    const regelsData = await supabase.from("factuurregels").select("*").order("id", { ascending: true });

    if (!klantenData.error) setKlanten(klantenData.data || []);
    if (!facturenData.error) setFacturen(facturenData.data || []);
    if (!regelsData.error) setFactuurregels(regelsData.data || []);
  }

  const klantenBedrijf = klanten.filter(k => k.bedrijf === bedrijf.naam);
  const facturenBedrijf = facturen.filter(f => f.bedrijf === bedrijf.naam);

  function euro(v) {
    return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(Number(v || 0));
  }

  function volgendeFactuurnummer() {
    return `2026.${String(facturenBedrijf.length + bedrijf.startNummer).padStart(4, "0")}`;
  }

  function berekenRegel(r) {
    const subtotaal = Number(r.aantal || 0) * Number(r.prijs || 0);
    const btw = subtotaal * (Number(r.btwPercentage || 0) / 100);
    return { subtotaal, btw, totaal: subtotaal + btw };
  }

  function berekenFactuur() {
    return factuurForm.regels.reduce(
      (acc, r) => {
        const b = berekenRegel(r);
        acc.subtotaal += b.subtotaal;
        acc.btw += b.btw;
        acc.totaal += b.totaal;
        return acc;
      },
      { subtotaal: 0, btw: 0, totaal: 0 }
    );
  }

  async function klantOpslaan(e) {
    e.preventDefault();

    const nieuweKlant = {
      bedrijf: bedrijf.naam,
      bedrijfsnaam: klantForm.bedrijfsnaam,
      contactpersoon: `${klantForm.voornaam} ${klantForm.achternaam}`.trim(),
      email: klantForm.email,
      telefoon: klantForm.telefoon,
      adres: klantForm.adres,
      postcode: klantForm.postcode,
      plaats: klantForm.plaats,
      kvk: klantForm.kvk,
      btw: klantForm.btw,
      land: "Nederland",
    };

    const { data, error } = await supabase.from("klanten").insert([nieuweKlant]).select();

    if (error) return alert("Klant opslaan mislukt: " + error.message);

    setKlanten([data[0], ...klanten]);
    setKlantForm({
      bedrijfsnaam: "",
      adres: "",
      postcode: "",
      plaats: "",
      kvk: "",
      btw: "",
      voornaam: "",
      achternaam: "",
      email: "",
      telefoon: "",
    });
  }

  function updateRegel(index, veld, waarde) {
    const regels = [...factuurForm.regels];
    regels[index][veld] = waarde;
    setFactuurForm({ ...factuurForm, regels });
  }

  function voegRegelToe() {
    setFactuurForm({
      ...factuurForm,
      regels: [...factuurForm.regels, { omschrijving: "", aantal: 1, prijs: "", btwPercentage: 21 }],
    });
  }

  function verwijderRegel(index) {
    setFactuurForm({
      ...factuurForm,
      regels: factuurForm.regels.filter((_, i) => i !== index),
    });
  }

  async function factuurOpslaan(e) {
    e.preventDefault();

    const klant = klanten.find(k => String(k.id) === String(factuurForm.klantId));
    if (!klant) return alert("Kies eerst een klant.");

    const totalen = berekenFactuur();

    const factuur = {
      bedrijf: bedrijf.naam,
      klant_id: klant.id,
      klant_naam: klant.bedrijfsnaam || klant.contactpersoon,
      factuurnummer: volgendeFactuurnummer(),
      datum: new Date().toLocaleDateString("nl-NL"),
      omschrijving: "Meerdere producten",
      aantal: 1,
      prijs: totalen.subtotaal,
      btw_percentage: 0,
      subtotaal: totalen.subtotaal,
      btw_bedrag: totalen.btw,
      totaal: totalen.totaal,
      status: "Open",
    };

    const { data, error } = await supabase.from("facturen").insert([factuur]).select();
    if (error) return alert("Factuur opslaan mislukt: " + error.message);

    const factuurId = data[0].id;

    const regels = factuurForm.regels.map(r => {
      const b = berekenRegel(r);
      return {
        factuur_id: factuurId,
        omschrijving: r.omschrijving,
        aantal: Number(r.aantal),
        prijs: Number(r.prijs),
        btw_percentage: Number(r.btwPercentage),
        subtotaal: b.subtotaal,
        btw_bedrag: b.btw,
        totaal: b.totaal,
      };
    });

    const regelsResult = await supabase.from("factuurregels").insert(regels).select();
    if (regelsResult.error) return alert("Factuurregels opslaan mislukt: " + regelsResult.error.message);

    setFacturen([data[0], ...facturen]);
    setFactuurregels([...factuurregels, ...regelsResult.data]);

    setFactuurForm({
      klantId: "",
      regels: [{ omschrijving: "", aantal: 1, prijs: "", btwPercentage: 21 }],
    });
  }

  async function verwijderFactuur(id) {
    if (!confirm("Factuur verwijderen?")) return;

    const { error } = await supabase.from("facturen").delete().eq("id", id);
    if (error) return alert("Verwijderen mislukt: " + error.message);

    setFacturen(facturen.filter(f => f.id !== id));
    setFactuurregels(factuurregels.filter(r => r.factuur_id !== id));
  }

  function downloadPdf(factuur) {
    const klant = klanten.find(k => k.id === factuur.klant_id) || {};
    const regels = factuurregels.filter(r => r.factuur_id === factuur.id);
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("FACTUUR", 160, 20);

    doc.setFontSize(10);
    doc.text(bedrijf.naam, 20, 25);
    doc.text(bedrijf.adres || "-", 20, 32);
    doc.text(bedrijf.plaats || "-", 20, 39);
    doc.text(`KvK: ${bedrijf.kvk}`, 20, 50);
    doc.text(`BTW: ${bedrijf.btw}`, 20, 57);
    doc.text(`IBAN: ${bedrijf.iban}`, 20, 64);

    doc.text(factuur.klant_naam || "-", 20, 88);
    doc.text(klant.adres || "-", 20, 95);
    doc.text(`${klant.postcode || ""} ${klant.plaats || ""}`, 20, 102);

    doc.text(`Nummer: ${factuur.factuurnummer}`, 140, 88);
    doc.text(`Datum: ${factuur.datum}`, 140, 95);

    doc.line(20, 125, 190, 125);
    doc.text("Product", 20, 135);
    doc.text("Aantal", 95, 135);
    doc.text("Prijs", 120, 135);
    doc.text("BTW", 145, 135);
    doc.text("Totaal", 165, 135);
    doc.line(20, 140, 190, 140);

    let y = 150;
    regels.forEach(r => {
      doc.text(String(r.omschrijving || "-"), 20, y);
      doc.text(String(r.aantal), 95, y);
      doc.text(euro(r.prijs), 120, y);
      doc.text(`${r.btw_percentage}%`, 145, y);
      doc.text(euro(r.totaal), 165, y);
      y += 10;
    });

    y += 15;
    doc.text(`Subtotaal: ${euro(factuur.subtotaal)}`, 125, y);
    doc.text(`BTW: ${euro(factuur.btw_bedrag)}`, 125, y + 8);
    doc.setFontSize(14);
    doc.text(`Totaal: ${euro(factuur.totaal)}`, 125, y + 20);

    doc.setFontSize(10);
    doc.text("Gelieve binnen 7 dagen te betalen onder vermelding van het factuurnummer.", 20, 260);
    doc.text(`${bedrijf.naam} * IBAN: ${bedrijf.iban}`, 20, 275);

    doc.save(`Factuur ${factuur.factuurnummer}.pdf`);
  }

  const openstaand = facturenBedrijf.filter(f => f.status === "Open").reduce((s, f) => s + Number(f.totaal || 0), 0);

  return (
    <div style={s.app}>
      <aside style={s.sidebar}>
        <h2 style={s.logo}>Factuur Simpel</h2>
        <Menu label="Dashboard" active={pagina === "dashboard"} onClick={() => setPagina("dashboard")} />
        <Menu label="Facturen" active={pagina === "facturen"} onClick={() => setPagina("facturen")} />
        <Menu label="Klanten" active={pagina === "klanten"} onClick={() => setPagina("klanten")} />
        <Menu label="Producten" active={pagina === "producten"} onClick={() => setPagina("producten")} />
        <Menu label="Rapporten" active={pagina === "rapporten"} onClick={() => setPagina("rapporten")} />
        <Menu label="Instellingen" active={pagina === "instellingen"} onClick={() => setPagina("instellingen")} />
      </aside>

      <main style={s.main}>
        <header style={s.topbar}>
          <select value={bedrijfIndex} onChange={e => setBedrijfIndex(Number(e.target.value))} style={s.select}>
            {bedrijven.map((b, i) => <option key={i} value={i}>{b.naam}</option>)}
          </select>
          <strong>Uzeyir Gulec</strong>
        </header>

        {pagina === "dashboard" && (
          <>
            <h1>Dashboard</h1>
            <section style={s.stats}>
              <Card title="Klanten" value={klantenBedrijf.length} />
              <Card title="Facturen" value={facturenBedrijf.length} />
              <Card title="Openstaand" value={euro(openstaand)} />
              <Card title="Volgende factuur" value={volgendeFactuurnummer()} />
            </section>
          </>
        )}

        {pagina === "klanten" && (
          <section style={s.panel}>
            <h1>Klanten</h1>
            <form onSubmit={klantOpslaan} style={s.formGrid}>
              {[
                ["bedrijfsnaam", "Bedrijfsnaam"],
                ["adres", "Adres"],
                ["postcode", "Postcode"],
                ["plaats", "Plaats"],
                ["kvk", "KvK"],
                ["btw", "BTW"],
                ["voornaam", "Voornaam"],
                ["achternaam", "Achternaam"],
                ["email", "E-mail"],
                ["telefoon", "Telefoon"],
              ].map(([name, label]) => (
                <input key={name} name={name} value={klantForm[name]} onChange={e => setKlantForm({ ...klantForm, [name]: e.target.value })} placeholder={label} style={s.input} />
              ))}
              <button style={s.greenButton}>Klant opslaan</button>
            </form>

            {klantenBedrijf.map(k => (
              <div key={k.id} style={s.row}>
                <strong>{k.bedrijfsnaam || k.contactpersoon}</strong>
                <span>{k.email}</span>
              </div>
            ))}
          </section>
        )}

        {pagina === "facturen" && (
          <>
            <section style={s.panel}>
              <h1>Nieuwe factuur</h1>
              <form onSubmit={factuurOpslaan}>
                <select value={factuurForm.klantId} onChange={e => setFactuurForm({ ...factuurForm, klantId: e.target.value })} style={s.input}>
                  <option value="">Selecteer klant</option>
                  {klantenBedrijf.map(k => <option key={k.id} value={k.id}>{k.bedrijfsnaam || k.contactpersoon}</option>)}
                </select>

                <h3>Producten</h3>
                {factuurForm.regels.map((r, i) => {
                  const b = berekenRegel(r);
                  return (
                    <div key={i} style={s.productLine}>
                      <input placeholder="Omschrijving" value={r.omschrijving} onChange={e => updateRegel(i, "omschrijving", e.target.value)} style={s.input} />
                      <input placeholder="Aantal" value={r.aantal} onChange={e => updateRegel(i, "aantal", e.target.value)} style={s.smallInput} />
                      <input placeholder="Prijs" value={r.prijs} onChange={e => updateRegel(i, "prijs", e.target.value)} style={s.smallInput} />
                      <select value={r.btwPercentage} onChange={e => updateRegel(i, "btwPercentage", e.target.value)} style={s.smallInput}>
                        <option value="0">0%</option>
                        <option value="9">9%</option>
                        <option value="21">21%</option>
                      </select>
                      <strong>{euro(b.totaal)}</strong>
                      <button type="button" onClick={() => verwijderRegel(i)} style={s.deleteSmall}>×</button>
                    </div>
                  );
                })}

                <button type="button" onClick={voegRegelToe} style={s.greenButton}>+ Product</button>

                <div style={s.totalBox}>
                  <p>Subtotaal: {euro(berekenFactuur().subtotaal)}</p>
                  <p>BTW: {euro(berekenFactuur().btw)}</p>
                  <h2>Totaal: {euro(berekenFactuur().totaal)}</h2>
                </div>

                <button style={s.blueButton}>Factuur opslaan</button>
              </form>
            </section>

            <section style={s.panel}>
              <h1>Facturen</h1>
              {facturenBedrijf.map(f => (
                <div key={f.id} style={s.invoiceRow}>
                  <strong>{f.factuurnummer}</strong>
                  <span>{f.klant_naam}</span>
                  <span>{f.datum}</span>
                  <strong>{euro(f.totaal)}</strong>
                  <button onClick={() => downloadPdf(f)} style={s.blueButton}>PDF</button>
                  <button onClick={() => verwijderFactuur(f.id)} style={s.redButton}>Verwijder</button>
                </div>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function Menu({ label, active, onClick }) {
  return <button onClick={onClick} style={active ? s.menuActive : s.menu}>{label}</button>;
}

function Card({ title, value }) {
  return (
    <div style={s.card}>
      <p>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

const s = {
  app: { display: "flex", minHeight: "100vh", background: "#f6f7fb", fontFamily: "Arial" },
  sidebar: { width: 270, background: "white", padding: 24, boxShadow: "2px 0 20px #00000010" },
  logo: { color: "#4f6bed", marginBottom: 30 },
  menu: { display: "block", width: "100%", padding: 14, marginBottom: 8, background: "white", border: 0, textAlign: "left", borderRadius: 10, fontSize: 16 },
  menuActive: { display: "block", width: "100%", padding: 14, marginBottom: 8, background: "#5b6ee1", color: "white", border: 0, textAlign: "left", borderRadius: 10, fontSize: 16 },
  main: { flex: 1, padding: 30 },
  topbar: { background: "white", padding: 20, borderRadius: 18, marginBottom: 25, display: "flex", justifyContent: "space-between" },
  select: { padding: 12, borderRadius: 10, border: "1px solid #ddd" },
  stats: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 },
  card: { background: "white", padding: 25, borderRadius: 18, boxShadow: "0 10px 30px #00000008" },
  panel: { background: "white", padding: 25, borderRadius: 18, marginBottom: 25, boxShadow: "0 10px 30px #00000008" },
  input: { width: "100%", padding: 14, border: "1px solid #ddd", borderRadius: 10, marginBottom: 12 },
  smallInput: { width: 110, padding: 14, border: "1px solid #ddd", borderRadius: 10 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  row: { padding: 15, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" },
  productLine: { display: "grid", gridTemplateColumns: "1fr 100px 120px 100px 120px 40px", gap: 10, alignItems: "center", marginBottom: 12 },
  totalBox: { textAlign: "right", marginTop: 20 },
  greenButton: { background: "#22c55e", color: "white", padding: "13px 20px", border: 0, borderRadius: 10, fontWeight: "bold", cursor: "pointer" },
  blueButton: { background: "#4f6bed", color: "white", padding: "10px 16px", border: 0, borderRadius: 10, fontWeight: "bold", cursor: "pointer" },
  redButton: { background: "#ef4444", color: "white", padding: "10px 16px", border: 0, borderRadius: 10, fontWeight: "bold", cursor: "pointer" },
  deleteSmall: { background: "#ef4444", color: "white", border: 0, borderRadius: 8, padding: 10 },
  invoiceRow: { display: "grid", gridTemplateColumns: "120px 1fr 120px 120px 80px 110px", gap: 12, alignItems: "center", padding: 14, borderBottom: "1px solid #eee" },
};
