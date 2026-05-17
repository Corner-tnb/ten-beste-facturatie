import React, { useState } from "react";
import { jsPDF } from "jspdf";

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
      factuurPrefix: "2026.",
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
      factuurPrefix: "2026.",
      startNummer: 4,
    },
  ];

  const [bedrijfIndex, setBedrijfIndex] = useState(0);
  const [klanten, setKlanten] = useState([]);
  const [facturen, setFacturen] = useState([]);

  const [klantFormulier, setKlantFormulier] = useState({
    type: "Bedrijf",
    bedrijfsnaam: "",
    adres: "",
    postcode: "",
    plaats: "",
    land: "Nederland",
    kvk: "",
    btw: "",
    voornaam: "",
    achternaam: "",
    email: "",
    telefoon: "",
  });

  const [factuurFormulier, setFactuurFormulier] = useState({
    klantId: "",
    omschrijving: "",
    aantal: 1,
    prijs: "",
    btwPercentage: 9,
  });

  const actiefBedrijf = bedrijven[bedrijfIndex];

  const klantenVoorBedrijf = klanten.filter((k) => k.bedrijf === actiefBedrijf.naam);
  const facturenVoorBedrijf = facturen.filter((f) => f.bedrijf === actiefBedrijf.naam);

  function updateKlant(e) {
    setKlantFormulier({ ...klantFormulier, [e.target.name]: e.target.value });
  }

  function updateFactuur(e) {
    setFactuurFormulier({ ...factuurFormulier, [e.target.name]: e.target.value });
  }

  function klantOpslaan(e) {
    e.preventDefault();

    if (!klantFormulier.bedrijfsnaam && !klantFormulier.voornaam) {
      alert("Vul minimaal een bedrijfsnaam of voornaam in.");
      return;
    }

    setKlanten([
      { id: Date.now(), bedrijf: actiefBedrijf.naam, ...klantFormulier },
      ...klanten,
    ]);

    setKlantFormulier({
      type: "Bedrijf",
      bedrijfsnaam: "",
      adres: "",
      postcode: "",
      plaats: "",
      land: "Nederland",
      kvk: "",
      btw: "",
      voornaam: "",
      achternaam: "",
      email: "",
      telefoon: "",
    });
  }

  function maakFactuurnummer() {
    const aantal = facturenVoorBedrijf.length + actiefBedrijf.startNummer;
    return actiefBedrijf.factuurPrefix + String(aantal).padStart(4, "0");
  }

  function factuurOpslaan(e) {
    e.preventDefault();

    const klant = klanten.find((k) => String(k.id) === String(factuurFormulier.klantId));

    if (!klant) {
      alert("Kies eerst een klant.");
      return;
    }

    const aantal = Number(factuurFormulier.aantal);
    const prijs = Number(factuurFormulier.prijs);
    const btwPercentage = Number(factuurFormulier.btwPercentage);

    const subtotaal = aantal * prijs;
    const btwBedrag = subtotaal * (btwPercentage / 100);
    const totaal = subtotaal + btwBedrag;

    setFacturen([
      {
        id: Date.now(),
        bedrijf: actiefBedrijf.naam,
        nummer: maakFactuurnummer(),
        datum: new Date().toLocaleDateString("nl-NL"),
        klant,
        klantNaam: klant.bedrijfsnaam || `${klant.voornaam} ${klant.achternaam}`,
        omschrijving: factuurFormulier.omschrijving,
        aantal,
        prijs,
        btwPercentage,
        subtotaal,
        btwBedrag,
        totaal,
        status: "Open",
      },
      ...facturen,
    ]);

    setFactuurFormulier({
      klantId: "",
      omschrijving: "",
      aantal: 1,
      prijs: "",
      btwPercentage: 9,
    });
  }

  function downloadPdf(factuur) {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("FACTUUR", 160, 20);

    doc.setFontSize(11);
    doc.text(actiefBedrijf.naam, 20, 25);
    doc.text(actiefBedrijf.adres || "-", 20, 32);
    doc.text(actiefBedrijf.plaats || "-", 20, 39);
    doc.text(actiefBedrijf.land, 20, 46);
    doc.text(`KvK-nr: ${actiefBedrijf.kvk}`, 20, 56);
    doc.text(`BTW-nr: ${actiefBedrijf.btw}`, 20, 63);
    doc.text(`Bank: ${actiefBedrijf.iban}`, 20, 70);

    doc.text(factuur.klantNaam, 20, 90);
    doc.text(factuur.klant.adres || "-", 20, 97);
    doc.text(`${factuur.klant.postcode || ""} ${factuur.klant.plaats || ""}`, 20, 104);
    doc.text(factuur.klant.land || "Nederland", 20, 111);

    doc.text(`Nummer: ${factuur.nummer}`, 140, 90);
    doc.text(`Datum: ${factuur.datum}`, 140, 97);

    doc.line(20, 130, 190, 130);
    doc.text("Producten", 20, 140);
    doc.text("Aantal", 100, 140);
    doc.text("Prijs", 125, 140);
    doc.text("Totaal", 160, 140);
    doc.line(20, 145, 190, 145);

    doc.text(factuur.omschrijving, 20, 155);
    doc.text(String(factuur.aantal), 100, 155);
    doc.text(euro(factuur.prijs), 125, 155);
    doc.text(euro(factuur.subtotaal), 160, 155);

    doc.text(`Subtotaal: ${euro(factuur.subtotaal)}`, 125, 180);
    doc.text(`BTW ${factuur.btwPercentage}%: ${euro(factuur.btwBedrag)}`, 125, 188);

    doc.setFontSize(14);
    doc.text(`Totaal: ${euro(factuur.totaal)}`, 125, 200);

    doc.setFontSize(10);
    doc.text(
      "Wij verzoeken u vriendelijk om het factuurbedrag binnen 7 dagen na factuurdatum over te maken onder vermelding van het factuurnummer.",
      20,
      240,
      { maxWidth: 170 }
    );

    doc.text(`${actiefBedrijf.naam} * IBAN: ${actiefBedrijf.iban}`, 20, 275);
    doc.text(`BTW nummer: ${actiefBedrijf.btw} * KvK nummer: ${actiefBedrijf.kvk}`, 20, 282);

    doc.save(`Factuur ${factuur.nummer}.pdf`);
  }

  const openstaand = facturenVoorBedrijf.filter((f) => f.status === "Open").reduce((s, f) => s + f.totaal, 0);

  return (
    <div style={{ fontFamily: "Arial", background: "#f4eee5", minHeight: "100vh" }}>
      <header style={styles.header}>
        <h1 style={{ color: "#e79a3b", margin: 0 }}>Ten Beste Facturatie</h1>
        <select value={bedrijfIndex} onChange={(e) => setBedrijfIndex(Number(e.target.value))} style={styles.select}>
          {bedrijven.map((bedrijf, index) => (
            <option key={index} value={index}>{bedrijf.naam}</option>
          ))}
        </select>
      </header>

      <main style={{ padding: "30px" }}>
        <section style={styles.panel}>
          <h2>{actiefBedrijf.naam}</h2>
          <p>KvK: {actiefBedrijf.kvk}</p>
          <p>BTW: {actiefBedrijf.btw}</p>
          <p>IBAN: {actiefBedrijf.iban}</p>
          <p>Volgende factuur: {maakFactuurnummer()}</p>
        </section>

        <section style={styles.stats}>
          <Card title="Klanten" value={klantenVoorBedrijf.length} />
          <Card title="Facturen" value={facturenVoorBedrijf.length} />
          <Card title="Openstaand" value={euro(openstaand)} />
          <Card title="Betaald" value="€ 0,00" />
        </section>

        <section style={styles.grid}>
          <form onSubmit={klantOpslaan} style={styles.panel}>
            <h2>Nieuwe klant</h2>
            <Input name="bedrijfsnaam" label="Bedrijfsnaam" value={klantFormulier.bedrijfsnaam} onChange={updateKlant} />
            <Input name="adres" label="Adres" value={klantFormulier.adres} onChange={updateKlant} />
            <Input name="postcode" label="Postcode" value={klantFormulier.postcode} onChange={updateKlant} />
            <Input name="plaats" label="Plaats" value={klantFormulier.plaats} onChange={updateKlant} />
            <Input name="land" label="Land" value={klantFormulier.land} onChange={updateKlant} />
            <Input name="kvk" label="KvK-nummer" value={klantFormulier.kvk} onChange={updateKlant} />
            <Input name="btw" label="BTW-nummer" value={klantFormulier.btw} onChange={updateKlant} />
            <Input name="email" label="E-mailadres" value={klantFormulier.email} onChange={updateKlant} />
            <Input name="telefoon" label="Telefoonnummer" value={klantFormulier.telefoon} onChange={updateKlant} />
            <Button>Klant opslaan</Button>
          </form>

          <form onSubmit={factuurOpslaan} style={styles.panel}>
            <h2>Nieuwe factuur</h2>
            <label style={styles.label}>Klant</label>
            <select name="klantId" value={factuurFormulier.klantId} onChange={updateFactuur} style={styles.input}>
              <option value="">Kies klant</option>
              {klantenVoorBedrijf.map((klant) => (
                <option key={klant.id} value={klant.id}>
                  {klant.bedrijfsnaam || `${klant.voornaam} ${klant.achternaam}`}
                </option>
              ))}
            </select>

            <Input name="omschrijving" label="Omschrijving" value={factuurFormulier.omschrijving} onChange={updateFactuur} />
            <Input name="aantal" label="Aantal" value={factuurFormulier.aantal} onChange={updateFactuur} />
            <Input name="prijs" label="Prijs excl. BTW" value={factuurFormulier.prijs} onChange={updateFactuur} />

            <label style={styles.label}>BTW</label>
            <select name="btwPercentage" value={factuurFormulier.btwPercentage} onChange={updateFactuur} style={styles.input}>
              <option value="9">9%</option>
              <option value="21">21%</option>
              <option value="0">0%</option>
            </select>

            <Button>Factuur opslaan</Button>
          </form>
        </section>

        <section style={styles.panel}>
          <h2>Facturenlijst</h2>
          {facturenVoorBedrijf.length === 0 ? (
            <p>Nog geen facturen gemaakt.</p>
          ) : (
            facturenVoorBedrijf.map((factuur) => (
              <div key={factuur.id} style={styles.item}>
                <strong>{factuur.nummer}</strong>
                <p>{factuur.klantNaam}</p>
                <p>{factuur.omschrijving}</p>
                <h3>Totaal: {euro(factuur.totaal)}</h3>
                <button onClick={() => downloadPdf(factuur)} style={styles.button}>
                  Download PDF
                </button>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div style={styles.card}>
      <p style={{ color: "#666" }}>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

function Input({ label, name, value, onChange }) {
  return (
    <div style={{ marginTop: "15px" }}>
      <label style={styles.label}>{label}</label>
      <input name={name} value={value} onChange={onChange} placeholder={label} style={styles.input} />
    </div>
  );
}

function Button({ children }) {
  return <button style={styles.button}>{children}</button>;
}

function euro(value) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(value || 0);
}

const styles = {
  header: {
    background: "white",
    padding: "20px 30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 12px #00000010",
  },
  select: { padding: "12px", borderRadius: "10px", border: "1px solid #ccc" },
  panel: { background: "white", padding: "30px", borderRadius: "20px", marginBottom: "25px" },
  stats: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "25px" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px", marginBottom: "25px" },
  card: { background: "white", padding: "25px", borderRadius: "20px", boxShadow: "0 4px 18px #00000010" },
  item: { border: "1px solid #eee", borderRadius: "14px", padding: "16px", marginBottom: "12px" },
  label: { display: "block", marginBottom: "6px", marginTop: "12px", fontWeight: "bold" },
  input: { width: "100%", padding: "13px", border: "1px solid #ddd", borderRadius: "10px", fontSize: "15px" },
  button: {
    marginTop: "20px",
    background: "#e79a3b",
    color: "white",
    border: 0,
    padding: "14px 22px",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
