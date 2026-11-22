# Testy

Backend ma dwa rodzaje testów. Oba uruchamia [Vitest](https://vitest.dev/), a zapytania do API wysyła
[supertest](https://github.com/ladjs/supertest).

| Rodzaj | Pliki | Baza danych | Polecenie (w `backend/`) |
|---|---|---|---|
| Jednostkowe | `src/**/*.test.js` (obok testowanego kodu) | niepotrzebna | `npm run test` |
| Integracyjne | `test/**/*.int.test.js` | `konsultacje_test` w Dockerze | `npm run test:int` |

## Przed pierwszym uruchomieniem

1. Uruchom Dockera: `docker compose up -d` (w głównym folderze repozytorium).
2. Skopiuj plik ze zmiennymi do testów (tylko raz):

   ```powershell
   Copy-Item backend\.env.test.example backend\.env.test
   ```

3. `npm install` w `backend/`.

Vitest zawsze ustawia zmienną `VITEST`, dlatego w każdym teście `src/config.js` czyta `.env.test` zamiast `.env`.

## Uruchamianie

```powershell
cd backend
npm run test       # testy jednostkowe
npm run test:int   # testy integracyjne
npx vitest run --config vitest.int.config.js test/auth.int.test.js   # jeden plik integracyjny
```

Co robi `npm run test:int`:

1. Raz na początku uruchamia się `test/global-setup.js`. Najpierw sprawdza, czy nazwa bazy w `DATABASE_URL` kończy
   się na `_test` — jeśli nie, przerywa testy, więc nigdy nie wyczyści bazy deweloperskiej. Potem wykonuje
   `prisma migrate reset`, który buduje `konsultacje_test` od zera z migracji.
2. Pliki testów uruchamiają się **jeden po drugim** (`fileParallelism: false` w `vitest.int.config.js`), bo wszystkie
   korzystają z jednej bazy.

Błąd `database "konsultacje_test" does not exist` oznacza, że wolumen Dockera powstał, zanim dodano skrypt tworzący
bazę testową. Wykonaj `docker compose down -v` i `docker compose up -d` (to usuwa lokalne dane).

## Czym jest „agent” z supertesta

Zwykłe `request(app)` z supertesta wysyła **pojedyncze** zapytanie i od razu o nim zapomina — tak jakby za każdym
razem otwierać nowe okno przeglądarki w trybie incognito. Ciasteczko z sesją, które ustawi serwer, przepada.

`request.agent(app)` tworzy **agenta**, czyli obiekt, który zachowuje się jak jedna karta przeglądarki: zapamiętuje
ciasteczka z odpowiedzi serwera i sam dołącza je do kolejnych zapytań. Nasze logowanie demo ustawia ciasteczko
`access_token` (httpOnly), więc:

```js
const agent = createTestAgent();               // nowa „przeglądarka”, jeszcze niezalogowana
await loginAs(agent, student.id);              // serwer ustawia ciasteczko access_token, agent je zapamiętuje
const response = await agent.get('/api/v1/auth/me'); // agent sam wysyła ciasteczko → 200, zalogowany student
```

Bez agenta trzeba by po logowaniu ręcznie wyciągać nagłówek `Set-Cookie` i dopisywać go do każdego zapytania.

Zasady:

- jeden agent = jeden zalogowany użytkownik; do sprawdzenia dwóch osób (np. student i prowadzący) utwórz dwa agenty;
- do zapytań **bez logowania** (np. test, że trasa zwraca 401) użyj nowego agenta: `createTestAgent().get(...)`;
- `createTestAgent()` za każdym razem buduje świeżą aplikację przez `createApp()` — nie trzeba niczego uruchamiać
  ani zamykać (supertest sam startuje serwer na wolnym porcie na czas zapytania).

## Pomocniki (`backend/test/helpers/`)

| Pomocnik | Co robi |
|---|---|
| `createTestAgent()` | Agent supertesta (opis wyżej) na świeżej aplikacji z `createApp()` |
| `cleanDatabase()` | Czyści wszystkie tabele. Wywołuj w `beforeEach` |
| `loginAs(agent, userId)` | Loguje agenta przez `POST /api/v1/auth/mock-login`; gdy status nie jest 200, rzuca błąd. Zwraca użytkownika |
| `createUser({ role, firstName?, lastName? })` | Dodaje użytkownika z unikalnym e-mailem |
| `createOfficeHourWithSlot({ lecturerId, startsAt?, capacity? })` | Dodaje jeden dyżur `ONCE` z dokładnie jednym slotem `OPEN` (15 min, domyślnie jutro o 12:00 UTC, pojemność 1). Zwraca `{ officeHour, slot }` |
| `createBooking({ slotId, studentId, status? })` | Dodaje rezerwację (domyślnie `CONFIRMED`). Rezerwacja `CONFIRMED` zwiększa też `slots.booked_count` |

Fabryki zapisują dane prosto do bazy przez wspólnego klienta `prisma`. Używaj ich do przygotowania danych, a przez
API wywołuj tylko to, co test faktycznie sprawdza.

## Szablon pliku testu integracyjnego

Skopiuj do `backend/test/<funkcja>.int.test.js`:

```js
import { Role } from '@prisma/client';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/db.js';
import { cleanDatabase } from './helpers/clean-database.js';
import { createOfficeHourWithSlot, createUser } from './helpers/factories.js';
import { loginAs } from './helpers/login-as.js';
import { createTestAgent } from './helpers/test-agent.js';

describe('POST /api/v1/bookings', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('books a free slot', async () => {
    // 1. Arrange: prepare the data with factories
    const lecturer = await createUser({ role: Role.LECTURER });
    const student = await createUser({ role: Role.STUDENT });
    const { slot } = await createOfficeHourWithSlot({ lecturerId: lecturer.id });
    const agent = createTestAgent();
    await loginAs(agent, student.id);

    // 2. Act: call the API
    const response = await agent.post('/api/v1/bookings').send({ slotId: slot.id, topic: 'Projekt' });

    // 3. Assert: check the response and, when it matters, the database
    expect(response.status).toBe(201);
    const savedSlot = await prisma.slot.findUnique({ where: { id: slot.id } });
    expect(savedSlot.bookedCount).toBe(1);
  });

  it('returns 401 without login', async () => {
    const response = await createTestAgent().post('/api/v1/bookings').send({});

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHENTICATED');
  });
});
```

Nazwy testów i komentarze w kodzie piszemy po angielsku, tak jak resztę kodu.

Każdy nowy endpoint ma mieć co najmniej jeden test ścieżki sukcesu i jeden ścieżki błędu (Definition of Done).
Każdą nową trasę **niepubliczną** dopisz też do listy w `test/route-protection.int.test.js`.

## Podmiana modułu: udawana wysyłka e-maili

Testy nigdy nie wysyłają prawdziwych e-maili. Moduł podmieniamy przez `vi.mock` na górze pliku — Vitest przenosi to
wywołanie nad importy, więc każdy plik, który importuje `mail.js`, dostaje udawaną funkcję:

```js
import { beforeEach, expect, it, vi } from 'vitest';
import { sendMail } from '../src/notifications/mail.js';

vi.mock('../src/notifications/mail.js', () => ({ sendMail: vi.fn() }));

beforeEach(() => {
  vi.mocked(sendMail).mockReset();
  vi.mocked(sendMail).mockResolvedValue(undefined); // or .mockRejectedValue(new Error('SMTP is down'))
});

it('sends one e-mail', async () => {
  // ... call the code that sends the e-mail ...
  expect(sendMail).toHaveBeenCalledTimes(1);
});
```

Pełny przykład: `test/outbox-worker.int.test.js`.

## Zmiana wartości z konfiguracji na czas jednego testu

`config` z `src/config.js` to zwykły obiekt, więc test może zmienić wartość bezpośrednio. **Zawsze** przywróć ją
w `afterEach` — inaczej kolejne testy zobaczą zmienioną wartość:

```js
import { afterEach, expect, it } from 'vitest';
import { config } from '../src/config.js';

afterEach(() => {
  config.AUTH_MOCK_ENABLED = true; // the value from .env.test
});

it('demo login is off when the flag is false', async () => {
  config.AUTH_MOCK_ENABLED = false;
  // ... call the API and check the error ...
});
```

Pełny przykład: `test/auth.int.test.js`.

## Testy jednostkowe

Test jednostkowy sprawdza jedną funkcję bez bazy i bez Expressa (np. `src/office-hours/slot-generator.test.js`).
Plik umieść obok testowanego pliku i nazwij `<plik>.test.js`. Jeśli kod potrzebuje bazy — napisz test integracyjny.
