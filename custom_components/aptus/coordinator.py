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
from .const import (
    CONF_ENABLE_APARTMENT_DOOR,
    CONF_ENABLE_ENTRANCE_DOORS,
    CONF_ENABLE_LAUNDRY,
    DEFAULT_SCAN_INTERVAL,
)

_LOGGER = logging.getLogger(__name__)


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

        return {
            "doors": door_list,
            "apartment_status": apartment_status,
            "bookings": bookings,
        }
