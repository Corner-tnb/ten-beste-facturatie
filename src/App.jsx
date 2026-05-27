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
      startNummer: 5,
    },
  ];

  const [pagina, setPagina] = useState("dashboard");
  const [bedrijfIndex, setBedrijfIndex] = useState(0);
  const [session, setSession] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  const [klanten, setKlanten] = useState([]);
  const [producten, setProducten] = useState([]);
  const [facturen, setFacturen] = useState([]);
  const [factuurregels, setFactuurregels] = useState([]);

  const [bewerkFactuur, setBewerkFactuur] = useState(null);
  const [previewFactuur, setPreviewFactuur] = useState(null);
  const [bewerkKlant, setBewerkKlant] = useState(null);
  const [bewerkProduct, setBewerkProduct] = useState(null);

  const [zoekterm, setZoekterm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Alles");
  const [darkMode, setDarkMode] = useState(false);

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

  const [productForm, setProductForm] = useState({
    omschrijving: "",
    categorie: "",
    prijs: "",
    btw_percentage: 21,
  });

  const [factuurForm, setFactuurForm] = useState({
    klantId: "",
    regels: [{ omschrijving: "", aantal: 1, prijs: "", btwPercentage: 21 }],
    notitie: "",
  });

  const bedrijf = bedrijven[bedrijfIndex];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) laadData();
  }, [session]);

  async function login(e) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword(loginForm);

    if (error) alert(error.message);
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  async function laadData() {
    const k = await supabase.from("klanten").select("*").order("id", { ascending: false });
    const p = await supabase.from("producten").select("*").order("id", { ascending: false });
    const f = await supabase.from("facturen").select("*").order("id", { ascending: false });
    const r = await supabase.from("factuurregels").select("*").order("id", { ascending: true });

    if (!k.error) setKlanten(k.data || []);
    if (!p.error) setProducten(p.data || []);
    if (!f.error) setFacturen(f.data || []);
    if (!r.error) setFactuurregels(r.data || []);
  }

  const klantenBedrijf = klanten.filter((k) => k.bedrijf === bedrijf.naam);
  const productenBedrijf = producten.filter((p) => p.bedrijf === bedrijf.naam);
  const alleFacturenBedrijf = facturen.filter((f) => f.bedrijf === bedrijf.naam);

  const facturenBedrijf = alleFacturenBedrijf.filter((f) => {
    const tekst = `${f.factuurnummer} ${f.klant_naam} ${f.status}`.toLowerCase();
    return (
      tekst.includes(zoekterm.toLowerCase()) &&
      (statusFilter === "Alles" || f.status === statusFilter)
    );
  });

  function euro(v) {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(Number(v || 0));
  }

