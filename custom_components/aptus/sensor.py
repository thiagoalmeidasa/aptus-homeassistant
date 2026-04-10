"""Sensor platform for Aptus integration."""

from __future__ import annotations

from typing import Any

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .aptus_client.models import LaundryBooking
from .coordinator import AptusDataUpdateCoordinator


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Aptus sensor entities."""
    coordinator: AptusDataUpdateCoordinator = entry.runtime_data
    if not coordinator.laundry_enabled:
        return
    async_add_entities(
        [
            AptusNextLaundryBookingSensor(coordinator, entry),
        ]
    )


class AptusNextLaundryBookingSensor(CoordinatorEntity[AptusDataUpdateCoordinator], SensorEntity):
    """Sensor showing the next laundry booking datetime."""

    _attr_has_entity_name = True
    _attr_name = "Next Laundry Booking"

    def __init__(
        self,
        coordinator: AptusDataUpdateCoordinator,
        entry: ConfigEntry,
    ) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{entry.entry_id}_next_laundry"

    @property
    def native_value(self) -> str | None:
        """Return the next booking datetime as ISO string."""
        bookings: list[LaundryBooking] = self.coordinator.data.get("bookings", [])
        if not bookings:
            return None

        next_booking = min(bookings, key=lambda b: b.start)
        return next_booking.start.isoformat()

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        bookings: list[LaundryBooking] = self.coordinator.data.get("bookings", [])
        if not bookings:
            return {}

        next_booking = min(bookings, key=lambda b: b.start)
        return {
            "group_name": next_booking.group_name,
            "pass_no": next_booking.pass_no,
            "booking_id": next_booking.id,
        }
