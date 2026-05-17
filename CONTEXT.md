# CONTEXT.md

Domain-specific terminology used in this repository. Glossary only — not a
specification or design doc.

## Language

- **Card bundle** — Compiled ES module for a Lovelace card (built from
  `lovelace/<card>/src/` into `lovelace/<card>/dist/`, then *manually
  copied* into `custom_components/aptus/www/<card>.js`). Aliases to avoid:
  "card script", "card js".
- **Served card** — The bundle actually delivered to browsers, i.e. the
  copy under `custom_components/aptus/www/`. Distinct from the `dist/`
  output, which is build-only.
- **Cold-load race** — The window between HA's first dashboard render and
  `customElements.define()` running inside a card bundle. If the dashboard
  renders first, HA creates the card element before it's defined and shows
  `hui-error-card` instead. Industry stance: don't preempt it; rely on
  HA's `whenDefined` → `ll-rebuild`. Aliases to avoid: "slow phone bug".
- **Upgrade callback** — `connectedCallback` invoked by the browser when an
  already-attached element is upgraded by a late `customElements.define`.
  Fires with `_config` undefined unless `setConfig` has run first; guard
  every connectedCallback override against this.
- **ll-rebuild** — HA's event (`fireEvent(el, "ll-rebuild")`) that asks the
  parent view to discard an existing error/placeholder element and
  recreate the real card. Fired automatically after
  `customElements.whenDefined(tag)` resolves.
- **hui-error-card** — HA's fallback element used whenever `setConfig`
  throws or a custom element is missing. Its heading is the literal string
  "Configuration error"; the underlying cause is rendered below as the
  `.error` body.
- **Coordinator** — `AptusDataUpdateCoordinator`
  (`custom_components/aptus/coordinator.py`). Polls Aptus every
  `DEFAULT_SCAN_INTERVAL` (30 s) and is the single source of truth for
  door/booking state in the integration process.
- **WS command** — Synchronous WebSocket request/response handler
  registered by the integration (e.g. `aptus/entries`,
  `aptus/laundry/bookings`). Called via `hass.connection.sendMessagePromise`
  from the card.
- **WS subscription** — Push channel established by
  `hass.connection.subscribeMessage`. Aptus exposes a single signal-only
  channel `aptus/subscribe` scoped per `entry_id`; the coordinator fires
  `{ updated: true }` after every refresh and subscribers re-fetch via
  the existing `aptus/laundry/*` commands. Pattern copied from
  scheduler-card.

## Relationships

- A **served card** is produced from one **card bundle**: build → copy.
  There is no automation for the copy step; commits like `build: update
  aptus-laundry-card.js` are how the served version is refreshed.
- The **coordinator** exposes data both as HA entities (sensor/lock/
  calendar platforms) **and** via **WS commands**. Cards can read either
  surface; today the lock card reads entities, the laundry card uses WS
  commands.
- A **cold-load race** can only surface as "Configuration error" — never
  as a server-side log line — because the failure happens inside the
  browser. `gcx logs query` against the HA Loki stream is not useful for
  diagnosing it.

## Flagged ambiguities

- "Configuration error" is overloaded: in HA's UI it is the *heading* of
  any `hui-error-card`, so the same label appears for setConfig throws,
  missing custom elements, and schema failures. When triaging, the
  meaningful detail is the body text underneath the heading — not the
  heading itself.
