import React, { useState } from "react";
import ReactDOM from "react-dom/client";

function App() {
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

  function update veld(e) {}
}
