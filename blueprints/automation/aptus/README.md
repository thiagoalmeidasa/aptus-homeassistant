# Calendar sync blueprint

Mirrors your Aptus laundry bookings onto another calendar — typically Google Calendar — so your slots show up next to everything else you've got planned.

## Before you start

- This **Aptus integration** installed and connected to your portal.
- **[Calendar Utils](https://github.com/swehog/hacs_calendar_utils)** from HACS, then added under **Settings → Devices & Services → + Add Integration → Calendar Utils**. (Home Assistant's built-in calendar tools can't read event IDs or delete events on their own; this fills the gap.)
- A destination calendar you can write to — Google Calendar and HA's Local Calendar both work.

## Install

[![Open your Home Assistant instance and show the blueprint import dialog with this blueprint pre-filled.](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2Fthiagoalmeidasa%2Faptus-homeassistant%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Faptus%2Fcalendar_sync.yaml)

Click the badge, confirm the import, then create an automation from the blueprint and pick your source and destination calendars.

## Settings

| Option | What it controls |
|---|---|
| **Source calendar** | Where bookings come from — usually `calendar.laundry`. |
| **Destination calendar** | Where bookings go — your Google or Local Calendar. |
| **Look-ahead window** | How many days into the future to sync (default 30). |
| **Sync interval** | How often to double-check, in case real-time signals get missed (default every 10 minutes). |
| **Convert event times to HA's timezone** | Leave on unless your source and destination use different time zones on purpose. |

## What happens

- Book a slot → it appears on the destination calendar within seconds.
- Cancel a booking → the event is removed from the destination and replaced with a `[CANCELLED]` placeholder at the same time, so you still see when it was.
- Bookings made or cancelled by someone else directly on the Aptus portal are picked up too.

## If something's not syncing

Open the automation in HA → **Traces** and look at the most recent run. The trace points at which step went wrong — almost always one of:

- Calendar Utils not installed, or installed but not added under Settings → Devices & Services.
- Destination calendar doesn't support deletion (cancellations stay as duplicates). Google and HA Local Calendar both support it; others may not.
- Source calendar doesn't expose event IDs. For Aptus this works as of the integration's UID release; for other source calendars, results vary.

Open an issue on the repo if you're stuck.
