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

View, book, and cancel laundry time slots with three configurable sections.

**Sections:**
- **My bookings** — current bookings with cancel button
- **First available** — next N available slots across all rooms with one-click booking
- **Calendar** — weekly grid per laundry room with group selector and week navigation

Data is fetched on-demand via websocket commands when the card is opened, not via polling.

**Configuration:**

```yaml
type: custom:aptus-laundry-card
title: Laundry  # optional
sections:  # optional, defaults to all three
  - type: my-bookings
  - type: first-available
  - type: calendar
first_available_count: 10  # optional, default 10
```

| Option                  | Type           | Required | Description                              |
|-------------------------|----------------|----------|------------------------------------------|
| `title`                 | string         | No       | Card header title                        |
| `sections`              | SectionConfig[]| No       | Which sections to show and in what order  |
| `first_available_count` | number         | No       | Number of slots in "First available" (default 10) |

**Section types:** `my-bookings`, `first-available`, `calendar`

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
