# 🚜 Mijn CSA - Project Handleiding

Dit project is een webapplicatie voor een zelfoogstboerderij (CSA), waarmee leden hun oogst kunnen plannen, recepten kunnen vinden en de boer de teelt kan beheren.

## 🏗️ Projectstructuur

Het project is een monorepo gebouwd met:
- **Frontend**: React + Vite + Tailwind CSS + Lucide React
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Infrastructuur**: Docker + Docker Compose + Nginx

## 🚀 Snel Starten (Development)

### 1. Vereisten
- Docker & Docker Compose
- Node.js (v18+) & npm

### 2. Installatie
```bash
git clone git@github.com:jvm985/zelfoogst_gullegaard.git
cd zelfoogst_gullegaard
npm install
```

### 3. Database opzetten
```bash
docker-compose up -d db
cd apps/backend
npx prisma migrate dev
npx prisma db seed
```

### 4. Applicatie starten
```bash
# In de root directory
npm run dev
```

De frontend draait op `http://localhost:5173` en de backend op `http://localhost:3000`.

## 🚢 Productie Deployment

### Nginx Configuratie
Gebruik het meegeleverde `nginx.production.conf` als basis.
```bash
sudo nano /etc/nginx/sites-available/mijn-csa
# Kopieer inhoud van nginx.production.conf
sudo ln -s /etc/nginx/sites-available/mijn-csa /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Deployment Script
Er is een `deploy.sh` script aanwezig om de laatste wijzigingen van GitHub te trekken en de containers te herstarten.

## 🛠️ Belangrijke Commando's

- `npm run dev`: Start frontend & backend in dev mode.
- `npm run build`: Build de volledige applicatie.
- `npx prisma studio`: Open de database browser (in `apps/backend`).

## 🔐 Authenticatie

De applicatie gebruikt JWT (JSON Web Tokens) voor authenticatie.
*   **Beheerder**: `admin@mijn-csa.be` (Wachtwoord: `Karekiet1`)

## 📄 Licentie
Dit project is privébezit.
