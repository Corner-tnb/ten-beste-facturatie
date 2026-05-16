# Ten Beste Facturatie

Complete basisversie voor **Cafetaria Ten Beste Corner B.V.**

## Functies

- Login voor alleen eigenaar
- Klantenbeheer
- Facturen aanmaken
- Abonnement-facturen
- Automatische factuurnummers vanaf `2026.0014`
- BTW 9% en 21%
- PDF-factuur generatie
- Automatische e-mails
- Mollie iDEAL betaal-link integratie
- Dashboard
- Nederlandse interface
- Ten Beste logo-kleur

## Projectstructuur

- `frontend/` React webapp
- `backend/` Node.js API
- `backend/src/db/schema.sql` database structuur
- `.env.example` voorbeeld instellingen

## Installatie

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### 2. Frontend

Open een tweede terminal:

```bash
cd frontend
npm install
npm run dev
```

Daarna openen:

```text
http://localhost:5173
```

## Belangrijk

Vul in `backend/.env` je echte gegevens in:

```text
OWNER_EMAIL=
OWNER_PASSWORD=
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
MOLLIE_API_KEY=
```

Voor iDEAL gebruik je een Mollie-account. Zet eerst een test API-key in `.env`.

## Productie

Voor echte livegang heb je nodig:

- hosting/server
- domeinnaam
- SSL-certificaat
- PostgreSQL database
- Mollie account
- SMTP/e-mailaccount
- veilige eigenaar-login

Deze versie is een complete technische basis, maar moet voor productie nog worden getest en beveiligd.