import React from "react";
import ReactDOM from "react-dom/client";

function App() {
  return (
    <div style={{ fontFamily: "Arial", minHeight: "100vh", background: "#fff7ed" }}>
      <header style={{
        padding: "24px 40px",
        background: "white",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 12px #00000010"
      }}>
        <h1 style={{ color: "#f4a14b", margin: 0 }}>Ten Beste Facturatie</h1>
        <button style={{
          background: "#f4a14b",
          color: "white",
          border: 0,
          padding: "12px 20px",
          borderRadius: "10px",
          fontWeight: "bold"
        }}>
          Inloggen
        </button>
      </header>

      <main style={{ padding: "40px" }}>
        <section style={{
          background: "white",
          borderRadius: "20px",
          padding: "40px",
          marginBottom: "30px"
        }}>
          <h2>Welkom bij jullie facturatiesysteem</h2>
          <p>Maak facturen, beheer klanten en verstuur straks automatisch iDEAL-betaallinks.</p>
        </section>

        <section style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px"
        }}>
          <Card title="Klanten" value="0" />
          <Card title="Facturen" value="0" />
          <Card title="Openstaand" value="€ 0,00" />
          <Card title="Betaald" value="€ 0,00" />
        </section>
      </main>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div style={{
      background: "white",
      padding: "24px",
      borderRadius: "18px",
      boxShadow: "0 4px 18px #00000010"
    }}>
      <p style={{ color: "#666" }}>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
