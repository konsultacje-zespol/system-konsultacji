# Makiety ekranów

Założenia:

- Aplikacja działa w przeglądarce na komputerze. Główny kontener ma `min-width: 1024px`, siatki zawijają się same.
- Domyślny język to polski. Każdy tekst ma odpowiednik angielski. Kolumna „Klucz” to proponowany klucz w `pl.json` i `en.json`.
- Godziny są zawsze w czasie polskim z etykietą „czas polski” / "Polish time".
- Każdy ekran z danymi ma też stan ładowania (`Spinner`), brak danych (`EmptyState`) i błąd (`ErrorState` z przyciskiem „Spróbuj ponownie”).

Oznaczenia w makietach:

| Znak | Znaczenie |
|---|---|
| `[ Tekst ]` | przycisk |
| `[____]` | pole tekstowe |
| `[ v ]` | lista wyboru |
| `( )`, `(o)` | przycisk opcji |
| `[ ]`, `[x]` | pole wyboru |
| `<Tekst>` | link |
| `-14:30-` | tekst przekreślony |
| `+====+` | niebieski obrys slotu „Twoja rezerwacja” |

## Wspólny układ

Navbar i pasek trybu demo są na każdym ekranie po zalogowaniu (`AppLayout`). Przykład dla studenta:

```
+----------------------------------------------------------------------------------------------+
| Konsultacje  Znajdź prowadzącego  Moje rezerwacje  [PL]|EN  Anna Nowak · Student [ Wyloguj ] |
+----------------------------------------------------------------------------------------------+
| Tryb demonstracyjny — logowanie bez hasła                                                    |
+----------------------------------------------------------------------------------------------+
|                                                                                              |
|   <h1> nagłówek strony                                                                       |
|   ... treść strony ...                                                                       |
|                                                                                              |
+----------------------------------------------------------------------------------------------+
```

- Aktywny język i aktywna pozycja menu mają inny kolor i podkreślenie.
- W wąskim oknie pozycje Navbara przechodzą do drugiej linii. Nie ma menu rozwijanego.

Komponenty: `AppLayout`, `Navbar`, `LanguageSwitcher`, `Button` (secondary dla „Wyloguj”).

| Element | PL | EN | Klucz |
|---|---|---|---|
| Logo | Konsultacje | Office hours | `common.appShortName` |
| Menu studenta | Znajdź prowadzącego, Moje rezerwacje | Find a lecturer, My bookings | `nav.findLecturer`, `nav.myBookings` |
| Menu prowadzącego | Mój tydzień, Kreator dyżurów | My week, Office hours | `nav.myWeek`, `nav.officeHours` |
| Menu admina | Zarządzaj seedem, Logi powiadomień | Manage seed, Notification log | `nav.manageSeed`, `nav.notificationLog` |
| Role | Student, Prowadzący, Admin | Student, Lecturer, Admin | `common.role.STUDENT`, `common.role.LECTURER`, `common.role.ADMIN` |
| Wylogowanie | Wyloguj | Log out | `nav.logout` |
| Pasek demo | Tryb demonstracyjny — logowanie bez hasła | Demo mode — sign-in without password | `common.demoBanner` |

## Logowanie (`/login`)

Ekran bez Navbara. Przełącznik języka jest w prawym górnym rogu.

```
+----------------------------------------------------------------------------------------------+
|                                                                                  [PL]|EN     |
|                                                                                              |
|                          System zapisów na konsultacje                                       |
|        Tryb demonstracyjny — logowanie bez hasła. Wybierz konto testowe.                     |
|                                                                                              |
|   +--------------------------+   +--------------------------+   +--------------------------+ |
|   |                          |   |                          |   |                          | |
|   | Zaloguj jako testowy     |   | Zaloguj jako testowy     |   | Zaloguj jako Admin       | |
|   | Student                  |   | Prowadzący               |   |                          | |
|   |                          |   |                          |   |                          | |
|   | Anna Nowak               |   | dr Jan Kowalski          |   | Adam Admin               | |
|   +--------------------------+   +--------------------------+   +--------------------------+ |
|                                                                                              |
|   Zaloguj jako inny użytkownik                                                               |
|   [ Wybierz konto...                                       v ]   [ Zaloguj ]                 |
|                                                                                              |
+----------------------------------------------------------------------------------------------+
```

