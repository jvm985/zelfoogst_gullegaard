# 🚜 De Gullegaard - Project Handleiding

Dit project bevat een volledige Zelfoogst-app (CSA) met een React frontend, Node.js backend en PostgreSQL database, volledig gecontaineriseerd met Docker.

---

## 🚀 1. Ontwikkeling (Lokaal)

### Voorbereiding:
1.  **Installeer Node.js**: Zorg dat je een recente versie van Node.js (v20+) hebt geïnstalleerd.
2.  **PostgreSQL**: Zorg dat je een lokale PostgreSQL database hebt draaien (bijv. via Docker of een lokale installatie).
3.  **Configuratie**: Maak een `.env` bestand in `apps/backend/` gebaseerd op de instellingen daar.

### Eerste keer instellen:
1.  **Installeer alle dependencies** (in de hoofdmap):
    ```bash
    npm install
    ```
2.  **Zet de database klaar**:
    Dit commando voert de migraties uit en voegt de testdata toe:
    ```bash
    npm run db:setup
    ```

### Dagelijks gebruik (Runnen):
Je moet de backend en de frontend in twee aparte terminals starten:

*   **Terminal 1 (Backend)**:
    ```bash
    npm run dev:backend
    ```
    *De server draait nu op http://localhost:3001*

*   **Terminal 2 (Frontend)**:
    ```bash
    npm run dev:frontend
    ```
    *De website draait nu op http://localhost:5173*

---

## 📤 2. Werken met GitHub

Gebruik het meegeleverde script `push_to_github.sh`. Dit script regelt alles: initialisatie, remote instellen, staging, commit en push.

### De allereerste keer pushen:
```bash
chmod +x push_to_github.sh
./push_to_github.sh "Initial commit: Volledige app werkend"
```

### Volgende updates pushen:
Telkens als je wijzigingen hebt gemaakt die je naar de server wilt sturen:
```bash
./push_to_github.sh "Omschrijving van je wijziging"
```

---

## 🌐 3. Deployment op de Productie Server

### Voorbereiding (Eenmalig op de server):
1.  **Installeer Docker & Git**:
    ```bash
    sudo apt update
    sudo apt install docker.io docker-compose-v2 git nginx certbot python3-certbot-nginx
    ```
2.  **Clone het project**:
    ```bash
    git clone git@github.com:jvm985/zelfoogst_gullegaard.git
    cd zelfoogst_gullegaard
    chmod +x deploy.sh
    ```
3.  **Configuratie**:
    Maak een `.env` bestand in de hoofdmap met je productie-geheimen (DB wachtwoord, SMTP gegevens, etc.).

### De allereerste keer live zetten:
1.  **Start Docker**:
    ```bash
    ./deploy.sh
    ```
2.  **Nginx (Bootstrap)**:
    Kopieer de inhoud van `nginx.production.conf`, maar gebruik alleen het poort 80 blok (zonder SSL regels) om te starten.
    ```bash
    sudo nano /etc/nginx/sites-available/gullegaard
    # Plak bootstrap config (zie chat/nginx.production.conf)
    sudo ln -s /etc/nginx/sites-available/gullegaard /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
    ```
3.  **SSL Certificaat (HTTPS)**:
    ```bash
    sudo certbot --nginx -d jouw-domein.be
    ```

### Updates deployen (Telkens na een push):
Log in op je server, ga naar de projectmap en run:
```bash
./deploy.sh
```
*Dit script haalt de nieuwste code van GitHub, bouwt de Docker images opnieuw op en voert eventuele database-migraties uit.*

---

## 🛠️ Belangrijke Commando's op de Server

*   **Logs bekijken**: `docker compose logs -f`
*   **Status checken**: `docker compose ps`
*   **Database handmatig seeden**: `docker compose exec backend npx prisma db seed`
*   **Herstarten**: `docker compose restart`

---

## 🔐 Gebruikers & Testen
De app bevat na het seeden twee test-accounts op de login pagina:
*   **Beheerder**: `admin@gullegaard.be` (Wachtwoord: `Karekiet1`)
*   **Lid**: `jan@voorbeeld.be` (Wachtwoord: `test1234`)
