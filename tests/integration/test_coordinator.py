"""BDD tests for AptusDataUpdateCoordinator."""

from unittest.mock import AsyncMock, patch

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryAuthFailed
from homeassistant.helpers.update_coordinator import UpdateFailed

from custom_components.aptus.aptus_client import doors, laundry
from custom_components.aptus.aptus_client.exceptions import (
    AptusAuthError,
    AptusConnectionError,
)
from custom_components.aptus.coordinator import AptusDataUpdateCoordinator

from .conftest import MOCK_BOOKINGS, MOCK_DOOR_STATUS, MOCK_DOORS


class TestAptusCoordinator:
    """Describe AptusDataUpdateCoordinator."""

    async def test_it_should_fetch_doors_status_and_bookings_on_update(self, hass: HomeAssistant):
        mock_client = AsyncMock()

        with (
            patch.object(doors, "list_doors", return_value=MOCK_DOORS) as mock_list,
            patch.object(
                doors, "get_apartment_door_status", return_value=MOCK_DOOR_STATUS
            ) as mock_status,
            patch.object(laundry, "list_bookings", return_value=MOCK_BOOKINGS) as mock_bookings,
        ):
            coordinator = AptusDataUpdateCoordinator(hass, mock_client)
            await coordinator.async_refresh()

        mock_list.assert_awaited_once_with(mock_client)
        mock_status.assert_awaited_once_with(mock_client)
        mock_bookings.assert_awaited_once_with(mock_client)

        assert coordinator.data["doors"] == MOCK_DOORS
        assert coordinator.data["apartment_status"] == MOCK_DOOR_STATUS
        assert coordinator.data["bookings"] == MOCK_BOOKINGS

    async def test_it_should_raise_update_failed_on_connection_error(self, hass: HomeAssistant):
        mock_client = AsyncMock()

        with patch.object(doors, "list_doors", side_effect=AptusConnectionError("timeout")):
            coordinator = AptusDataUpdateCoordinator(hass, mock_client)
            await coordinator.async_refresh()

        # DataUpdateCoordinator catches the exception and stores it
        assert coordinator.last_update_success is False
        assert isinstance(coordinator.last_exception, UpdateFailed)

    async def test_it_should_trigger_reauth_on_auth_error(self, hass: HomeAssistant):
        mock_client = AsyncMock()

        with patch.object(doors, "list_doors", side_effect=AptusAuthError("expired")):
            coordinator = AptusDataUpdateCoordinator(hass, mock_client)
            await coordinator.async_refresh()

        assert coordinator.last_update_success is False
        assert isinstance(coordinator.last_exception, ConfigEntryAuthFailed)
