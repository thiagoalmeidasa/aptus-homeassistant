"""DataUpdateCoordinator for Aptus integration."""

from __future__ import annotations

import logging
from datetime import timedelta
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryAuthFailed
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .aptus_client import AptusClient
from .aptus_client import doors, laundry
from .aptus_client.exceptions import AptusAuthError, AptusConnectionError
from .const import DEFAULT_SCAN_INTERVAL

_LOGGER = logging.getLogger(__name__)


class AptusDataUpdateCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Coordinator to fetch door status and laundry bookings from Aptus."""

    def __init__(self, hass: HomeAssistant, client: AptusClient) -> None:
        super().__init__(
            hass,
            _LOGGER,
            name="Aptus",
            update_interval=timedelta(seconds=DEFAULT_SCAN_INTERVAL),
        )
        self.client = client

    async def _async_update_data(self) -> dict[str, Any]:
        try:
            door_list = await doors.list_doors(self.client)
            apartment_status = await doors.get_apartment_door_status(self.client)
            bookings = await laundry.list_bookings(self.client)
        except AptusAuthError as exc:
            raise ConfigEntryAuthFailed(str(exc)) from exc
        except AptusConnectionError as exc:
            raise UpdateFailed(str(exc)) from exc

        return {
            "doors": door_list,
            "apartment_status": apartment_status,
            "bookings": bookings,
        }