- Trzy duże przyciski to `Button` primary. Pod napisem jest imię i nazwisko konta z listy `featured` z `GET /auth/mock-users`.
- Lista wyboru zawiera konta z listy `users`, pogrupowane w `<optgroup>`: Studenci, Prowadzący, Administratorzy.
- „Zaloguj” jest nieaktywny, dopóki nie wybrano konta.
- W trakcie logowania kliknięty przycisk pokazuje `Spinner` i jest zablokowany. Po sukcesie aplikacja przechodzi na stronę startową roli.

Komponenty: `LanguageSwitcher`, `Button` (4 przyciski), `Select`, `Spinner`, `ErrorState` (gdy nie udało się pobrać listy kont).

| Element | PL | EN | Klucz |
|---|---|---|---|
| Nagłówek `<h1>` | System zapisów na konsultacje | Office hours booking system | `login.title` |
| Opis | Tryb demonstracyjny — logowanie bez hasła. Wybierz konto testowe. | Demo mode — sign-in without password. Choose a test account. | `login.description` |
| Przycisk | Zaloguj jako testowy Student | Sign in as test Student | `login.asStudent` |
| Przycisk | Zaloguj jako testowy Prowadzący | Sign in as test Lecturer | `login.asLecturer` |
| Przycisk | Zaloguj jako Admin | Sign in as Admin | `login.asAdmin` |
| Nagłówek `<h2>` i etykieta listy | Zaloguj jako inny użytkownik | Sign in as another user | `login.otherUser` |
| Podpowiedź w liście | Wybierz konto... | Choose an account... | `login.chooseAccount` |
| Grupy w liście | Studenci, Prowadzący, Administratorzy | Students, Lecturers, Administrators | `login.group.STUDENT`, `login.group.LECTURER`, `login.group.ADMIN` |
| Przycisk | Zaloguj | Sign in | `login.submit` |

## Znajdź prowadzącego (`/student/dashboard`)

Strona startowa studenta.

```
+----------------------------------------------------------------------------------------------+
| Navbar + pasek demo                                                                          |
+----------------------------------------------------------------------------------------------+
|                                                                                              |
|   Znajdź prowadzącego                                                                        |
|                                                                                              |
|   Nazwisko prowadzącego                                                                      |
|   [ np. Kowalski ____________________________________ ]                                      |
|                                                                                              |
|   +--------------------------+  +--------------------------+  +--------------------------+   |
|   | dr hab.                  |  | dr                       |  | prof. dr hab.            |   |
|   | Ewa Kamińska             |  | Jan Kowalski             |  | Piotr Lewandowski        |   |
|   | Katedra Informatyki      |  | Katedra Matematyki       |  | Katedra Fizyki           |   |
|   +--------------------------+  +--------------------------+  +--------------------------+   |
|   +--------------------------+  +--------------------------+                                 |
|   | dr                       |  | mgr inż.                 |                                 |
|   | Marta Wiśniewska         |  | Tomasz Zieliński         |                                 |
|   | Katedra Informatyki      |  | Katedra Elektroniki      |                                 |
|   +--------------------------+  +--------------------------+                                 |
|                                                                                              |
+----------------------------------------------------------------------------------------------+
```

- Bez wpisanego tekstu widać wszystkich prowadzących w kolejności alfabetycznej.
- Wyniki wyszukiwania pojawiają się 300 ms po ostatnim znaku. Wyszukiwanie ignoruje polskie znaki, np. „kaminska” znajduje „Kamińska”.
- Siatka kart zawija się sama.
- Cała karta `LecturerCard` jest klikalna (`<button>` albo `<a>`) i prowadzi do profilu prowadzącego.
- Gdy nic nie znaleziono, widać `EmptyState`.

Komponenty: `TextField` z etykietą, `LecturerCard` (komponent tej strony), `Spinner`, `EmptyState`, `ErrorState`.

| Element | PL | EN | Klucz |
|---|---|---|---|
| Nagłówek `<h1>` | Znajdź prowadzącego | Find a lecturer | `student.dashboard.title` |
| Etykieta pola | Nazwisko prowadzącego | Lecturer's surname | `student.dashboard.searchLabel` |
| Podpowiedź w polu | np. Kowalski | e.g. Kowalski | `student.dashboard.searchPlaceholder` |
| Brak wyników | Nie znaleziono prowadzącego „{{search}}” | No lecturer found for "{{search}}" | `student.dashboard.notFound` |

