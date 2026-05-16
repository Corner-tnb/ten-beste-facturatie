import React, { useState } from "react";
import ReactDOM from "react-dom/client";

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

  const actiefBedrijf = bedrijven[bedrijfIndex];

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
        }}
      >
        <h1 style={{ color: "#e79a3b" }}>Ten Beste Facturatie</h1>

        <select
          value={bedrijfIndex}
          onChange={(e) => setBedrijfIndex(Number(e.target.value))}
          style={{
            padding: "10px",
            borderRadius: "8px",
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

      <div style={{ padding: "30px" }}>
        <div
          style={{
            background: "white",
            padding: "30px",
            borderRadius: "20px",
            marginBottom: "20px",
          }}
        >
          <h2>{actiefBedrijf.naam}</h2>

          <p>KvK: {actiefBedrijf.kvk}</p>
          <p>BTW: {actiefBedrijf.btw}</p>
          <p>IBAN: {actiefBedrijf.iban}</p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "20px",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "20px",
            }}
          >
            <h3>Klanten</h3>
            <h1>0</h1>
          </div>

          <div
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "20px",
            }}
          >
            <h3>Facturen</h3>
            <h1>0</h1>
          </div>

          <div
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "20px",
            }}
          >
            <h3>Openstaand</h3>
            <h1>€ 0,00</h1>
          </div>

          <div
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "20px",
            }}
          >
            <h3>Betaald</h3>
            <h1>€ 0,00</h1>
          </div>
        </div>
      </div>
    </div>
  );
}
}
