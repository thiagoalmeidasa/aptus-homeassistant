# Calendar sync blueprint

One-way reconciliation sync from any HA source calendar to any destination calendar — built to mirror `calendar.laundry` (from this Aptus integration) onto a Google Calendar so your laundry bookings show up alongside everything else.

The reconciliation pass diffs source vs destination on every trigger and:

- **Creates** missing destination events (copies summary, description, start, end).
- **Cancels** orphan destination events whose source has disappeared — by deleting them and recreating with a `[CANCELLED]` prefix on the same time slot.

Dedup is done by embedding `[sync_uid:<source.uid>]` in the destination event's description, so the blueprint can recognise events it already created on subsequent passes.

## Prerequisites

| Required | Why |
|---|---|
| **Aptus integration** (this repo) | Source events on `calendar.laundry` carry a stable `uid` (the portal's booking ID). Also fires `aptus_event` for instant trigger response. |
| **[`hacs_calendar_utils`](https://github.com/swehog/hacs_calendar_utils)** | HA core's `calendar.get_events` strips `uid` from responses and exposes no `delete_event` service. `calendar_utils.get_events` returns `uid`; `calendar_utils.delete_event_by_uid` enables real cancellation. Install via HACS, then **Settings → Devices & Services → + Add Integration → Calendar Utils**. |
| **Destination calendar that supports `DELETE_EVENT`** | Google Calendar (`supported_features: 3`) and `local_calendar` both qualify. Check via `state_attr('calendar.<entity>', 'supported_features')` — bit 2 (decimal 2) must be set. |

## Install

[![Open your Home Assistant instance and show the blueprint import dialog with this blueprint pre-filled.](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2Fthiagoalmeidasa%2Faptus-homeassistant%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Faptus%2Fcalendar_sync.yaml)

Or manually: **Settings → Automations & Scenes → Blueprints → Import Blueprint** and paste the raw URL.

## Inputs

| Name | Default | Description |
|---|---|---|
| **Source calendar** | — | The calendar to read from. For laundry: `calendar.laundry`. |
| **Destination calendar** | — | The calendar to mirror events to. For Google: e.g. `calendar.home399`. |
| **Look-ahead window (days)** | 30 | How far into the future to reconcile. Bookings beyond this are ignored until they fall inside the window. |
| **Sync interval** | Every 10 minutes | Polling fallback for missed bus events. Choose from 5 / 10 / 15 / 30 min. |
| **Convert event times to Home Assistant's timezone** | on | Leave on unless source and destination intentionally use different timezones. |

## How it works

### Triggers

| ID | When it fires | Why |
|---|---|---|
| `ha_start` | HA boots | Reconcile anything that drifted while HA was offline. |
| `scheduled` | Every N minutes | Safety net for missed bus events and out-of-band changes. |
| `source_state_change` | The source calendar's next event changes | Catches a lot of edits quickly. |
| `aptus_booking_created` | Aptus integration fires `aptus_event` with `type: booking_created` | Instant propagation when a booking is made (via the HA service or the Aptus portal directly). |
| `aptus_booking_cancelled` | Aptus integration fires `aptus_event` with `type: booking_cancelled` | Instant propagation when a booking is cancelled. |

All triggers run the same reconciliation logic. Mode is `single` with `max_exceeded: silent` — a re-fire while running is dropped, and the next scheduled tick picks it up.

### Reconciliation logic

1. `calendar_utils.get_events` on the source and destination over the look-ahead window.
2. Build `dest_sync_uids` by regex-extracting `[sync_uid:<x>]` from each destination event's description.
3. **Create**: any source event whose `uid` is *not* in `dest_sync_uids` is created on the destination, with `[sync_uid:<source.uid>]` appended to the description.
4. **Cancel**: any destination event whose embedded `sync_uid` is *not* in the current source list (and whose summary doesn't already start with `[CANCELLED]`) is deleted via `calendar_utils.delete_event_by_uid` and recreated with `[CANCELLED]` prefixed to the summary.

## Troubleshooting

Pull the automation trace from **Settings → Automations & Scenes → \<your automation\> → Traces** and look at which `action/<n>` step failed.

| Symptom | Likely cause | Fix |
|---|---|---|
| Trace error `Action calendar_utils.get_events not found` | The hacs_calendar_utils integration was installed via HACS but not added under **Settings → Devices & Services**. | Add it; services register after the next restart. |
| Trace error `SecurityError: access to attribute 'append' ...` | You're on a stale blueprint version. | Re-import from the URL above. |
| Destination calendar stays empty, trace shows source `uid` as `null` or missing | Source integration doesn't expose `uid` through `calendar.get_events`. | Check the source — for Aptus this works as of the integration's UID + `aptus_event` release. Other integrations vary. |
| Same event re-created every run | Source `uid` is unstable across refreshes (changes on every poll). | Source-integration bug. The Aptus integration's `booking.id` is the portal's persistent backend ID and is stable. |
| Cancellation isn't deleting the destination event | Destination doesn't actually support `DELETE_EVENT`. | `calendar_utils.delete_event_by_uid` requires `DELETE_EVENT` in the entity's `supported_features`. The service refuses otherwise. |

## Known limitations

- **Timed events only** — all-day events (no `start.dateTime`) are skipped silently. For laundry this is fine since slots are always timed.
- **One-way sync** — edits made on the destination aren't propagated back to the source. Don't point a destination back as another sync's source; the topology gets confusing fast even though `[sync_uid:…]` prevents the blueprint from re-syncing its own creations.
- **HA Jinja sandbox** — the diff is implemented with namespace + list concatenation (`ns.items + [x]`) because `.append()` is blocked. If you fork this blueprint, keep that in mind.
- **No update path** — when a source event's summary / time / description changes without changing `uid`, the blueprint won't notice. (Aptus doesn't have a "modify" operation, so this is moot for the primary use case.)