## Profil prowadzącego (`/student/lecturers/:lecturerId`)

```
+----------------------------------------------------------------------------------------------+
| Navbar + pasek demo                                                                          |
+----------------------------------------------------------------------------------------------+
|                                                                                              |
|   dr Jan Kowalski                                                                            |
|   Katedra Matematyki                                                                         |
|                                                                                              |
|   [ < Poprzedni tydzień ]  [ Dziś ]  [ Następny tydzień > ]   23–29.11.2026 (czas polski)    |
|                                                                                              |
|   Pon 23.11            Wt 24.11             Śr 25.11             Czw 26.11                   |
|   +----------------+   +----------------+   +================+   +----------------+          |
|   | 14:00–14:15    |   | Brak terminów  |   | 14:00–14:15    |   | 10:00–10:15    |          |
|   | 2/3 wolne      |   +----------------+   | Twoja          |   | Zapisy         |          |
|   +----------------+                        | rezerwacja     |   | zamknięte      |          |
|   | 14:15–14:30    |                        +================+   +----------------+          |
|   | Brak miejsc    |                        | 14:15–14:30    |   | 10:15–10:30    |          |
|   +----------------+                        | 1/3 wolne      |   | 3/3 wolne      |          |
|   | -14:30–14:45-  |                        +----------------+   +----------------+          |
|   | Odwołany       |                                                                         |
|   +----------------+                                                                         |
|                                                                                              |
|   Pt 27.11             Sob 28.11            Nd 29.11                                         |
|   ...                                                                                        |
+----------------------------------------------------------------------------------------------+
```

