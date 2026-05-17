import React, { useState } from "react";

export default function App() {
  const bedrijven = [
    {
      naam: "Cafetaria Ten Beste Corner B.V.",
      kvk: "98498762",
      btw: "NL868520895B01",
      iban: "NL85ABNA0120545004",
    },
    {
      naam: "Ten Beste Investment B.V.",
      kvk: "98613375",
      btw: "NL868569021B01",
      iban: "NL03ABNA0149841159",
    },
  ];

  const [bedrijfIndex, setBedrijfIndex] = useState(0);
  const [klanten, setKlanten] = useState([]);
  const [formulier, setFormulier] = useState({
    type: "Bedrijf",
    bedrijfsnaam: "",
    adres: "",
    postcode: "",
    plaats: "",
    land: "Nederland",
    kvk: "",
    btw: "",
    aanhef: "",
    voornaam: "",
    achternaam: "",
    email: "",
    telefoon: "",
  });

  const actiefBedrijf = bedrijven[bedrijfIndex];

  function updateFormulier(e) {
    const { name, value } = e.target;
    setFormulier({ ...formulier, [name]: value });
  }

  function klantOpslaan(e) {
    e.preventDefault();

    if (!formulier.bedrijfsnaam && !formulier.voornaam) {
      alert("Vul minimaal een bedrijfsnaam of voornaam in.");
      return;
    }

    const nieuweKlant = {
      id: Date.now(),
      bedrijf: actiefBedrijf.naam,
      ...formulier,
    };

    setKlanten([nieuweKlant, ...klanten]);

    setFormulier({
      type: "Bedrijf",
      bedrijfsnaam: "",
      adres: "",
      postcode: "",
      plaats: "",
      land: "Nederland",
      kvk: "",
      btw: "",
      aanhef: "",
      voornaam: "",
      achternaam: "",
      email: "",
      telefoon: "",
    });
  }

  const klantenVoorBedrijf = klanten.filter(
    (klant) => klant.bedrijf === actiefBedrijf.naam
  );

  return (
    <div
      style={{
        fontFamily: "Arial",
        background: "#f4eee5",
        minHeight: "100vh",
      }}
    >
      <header
        style={{
          background: "white",
          padding: "20px 30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 12px #00000010",
        }}
      >
        <h1 style={{ color: "#e79a3b", margin: 0 }}>
          Ten Beste Facturatie
        </h1>

        <select
          value={bedrijfIndex}
          onChange={(e) => setBedrijfIndex(Number(e.target.value))}
          style={{
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid #ccc",
          }}
        >
          {bedrijven.map((bedrijf, index) => (
            <option key={index} value={index}>
              {bedrijf.naam}
            </option>
          ))}
        </select>
      </header>

      <main style={{ padding: "30px" }}>
        <section
          style={{
            background: "white",
            padding: "30px",
            borderRadius: "20px",
            marginBottom: "25px",
          }}
        >
          <h2>{actiefBedrijf.naam}</h2>
          <p>KvK: {actiefBedrijf.kvk}</p>
          <p>BTW: {actiefBedrijf.btw}</p>
          <p>IBAN: {actiefBedrijf.iban}</p>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "20px",
            marginBottom: "25px",
          }}
        >
          <Card title="Klanten" value={klantenVoorBedrijf.length} />
          <Card title="Facturen" value="0" />
          <Card title="Openstaand" value="€ 0,00" />
          <Card title="Betaald" value="€ 0,00" />
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: "25px",
          }}
        >
          <form
            onSubmit={klantOpslaan}
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "20px",
            }}
          >
            <h2>Nieuwe klant</h2>

            <label>
              <input
                type="radio"
                name="type"
                value="Bedrijf"
                checked={formulier.type === "Bedrijf"}
                onChange={updateFormulier}
              />{" "}
              Bedrijf
            </label>

            <label style={{ marginLeft: "20px" }}>
              <input
                type="radio"
                name="type"
                value="Particulier"
                checked={formulier.type === "Particulier"}
                onChange={updateFormulier}
              />{" "}
              Particulier
            </label>

            <Input
              name="bedrijfsnaam"
              label="Bedrijfsnaam"
              value={formulier.bedrijfsnaam}
              onChange={updateFormulier}
            />

            <Input
              name="adres"
              label="Adres"
              value={formulier.adres}
              onChange={updateFormulier}
            />

            <Input
              name="postcode"
              label="Postcode"
              value={formulier.postcode}
              onChange={updateFormulier}
            />

            <Input
              name="plaats"
              label="Plaats"
              value={formulier.plaats}
              onChange={updateFormulier}
            />

            <Input
              name="land"
              label="Land"
              value={formulier.land}
              onChange={updateFormulier}
            />

            <Input
              name="kvk"
              label="KvK-nummer"
              value={formulier.kvk}
              onChange={updateFormulier}
            />

            <Input
              name="btw"
              label="BTW-nummer"
              value={formulier.btw}
              onChange={updateFormulier}
            />

            <h2 style={{ marginTop: "30px" }}>Contactpersoon</h2>

            <Input
              name="aanhef"
              label="Aanhef"
              value={formulier.aanhef}
              onChange={updateFormulier}
            />

            <Input
              name="voornaam"
              label="Voornaam"
              value={formulier.voornaam}
              onChange={updateFormulier}
            />

            <Input
              name="achternaam"
              label="Achternaam"
              value={formulier.achternaam}
              onChange={updateFormulier}
            />

            <Input
              name="email"
              label="E-mailadres"
              value={formulier.email}
              onChange={updateFormulier}
            />

            <Input
              name="telefoon"
              label="Telefoonnummer"
              value={formulier.telefoon}
              onChange={updateFormulier}
            />

            <button
              style={{
                marginTop: "20px",
                background: "#e79a3b",
                color: "white",
                border: 0,
                padding: "14px 22px",
                borderRadius: "12px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Klant opslaan
            </button>
          </form>

          <div
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "20px",
            }}
          >
            <h2>Klantenlijst</h2>

            {klantenVoorBedrijf.length === 0 ? (
              <p>Nog geen klanten toegevoegd.</p>
            ) : (
              klantenVoorBedrijf.map((klant) => (
                <div
                  key={klant.id}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: "14px",
                    padding: "16px",
                    marginBottom: "12px",
                  }}
                >
                  <strong>
                    {klant.bedrijfsnaam ||
                      `${klant.voornaam} ${klant.achternaam}`}
                  </strong>

                  <p>
                    {klant.adres}, {klant.postcode} {klant.plaats}
                  </p>

                  <p>{klant.email}</p>

                  <p>{klant.telefoon}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div
      style={{
        background: "white",
        padding: "25px",
        borderRadius: "20px",
        boxShadow: "0 4px 18px #00000010",
      }}
    >
      <p style={{ color: "#666" }}>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

function Input({ label, name, value, onChange }) {
  return (
    <div style={{ marginTop: "15px" }}>
      <label
        style={{
          display: "block",
          marginBottom: "6px",
          fontWeight: "bold",
        }}
      >
        {label}
      </label>

      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={label}
        style={{
          width: "100%",
          padding: "13px",
          border: "1px solid #ddd",
          borderRadius: "10px",
          fontSize: "15px",
        }}
      />
    </div>
  );
}
