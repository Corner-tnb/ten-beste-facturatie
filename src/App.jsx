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

  const [session, setSession] = useState(null);

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [klanten, setKlanten] = useState([]);
  const [producten, setProducten] = useState([]);
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

  const [productForm, setProductForm] = useState({
    omschrijving: "",
    categorie: "",
    prijs: "",
    btw_percentage: 21,
  });

  const [factuurForm, setFactuurForm] = useState({
    klantId: "",
    regels: [{ omschrijving: "", aantal: 1, prijs: "", btwPercentage: 21 }],
  });

  const bedrijf = bedrijven[bedrijfIndex];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      laadData();
    }
  }, [session]);

  async function login(e) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password,
    });

    if (error) {
      alert(error.message);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  async function laadData() {
    const k = await supabase.from("klanten").select("*");
    const p = await supabase.from("producten").select("*");
    const f = await supabase.from("facturen").select("*");
    const r = await supabase.from("factuurregels").select("*");

    if (!k.error) setKlanten(k.data || []);
    if (!p.error) setProducten(p.data || []);
    if (!f.error) setFacturen(f.data || []);
    if (!r.error) setFactuurregels(r.data || []);
  }

  const klantenBedrijf = klanten.filter((k) => k.bedrijf === bedrijf.naam);
  const productenBedrijf = producten.filter((p) => p.bedrijf === bedrijf.naam);
  const facturenBedrijf = facturen.filter((f) => f.bedrijf === bedrijf.naam);

  function euro(v) {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(Number(v || 0));
  }

  function volgendeFactuurnummer() {
    return `2026.${String(
      facturenBedrijf.length + bedrijf.startNummer
    ).padStart(4, "0")}`;
  }

  function berekenRegel(r) {
    const subtotaal = Number(r.aantal || 0) * Number(r.prijs || 0);
    const btw =
      subtotaal * (Number(r.btwPercentage || 0) / 100);

    return {
      subtotaal,
      btw,
      totaal: subtotaal + btw,
    };
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
      contactpersoon:
        `${klantForm.voornaam} ${klantForm.achternaam}`.trim(),
      email: klantForm.email,
      telefoon: klantForm.telefoon,
      adres: klantForm.adres,
      postcode: klantForm.postcode,
      plaats: klantForm.plaats,
      kvk: klantForm.kvk,
      btw: klantForm.btw,
      land: "Nederland",
    };

    const { data, error } = await supabase
      .from("klanten")
      .insert([nieuweKlant])
      .select();

    if (error) {
      return alert(error.message);
    }

    setKlanten([data[0], ...klanten]);
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

    const { data, error } = await supabase
      .from("producten")
      .insert([nieuwProduct])
      .select();

    if (error) {
      return alert(error.message);
    }

    setProducten([data[0], ...producten]);
  }

  function kiesProduct(index, productId) {
    const product = producten.find(
      (p) => String(p.id) === String(productId)
    );

    if (!product) return;

    const regels = [...factuurForm.regels];

    regels[index] = {
      omschrijving: product.omschrijving,
      aantal: regels[index].aantal || 1,
      prijs: product.prijs,
      btwPercentage: product.btw_percentage,
    };

    setFactuurForm({
      ...factuurForm,
      regels,
    });
  }

  function updateRegel(index, veld, waarde) {
    const regels = [...factuurForm.regels];
    regels[index][veld] = waarde;

    setFactuurForm({
      ...factuurForm,
      regels,
    });
  }

  function voegRegelToe() {
    setFactuurForm({
      ...factuurForm,
      regels: [
        ...factuurForm.regels,
        {
          omschrijving: "",
          aantal: 1,
          prijs: "",
          btwPercentage: 21,
        },
      ],
    });
  }

  async function factuurOpslaan(e) {
    e.preventDefault();

    const klant = klanten.find(
      (k) => String(k.id) === String(factuurForm.klantId)
    );

    if (!klant) {
      return alert("Kies eerst een klant");
    }

    const totalen = berekenFactuur();

    const factuur = {
      bedrijf: bedrijf.naam,
      klant_id: klant.id,
      klant_naam:
        klant.bedrijfsnaam || klant.contactpersoon,
      factuurnummer: volgendeFactuurnummer(),
      datum: new Date().toLocaleDateString("nl-NL"),
      totaal: totalen.totaal,
      subtotaal: totalen.subtotaal,
      btw_bedrag: totalen.btw,
      status: "Open",
    };

    const { data, error } = await supabase
      .from("facturen")
      .insert([factuur])
      .select();

    if (error) {
      return alert(error.message);
    }

    const factuurId = data[0].id;

    const regels = factuurForm.regels.map((r) => {
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

    await supabase.from("factuurregels").insert(regels);

    laadData();
  }

  async function wijzigStatus(factuur, status) {
    const { data, error } = await supabase
      .from("facturen")
      .update({
        status,
      })
      .eq("id", factuur.id)
      .select();

    if (error) {
      return alert(error.message);
    }

    setFacturen(
      facturen.map((f) =>
        f.id === factuur.id ? data[0] : f
      )
    );
  }

  async function verwijderFactuur(id) {
    if (!confirm("Factuur verwijderen?")) return;

    await supabase
      .from("facturen")
      .delete()
      .eq("id", id);

    laadData();
  }

  function downloadPdf(factuur) {
    const doc = new jsPDF();

    doc.text("Factuur", 20, 20);
    doc.text(
      `Factuurnummer: ${factuur.factuurnummer}`,
      20,
      40
    );

    doc.text(
      `Klant: ${factuur.klant_naam}`,
      20,
      50
    );

    doc.text(
      `Totaal: ${euro(factuur.totaal)}`,
      20,
      60
    );

    doc.save(`factuur-${factuur.factuurnummer}.pdf`);
  }

  const openstaand = facturenBedrijf
    .filter((f) => f.status === "Open")
    .reduce((s, f) => s + Number(f.totaal || 0), 0);

  const betaald = facturenBedrijf
    .filter((f) => f.status === "Betaald")
    .reduce((s, f) => s + Number(f.totaal || 0), 0);

  if (!session) {
    return (
      <div style={s.loginPage}>
        <form onSubmit={login} style={s.loginBox}>
          <h1>Facturatie Ten Beste</h1>

          <input
            type="email"
            placeholder="E-mailadres"
            value={loginForm.email}
            onChange={(e) =>
              setLoginForm({
                ...loginForm,
                email: e.target.value,
              })
            }
            style={s.input}
          />

          <input
            type="password"
            placeholder="Wachtwoord"
            value={loginForm.password}
            onChange={(e) =>
              setLoginForm({
                ...loginForm,
                password: e.target.value,
              })
            }
            style={s.input}
          />

          <button style={s.blueButton}>
            Inloggen
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={s.app}>
      <aside style={s.sidebar}>
        <h2 style={s.logo}>
          Facturatie Ten Beste
        </h2>

        <Menu
          label="Dashboard"
          active={pagina === "dashboard"}
          onClick={() => setPagina("dashboard")}
        />

        <Menu
          label="Facturen"
          active={pagina === "facturen"}
          onClick={() => setPagina("facturen")}
        />

        <Menu
          label="Klanten"
          active={pagina === "klanten"}
          onClick={() => setPagina("klanten")}
        />

        <Menu
          label="Producten"
          active={pagina === "producten"}
          onClick={() => setPagina("producten")}
        />
      </aside>

      <main style={s.main}>
        <header style={s.topbar}>
          <select
            value={bedrijfIndex}
            onChange={(e) =>
              setBedrijfIndex(Number(e.target.value))
            }
            style={s.select}
          >
            {bedrijven.map((b, i) => (
              <option key={i} value={i}>
                {b.naam}
              </option>
            ))}
          </select>

          <div style={{ display: "flex", gap: 10 }}>
            <strong>{session.user.email}</strong>

            <button
              onClick={logout}
              style={s.redButton}
            >
              Uitloggen
            </button>
          </div>
        </header>

        {pagina === "dashboard" && (
          <>
            <h1>Dashboard</h1>

            <section style={s.stats}>
              <Card
                title="Openstaand"
                value={euro(openstaand)}
              />

              <Card
                title="Betaald"
                value={euro(betaald)}
              />

              <Card
                title="Facturen"
                value={facturenBedrijf.length}
              />

              <Card
                title="Klanten"
                value={klantenBedrijf.length}
              />
            </section>
          </>
        )}

        {pagina === "klanten" && (
          <section style={s.panel}>
            <h1>Klanten</h1>

            <form
              onSubmit={klantOpslaan}
              style={s.formGrid}
            >
              <input
                placeholder="Bedrijfsnaam"
                value={klantForm.bedrijfsnaam}
                onChange={(e) =>
                  setKlantForm({
                    ...klantForm,
                    bedrijfsnaam: e.target.value,
                  })
                }
                style={s.input}
              />

              <input
                placeholder="E-mail"
                value={klantForm.email}
                onChange={(e) =>
                  setKlantForm({
                    ...klantForm,
                    email: e.target.value,
                  })
                }
                style={s.input}
              />

              <button style={s.greenButton}>
                Klant opslaan
              </button>
            </form>
          </section>
        )}

        {pagina === "producten" && (
          <section style={s.panel}>
            <h1>Producten</h1>

            <form
              onSubmit={productOpslaan}
              style={s.formGrid}
            >
              <input
                placeholder="Omschrijving"
                value={productForm.omschrijving}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    omschrijving: e.target.value,
                  })
                }
                style={s.input}
              />

              <input
                placeholder="Prijs"
                value={productForm.prijs}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    prijs: e.target.value,
                  })
                }
                style={s.input}
              />

              <button style={s.greenButton}>
                Product opslaan
              </button>
            </form>
          </section>
        )}

        {pagina === "facturen" && (
          <>
            <section style={s.panel}>
              <h1>Nieuwe factuur</h1>

              <form onSubmit={factuurOpslaan}>
                <select
                  value={factuurForm.klantId}
                  onChange={(e) =>
                    setFactuurForm({
                      ...factuurForm,
                      klantId: e.target.value,
                    })
                  }
                  style={s.input}
                >
                  <option value="">
                    Selecteer klant
                  </option>

                  {klantenBedrijf.map((k) => (
                    <option
                      key={k.id}
                      value={k.id}
                    >
                      {k.bedrijfsnaam ||
                        k.contactpersoon}
                    </option>
                  ))}
                </select>

                {factuurForm.regels.map((r, i) => {
                  const b = berekenRegel(r);

                  return (
                    <div
                      key={i}
                      style={s.productLine}
                    >
                      <select
                        onChange={(e) =>
                          kiesProduct(
                            i,
                            e.target.value
                          )
                        }
                        style={s.input}
                      >
                        <option value="">
                          Kies product
                        </option>

                        {productenBedrijf.map(
                          (p) => (
                            <option
                              key={p.id}
                              value={p.id}
                            >
                              {p.omschrijving}
                            </option>
                          )
                        )}
                      </select>

                      <input
                        value={r.omschrijving}
                        onChange={(e) =>
                          updateRegel(
                            i,
                            "omschrijving",
                            e.target.value
                          )
                        }
                        style={s.input}
                      />

                      <input
                        value={r.aantal}
                        onChange={(e) =>
                          updateRegel(
                            i,
                            "aantal",
                            e.target.value
                          )
                        }
                        style={s.smallInput}
                      />

                      <input
                        value={r.prijs}
                        onChange={(e) =>
                          updateRegel(
                            i,
                            "prijs",
                            e.target.value
                          )
                        }
                        style={s.smallInput}
                      />

                      <strong>
                        {euro(b.totaal)}
                      </strong>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={voegRegelToe}
                  style={s.greenButton}
                >
                  + Product
                </button>

                <div style={s.totalBox}>
                  <h2>
                    Totaal:{" "}
                    {euro(
                      berekenFactuur().totaal
                    )}
                  </h2>
                </div>

                <button style={s.blueButton}>
                  Factuur opslaan
                </button>
              </form>
            </section>

            <section style={s.panel}>
              <h1>Facturen</h1>

              {facturenBedrijf.map((f) => (
                <div
                  key={f.id}
                  style={s.invoiceRow}
                >
                  <span>
                    {f.factuurnummer}
                  </span>

                  <span>
                    {f.klant_naam}
                  </span>

                  <strong>
                    {euro(f.totaal)}
                  </strong>

                  <span
                    style={
                      f.status === "Betaald"
                        ? s.statusPaid
                        : s.statusOpen
                    }
                  >
                    {f.status}
                  </span>

                  <div>
                    <button
                      onClick={() =>
                        downloadPdf(f)
                      }
                      style={s.blueButton}
                    >
                      PDF
                    </button>

                    {f.status !==
                    "Betaald" ? (
                      <button
                        onClick={() =>
                          wijzigStatus(
                            f,
                            "Betaald"
                          )
                        }
                        style={s.greenButton}
                      >
                        Betaald
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          wijzigStatus(
                            f,
                            "Open"
                          )
                        }
                        style={s.blueButton}
                      >
                        Open zetten
                      </button>
                    )}

                    <button
                      onClick={() =>
                        verwijderFactuur(
                          f.id
                        )
                      }
                      style={s.redButton}
                    >
                      Verwijder
                    </button>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function Menu({
  label,
  active,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      style={
        active
          ? s.menuActive
          : s.menu
      }
    >
      {label}
    </button>
  );
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
  },

  loginBox: {
    background: "white",
    padding: 40,
    borderRadius: 20,
    width: 400,
    boxShadow:
      "0 10px 30px rgba(0,0,0,0.08)",
  },

  app: {
    display: "flex",
    minHeight: "100vh",
    background: "#f6f7fb",
    fontFamily: "Arial",
  },

  sidebar: {
    width: 270,
    background: "white",
    padding: 24,
    boxShadow:
      "2px 0 20px #00000010",
  },

  logo: {
    color: "#4f6bed",
    marginBottom: 30,
  },

  menu: {
    display: "block",
    width: "100%",
    padding: 14,
    marginBottom: 8,
    background: "white",
    border: 0,
    textAlign: "left",
    borderRadius: 10,
    fontSize: 16,
  },

  menuActive: {
    display: "block",
    width: "100%",
    padding: 14,
    marginBottom: 8,
    background: "#5b6ee1",
    color: "white",
    border: 0,
    textAlign: "left",
    borderRadius: 10,
    fontSize: 16,
  },

  main: {
    flex: 1,
    padding: 30,
  },

  topbar: {
    background: "white",
    padding: 20,
    borderRadius: 18,
    marginBottom: 25,
    display: "flex",
    justifyContent: "space-between",
  },

  select: {
    padding: 12,
    borderRadius: 10,
    border: "1px solid #ddd",
  },

  stats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4,1fr)",
    gap: 20,
  },

  card: {
    background: "white",
    padding: 25,
    borderRadius: 18,
    boxShadow:
      "0 10px 30px #00000008",
  },

  panel: {
    background: "white",
    padding: 25,
    borderRadius: 18,
    marginBottom: 25,
    boxShadow:
      "0 10px 30px #00000008",
  },

  input: {
    width: "100%",
    padding: 14,
    border: "1px solid #ddd",
    borderRadius: 10,
    marginBottom: 12,
  },

  smallInput: {
    width: 100,
    padding: 14,
    border: "1px solid #ddd",
    borderRadius: 10,
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap: 12,
  },

  productLine: {
    display: "grid",
    gridTemplateColumns:
      "200px 1fr 100px 100px 120px",
    gap: 10,
    alignItems: "center",
    marginBottom: 12,
  },

  totalBox: {
    textAlign: "right",
    marginTop: 20,
  },

  greenButton: {
    background: "#22c55e",
    color: "white",
    padding: "10px 14px",
    border: 0,
    borderRadius: 10,
    fontWeight: "bold",
    cursor: "pointer",
    marginRight: 6,
  },

  blueButton: {
    background: "#4f6bed",
    color: "white",
    padding: "10px 14px",
    border: 0,
    borderRadius: 10,
    fontWeight: "bold",
    cursor: "pointer",
    marginRight: 6,
  },

  redButton: {
    background: "#ef4444",
    color: "white",
    padding: "10px 14px",
    border: 0,
    borderRadius: 10,
    fontWeight: "bold",
    cursor: "pointer",
  },

  invoiceRow: {
    display: "grid",
    gridTemplateColumns:
      "120px 1fr 120px 100px 340px",
    gap: 12,
    alignItems: "center",
    padding: 14,
    borderBottom:
      "1px solid #eee",
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
};