async function haalVolgendFactuurnummer() {
  const { data: facturenData } = await supabase
    .from("facturen")
    .select("factuurnummer")
    .eq("bedrijf", bedrijf.naam);

  let hoogste = bedrijf.startNummer - 1;

  (facturenData || []).forEach((f) => {
    const nr = Number(
      String(f.factuurnummer).split(".")[1]
    );

    if (nr > hoogste) hoogste = nr;
  });

  const nieuwNummer = hoogste + 1;

  return `2026.${String(nieuwNummer).padStart(4, "0")}`;
}
  


  function berekenRegel(r) {
    const subtotaal = Number(r.aantal || 0) * Number(r.prijs || 0);
    const btw = subtotaal * (Number(r.btwPercentage || r.btw_percentage || 0) / 100);
    return { subtotaal, btw, totaal: subtotaal + btw };
  }

  function berekenRegels(regels) {
    return regels.reduce(
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

  function berekenFactuur() {
    return berekenRegels(factuurForm.regels);
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

    if (error) return alert(error.message);

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

  function startKlantBewerken(klant) {
    setBewerkKlant({ ...klant });
  }

  async function klantWijzigen(e) {
    e.preventDefault();

    const update = {
      bedrijfsnaam: bewerkKlant.bedrijfsnaam,
      contactpersoon: bewerkKlant.contactpersoon,
      email: bewerkKlant.email,
      telefoon: bewerkKlant.telefoon,
      adres: bewerkKlant.adres,
      postcode: bewerkKlant.postcode,
      plaats: bewerkKlant.plaats,
      kvk: bewerkKlant.kvk,
      btw: bewerkKlant.btw,
      land: bewerkKlant.land || "Nederland",
    };

    const { data, error } = await supabase
      .from("klanten")
      .update(update)
      .eq("id", bewerkKlant.id)
      .select();

    if (error) return alert(error.message);

    setKlanten(klanten.map((k) => (k.id === bewerkKlant.id ? data[0] : k)));
    setBewerkKlant(null);
  }

  async function klantVerwijderen(id) {
    if (!confirm("Klant verwijderen?")) return;

    const { error } = await supabase.from("klanten").delete().eq("id", id);

    if (error) return alert(error.message);

    setKlanten(klanten.filter((k) => k.id !== id));
  }

  async function productOpslaan(e) {
    e.preventDefault();

    const nieuwProduct = {
      bedrijf: bedrijf.naam,
      omschrijving: productForm.omschrijving,
      categorie: productForm.categorie,
      prijs: Number(productForm.prijs),
      btw_percentage: Number(productForm.btw_percentage),
    };

    const { data, error } = await supabase.from("producten").insert([nieuwProduct]).select();

    if (error) return alert(error.message);

    setProducten([data[0], ...producten]);
    setProductForm({ omschrijving: "", categorie: "", prijs: "", btw_percentage: 21 });
  }

  function startProductBewerken(product) {
    setBewerkProduct({ ...product });
  }

  async function productWijzigen(e) {
    e.preventDefault();

    const update = {
      omschrijving: bewerkProduct.omschrijving,
      categorie: bewerkProduct.categorie,
      prijs: Number(bewerkProduct.prijs),
      btw_percentage: Number(bewerkProduct.btw_percentage),
    };

    const { data, error } = await supabase
      .from("producten")
      .update(update)
      .eq("id", bewerkProduct.id)
      .select();

    if (error) return alert(error.message);

    setProducten(producten.map((p) => (p.id === bewerkProduct.id ? data[0] : p)));
    setBewerkProduct(null);
  }

  async function productVerwijderen(id) {
    if (!confirm("Product verwijderen?")) return;

    const { error } = await supabase.from("producten").delete().eq("id", id);

    if (error) return alert(error.message);

    setProducten(producten.filter((p) => p.id !== id));
  }

  function kiesProduct(index, productId, isEdit = false) {
    const product = producten.find((p) => String(p.id) === String(productId));
    if (!product) return;

    const source = isEdit ? bewerkFactuur.regels : factuurForm.regels;
    const regels = [...source];

    regels[index] = {
      ...regels[index],
      omschrijving: product.omschrijving,
      aantal: regels[index].aantal || 1,
      prijs: product.prijs,
      btwPercentage: product.btw_percentage,
    };

    if (isEdit) setBewerkFactuur({ ...bewerkFactuur, regels });
    else setFactuurForm({ ...factuurForm, regels });
  }

  function updateRegel(index, veld, waarde, isEdit = false) {
    const source = isEdit ? bewerkFactuur.regels : factuurForm.regels;
    const regels = [...source];
    regels[index][veld] = waarde;

    if (isEdit) setBewerkFactuur({ ...bewerkFactuur, regels });
    else setFactuurForm({ ...factuurForm, regels });
  }

  function voegRegelToe(isEdit = false) {
    const nieuweRegel = { omschrijving: "", aantal: 1, prijs: "", btwPercentage: 21 };

    if (isEdit) {
      setBewerkFactuur({
        ...bewerkFactuur,
        regels: [...bewerkFactuur.regels, nieuweRegel],
      });
    } else {
      setFactuurForm({
        ...factuurForm,
        regels: [...factuurForm.regels, nieuweRegel],
      });
    }
  }

  function verwijderRegel(index, isEdit = false) {
    if (isEdit) {
      setBewerkFactuur({
        ...bewerkFactuur,
        regels: bewerkFactuur.regels.filter((_, i) => i !== index),
      });
    } else {
      setFactuurForm({
        ...factuurForm,
        regels: factuurForm.regels.filter((_, i) => i !== index),
      });
    }
  }

  async function factuurOpslaan(e) {
    e.preventDefault();

    const klant = klanten.find((k) => String(k.id) === String(factuurForm.klantId));

    if (!klant) return alert("Kies eerst een klant.");

    const totalen = berekenFactuur();

    const factuur = {
      bedrijf: bedrijf.naam,
      klant_id: klant.id,
      klant_naam: klant.bedrijfsnaam || klant.contactpersoon,
    factuurnummer: await haalVolgendFactuurnummer(),
      datum: new Date().toLocaleDateString("nl-NL"),
      vervaldatum: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("nl-NL"),
      omschrijving: "Meerdere producten",
      subtotaal: totalen.subtotaal,
      btw_bedrag: totalen.btw,
      totaal: totalen.totaal,
      status: "Open",
      notitie: factuurForm.notitie || "",
    };

    const { data, error } = await supabase.from("facturen").insert([factuur]).select();

    if (error) return alert(error.message);

    const regels = factuurForm.regels.map((r) => {
      const b = berekenRegel(r);

      return {
        factuur_id: data[0].id,
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

    if (regelsResult.error) return alert(regelsResult.error.message);

    setFacturen([data[0], ...facturen]);
    setFactuurregels([...factuurregels, ...regelsResult.data]);

    setFactuurForm({
      klantId: "",
      regels: [{ omschrijving: "", aantal: 1, prijs: "", btwPercentage: 21 }],
      notitie: "",
    });
  }

  function openBewerken(factuur) {
    const regels = factuurregels
      .filter((r) => r.factuur_id === factuur.id)
      .map((r) => ({
        id: r.id,
        omschrijving: r.omschrijving,
        aantal: r.aantal,
        prijs: r.prijs,
        btwPercentage: r.btw_percentage,
      }));

    setBewerkFactuur({
      ...factuur,
       factuurnummer: factuur.factuurnummer,
      klantId: factuur.klant_id,
      regels: regels.length ? regels : [{ omschrijving: "", aantal: 1, prijs: "", btwPercentage: 21 }],
      notitie: factuur.notitie || "",
    });

    setPagina("factuur-bewerken");
  }

  async function bewaarBewerking(e) {
    e.preventDefault();

    const klant = klanten.find((k) => String(k.id) === String(bewerkFactuur.klantId));

    if (!klant) return alert("Kies klant.");

    const totalen = berekenRegels(bewerkFactuur.regels);

    const updateFactuur = {
      factuurnummer: bewerkFactuur.factuurnummer,
      klant_id: klant.id,
      klant_naam: klant.bedrijfsnaam || klant.contactpersoon,
      subtotaal: totalen.subtotaal,
      btw_bedrag: totalen.btw,
      totaal: totalen.totaal,
      notitie: bewerkFactuur.notitie || "",
      bijgewerkt_op: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("facturen")
      .update(updateFactuur)
      .eq("id", bewerkFactuur.id)
      .select();

    if (error) return alert(error.message);

    await supabase.from("factuurregels").delete().eq("factuur_id", bewerkFactuur.id);

    const nieuweRegels = bewerkFactuur.regels.map((r) => {
      const b = berekenRegel(r);

      return {
        factuur_id: bewerkFactuur.id,
        omschrijving: r.omschrijving,
        aantal: Number(r.aantal),
        prijs: Number(r.prijs),
        btw_percentage: Number(r.btwPercentage),
        subtotaal: b.subtotaal,
        btw_bedrag: b.btw,
        totaal: b.totaal,
      };
    });

    const regelsResult = await supabase.from("factuurregels").insert(nieuweRegels).select();

    if (regelsResult.error) return alert(regelsResult.error.message);

    setFacturen(facturen.map((f) => (f.id === bewerkFactuur.id ? data[0] : f)));
    setFactuurregels([
      ...factuurregels.filter((r) => r.factuur_id !== bewerkFactuur.id),
      ...regelsResult.data,
    ]);

    setBewerkFactuur(null);
    setPagina("facturen");
  }

  async function wijzigStatus(factuur, status) {
    const { data, error } = await supabase
      .from("facturen")
      .update({
        status,
        betaald_op: status === "Betaald" ? new Date().toLocaleDateString("nl-NL") : null,
      })
      .eq("id", factuur.id)
      .select();

    if (error) return alert(error.message);

    setFacturen(facturen.map((f) => (f.id === factuur.id ? data[0] : f)));
  }

 async function verwijderFactuur(id) {
  if (!confirm("Factuur verwijderen?")) return;

  const factuur = facturen.find((f) => f.id === id);

  if (!factuur) return;

  const nummer = Number(
    String(factuur.factuurnummer).split(".")[1]
  );

  const { data: tellerData } = await supabase
    .from("factuur_tellers")
    .select("*")
    .eq("bedrijf", factuur.bedrijf)
    .limit(1);

  if (tellerData && tellerData.length > 0) {
    const teller = tellerData[0];

    if (nummer === teller.laatste_nummer) {
      await supabase
        .from("factuur_tellers")
        .update({
          laatste_nummer: nummer - 1,
        })
        .eq("id", teller.id);
    }
  }

  await supabase.from("facturen").delete().eq("id", id);

  setFacturen(facturen.filter((f) => f.id !== id));
  setFactuurregels(factuurregels.filter((r) => r.factuur_id !== id));
}
  
  async function downloadPdf(factuur) {
    const klant = klanten.find((k) => k.id === factuur.klant_id) || {};
    const regels = factuurregels.filter((r) => r.factuur_id === factuur.id);
    const doc = new jsPDF();

    const img = new Image();
    img.src = "/logo.png";

    img.onload = () => {
      doc.addImage(img, "PNG", 15, 10, 40, 20);

      doc.setFontSize(22);
      doc.setTextColor(40);
      doc.text("FACTUUR", 150, 22);

      doc.setDrawColor(220);
      doc.line(15, 38, 195, 38);

      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.text(bedrijf.naam, 15, 50);
      doc.text(bedrijf.adres || "-", 15, 56);
      doc.text(bedrijf.plaats || "-", 15, 62);
      doc.text(`KvK: ${bedrijf.kvk}`, 15, 74);
      doc.text(`BTW: ${bedrijf.btw}`, 15, 80);
      doc.text(`IBAN: ${bedrijf.iban}`, 15, 86);

      doc.setTextColor(30);
      doc.setFontSize(11);
      doc.text("Factuur aan:", 120, 50);

      doc.setFontSize(10);
      doc.text(factuur.klant_naam || "-", 120, 58);
      doc.text(klant.adres || "-", 120, 64);
      doc.text(`${klant.postcode || ""} ${klant.plaats || ""}`, 120, 70);

      doc.text(`Factuurnummer: ${factuur.factuurnummer}`, 15, 105);
      doc.text(`Factuurdatum: ${factuur.datum}`, 15, 112);
      doc.text(`Vervaldatum: ${factuur.vervaldatum || "-"}`, 15, 119);

      let y = 140;

      doc.setFillColor(79, 107, 237);
      doc.rect(15, y, 180, 10, "F");

      doc.setTextColor(255);
      doc.text("Omschrijving", 18, y + 7);
      doc.text("Aantal", 105, y + 7);
      doc.text("Prijs", 130, y + 7);
      doc.text("BTW", 155, y + 7);
      doc.text("Totaal", 173, y + 7);

      y += 16;
      doc.setTextColor(40);

      regels.forEach((r) => {
        doc.text(String(r.omschrijving || "-"), 18, y);
        doc.text(String(r.aantal), 108, y);
        doc.text(euro(r.prijs), 128, y);
        doc.text(`${r.btw_percentage}%`, 158, y);
        doc.text(euro(r.totaal), 172, y);

        doc.setDrawColor(235);
        doc.line(15, y + 4, 195, y + 4);
        y += 12;
      });

      y += 10;

      doc.setFontSize(11);
      doc.text(`Subtotaal: ${euro(factuur.subtotaal)}`, 135, y);
      doc.text(`BTW: ${euro(factuur.btw_bedrag)}`, 135, y + 8);

      doc.setFontSize(16);
      doc.setTextColor(79, 107, 237);
      doc.text(`Totaal: ${euro(factuur.totaal)}`, 135, y + 22);

      doc.setFontSize(10);
      doc.setTextColor(40);

      doc.text(
        "Wij verzoeken u vriendelijk om het factuurbedrag binnen 7 dagen na factuurdatum over te maken onder vermelding van het factuurnummer.",
        105,
        255,
        { align: "center", maxWidth: 170 }
      );

      doc.text(`${bedrijf.naam} * IBAN: ${bedrijf.iban}`, 105, 272, { align: "center" });
      doc.text(`BTW nummer: ${bedrijf.btw} * KvK nummer: ${bedrijf.kvk}`, 105, 280, { align: "center" });

      doc.save(`Factuur-${factuur.factuurnummer}.pdf`);
    };
  }

  const openstaand = alleFacturenBedrijf
    .filter((f) => f.status === "Open")
    .reduce((s, f) => s + Number(f.totaal || 0), 0);

const betaald = alleFacturenBedrijf
  .filter((f) => f.status === "Betaald")
  .reduce((s, f) => s + Number(f.totaal || 0), 0);

function exporteerCSV() {
  const rows = [
    ["Factuurnummer", "Klant", "Datum", "Status", "Subtotaal", "BTW", "Totaal"],
  ];

  alleFacturenBedrijf.forEach((f) => {
    rows.push([
      f.factuurnummer || "",
      f.klant_naam || "",
      f.datum || "",
      f.status || "",
      f.subtotaal || 0,
      f.btw_bedrag || 0,
      f.totaal || 0,
    ]);
  });

  const csv = rows.map((r) => r.join(";")).join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `boekhouding-${bedrijf.naam}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

if (!session) {
  
    return (
      <div style={s.loginPage}>
        <form onSubmit={login} style={s.loginBox}>
          <h1>Facturatie Ten Beste</h1>

          <input
            type="email"
            placeholder="E-mailadres"
            value={loginForm.email}
            onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
            style={s.input}
          />

          <input
            type="password"
            placeholder="Wachtwoord"
            value={loginForm.password}
            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
            style={s.input}
          />

          <button style={s.blueButton}>Inloggen</button>
        </form>
      </div>
    );
  }

  return (
<div
  style={{
    ...s.app,
    background: darkMode ? "#0f172a" : "#f6f7fb",
    color: darkMode ? "white" : "#111827",
  }}
  >
      <aside style={s.sidebar}>
        <h2 style={s.logo}>Facturatie Ten Beste</h2>
        <Menu label="Dashboard" active={pagina === "dashboard"} onClick={() => setPagina("dashboard")} />
        <Menu label="Facturen" active={pagina === "facturen"} onClick={() => setPagina("facturen")} />
        <Menu label="Klanten" active={pagina === "klanten"} onClick={() => setPagina("klanten")} />
        <Menu label="Producten" active={pagina === "producten"} onClick={() => setPagina("producten")} />
      </aside>

      <main style={s.main}>
        <header style={s.topbar}>
          <select value={bedrijfIndex} onChange={(e) => setBedrijfIndex(Number(e.target.value))} style={s.select}>
            {bedrijven.map((b, i) => (
              <option key={i} value={i}>{b.naam}</option>
            ))}
          </select>

<div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
  <strong>{session.user.email}</strong>

  <button
    onClick={() => setDarkMode(!darkMode)}
    style={s.blueButton}
  >
    {darkMode ? "☀️ Light" : "🌙 Dark"}
  </button>

  <button onClick={logout} style={s.redButton}>
    Uitloggen
  </button>
</div>
        </header>

        {pagina === "dashboard" && (
          <>
            <h1>Dashboard</h1>
<div
  style={{
    background: "#fff7ed",
    border: "1px solid #fdba74",
    padding: 20,
    borderRadius: 14,
    marginBottom: 20,
  }}
>
  <h2 style={{ marginTop: 0 }}>
    Debiteuren overzicht
  </h2>

  <p>
    Openstaande facturen:{" "}
    <strong>
      {
        alleFacturenBedrijf.filter(
          (f) => f.status === "Open"
        ).length
      }
    </strong>
  </p>

  <p>
    Verlopen facturen:{" "}
    <strong>
      {
        alleFacturenBedrijf.filter(
          (f) =>
            f.status === "Open" &&
            new Date(
              f.vervaldatum
                .split("/")
                .reverse()
                .join("-")
            ) < new Date()
        ).length
      }
    </strong>
  </p>

  <p>
    Openstaand bedrag:{" "}
    <strong>{euro(openstaand)}</strong>
  </p>
</div>
            <div style={s.stats}>
  <Card
    title="Omzet totaal"
    value={euro(
      alleFacturenBedrijf.reduce(
        (s, f) => s + Number(f.totaal || 0),
        0
      )
    )}
  />

  <Card
    title="BTW totaal"
    value={euro(
      alleFacturenBedrijf.reduce(
        (s, f) => s + Number(f.btw_bedrag || 0),
        0
      )
    )}
  />

  <Card
    title="Openstaand"
    value={euro(
      alleFacturenBedrijf
        .filter((f) => f.status === "Open")
        .reduce((s, f) => s + Number(f.totaal || 0), 0)
    )}
  />

  <Card
    title="Betaald"
    value={euro(
      alleFacturenBedrijf
        .filter((f) => f.status === "Betaald")
        .reduce((s, f) => s + Number(f.totaal || 0), 0)
    )}
  />

  <Card
    title="Aantal facturen"
    value={alleFacturenBedrijf.length}
  />

  <Card
    title="Aantal klanten"
    value={klantenBedrijf.length}
  />
</div>

            <section style={s.stats}>
              <Card title="Openstaand" value={euro(openstaand)} />
              <Card title="Betaald" value={euro(betaald)} />
              <Card title="Facturen" value={alleFacturenBedrijf.length} />
              <Card title="Klanten" value={klantenBedrijf.length} />
              <Card title="Open facturen" value={alleFacturenBedrijf.filter((f) => f.status === "Open").length} />
              <Card title="Betaalde facturen" value={alleFacturenBedrijf.filter((f) => f.status === "Betaald").length} />
            </section>
            <button
  onClick={exporteerCSV}
  style={{ ...s.greenButton, marginTop: 20 }}
>
  Exporteer boekhouding CSV
</button>

            <section style={{ ...s.panel, marginTop: 25 }}>
              <h2>Laatste facturen</h2>

              {alleFacturenBedrijf.slice(0, 5).map((f) => (
                <div key={f.id} style={s.invoiceRow}>
                  <strong>{f.factuurnummer}</strong>
                  <span>{f.klant_naam}</span>
                  <span>{f.datum}</span>
                  <strong>{euro(f.totaal)}</strong>
                <span
  style={
    f.status === "Betaald"
      ? s.statusPaid
      : new Date(
          f.vervaldatum.split("/").reverse().join("-")
        ) < new Date()
      ? s.statusLate
      : s.statusOpen
    
  }
>
                    {f.status}
                  </span>
                </div>
              ))}
            </section>

            <section style={{ ...s.panel, marginTop: 25 }}>
              <h2>Openstaande facturen</h2>

              {alleFacturenBedrijf
                .filter((f) => f.status === "Open")
                .map((f) => (
                  <div key={f.id} style={s.invoiceRow}>
                    <strong>{f.factuurnummer}</strong>
                    <span>{f.klant_naam}</span>
                    <span>{f.datum}</span>
                    <strong>{euro(f.totaal)}</strong>
                    <span style={s.statusOpen}>Open</span>
                  </div>
                ))}
            </section>
          </>
        )}

        {pagina === "klanten" && (
          <section style={s.panel}>
            <h1>Klanten</h1>

            <form onSubmit={klantOpslaan} style={s.formGrid}>
              {["bedrijfsnaam", "adres", "postcode", "plaats", "kvk", "btw", "voornaam", "achternaam", "email", "telefoon"].map((name) => (
                <input
                  key={name}
                  placeholder={name}
                  value={klantForm[name]}
                  onChange={(e) => setKlantForm({ ...klantForm, [name]: e.target.value })}
                  style={s.input}
                />
              ))}

              <button style={s.greenButton}>Klant opslaan</button>
            </form>

            {bewerkKlant && (
              <form onSubmit={klantWijzigen} style={s.editBox}>
                <h2>Klant wijzigen</h2>

                {["bedrijfsnaam", "contactpersoon", "email", "telefoon", "adres", "postcode", "plaats", "kvk", "btw"].map((name) => (
                  <input
                    key={name}
                    placeholder={name}
                    value={bewerkKlant[name] || ""}
                    onChange={(e) => setBewerkKlant({ ...bewerkKlant, [name]: e.target.value })}
                    style={s.input}
                  />
                ))}

                <button style={s.greenButton}>Wijzigingen opslaan</button>
                <button type="button" onClick={() => setBewerkKlant(null)} style={s.redButton}>Annuleren</button>
              </form>
            )}

            {klantenBedrijf.map((k) => (
              <div key={k.id} style={s.row4}>
                <strong>{k.bedrijfsnaam || k.contactpersoon}</strong>
                <span>{k.email}</span>
                <button onClick={() => startKlantBewerken(k)} style={s.blueButton}>Wijzig</button>
                <button onClick={() => klantVerwijderen(k.id)} style={s.redButton}>Verwijder</button>
              </div>
            ))}
          </section>
        )}

        {pagina === "producten" && (
          <section style={s.panel}>
            <h1>Producten</h1>

            <form onSubmit={productOpslaan} style={s.formGrid}>
              <input
                placeholder="Omschrijving"
                value={productForm.omschrijving}
                onChange={(e) => setProductForm({ ...productForm, omschrijving: e.target.value })}
                style={s.input}
              />

              <input
                placeholder="Categorie"
                value={productForm.categorie}
                onChange={(e) => setProductForm({ ...productForm, categorie: e.target.value })}
                style={s.input}
              />

              <input
                placeholder="Prijs"
                value={productForm.prijs}
                onChange={(e) => setProductForm({ ...productForm, prijs: e.target.value })}
                style={s.input}
              />

              <select
                value={productForm.btw_percentage}
                onChange={(e) => setProductForm({ ...productForm, btw_percentage: e.target.value })}
                style={s.input}
              >
                <option value="0">0%</option>
                <option value="9">9%</option>
                <option value="21">21%</option>
              </select>

              <button style={s.greenButton}>Product opslaan</button>
            </form>

            {bewerkProduct && (
              <form onSubmit={productWijzigen} style={s.editBox}>
                <h2>Product wijzigen</h2>

                <input
                  placeholder="Omschrijving"
                  value={bewerkProduct.omschrijving || ""}
                  onChange={(e) => setBewerkProduct({ ...bewerkProduct, omschrijving: e.target.value })}
                  style={s.input}
                />

                <input
                  placeholder="Categorie"
                  value={bewerkProduct.categorie || ""}
                  onChange={(e) => setBewerkProduct({ ...bewerkProduct, categorie: e.target.value })}
                  style={s.input}
                />

                <input
                  placeholder="Prijs"
                  value={bewerkProduct.prijs || ""}
                  onChange={(e) => setBewerkProduct({ ...bewerkProduct, prijs: e.target.value })}
                  style={s.input}
                />

                <select
                  value={bewerkProduct.btw_percentage || 21}
                  onChange={(e) => setBewerkProduct({ ...bewerkProduct, btw_percentage: e.target.value })}
                  style={s.input}
                >
                  <option value="0">0%</option>
                  <option value="9">9%</option>
                  <option value="21">21%</option>
                </select>

                <button style={s.greenButton}>Wijzigingen opslaan</button>
                <button type="button" onClick={() => setBewerkProduct(null)} style={s.redButton}>Annuleren</button>
              </form>
            )}

            {productenBedrijf.map((p) => (
              <div key={p.id} style={s.row4}>
                <strong>{p.omschrijving}</strong>
                <span>{euro(p.prijs)}</span>
                <button onClick={() => startProductBewerken(p)} style={s.blueButton}>Wijzig</button>
                <button onClick={() => productVerwijderen(p.id)} style={s.redButton}>Verwijder</button>
              </div>
            ))}
          </section>
        )}

        {pagina === "facturen" && (
          <>
            <section style={s.panel}>
              <h1>Nieuwe factuur</h1>

              <form onSubmit={factuurOpslaan}>
                <select
                  value={factuurForm.klantId}
                  onChange={(e) => setFactuurForm({ ...factuurForm, klantId: e.target.value })}
                  style={s.input}
                >
                  <option value="">Selecteer klant</option>
                  {klantenBedrijf.map((k) => (
                    <option key={k.id} value={k.id}>{k.bedrijfsnaam || k.contactpersoon}</option>
                  ))}
                </select>

                {factuurForm.regels.map((r, i) => (
                  <ProductRegel
                    key={i}
                    r={r}
                    i={i}
                    producten={productenBedrijf}
                    kiesProduct={kiesProduct}
                    updateRegel={updateRegel}
                    verwijderRegel={verwijderRegel}
                    euro={euro}
                    berekenRegel={berekenRegel}
                  />
                ))}

                <button type="button" onClick={() => voegRegelToe(false)} style={s.greenButton}>+ Product</button>

<div
  style={{
    background: darkMode ? "#111827" : "#f8fafc",
    color: darkMode ? "white" : "#111827",
    padding: 28,
    borderRadius: 24,
    marginTop: 25,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 20,
    border: darkMode
      ? "1px solid #374151"
      : "1px solid #e5e7eb",
  }}
>
  <div>
    <div
      style={{
        fontSize: 14,
        opacity: 0.7,
        marginBottom: 6,
      }}
    >
      Factuur totaal
    </div>

    <div
      style={{
        fontSize: 38,
        fontWeight: "bold",
      }}
    >
      {euro(berekenFactuur().totaal)}
    </div>
  </div>

  <button
    style={{
      ...s.blueButton,
      padding: "16px 24px",
      fontSize: 16,
    }}
  >
    Factuur opslaan
  </button>
</div>
              </form>
            </section>

            <section style={s.panel}>
              <h1>Facturen</h1>

              <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                <input
                  placeholder="Zoek op factuurnummer of klant"
                  value={zoekterm}
                  onChange={(e) => setZoekterm(e.target.value)}
                  style={s.input}
                />

                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={s.select}>
                  <option value="Alles">Alles</option>
                  <option value="Open">Openstaand</option>
                  <option value="Betaald">Betaald</option>
                </select>
              </div>

              {facturenBedrijf.map((f) => (
                <div key={f.id} style={s.invoiceRow}>
                  <span>{f.factuurnummer}</span>
                  <span>{f.klant_naam}</span>
                  <strong>{euro(f.totaal)}</strong>
                  <span style={f.status === "Betaald" ? s.statusPaid : s.statusOpen}>{f.status}</span>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    <button onClick={() => setPreviewFactuur(f)} style={s.blueButton}>Inzien</button>
                    <button onClick={() => openBewerken(f)} style={s.blueButton}>Bewerken</button>
                    <button onClick={() => downloadPdf(f)} style={s.blueButton}>PDF</button>

                    {f.status !== "Betaald" ? (
                      <button onClick={() => wijzigStatus(f, "Betaald")} style={s.greenButton}>Betaald</button>
                    ) : (
                      <button onClick={() => wijzigStatus(f, "Open")} style={s.blueButton}>Open zetten</button>
                    )}

                    <button onClick={() => verwijderFactuur(f.id)} style={s.redButton}>Verwijder</button>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}

        {previewFactuur && (
          <section style={s.panel}>
            <h1>Factuur bekijken: {previewFactuur.factuurnummer}</h1>
            <p><strong>Klant:</strong> {previewFactuur.klant_naam}</p>
            <p><strong>Datum:</strong> {previewFactuur.datum}</p>
            <p><strong>Status:</strong> {previewFactuur.status}</p>

            <h3>Producten</h3>

            {factuurregels
              .filter((r) => r.factuur_id === previewFactuur.id)
              .map((r) => (
                <div key={r.id} style={s.row5}>
                  <strong>{r.omschrijving}</strong>
                  <span>Aantal: {r.aantal}</span>
                  <span>Prijs: {euro(r.prijs)}</span>
                  <span>BTW: {r.btw_percentage}%</span>
                  <span>Totaal: {euro(r.totaal)}</span>
                </div>
              ))}

            <div style={s.totalBox}>
              <p>Subtotaal: {euro(previewFactuur.subtotaal)}</p>
              <p>BTW: {euro(previewFactuur.btw_bedrag)}</p>
              <h2>Totaal: {euro(previewFactuur.totaal)}</h2>
            </div>

            <button onClick={() => setPreviewFactuur(null)} style={s.redButton}>Sluiten</button>
          </section>
        )}

        {pagina === "factuur-bewerken" && bewerkFactuur && (
          <section style={s.panel}>
            <h1>Factuur bewerken: {bewerkFactuur.factuurnummer}</h1>
<input
  placeholder="Factuurnummer"
  value={bewerkFactuur.factuurnummer || ""}
  onChange={(e) =>
    setBewerkFactuur({
      ...bewerkFactuur,
      factuurnummer: e.target.value,
    })
  }
  style={s.input}
/>
            <form onSubmit={bewaarBewerking}>
              <select
                value={bewerkFactuur.klantId}
                onChange={(e) => setBewerkFactuur({ ...bewerkFactuur, klantId: e.target.value })}
                style={s.input}
              >
                {klantenBedrijf.map((k) => (
                  <option key={k.id} value={k.id}>{k.bedrijfsnaam || k.contactpersoon}</option>
                ))}
              </select>

              {bewerkFactuur.regels.map((r, i) => (
                <ProductRegel
                  key={i}
                  r={r}
                  i={i}
                  producten={productenBedrijf}
                  kiesProduct={(index, id) => kiesProduct(index, id, true)}
                  updateRegel={(index, veld, waarde) => updateRegel(index, veld, waarde, true)}
                  verwijderRegel={(index) => verwijderRegel(index, true)}
                  euro={euro}
                  berekenRegel={berekenRegel}
                />
              ))}

              <button type="button" onClick={() => voegRegelToe(true)} style={s.greenButton}>+ Productregel</button>

              <textarea
                placeholder="Notitie"
                value={bewerkFactuur.notitie}
                onChange={(e) => setBewerkFactuur({ ...bewerkFactuur, notitie: e.target.value })}
                style={{ ...s.input, minHeight: 90 }}
              />

<div
  style={{
color: darkMode ? "white" : "#111827",
    color: darkMode ? "white" : "#111827",
    padding: 28,
    borderRadius: 24,
    marginTop: 25,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 20,
    border: darkMode
      ? "1px solid #374151"
      : "1px solid #e5e7eb",
  }}
>
  <div>
    <div
      style={{
        fontSize: 14,
        opacity: 0.7,
        marginBottom: 6,
      }}
    >
      Factuur totaal
    </div>

    <div
      style={{
        fontSize: 38,
        fontWeight: "bold",
      }}
    >
      {euro(berekenRegels(bewerkFactuur.regels).totaal)}
    </div>
  </div>
</div>

              <button style={s.greenButton}>Wijzigingen opslaan</button>
              <button type="button" onClick={() => { setBewerkFactuur(null); setPagina("facturen"); }} style={s.redButton}>Annuleren</button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}

function ProductRegel({ r, i, producten, kiesProduct, updateRegel, verwijderRegel, euro, berekenRegel }) {
  const b = berekenRegel(r);

  return (
    <div style={s.productLine}>
      <select onChange={(e) => kiesProduct(i, e.target.value)} style={s.input}>
        <option value="">Kies product</option>
        {producten.map((p) => (
          <option key={p.id} value={p.id}>{p.omschrijving}</option>
        ))}
      </select>

      <input
        placeholder="Omschrijving"
        value={r.omschrijving || ""}
        onChange={(e) => updateRegel(i, "omschrijving", e.target.value)}
        style={s.input}
      />

      <input
        placeholder="Aantal"
        value={r.aantal || ""}
        onChange={(e) => updateRegel(i, "aantal", e.target.value)}
        style={s.smallInput}
      />

      <input
        placeholder="Prijs"
        value={r.prijs || ""}
        onChange={(e) => updateRegel(i, "prijs", e.target.value)}
        style={s.smallInput}
      />

      <select
        value={r.btwPercentage || 21}
        onChange={(e) => updateRegel(i, "btwPercentage", e.target.value)}
        style={s.smallInput}
      >
        <option value="0">0%</option>
        <option value="9">9%</option>
        <option value="21">21%</option>
      </select>

      <strong>{euro(b.totaal)}</strong>
      <button type="button" onClick={() => verwijderRegel(i)} style={s.redButton}>×</button>
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
  loginPage: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f6f7fb",
    fontFamily: "Arial",
    padding: 20,
  },

  loginBox: {
    background: "white",
    padding: 40,
    borderRadius: 20,
    width: "100%",
    maxWidth: 400,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },

app: {
  display: "flex",
  flexDirection: window.innerWidth < 900 ? "column" : "row",
  minHeight: "100vh",
  background: "#f6f7fb",
  color: "#111827",
  fontFamily: "Arial",
},

sidebar: {
  width: "100%",
  maxWidth: window.innerWidth < 900 ? "100%" : 270,
  background: "#111827",
  color: "white",
  padding: 24,
},

  logo: {
    color: "#4f6bed",
    marginBottom: 30,
  },

menu: {
  display: "block",
  width: "100%",
  padding: 14,
  marginBottom: 10,
  background: "transparent",
  color: "#d1d5db",
  border: 0,
  textAlign: "left",
  borderRadius: 14,
  fontSize: 16,
  cursor: "pointer",
},

menuActive: {
  display: "block",
  width: "100%",
  padding: 14,
  marginBottom: 10,
  background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
  color: "white",
  border: 0,
  textAlign: "left",
  borderRadius: 14,
  fontSize: 16,
  fontWeight: "bold",
  cursor: "pointer",
},

  main: {
    flex: 1,
    padding: 20,
    minWidth: 0,
  },

topbar: {
  background: "rgba(255,255,255,0.9)",
  backdropFilter: "blur(12px)",
  padding: 20,
  borderRadius: 24,
  marginBottom: 30,
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  justifyContent: "space-between",
  alignItems: "center",
  boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
},

  select: {
    padding: 12,
    borderRadius: 10,
    border: "1px solid #ddd",
    width: "100%",
    maxWidth: 320,
  },

  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: 20,
  },

card: {
  background: "linear-gradient(135deg,#ffffff,#f8fafc)",
  padding: 28,
  borderRadius: 24,
  boxShadow: "0 12px 35px rgba(0,0,0,0.08)",
  border: "1px solid #eef2ff",
  transition: "0.2s",
},

  panel: {
    background: "white",
    padding: 25,
    borderRadius: 18,
    marginBottom: 25,
    boxShadow: "0 10px 30px #00000008",
    overflowX: "auto",
  },

  editBox: {
    background: "#f8fafc",
    padding: 20,
    borderRadius: 16,
    marginTop: 20,
    marginBottom: 20,
  },

  input: {
    width: "100%",
    padding: 14,
    border: "1px solid #ddd",
    borderRadius: 10,
    marginBottom: 12,
    boxSizing: "border-box",
  },

  smallInput: {
    width: "100%",
    minWidth: 90,
    padding: 14,
    border: "1px solid #ddd",
    borderRadius: 10,
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
    gap: 12,
  },

  row4: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    padding: 15,
    borderBottom: "1px solid #eee",
    alignItems: "center",
  },

  row5: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    padding: 15,
    borderBottom: "1px solid #eee",
    alignItems: "center",
  },

  productLine: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
    marginBottom: 12,
  },

  totalBox: {
    textAlign: "right",
    marginTop: 20,
  },

greenButton: {
  background: "linear-gradient(135deg,#22c55e,#16a34a)",
  color: "white",
  padding: "12px 18px",
  border: 0,
  borderRadius: 14,
  fontWeight: "bold",
  cursor: "pointer",
  marginRight: 6,
  boxShadow: "0 8px 20px rgba(34,197,94,0.25)",
},

blueButton: {
  background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
  color: "white",
  padding: "12px 18px",
  border: 0,
  borderRadius: 14,
  fontWeight: "bold",
  cursor: "pointer",
  marginRight: 6,
  boxShadow: "0 8px 20px rgba(79,70,229,0.25)",
},

redButton: {
  background: "linear-gradient(135deg,#ef4444,#dc2626)",
  color: "white",
  padding: "12px 18px",
  border: 0,
  borderRadius: 14,
  fontWeight: "bold",
  cursor: "pointer",
  marginRight: 6,
  boxShadow: "0 8px 20px rgba(239,68,68,0.25)",
},

invoiceRow: {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  flexDirection: window.innerWidth < 700 ? "column" : "row",
  alignItems: window.innerWidth < 700 ? "flex-start" : "center",
  padding: 14,
  borderBottom: "1px solid #eee",
},

  statusPaid: {
    background: "#22c55e",
    color: "white",
    padding: "6px 10px",
    borderRadius: 8,
    fontWeight: "bold",
    textAlign: "center",
  },

  statusOpen: {
    background: "#f97316",
    color: "white",
    padding: "6px 10px",
    borderRadius: 8,
    fontWeight: "bold",
    textAlign: "center",
  },
  statusLate: {
  background: "#dc2626",
  color: "white",
  padding: "6px 10px",
  borderRadius: 8,
  fontWeight: "bold",
  textAlign: "center",
},
};
