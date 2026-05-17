"""Calendar platform for Aptus laundry bookings."""

from __future__ import annotations

from datetime import datetime
import logging

from homeassistant.components.calendar import CalendarEntity, CalendarEvent
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity
from homeassistant.util import dt as dt_util

from .aptus_client.models import LaundryBooking
from .coordinator import AptusDataUpdateCoordinator

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Aptus laundry calendar entity."""
    coordinator: AptusDataUpdateCoordinator = entry.runtime_data
    if not coordinator.laundry_enabled:
        return
    async_add_entities([AptusLaundryCalendar(coordinator, entry)])


def _ensure_tz(value: datetime) -> datetime:
    """
    Attach DEFAULT_TIME_ZONE only if the datetime is naive.

    Prevents the previous bug where `.replace(tzinfo=DEFAULT_TIME_ZONE)`
    silently re-zoned datetimes that already had explicit tzinfo.
    """
    if value.tzinfo is None:
        return value.replace(tzinfo=dt_util.DEFAULT_TIME_ZONE)
    return value


class AptusLaundryCalendar(CoordinatorEntity[AptusDataUpdateCoordinator], CalendarEntity):
    """Calendar entity showing laundry bookings."""

    _attr_has_entity_name = True
    _attr_name = "Laundry"

    def __init__(
        self,
        coordinator: AptusDataUpdateCoordinator,
        entry: ConfigEntry,
    ) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{entry.entry_id}_laundry_calendar"

    @property
    def event(self) -> CalendarEvent | None:
        """
        Return the next upcoming event, or None if nothing is upcoming.

        Past bookings no longer linger on the entity. The previous "fall
        back to most recent past booking" made `state == off` ambiguous
        and surfaced stale events.
        """
        bookings: list[LaundryBooking] = self.coordinator.data.get("bookings", [])
        if not bookings:
            return None

        now = dt_util.now()
        future: list[LaundryBooking] = []
        for booking in bookings:
            try:
                if _ensure_tz(booking.end) > now:
                    future.append(booking)
            except ValueError as exc:
                _LOGGER.warning(
                    "Skipping laundry booking %s with unresolvable times: %s",
                    booking.id,
                    exc,
                )

        if not future:
            return None

        upcoming = min(future, key=lambda b: b.start)
        try:
            return self._booking_to_event(upcoming)
        except ValueError as exc:
            _LOGGER.warning(
                "Skipping laundry booking %s with unresolvable times: %s",
                upcoming.id,
                exc,
            )
            return None

    def _booking_to_event(self, booking: LaundryBooking) -> CalendarEvent:
        """Convert a booking to a HA CalendarEvent with timezone."""
        return CalendarEvent(
            start=_ensure_tz(booking.start),
            end=_ensure_tz(booking.end),
            summary=(
                f"Laundry {booking.group_name} "
                f"{booking.start_time:%H:%M}-{booking.end_time:%H:%M}"
            ),
            description=(f"Aptus laundry booking · {booking.group_name} · slot {booking.pass_no}"),
            uid=booking.id,
        )

    async def async_get_events(
        self,
        hass: HomeAssistant,
        start_date: datetime,
        end_date: datetime,
    ) -> list[CalendarEvent]:
        """Return all events in a date range."""
        bookings: list[LaundryBooking] = self.coordinator.data.get("bookings", [])
        events: list[CalendarEvent] = []
        for booking in bookings:
            try:
                start = _ensure_tz(booking.start)
                end = _ensure_tz(booking.end)
            except ValueError as exc:
                _LOGGER.warning(
                    "Skipping laundry booking %s with unresolvable times: %s",
                    booking.id,
                    exc,
                )
                continue
            if start >= start_date and end <= end_date:
                events.append(self._booking_to_event(booking))
        return events