Stany kafelków na makiecie (kolory w [`colors.md`](colors.md#stany-slotu)):

| Kafelek | Stan | Wygląd | Tekst |
|---|---|---|---|
| 14:00–14:15, 2/3 wolne | wolny | zielone tło, zielona ramka | 2/3 wolne |
| 14:15–14:30, Brak miejsc | pełny | szare tło | Brak miejsc |
| 14:30–14:45, Odwołany | odwołany | szare tło, godzina przekreślona | Odwołany |
| 10:00–10:15, Zapisy zamknięte | mniej niż 15 min do startu | szare tło | Zapisy zamknięte |
| 14:00–14:15, Twoja rezerwacja | moja rezerwacja | białe tło, niebieski obrys 2 px | Twoja rezerwacja |

- Dni tygodnia (pn–nd) są w siatce, która zawija się w węższym oknie.
- W bieżącym tygodniu przycisk „Poprzedni tydzień” jest nieaktywny, bo nie można cofnąć się przed dziś.
- Dzień bez slotów ma szary napis „Brak terminów”. Tydzień bez slotów pokazuje `EmptyState` „Brak dyżurów w tym tygodniu”.
- Sloty odświeżają się co 15 s.

### Modal rezerwacji

`BookingModal` otwiera się po kliknięciu wolnego kafelka.

```
          +--------------------------------------------------------------+
          |  Rezerwacja konsultacji                                  [X] |
          |                                                              |
          |  dr Jan Kowalski                                             |
          |  środa, 25 listopada 2026                                    |
          |  14:15–14:30 (czas polski)                                   |
          |  Sala 204, budynek C                                         |
          |                                                              |
          |  Temat konsultacji *                                         |
          |  +--------------------------------------------------------+  |
          |  | Pytanie o zadanie 3 z listy 5                          |  |
          |  |                                                        |  |
          |  +--------------------------------------------------------+  |
          |  Od 3 do 300 znaków                                 29/300   |
          |                                                              |
          |                                [ Anuluj ]  [ Potwierdź ]     |
          +--------------------------------------------------------------+
```

Po udanej rezerwacji (201) ten sam modal wygląda tak:

```
          +--------------------------------------------------------------+
          |  Rezerwacja konsultacji                                  [X] |
          |                                                              |
          |  Zarezerwowano.                                              |
          |  Potwierdzenie z zaproszeniem do kalendarza wyślemy          |
          |  na Twój e-mail.                                             |
          |                                                              |
          |                          [ Moje rezerwacje ]  [ Zamknij ]    |
          +--------------------------------------------------------------+
```

- Dla dyżuru online w miejscu sali jest tekst „Microsoft Teams — link otrzymasz w potwierdzeniu”.
- „Potwierdź” jest nieaktywny, gdy temat ma mniej niż 3 znaki, oraz w trakcie wysyłania (wtedy pokazuje `Spinner`).
- Błąd 409 lub 422 (np. `SLOT_FULL`): toast „Ten termin nie jest już dostępny”, modal się zamyka, sloty się odświeżają.
- Błąd 400 `VALIDATION_FAILED`: czerwony komunikat pod polem tematu.
- Inny błąd: tekst błędu w modalu. Wpisany temat zostaje.
- Przycisk `[X]` ma `aria-label="Zamknij"`. Modal zamyka też klawisz Esc (natywny `<dialog>`).

Komponenty: `SlotBoard`, `SlotTile`, `Button`, `Modal`, `TextArea` z licznikiem, `DateTime`, `LocationLabel`, `Spinner`, `EmptyState`, `ErrorState`, toast (`sonner`).

| Element | PL | EN | Klucz |
|---|---|---|---|
| Nawigacja tygodniami | Poprzedni tydzień, Dziś, Następny tydzień | Previous week, Today, Next week | `common.week.previous`, `common.week.today`, `common.week.next` |
| Etykieta strefy | czas polski | Polish time | `common.polishTime` |
| Kafelek wolny | {{free}}/{{capacity}} wolne | {{free}}/{{capacity}} free | `student.slot.free` |
| Kafelek pełny | Brak miejsc | Full | `student.slot.FULL` |
| Kafelek odwołany | Odwołany | Cancelled | `student.slot.CANCELLED` |
| Kafelek zamknięty | Zapisy zamknięte | Booking closed | `student.slot.CLOSED` |
| Kafelek mój | Twoja rezerwacja | Your booking | `student.slot.mine` |
| Dzień bez slotów | Brak terminów | No slots | `student.slot.noSlots` |
| Pusty tydzień | Brak dyżurów w tym tygodniu | No office hours this week | `common.emptyWeek` |
| Tytuł modala | Rezerwacja konsultacji | Book a consultation | `student.booking.title` |
| Miejsce online | Microsoft Teams — link otrzymasz w potwierdzeniu | Microsoft Teams — you will get the link in the confirmation | `student.booking.teamsInfo` |
| Etykieta pola | Temat konsultacji | Consultation topic | `student.booking.topicLabel` |
| Podpowiedź pola | Od 3 do 300 znaków | 3 to 300 characters | `student.booking.topicHint` |
| Przycisk | Potwierdź | Confirm | `student.booking.confirm` |
| Przycisk | Anuluj | Cancel | `common.cancel` |
| Sukces | Zarezerwowano. Potwierdzenie z zaproszeniem do kalendarza wyślemy na Twój e-mail | Booked. We will e-mail you a confirmation with a calendar invitation | `student.booking.success` |
| Przyciski po sukcesie | Moje rezerwacje, Zamknij | My bookings, Close | `nav.myBookings`, `common.close` |
| Toast `SLOT_FULL` | Ten termin nie jest już dostępny | This slot is no longer available | `errors.SLOT_FULL` |

## Moje rezerwacje (`/student/bookings`)

```
+----------------------------------------------------------------------------------------------+
| Navbar + pasek demo                                                                          |
+----------------------------------------------------------------------------------------------+
|                                                                                              |
|   Moje rezerwacje                                                                            |
|                                                                                              |
|   [ Nadchodzące ]  [ Historia ]  [ Odwołane ]                                                |
|                                                                                              |
|  +----------------+------------+-------------+-----------+--------------+------------------+ |
|  | Termin         | Prowadzący | Temat       | Miejsce   | Status       | Akcje            | |
|  +----------------+------------+-------------+-----------+--------------+------------------+ |
|  | śr 25.11.2026  | dr Jan     | Pytanie o   | Sala 204  | Potwierdzona | [ Odwołaj ]      | |
|  | 14:15–14:30    | Kowalski   | zadanie 3   |           |              | Odwołanie        | |
|  | (czas polski)  |            | z listy 5   |           |              | możliwe do 13:15 | |
|  |                |            |             |           |              | <Pobierz .ics>   | |
|  +----------------+------------+-------------+-----------+--------------+------------------+ |
|  | czw 26.11.2026 | dr Ewa     | Konsultacja | <Dołącz w | Potwierdzona | Po terminie      | |
|  | 10:00–10:15    | Kamińska   | projektu    | Teams>    |              | odwołania —      | |
|  | (czas polski)  |            |             |           |              | skontaktuj się   | |
|  |                |            |             |           |              | z prowadzącym    | |
|  |                |            |             |           |              | <Pobierz .ics>   | |
|  +----------------+------------+-------------+-----------+--------------+------------------+ |
|                                                                                              |
+----------------------------------------------------------------------------------------------+
```

### Okno odwołania rezerwacji

`ConfirmDialog` otwiera się po kliknięciu „Odwołaj”.

```
          +--------------------------------------------------------------+
          |  Odwołać rezerwację?                                         |
          |                                                              |
          |  dr Jan Kowalski · środa, 25 listopada 2026, 14:15–14:30     |
          |  (czas polski)                                               |
          |                                                              |
          |  Powód (opcjonalnie)                                         |
          |  +--------------------------------------------------------+  |
          |  |                                                        |  |
          |  +--------------------------------------------------------+  |
          |                                                     0/500    |
          |                                                              |
          |                      [ Nie odwołuj ]  [ Odwołaj rezerwację ] |
          +--------------------------------------------------------------+
```

- Zakładki to zwykłe przyciski ze stanem w `useState`. Aktywna zakładka ma inny kolor i podkreślenie.
- „Odwołaj” jest widoczne tylko wtedy, gdy API zwraca `canCancel: true`. Godzina pod przyciskiem pochodzi z `cancellableUntil`.
- „Pobierz .ics” to zwykły link `<a href="/api/v1/bookings/:id/calendar.ics" download>`.
- W zakładce „Odwołane” zamiast akcji widać powód odwołania, jeśli został podany.
- Po udanym odwołaniu pojawia się toast „Rezerwacja odwołana”. Przy błędzie `CANCELLATION_CUTOFF_PASSED` pojawia się toast z błędem, a lista się odświeża.

Komponenty: `Button`, `<table>`, `DateTime`, `LocationLabel`, `StatusBadge`, `ConfirmDialog`, `TextArea`, `Spinner`, `EmptyState`, `ErrorState`, toast.

| Element | PL | EN | Klucz |
|---|---|---|---|
| Nagłówek `<h1>` | Moje rezerwacje | My bookings | `student.bookings.title` |
| Zakładki | Nadchodzące, Historia, Odwołane | Upcoming, History, Cancelled | `student.bookings.tab.upcoming`, `student.bookings.tab.past`, `student.bookings.tab.cancelled` |
| Kolumny | Termin, Prowadzący, Temat, Miejsce, Status, Akcje | Date, Lecturer, Topic, Location, Status, Actions | `student.bookings.column.*` |
| Przycisk | Odwołaj | Cancel | `student.bookings.cancel` |
| Pod przyciskiem | Odwołanie możliwe do {{time}} | You can cancel until {{time}} | `student.bookings.cancelUntil` |
| Po terminie | Po terminie odwołania — skontaktuj się z prowadzącym | Cancellation deadline passed — contact the lecturer | `student.bookings.cutoffPassed` |
| Link | Pobierz .ics | Download .ics | `student.bookings.downloadIcs` |
| Link Teams | Dołącz w Teams | Join in Teams | `common.joinTeams` |
| Pusta lista | Nie masz jeszcze rezerwacji | You have no bookings yet | `student.bookings.empty` |
| Tytuł okna | Odwołać rezerwację? | Cancel this booking? | `student.bookings.confirmTitle` |
| Etykieta pola | Powód (opcjonalnie) | Reason (optional) | `student.bookings.reasonLabel` |
| Przyciski okna | Nie odwołuj, Odwołaj rezerwację | Keep booking, Cancel booking | `student.bookings.keep`, `student.bookings.confirmCancel` |
| Toast | Rezerwacja odwołana | Booking cancelled | `student.bookings.cancelled` |

## Mój tydzień (`/lecturer/schedule`)

Strona startowa prowadzącego. Tydzień jest listą dni od poniedziałku do niedzieli, bez biblioteki kalendarza.

```
+----------------------------------------------------------------------------------------------+
| Navbar + pasek demo                                                                          |
+----------------------------------------------------------------------------------------------+
|                                                                                              |
|   Mój tydzień                                                                                |
|                                                                                              |
|   [ < Poprzedni tydzień ]  [ Dziś ]  [ Następny tydzień > ]   23–29.11.2026 (czas polski)    |
|                                                                                              |
|   +----------------------------------------------------------------------------------------+ |
|   | Poniedziałek, 23 listopada                                         [ Odwołaj dzień ]   | |
|   +----------------------------------------------------------------------------------------+ |
|   | 14:00–14:15 · Sala 204       2/3 · Częściowo zajęty                    [ Szczegóły ]   | |
|   |    • Anna Nowak — Pytanie o zadanie 3 z listy 5                                        | |
|   |    • Maria Rossi — Help with the project report                                        | |
|   +----------------------------------------------------------------------------------------+ |
|   | 14:15–14:30 · Sala 204       0/3 · Wolny                               [ Szczegóły ]   | |
|   |    Brak zapisanych studentów                                                           | |
|   +----------------------------------------------------------------------------------------+ |
|   | -14:30–14:45- · Sala 204     Odwołany: choroba prowadzącego            [ Szczegóły ]   | |
|   +----------------------------------------------------------------------------------------+ |
|                                                                                              |
|   +----------------------------------------------------------------------------------------+ |
|   | Wtorek, 24 listopada                                                                   | |
|   +----------------------------------------------------------------------------------------+ |
|   | Brak dyżurów                                                                           | |
|   +----------------------------------------------------------------------------------------+ |
|   ...                                                                                        |
+----------------------------------------------------------------------------------------------+
```

- „Odwołaj dzień” jest widoczne tylko wtedy, gdy dzień ma przyszłe otwarte sloty.
- Stan slotu jest opisany tekstem i kolorem tła: wolny i częściowo zajęty mają zielone tło, pełny i odwołany szare. Godzina odwołanego slotu jest przekreślona. Szczegóły w [`colors.md`](colors.md#prowadzący-slot-w-moim-tygodniu).
- Lista zapisanych studentów jest zawsze rozwinięta: imię, nazwisko i pełny temat.
- Pusty tydzień pokazuje `EmptyState` „Brak dyżurów w tym tygodniu” z przyciskiem „Utwórz dyżur”.

### Szczegóły terminu

`SlotDetailsModal` otwiera się po kliknięciu „Szczegóły”.

```
          +--------------------------------------------------------------+
          |  Szczegóły terminu                                       [X] |
          |                                                              |
          |  Poniedziałek, 23 listopada 2026, 14:00–14:15 (czas polski)  |
          |  Miejsce: Sala 204                                           |
          |  Zajęte miejsca: 2/3                                         |
          |                                                              |
          |  Zapisani studenci                                           |
          |  • Anna Nowak <anna.nowak@student.example.pl>                |
          |    Pytanie o zadanie 3 z listy 5                             |
          |  • Maria Rossi <maria.rossi@student.example.pl>              |
          |    Help with the project report                              |
          |                                                              |
          |                           [ Zamknij ]  [ Odwołaj termin ]    |
          +--------------------------------------------------------------+
```

- Dla dyżuru online w polu „Miejsce” jest link „Dołącz w Teams”.
- Adres e-mail studenta to link `mailto:`.

### Odwołanie terminu lub dnia

„Odwołaj termin” i „Odwołaj dzień” otwierają `ConfirmDialog` z wymaganym powodem. Przykład dla dnia:

```
          +--------------------------------------------------------------+
          |  Odwołać wszystkie terminy w tym dniu?                       |
          |  Poniedziałek, 23 listopada 2026                             |
          |                                                              |
          |  Powód *                                                     |
          |  +--------------------------------------------------------+  |
          |  | Choroba prowadzącego                                   |  |
          |  +--------------------------------------------------------+  |
          |  Powód zostanie wysłany e-mailem do zapisanych studentów.    |
          |  Od 10 do 500 znaków                                 20/500  |
          |                                                              |
          |                              [ Anuluj ]  [ Odwołaj dzień ]   |
          +--------------------------------------------------------------+
```

- Przycisk potwierdzenia (danger) jest nieaktywny, dopóki powód ma mniej niż 10 znaków, oraz w trakcie wysyłania.
- Po sukcesie pojawia się toast, np. „Odwołano 8 terminów, powiadomiono 6 studentów”.

Komponenty: `ScheduleDay` (komponent tej strony), `Button`, `SlotDetailsModal` (zbudowany na `Modal`), `ConfirmDialog`, `TextArea`, `DateTime`, `LocationLabel`, `Spinner`, `EmptyState`, `ErrorState`, toast.

| Element | PL | EN | Klucz |
|---|---|---|---|
| Nagłówek `<h1>` | Mój tydzień | My week | `lecturer.schedule.title` |
| Przycisk dnia | Odwołaj dzień | Cancel day | `lecturer.schedule.cancelDay` |
| Przycisk slotu | Szczegóły | Details | `lecturer.schedule.details` |
| Stany slotu | Wolny, Częściowo zajęty, Pełny, Odwołany | Free, Partly booked, Full, Cancelled | `lecturer.slot.free`, `lecturer.slot.partly`, `lecturer.slot.full`, `lecturer.slot.cancelled` |
| Brak zapisanych | Brak zapisanych studentów | No students booked | `lecturer.schedule.noStudents` |
| Dzień bez slotów | Brak dyżurów | No office hours | `lecturer.schedule.noSlotsDay` |
| Pusty tydzień | Brak dyżurów w tym tygodniu | No office hours this week | `common.emptyWeek` |
| Przycisk w pustym tygodniu | Utwórz dyżur | Create office hours | `lecturer.schedule.create` |
| Tytuł modala | Szczegóły terminu | Slot details | `lecturer.slotDetails.title` |
| Nagłówek listy | Zapisani studenci | Booked students | `lecturer.slotDetails.students` |
| Przycisk | Odwołaj termin | Cancel slot | `lecturer.slotDetails.cancelSlot` |
| Tytuł okna (termin) | Odwołać ten termin? | Cancel this slot? | `lecturer.cancel.slotTitle` |
| Tytuł okna (dzień) | Odwołać wszystkie terminy w tym dniu? | Cancel all slots on this day? | `lecturer.cancel.dayTitle` |
| Etykieta pola | Powód | Reason | `lecturer.cancel.reasonLabel` |
| Podpowiedź | Powód zostanie wysłany e-mailem do zapisanych studentów. | The reason will be e-mailed to the booked students. | `lecturer.cancel.reasonHint` |
| Toast | Odwołano {{slots}} terminów, powiadomiono {{students}} studentów | Cancelled {{slots}} slots, notified {{students}} students | `lecturer.cancel.success` |

## Kreator dyżuru (`/lecturer/office-hours/new`)

Jeden formularz na jednej stronie. Utworzenie dyżuru ma zająć mniej niż 2 minuty, dlatego pola mają wartości domyślne.

```
+----------------------------------------------------------------------------------------------+
| Navbar + pasek demo                                                                          |
+----------------------------------------------------------------------------------------------+
|                                                                                              |
|   Nowy dyżur                                                                                 |
|                                                                                              |
|   1. Typ                                                                                     |
|      (o) Jednorazowy      ( ) Cykliczny (co tydzień)                                         |
|                                                                                              |
|   2. Termin                                                                                  |
|      Jednorazowy:  Data [ 18.11.2026 ]                                                       |
|      Cykliczny:    Od [ 18.11.2026 ]   Do [ 31.01.2027 ]                                     |
|                    Dni tygodnia: [x] pon [ ] wt [x] śr [ ] czw [ ] pt [ ] sob [ ] nd         |
|      Godzina od [ 14:00 ]   Godzina do [ 16:00 ]   (czas polski)                             |
|                                                                                              |
|   3. Sloty                                                                                   |
|      Długość slotu [ 15 min  v ]      Liczba miejsc w slocie [ 1 ]                           |
|                                                                                              |
|   4. Miejsce                                                                                 |
|      (o) Stacjonarnie     ( ) Online (Teams)                                                 |
|      Miejsce [ Sala 204, budynek C _______________________________ ]                         |
|      Utwórz w Teams cykliczne spotkanie „Dyżur” i wklej tutaj jego link                      |
|                                                                                              |
|   5. Notatka (opcjonalnie)                                                                   |
|      +-----------------------------------------------------------------+                     |
|      |                                                                 |                     |
|      +-----------------------------------------------------------------+                     |
|                                                                                              |
|   +-------------------------------------------------------------------------------------+    |
|   | Nowy dyżur koliduje z istniejącymi terminami:                                       |    |
|   |  • 25.11.2026, 14:00–15:00                                                          |    |
|   |  • 02.12.2026, 14:00–15:00                                                          |    |
|   +-------------------------------------------------------------------------------------+    |
|                                                                                              |
|                                                      [ Anuluj ]  [ Utwórz dyżur ]            |
+----------------------------------------------------------------------------------------------+
```

- Widać tylko pola dla wybranego typu: datę dla dyżuru jednorazowego albo „Od”, „Do” i dni tygodnia dla cyklicznego.
- Wartości domyślne: jutro, 14:00–16:00, slot 15 min, 1 osoba, stacjonarnie.
- Podpowiedź o Teams pod polem „Miejsce” jest widoczna tylko w trybie online.
- Błędy walidacji (React Hook Form + Zod) są pokazane czerwonym tekstem pod polem, którego dotyczą.
- Ramka z listą kolidujących terminów jest czerwona i pojawia się tylko przy błędzie `OFFICE_HOUR_OVERLAP`.
- „Utwórz dyżur” jest nieaktywny w trakcie wysyłania. Po sukcesie pojawia się toast, np. „Utworzono 32 sloty”, i aplikacja przechodzi do `/lecturer/schedule`.
- „Anuluj” wraca do `/lecturer/office-hours`.

Komponenty: `TextField` (data, godziny, miejsce, liczba miejsc), `Select` (długość slotu), `<input type="radio">` i `<input type="checkbox">` z etykietami, `TextArea` (notatka), `Button`.

| Element | PL | EN | Klucz |
|---|---|---|---|
| Nagłówek `<h1>` | Nowy dyżur | New office hours | `lecturer.form.title` |
| Sekcje | Typ, Termin, Sloty, Miejsce, Notatka (opcjonalnie) | Type, Date and time, Slots, Location, Note (optional) | `lecturer.form.section.*` |
| Typ | Jednorazowy, Cykliczny (co tydzień) | One-off, Weekly | `lecturer.form.once`, `lecturer.form.weekly` |
| Pola terminu | Data, Od, Do, Dni tygodnia, Godzina od, Godzina do | Date, From, To, Weekdays, Start time, End time | `lecturer.form.date` i kolejne |
| Dni | pon, wt, śr, czw, pt, sob, nd | Mon, Tue, Wed, Thu, Fri, Sat, Sun | `common.weekdayShort.1` do `common.weekdayShort.7` |
| Pola slotów | Długość slotu, Liczba miejsc w slocie | Slot length, Places per slot | `lecturer.form.slotDuration`, `lecturer.form.capacity` |
| Tryb | Stacjonarnie, Online (Teams) | In person, Online (Teams) | `lecturer.form.inPerson`, `lecturer.form.online` |
| Pole | Miejsce | Location | `lecturer.form.location` |
| Podpowiedź online | Utwórz w Teams cykliczne spotkanie „Dyżur” i wklej tutaj jego link | Create a recurring "Office hours" meeting in Teams and paste its link here | `lecturer.form.teamsHint` |
| Konflikt | Nowy dyżur koliduje z istniejącymi terminami: | The new office hours overlap existing slots: | `errors.OFFICE_HOUR_OVERLAP` |
| Przyciski | Anuluj, Utwórz dyżur | Cancel, Create office hours | `common.cancel`, `lecturer.form.submit` |
| Toast | Utworzono {{count}} slotów | Created {{count}} slots | `lecturer.form.created` |

## Liczba kroków rezerwacji

Punkt startowy: student jest zalogowany i widzi stronę „Znajdź prowadzącego”. Lista prowadzących jest widoczna od razu, bez wpisywania.

| Krok | Działanie studenta | Wynik |
|---|---|---|
| 1 | Klika kartę prowadzącego | Profil prowadzącego ze slotami bieżącego tygodnia |
| 2 | Klika zielony kafelek, np. „14:15–14:30 · 1/3 wolne” | Otwiera się modal rezerwacji |
| 3 | Wpisuje temat i klika „Potwierdź” | Modal pokazuje „Zarezerwowano” |

Rezerwacja zajmuje 3 kroki, więc cel „najwyżej 3 kroki” jest spełniony. Szacowany czas to 15–20 sekund (sam temat około 10 s), czyli mniej niż docelowe 30 sekund.

- Wpisanie nazwiska w wyszukiwarce jest opcjonalne. Tylko filtruje listę na tym samym ekranie, więc nie jest osobnym krokiem.
- Jeśli najbliższy wolny termin jest w kolejnym tygodniu, dochodzi jedno kliknięcie „Następny tydzień”. Cel z planu dotyczy terminu w bieżącym tygodniu i to sprawdza test E2E (S2-DQ-2).
