"""DataUpdateCoordinator for Aptus integration."""

from __future__ import annotations

from datetime import timedelta
import logging
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryAuthFailed
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .aptus_client import AptusClient, doors, laundry
from .aptus_client.exceptions import AptusAuthError, AptusConnectionError
from .aptus_client.laundry import get_laundry_category_id
from .aptus_client.models import LaundryBooking
from .const import (
    CONF_ENABLE_APARTMENT_DOOR,
    CONF_ENABLE_ENTRANCE_DOORS,
    CONF_ENABLE_LAUNDRY,
    DEFAULT_SCAN_INTERVAL,
)

_LOGGER = logging.getLogger(__name__)

# Bus event fired when laundry bookings appear or disappear between coordinator
# refreshes. Single event type with a "type" discriminator follows HA convention
# (see https://developers.home-assistant.io/docs/integration_events/) — keeps the
# contract stable as we add more event types later (e.g. lock activity).
EVENT_APTUS = "aptus_event"
EVENT_TYPE_BOOKING_CREATED = "booking_created"
EVENT_TYPE_BOOKING_CANCELLED = "booking_cancelled"


class AptusDataUpdateCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Coordinator to fetch door status and laundry bookings from Aptus."""

    def __init__(self, hass: HomeAssistant, client: AptusClient, entry: ConfigEntry) -> None:
        super().__init__(
            hass,
            _LOGGER,
            name="Aptus",
            update_interval=timedelta(seconds=DEFAULT_SCAN_INTERVAL),
        )
        self.client = client
        self.entry = entry
        self._category_id: str | None = None
        # None until the first successful refresh observes a booking snapshot.
        # The first snapshot is the baseline — emitting "created" events for
        # every booking on HA startup would flood any listening automation.
        self._previous_booking_ids: set[str] | None = None

    async def get_category_id(self) -> str:
        """Get the laundry category ID, caching on first call."""
        if self._category_id is None:
            self._category_id = await get_laundry_category_id(self.client)
        return self._category_id

    @property
    def entrance_doors_enabled(self) -> bool:
        """Check if entrance doors feature is enabled in options."""
        return self.entry.options.get(CONF_ENABLE_ENTRANCE_DOORS, True)

    @property
    def apartment_door_enabled(self) -> bool:
        """Check if apartment door feature is enabled in options."""
        return self.entry.options.get(CONF_ENABLE_APARTMENT_DOOR, False)

    @property
    def laundry_enabled(self) -> bool:
        """Check if laundry feature is enabled in options."""
        return self.entry.options.get(CONF_ENABLE_LAUNDRY, True)

    async def _async_update_data(self) -> dict[str, Any]:
        try:
            door_list = await doors.list_doors(self.client) if self.entrance_doors_enabled else []
            apartment_status = (
                await doors.get_apartment_door_status(self.client)
                if self.apartment_door_enabled
                else None
            )
            bookings = await laundry.list_bookings(self.client) if self.laundry_enabled else []
        except AptusAuthError as exc:
            raise ConfigEntryAuthFailed(str(exc)) from exc
        except AptusConnectionError as exc:
            raise UpdateFailed(str(exc)) from exc

        if self.laundry_enabled:
            self._fire_booking_diff_events(bookings)
        else:
            # Drop baseline so re-enabling laundry doesn't falsely emit
            # cancellation events for whatever was in the previous snapshot.
            self._previous_booking_ids = None

        return {
            "doors": door_list,
            "apartment_status": apartment_status,
            "bookings": bookings,
        }

    def _fire_booking_diff_events(self, bookings: list[LaundryBooking]) -> None:
        """
        Emit aptus_event for any bookings that appeared or disappeared.

        Runs on every coordinator refresh, so it catches both HA-initiated
        cancellations (via aptus.cancel_laundry) and portal-side changes
        (made by another household member directly on the Aptus website).
        Aptus has no in-place modify operation — only create and cancel — so
        a created/cancelled pair is sufficient to mirror the booking state.
        """
        current_ids = {b.id for b in bookings}

        if self._previous_booking_ids is None:
            self._previous_booking_ids = current_ids
            return

        created_ids = current_ids - self._previous_booking_ids
        cancelled_ids = self._previous_booking_ids - current_ids

        bookings_by_id = {b.id: b for b in bookings}
        for booking_id in created_ids:
            b = bookings_by_id[booking_id]
            self.hass.bus.async_fire(
                EVENT_APTUS,
                {
                    "type": EVENT_TYPE_BOOKING_CREATED,
                    "booking_id": b.id,
                    "group_name": b.group_name,
                    "date": b.date.isoformat(),
                    "pass_no": b.pass_no,
                },
            )
        for booking_id in cancelled_ids:
            self.hass.bus.async_fire(
                EVENT_APTUS,
                {"type": EVENT_TYPE_BOOKING_CANCELLED, "booking_id": booking_id},
            )

        self._previous_booking_ids = current_ids
