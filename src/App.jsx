import React from "react";
import ReactDOM from "react-dom/client";

function App() {
  return (
    <div style={{
      fontFamily: "Arial",
      padding: "40px",
      background: "#fff7ed",
      minHeight: "100vh"
    }}>
      <h1 style={{ color: "#f4a14b" }}>Ten Beste Facturatie</h1>
      <p>Systeem succesvol online 🚀</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
