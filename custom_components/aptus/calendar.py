"""Calendar platform for Aptus laundry bookings."""

from __future__ import annotations

from datetime import datetime

from homeassistant.components.calendar import CalendarEntity, CalendarEvent
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity
from homeassistant.util import dt as dt_util

from .aptus_client.models import LaundryBooking
from .coordinator import AptusDataUpdateCoordinator


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
        """Return the next upcoming event."""
        bookings: list[LaundryBooking] = self.coordinator.data.get("bookings", [])
        if not bookings:
            return None

        now = dt_util.now()
        tz = dt_util.DEFAULT_TIME_ZONE
        # Find next future booking, or the most recent one
        future = [b for b in bookings if b.end.replace(tzinfo=tz) > now]
        if future:
            booking = min(future, key=lambda b: b.start)
        else:
            booking = max(bookings, key=lambda b: b.start)

        return self._booking_to_event(booking)

    def _booking_to_event(self, booking: LaundryBooking) -> CalendarEvent:
        """Convert a booking to a HA CalendarEvent with timezone."""
        tz = dt_util.DEFAULT_TIME_ZONE
        return CalendarEvent(
            start=booking.start.replace(tzinfo=tz),
            end=booking.end.replace(tzinfo=tz),
            summary=f"Laundry - {booking.group_name}",
        )

    async def async_get_events(
        self,
        hass: HomeAssistant,
        start_date: datetime,
        end_date: datetime,
    ) -> list[CalendarEvent]:
        """Return all events in a date range."""
        bookings: list[LaundryBooking] = self.coordinator.data.get("bookings", [])
        events = []
        for booking in bookings:
            start = booking.start.replace(tzinfo=dt_util.DEFAULT_TIME_ZONE)
            end = booking.end.replace(tzinfo=dt_util.DEFAULT_TIME_ZONE)
            if start >= start_date and end <= end_date:
                events.append(self._booking_to_event(booking))
        return events
