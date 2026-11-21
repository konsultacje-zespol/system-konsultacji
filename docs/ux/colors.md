# Kolory, odstępy i czcionki

## Kolory

| Zmienna | Wartość | Użycie |
|---|---|---|
| `--color-primary` | `#1D4ED8` | główne przyciski, linki, aktywna zakładka, aktywny język |
| `--color-primary-hover` | `#1E40AF` | główny przycisk i link po najechaniu i z fokusem |
| `--color-text` | `#1F2937` | tekst, nagłówki, tekst na kafelkach slotów |
| `--color-text-muted` | `#4B5563` | tekst pomocniczy: katedra, „czas polski”, podpowiedzi, etykiety niedostępnych slotów |
| `--color-background` | `#F9FAFB` | tło strony |
| `--color-surface` | `#FFFFFF` | karty, tabele, modale, Navbar, pola formularzy |
| `--color-border` | `#D1D5DB` | ramki kart, tabel i pól, linie oddzielające (tylko dekoracja) |
| `--color-danger` | `#B91C1C` | przyciski odwołania, błędy walidacji, konflikt dyżurów, etykieta „Odwołany” |
| `--color-success` | `#15803D` | ramka wolnego slotu, status „Potwierdzona”, komunikat „Zarezerwowano” |
| `--color-slot-free` | `#DCFCE7` | tło wolnego slotu |
| `--color-slot-unavailable` | `#E5E7EB` | tło niedostępnego slotu (brak miejsc, odwołany, zapisy zamknięte) |
| `--color-slot-mine` | `#2563EB` | obrys 2 px i etykieta slotu „Twoja rezerwacja” |

Tekst na przyciskach primary i danger jest biały (`#FFFFFF`).

### Kontrast

Wszystkie pary spełniają WCAG AA (co najmniej 4,5 : 1).

| Tekst | Tło | Kontrast |
|---|---|---|
| `#1F2937` text | `#F9FAFB` background | 14,0 : 1 |
| `#1F2937` text | `#DCFCE7` slot-free | 13,4 : 1 |
| `#1F2937` text | `#E5E7EB` slot-unavailable | 11,9 : 1 |
| `#4B5563` text-muted | `#FFFFFF` surface | 7,6 : 1 |
| `#4B5563` text-muted | `#E5E7EB` slot-unavailable | 6,1 : 1 |
| `#FFFFFF` | `#1D4ED8` primary | 6,7 : 1 |
| `#FFFFFF` | `#1E40AF` primary-hover | 8,7 : 1 |
| `#FFFFFF` | `#B91C1C` danger | 6,5 : 1 |
| `#B91C1C` danger | `#E5E7EB` slot-unavailable | 5,2 : 1 |
| `#15803D` success | `#FFFFFF` surface | 5,0 : 1 |
| `#2563EB` slot-mine | `#FFFFFF` surface | 5,2 : 1 |

## Stany slotu

### Student: kafelek na profilu prowadzącego

| Stan | Warunek w `StudentSlot` | Tło | Ramka | Tekst PL | Tekst EN | Kliknięcie |
|---|---|---|---|---|---|---|
| wolny | `bookable: true` | `slot-free` | 1 px `success` | 14:00–14:15 · 2/3 wolne | 14:00–14:15 · 2/3 free | otwiera `BookingModal` |
| brak miejsc | `unavailableReason: 'FULL'` | `slot-unavailable` | 1 px `border` | 14:00–14:15 · Brak miejsc | 14:00–14:15 · Full | wyłączony |
| odwołany | `unavailableReason: 'CANCELLED'` | `slot-unavailable` | 1 px `border` | 14:00–14:15 · Odwołany | 14:00–14:15 · Cancelled | wyłączony |
| zapisy zamknięte | `unavailableReason: 'CLOSED'` | `slot-unavailable` | 1 px `border` | 14:00–14:15 · Zapisy zamknięte | 14:00–14:15 · Booking closed | wyłączony |
| moja rezerwacja | `myBookingId !== null` | `surface` | 2 px `slot-mine` | 14:00–14:15 · Twoja rezerwacja | 14:00–14:15 · Your booking | przejście do `/student/bookings` |

