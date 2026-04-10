# Aptus Lovelace Cards

Custom Lovelace cards for the Aptus Home Assistant integration.

## Cards

### Aptus Lock Card

Control Aptus door locks — entrance doors and apartment door.

**Features:**
- Lock/unlock toggle per entity
- Lock state icon (locked/unlocked)
- Battery low warning for apartment door
- Unavailable state handling

**Configuration:**

```yaml
type: custom:aptus-lock-card
title: Door Locks  # optional
entities:
  - lock.aptus_entrance_front
  - lock.aptus_entrance_back
  - lock.aptus_apartment_door
```

| Option     | Type     | Required | Description                    |
|------------|----------|----------|--------------------------------|
| `entities` | string[] | Yes      | List of `lock.*` entity IDs    |
| `title`    | string   | No       | Card header title              |

---

### Aptus Laundry Card

View, book, and cancel laundry time slots.

**Features:**
- Upcoming bookings list fetched from the HA calendar API
- Cancel button per booking
- Booking form with date picker, time slot selector, and group ID input
- Empty state when no bookings exist

**Configuration:**

```yaml
type: custom:aptus-laundry-card
title: Laundry  # optional
calendar_entity: calendar.aptus_laundry
```

| Option            | Type   | Required | Description                          |
|-------------------|--------|----------|--------------------------------------|
| `calendar_entity` | string | Yes      | Calendar entity ID for laundry       |
| `title`           | string | No       | Card header title                    |

**Time slots** (pass numbers 0–9):

| Pass | Time            |
|------|-----------------|
| 0    | 02:00 – 04:00   |
| 1    | 04:00 – 06:00   |
| 2    | 06:00 – 08:30   |
| 3    | 08:30 – 11:00   |
| 4    | 11:00 – 13:30   |
| 5    | 13:30 – 16:00   |
| 6    | 16:00 – 18:30   |
| 7    | 18:30 – 21:00   |
| 8    | 21:00 – 23:30   |
| 9    | 23:30 – 02:00   |

## Installation

### Via HACS (recommended)

Both cards are bundled with the Aptus integration. When you install the integration via HACS, the cards are automatically registered as frontend resources — no manual setup needed.

### Manual

1. Build the cards:

   ```bash
   cd lovelace/aptus-lock-card && npm install && npm run build
   cd ../aptus-laundry-card && npm install && npm run build
   ```

2. Copy the built JS files to `custom_components/aptus/www/`:

   ```bash
   cp lovelace/aptus-lock-card/dist/aptus-lock-card.js custom_components/aptus/www/
   cp lovelace/aptus-laundry-card/dist/aptus-laundry-card.js custom_components/aptus/www/
   ```

3. Restart Home Assistant. The integration auto-registers the cards — no need to add resources manually.

## Development

Each card is a standalone TypeScript + Lit project with its own `package.json`.

```bash
cd lovelace/aptus-lock-card  # or aptus-laundry-card
npm install
npm test          # run tests
npm run watch     # rebuild on changes
```

Tech stack: TypeScript, Lit 3, Rollup, Vitest.
