# Veb aplikacija za evidenciju studentskih radova 🎓

Ovaj projekat je razvijen kao rešenje za evidenciju radova, sa integrisanom proverom plagijata i vizuelnom statistikom. Sistem je u potpunosti dockerizovan radi lakšeg pokretanja i razvoja.

## 🚀 Tehnologije
* **Framework:** Next.js (App Router)
* **Baza podataka:** MySQL 8.0
* **ORM:** Prisma
* **Kontejnerizacija:** Docker & Docker Compose
* **Eksterni API:** RapidAPI (Plagiarism Checker), Google Charts

---

## 🛠️ Instalacija i pokretanje (Docker)

Sledeći koraci će podići celokupno okruženje (web aplikaciju i bazu podataka).

### 1. Pokretanje servisa
```bash
docker-compose up -d --build
```
### 2. Inicijalizacija baze
# Kreiranje tabela
```bash
docker-compose exec web npx prisma db push
```

# Dockerizacija (Tehnički detalji)
Aplikacija koristi dva osnovna servisa definisana kroz docker-compose.yml:

web (Next.js): Baziran na node:18-alpine. Dockerfile izvršava npx prisma generate, gradi aplikaciju (npm run build) i pokreće server na portu 3000.

db (MySQL): Koristi zvaničnu mysql:8.0 sliku. Podaci su perzistentni zahvaljujući Docker volume-u (mysql_data), što sprečava gubitak podataka nakon restarta kontejnera.

# Eksterni API servisi
Aplikacija se integriše sa dva eksterna servisa putem REST protokola:

1. RapidAPI - Plagiarism Checker
Svrha: Automatska provera originalnosti predatih dokumenata.

Komunikacija: Šalje tekstualni sadržaj rada na POST endpoint i dobija procenat sličnosti u JSON formatu.

2. Google Charts API
Svrha: Generisanje interaktivnih grafikona na dashboard-u nastavnika.

Komunikacija: Koristi klijentsku integraciju za renderovanje statistike predaja i ocena u realnom vremenu.

Evo teksta koji možeš direktno da prekopiraš u svoj README.md (ili u Word dokumentaciju), formatiranog tako da jasno opisuje tvoju Git strategiju grananja.

# Git strategija i upravljanje granama
U projektu je korišćen standardni Git Flow model grananja kako bi se osigurala stabilnost koda i omogućio paralelan rad na različitim funkcionalnostima.

Pregled korišćenih grana:
main: Predstavlja stabilnu verziju projekta koja je uvek spremna za produkciju. Ovde se nalazi proveren i testiran kod koji je prošao sve faze razvoja.

develop: Glavna integraciona grana. Služi za spajanje svih gotovih funkcionalnosti (features) pre nego što se one prebace u main granu. Svi razvojni procesi se primarno dešavaju ovde.

feature/login: Namenska grana korišćena za razvoj sistema autentifikacije. Na ovoj grani je implementirana logika za registraciju korisnika, JWT sesije, hashing lozinki i zaštitu ruta.

feature/dashboard: Dodatna funkcionalna grana fokusirana na razvoj kontrolne table za profesore i studente. 

Proces rada (Workflow):
Svaka nova funkcionalnost započeta je kreiranjem nove feature/ grane iz develop grane. Po završetku rada, grana je spajana (merge) nazad u develop radi integracionog testiranja, dok je main ažuriran isključivo iz develop grane kada su sve funkcionalnosti potvrđene kao stabilne.