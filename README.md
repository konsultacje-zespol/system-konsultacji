# System konsultacji

Aplikacja do zapisów na dyżury (konsultacje) prowadzących. Repozytorium ma dwa niezależne projekty:

- `backend/` — API: Node.js 20, Express 5, JavaScript (ES modules), PostgreSQL 16;
- `frontend/` — aplikacja React 18 + Vite 5 w JavaScripcie, style w SCSS.

Każdy folder ma własny `package.json` — polecenia `npm` uruchamiamy osobno w `backend/` i w `frontend/`.

## Wymagania

- Windows 11 + PowerShell
- [Node.js 20](https://nodejs.org/) (albo nowszy) i npm
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (WSL2)
- Git

## Pierwsze uruchomienie krok po kroku

1. Uruchom Docker Desktop i poczekaj, aż będzie gotowy.
2. W głównym folderze repozytorium uruchom bazę danych i Mailpit:

   ```powershell
   docker compose up -d
   docker compose ps
   ```

   Oba kontenery (`postgres` i `mailpit`) powinny mieć status `running`, a `postgres` dodatkowo `healthy`.

3. Skopiuj pliki ze zmiennymi środowiskowymi backendu:

   ```powershell
   Copy-Item backend\.env.example backend\.env
   Copy-Item backend\.env.test.example backend\.env.test
   ```

4. Uruchom backend (pierwsze okno PowerShell):

   ```powershell
   cd backend
   npm install
   npm run dev
   ```

5. Uruchom frontend (drugie okno PowerShell):

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

6. Sprawdź, czy wszystko działa: otwórz <http://localhost:3000/api/v1/health> — odpowiedź to `{"status":"ok"}`.

## Adresy

| Co | Adres |
|---|---|
| Frontend | <http://localhost:5173> |
| API | <http://localhost:3000/api/v1> |
| Swagger (dokumentacja API) | <http://localhost:3000/api/docs> |
| Mailpit (podgląd wysłanych e-maili) | <http://localhost:8025> |

## Bazy danych

Docker tworzy dwie bazy: `konsultacje` (praca na co dzień) i `konsultacje_test` (testy automatyczne).
Podgląd listy baz:

```powershell
docker compose exec postgres psql -U postgres -c "\l"
```

## Jak wyczyścić bazę od zera

```powershell
docker compose down -v
docker compose up -d
```

`-v` usuwa wolumen z danymi. **Uwaga:** skrypt `docker/postgres/init/01-create-test-db.sql`, który tworzy bazę
`konsultacje_test`, uruchamia się tylko przy starcie z pustym wolumenem. Jeśli brakuje bazy testowej, wykonaj dwa polecenia
powyżej.

## Przydatne polecenia

| Folder | Polecenie | Co robi |
|---|---|---|
| `backend/` | `npm run dev` | API z automatycznym restartem po zmianie pliku |
| `backend/` | `npm run lint` | Sprawdza kod ESLintem |
| `backend/` | `npm run test` | Testy jednostkowe (bez bazy) |
| `backend/` | `npm run test:int` | Testy integracyjne na bazie `konsultacje_test` — opis w [`docs/tests.md`](docs/tests.md) |
| `frontend/` | `npm run dev` | Serwer deweloperski Vite |
| `frontend/` | `npm run lint` | Sprawdza kod ESLintem |
| `frontend/` | `npm test` | Testy komponentów (Vitest + jsdom) — opis w [`docs/tests.md`](docs/tests.md#testy-frontendu) |
| `frontend/` | `npm run build` | Buduje wersję produkcyjną do `dist/` |

## Praca z Gitem

- Gałąź nazywamy `<osoba>-<słowo>`, małymi literami, np. `devops-docker`, `frontend-poprawki`.
- Identyfikator zadania (np. `S1-DQ-1`) wpisujemy w tytule PR.
- Do `main` trafiamy tylko przez PR.

## CI

Przy każdym PR i każdym pushu do `main` GitHub Actions uruchamia workflow
[`.github/workflows/ci.yml`](.github/workflows/ci.yml). Wynik widać na dole strony PR i w zakładce **Actions**.
Dwa zadania działają równolegle:

| Zadanie | Co sprawdza (po kolei) |
|---|---|
| `backend` | `npm ci`, `prisma generate`, `npm run lint`, `npm run openapi:check`, `npm run test`, `npm run test:int` (z PostgreSQL 16 i bazą `konsultacje_test` uruchomionymi w CI) |
| `frontend` | `npm ci`, `npm run lint`, `npm test`, `npm run build` |

Pierwszy nieudany krok zatrzymuje zadanie i oznacza PR czerwonym krzyżykiem. Zanim otworzysz PR, uruchom te same
polecenia lokalnie (tabela „Przydatne polecenia”). Gdy CI jest czerwone: kliknij **Details** przy zadaniu, otwórz
krok z błędem, popraw kod i wypchnij poprawkę na tę samą gałąź — CI uruchomi się ponownie samo.

`npm ci` instaluje paczki dokładnie według `package-lock.json`. Jeśli zmieniasz zależności, zawsze commituj
`package.json` razem z `package-lock.json`, inaczej CI zatrzyma się już na instalacji.