- Zapisy zamykają się 15 minut przed startem slotu.
- Tekst niedostępnych slotów ma kolor `text-muted`, a wolnych i własnych `text`.
- W odwołanym slocie godzina jest przekreślona, a słowo „Odwołany” ma kolor `danger`.
- Etykieta „Twoja rezerwacja” ma kolor `slot-mine`.
- Jeśli własny slot został odwołany, pokazujemy stan „Odwołany”, bo rezerwacja też jest wtedy odwołana.
- Każdy kafelek to `<button>` z pełnym `aria-label`, np. „Środa 25 listopada, 14:00–14:15 czas polski, 2 z 3 miejsc wolne”.

### Prowadzący: slot w „Moim tygodniu”

| Stan | Warunek w `ScheduleSlot` | Tło | Tekst PL | Tekst EN |
|---|---|---|---|---|
| wolny | `OPEN`, `bookedCount = 0` | `slot-free` | 0/3 · Wolny | 0/3 · Free |
| częściowo zajęty | `OPEN`, `0 < bookedCount < capacity` | `slot-free` | 2/3 · Częściowo zajęty | 2/3 · Partly booked |
| pełny | `OPEN`, `bookedCount = capacity` | `slot-unavailable` | 3/3 · Pełny | 3/3 · Full |
| odwołany | `CANCELLED` | `slot-unavailable` | Odwołany: powód | Cancelled: reason |

W odwołanym slocie godzina jest przekreślona, a słowo „Odwołany” ma kolor `danger`.

### Status rezerwacji w „Moich rezerwacjach”

| `BookingDto.status` | Kolor tekstu i ramki | Tekst PL | Tekst EN |
|---|---|---|---|
| `CONFIRMED` | `success` | Potwierdzona | Confirmed |
| `CANCELLED_BY_STUDENT` | `text-muted` | Odwołana przez Ciebie | Cancelled by you |
| `CANCELLED_BY_LECTURER` | `danger` | Odwołana przez prowadzącego | Cancelled by lecturer |

Tło odznaki to `surface`.

## Odstępy

| Zmienna | Wartość | Użycie |
|---|---|---|
| `--space-4` | 4px | między ikoną a tekstem, między liniami na kafelku |
| `--space-8` | 8px | między kafelkami, między przyciskami w rzędzie |
| `--space-12` | 12px | `padding` przycisku i pola formularza |
| `--space-16` | 16px | `padding` karty, kafelka i komórki tabeli |
| `--space-24` | 24px | między sekcjami strony, `padding` modala |
| `--space-32` | 32px | margines głównego kontenera, odstęp pod `<h1>` |

## Czcionki

```
system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
```

| Zmienna | Wartość | Użycie |
|---|---|---|
| `--font-size-sm` | 14px | tekst pomocniczy, „czas polski”, licznik znaków, odznaki, tabele |
| `--font-size-md` | 16px | zwykły tekst, przyciski, pola, kafelki slotów |
| `--font-size-lg` | 20px | `<h2>`: dzień tygodnia, tytuł modala |
| `--font-size-xl` | 28px | `<h1>`: nagłówek strony |

Grubość: 600 dla nagłówków i przycisków, 400 dla reszty.

## `_variables.scss`

```scss
:root {
  --color-primary: #1D4ED8;
  --color-primary-hover: #1E40AF;
  --color-text: #1F2937;
  --color-text-muted: #4B5563;
  --color-background: #F9FAFB;
  --color-surface: #FFFFFF;
  --color-border: #D1D5DB;
  --color-danger: #B91C1C;
  --color-success: #15803D;
  --color-slot-free: #DCFCE7;
  --color-slot-unavailable: #E5E7EB;
  --color-slot-mine: #2563EB;

  --space-4: 4px;
  --space-8: 8px;
  --space-12: 12px;
  --space-16: 16px;
  --space-24: 24px;
  --space-32: 32px;

  --font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-size-sm: 14px;
  --font-size-md: 16px;
  --font-size-lg: 20px;
  --font-size-xl: 28px;
}
```