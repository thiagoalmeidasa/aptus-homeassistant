"""Websocket commands for Aptus laundry on-demand data fetching."""

from __future__ import annotations

import logging
from typing import Any

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
import voluptuous as vol

from .aptus_client import laundry
from .aptus_client.exceptions import AptusAuthError, AptusConnectionError
from .aptus_client.models import LaundryBooking, TimeSlot
from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)


def _slot_to_dict(slot: TimeSlot) -> dict[str, Any]:
    """Serialize a TimeSlot to a dict for websocket response."""
    return {
        "pass_no": slot.pass_no,
        "date": slot.date.isoformat(),
        "group_id": slot.group_id,
        "state": slot.state.value,
        "start_time": slot.start_time.strftime("%H:%M"),
        "end_time": slot.end_time.strftime("%H:%M"),
    }


def _booking_to_dict(booking: LaundryBooking) -> dict[str, Any]:
    """Serialize a LaundryBooking to a dict for websocket response."""
    return {
        "id": booking.id,
        "group_name": booking.group_name,
        "date": booking.date.isoformat(),
        "pass_no": booking.pass_no,
        "start_time": booking.start_time.strftime("%H:%M"),
        "end_time": booking.end_time.strftime("%H:%M"),
    }


def _get_coordinator(hass: HomeAssistant, entry_id: str):
    """Get the Aptus coordinator for a specific config entry."""
    entry = hass.config_entries.async_get_entry(entry_id)
    if not entry or entry.domain != DOMAIN:
        return None
    return entry.runtime_data


@callback
def async_register_websocket_commands(hass: HomeAssistant) -> None:
    """Register Aptus websocket commands."""
    websocket_api.async_register_command(hass, ws_entries)
    websocket_api.async_register_command(hass, ws_laundry_groups)
    websocket_api.async_register_command(hass, ws_laundry_first_available)
    websocket_api.async_register_command(hass, ws_laundry_weekly_calendar)
    websocket_api.async_register_command(hass, ws_laundry_bookings)


@websocket_api.websocket_command({"type": "aptus/entries"})
@websocket_api.async_response
async def ws_entries(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Return configured Aptus integration entries."""
    entries = hass.config_entries.async_entries(DOMAIN)
    connection.send_result(
        msg["id"],
        [{"entry_id": e.entry_id, "title": e.title} for e in entries],
    )


@websocket_api.websocket_command(
    {
        "type": "aptus/laundry/groups",
        vol.Required("entry_id"): str,
    }
)
@websocket_api.async_response
async def ws_laundry_groups(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Return available laundry groups."""
    coordinator = _get_coordinator(hass, msg["entry_id"])
    if not coordinator:
        connection.send_error(msg["id"], "not_found", "Aptus entry not found")
        return

    try:
        category_id = await coordinator.get_category_id()
        # Try AJAX shortcut first — returns single group ID or None if multi
        single_group_id = await laundry.get_laundry_group_id(coordinator.client, category_id)
        if single_group_id:
            # Single group — return it directly without hitting CustomerLocationGroups
            connection.send_result(msg["id"], [{"id": single_group_id, "name": "Laundry"}])
        else:
            # Multiple groups — fetch the full list
            groups = await laundry.list_laundry_groups(coordinator.client, category_id)
            connection.send_result(msg["id"], [{"id": g.id, "name": g.name} for g in groups])
    except (AptusAuthError, AptusConnectionError) as exc:
        _LOGGER.debug("Failed to fetch laundry groups: %s", exc)
        connection.send_result(msg["id"], [])


@websocket_api.websocket_command(
    {
        "type": "aptus/laundry/first_available",
        vol.Required("entry_id"): str,
        vol.Optional("first_x", default=10): int,
    }
)
@websocket_api.async_response
async def ws_laundry_first_available(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Return first available laundry slots."""
    coordinator = _get_coordinator(hass, msg["entry_id"])
    if not coordinator:
        connection.send_error(msg["id"], "not_found", "Aptus entry not found")
        return

    try:
        category_id = await coordinator.get_category_id()
        slots = await laundry.get_first_available_slots(
            coordinator.client, category_id, first_x=msg["first_x"]
        )
        connection.send_result(msg["id"], [_slot_to_dict(s) for s in slots])
    except (AptusAuthError, AptusConnectionError) as exc:
        _LOGGER.debug("Failed to fetch first available slots: %s", exc)
        connection.send_result(msg["id"], [])


@websocket_api.websocket_command(
    {
        "type": "aptus/laundry/weekly_calendar",
        vol.Required("entry_id"): str,
        vol.Required("group_id"): str,
        vol.Optional("pass_date"): str,
    }
)
@websocket_api.async_response
async def ws_laundry_weekly_calendar(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Return weekly calendar for a laundry group."""
    coordinator = _get_coordinator(hass, msg["entry_id"])
    if not coordinator:
        connection.send_error(msg["id"], "not_found", "Aptus entry not found")
        return

    try:
        slots = await laundry.get_weekly_calendar(
            coordinator.client, group_id=msg["group_id"], pass_date=msg.get("pass_date")
        )
        connection.send_result(msg["id"], [_slot_to_dict(s) for s in slots])
    except (AptusAuthError, AptusConnectionError) as exc:
        _LOGGER.debug("Failed to fetch weekly calendar: %s", exc)
        connection.send_result(msg["id"], [])


@websocket_api.websocket_command(
    {
        "type": "aptus/laundry/bookings",
        vol.Required("entry_id"): str,
    }
)
@websocket_api.async_response
async def ws_laundry_bookings(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Return user's laundry bookings."""
    coordinator = _get_coordinator(hass, msg["entry_id"])
    if not coordinator:
        connection.send_error(msg["id"], "not_found", "Aptus entry not found")
        return

    try:
        bookings = await laundry.list_bookings(coordinator.client)
        connection.send_result(msg["id"], [_booking_to_dict(b) for b in bookings])
    except (AptusAuthError, AptusConnectionError) as exc:
        _LOGGER.debug("Failed to fetch bookings: %s", exc)
        connection.send_result(msg["id"], [])
