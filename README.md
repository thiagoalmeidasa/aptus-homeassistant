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

## Supported portals

Any AptusPortal instance should work. Known working:

- `bokning.ikanobostad.se/Aptusportal` (Ikano Bostad)
- `sssb.aptustotal.se/AptusPortal` (SSSB)

## License

MIT
