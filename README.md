# Aptus Home Assistant Integration

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)

Home Assistant custom integration for [Aptus](https://www.aptus.se/) building access portals, used by Swedish housing companies (Ikano Bostad, SSSB, etc.).

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=thiagoalmeidasa&repository=aptus-homeassistant&category=integration)

## Features

### Door locks
- **Entrance doors** — unlock from Home Assistant (auto-relocks)
- **Apartment door** — lock/unlock with real-time status and battery monitoring

### Laundry booking
- **Calendar entity** — your bookings shown as calendar events
- **Next booking sensor** — quick glance at your next laundry slot
- **Book & cancel services** — `aptus.book_laundry` and `aptus.cancel_laundry` for automations

## Installation

### HACS (recommended)

1. Open HACS in Home Assistant
2. Click the button above, or go to **HACS > Integrations > Custom repositories**
3. Add `https://github.com/thiagoalmeidasa/aptus-homeassistant` as an **Integration**
4. Install **Aptus**
5. Restart Home Assistant

### Manual

Copy `custom_components/aptus/` to your Home Assistant `config/custom_components/` directory and restart.

## Configuration

1. Go to **Settings > Devices & Services > Add Integration**
2. Search for **Aptus**
3. Enter your portal URL, username, and password

| Field | Example |
|-------|---------|
| Portal URL | `https://bokning.ikanobostad.se/Aptusportal` |
| Username | Your apartment/account ID |
| Password | Your portal password |

## Entities created

| Entity | Type | Description |
|--------|------|-------------|
| `lock.<door_name>` | Lock | One per entrance door (unlock only) |
| `lock.apartment_door` | Lock | Apartment doorman lock (lock/unlock + battery) |
| `calendar.laundry` | Calendar | Laundry bookings as calendar events |
| `sensor.next_laundry_booking` | Sensor | Next booking datetime with group name |

## Lovelace Cards

### aptus-lock-card

Custom slide-to-unlock card with animated countdown feedback. After unlocking, the card shows a 5-second countdown bar before returning to the locked state.

**Installation**: Copy `dist/aptus-lock-card.js` from `lovelace/aptus-lock-card/` to your HA `www/` directory, then add as a resource in your dashboard.

```yaml
type: custom:aptus-lock-card
title: Building Lock
entities:
  - lock.entity_example
unlock_duration: 5  # optional, seconds (default: 5)
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `entities` | list | required | Lock entity IDs |
| `title` | string | — | Card header title |
| `unlock_duration` | number | 5 | Countdown duration in seconds |

### Mushroom card alternative

If you prefer standard Mushroom cards, the lock entity auto-relocks after 5 seconds, so a `mushroom-template-card` works out of the box:

```yaml
type: custom:mushroom-template-card
entity: lock.entity_example
icon: >-
  {{ 'mdi:lock' if is_state(entity, 'locked') else 'mdi:lock-open-check' }}
icon_color: "{{ 'red' if is_state(entity, 'locked') else 'green' }}"
primary: Building Door
secondary: "{{ states(entity) | capitalize }}"
tap_action:
  action: perform-action
  perform_action: lock.unlock
  target:
    entity_id: lock.entity_example
  confirmation:
    text: Unlock the door?
```

## Services

### `aptus.book_laundry`

| Field | Type | Description |
|-------|------|-------------|
| `pass_no` | int | Time slot number (0-9) |
| `pass_date` | string | Date in YYYY-MM-DD format |
| `group_id` | string | Laundry group/facility ID |

### `aptus.cancel_laundry`

| Field | Type | Description |
|-------|------|-------------|
| `booking_id` | string | ID of the booking to cancel |

## Events

`aptus_event` fires on the HA event bus whenever a laundry booking appears or disappears between coordinator refreshes — covers HA-initiated changes (via the services above) and portal-side changes someone else makes directly on the Aptus website.

| `event.data.type` | Other payload fields |
|---|---|
| `booking_created` | `booking_id`, `group_name`, `date` (YYYY-MM-DD), `pass_no` |
| `booking_cancelled` | `booking_id` |

```yaml
trigger:
  - platform: event
    event_type: aptus_event
    event_data:
      type: booking_created
```

The first observed booking snapshot after HA start is treated as the baseline; no events fire for it.

## Blueprints

### Calendar sync

One-way mirror of upcoming events from a source HA calendar to a destination calendar — built for `calendar.laundry` → Google Calendar, but works with any source that exposes a stable `uid` per event.

[![Open your Home Assistant instance and show the blueprint import dialog with this blueprint pre-filled.](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2Fthiagoalmeidasa%2Faptus-homeassistant%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Faptus%2Fcalendar_sync.yaml)

Triggers on HA start, on a configurable interval, on source-calendar state changes, and on `aptus_event` (instant for Aptus bookings). Dedups by embedding `[sync_uid:<uid>]` in the destination event's description. Cancellations delete the destination copy and recreate it with a `[CANCELLED]` prefix.

**Prerequisite:** Install [`hacs_calendar_utils`](https://github.com/swehog/hacs_calendar_utils) — HA core's `calendar.get_events` strips `uid` from the response and exposes no `delete_event` service. `calendar_utils.get_events` and `calendar_utils.delete_event_by_uid` plug both gaps. The destination calendar must advertise `DELETE_EVENT` in its `supported_features` (Google Calendar does).

Source: [`blueprints/automation/aptus/calendar_sync.yaml`](blueprints/automation/aptus/calendar_sync.yaml).

## Supported portals

Any AptusPortal instance should work. Known working:

- `bokning.ikanobostad.se/Aptusportal` (Ikano Bostad)
- `sssb.aptustotal.se/AptusPortal` (SSSB)

## License

MIT
