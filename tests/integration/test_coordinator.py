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

from .conftest import MOCK_BOOKINGS, MOCK_DOOR_STATUS, MOCK_DOORS, MockEntryBuilder


class TestAptusCoordinator:
    """Describe AptusDataUpdateCoordinator."""

    async def test_it_should_fetch_doors_status_and_bookings_on_update(
        self, hass: HomeAssistant, mock_config_entry
    ):
        mock_client = AsyncMock()

        with (
            patch.object(doors, "list_doors", return_value=MOCK_DOORS) as mock_list,
            patch.object(
                doors, "get_apartment_door_status", return_value=MOCK_DOOR_STATUS
            ) as mock_status,
            patch.object(laundry, "list_bookings", return_value=MOCK_BOOKINGS) as mock_bookings,
        ):
            coordinator = AptusDataUpdateCoordinator(hass, mock_client, mock_config_entry)
            await coordinator.async_refresh()

        mock_list.assert_awaited_once_with(mock_client)
        mock_status.assert_awaited_once_with(mock_client)
        mock_bookings.assert_awaited_once_with(mock_client)

        assert coordinator.data["doors"] == MOCK_DOORS
        assert coordinator.data["apartment_status"] == MOCK_DOOR_STATUS
        assert coordinator.data["bookings"] == MOCK_BOOKINGS

    async def test_it_should_raise_update_failed_on_connection_error(
        self, hass: HomeAssistant, mock_config_entry
    ):
        mock_client = AsyncMock()

        with patch.object(doors, "list_doors", side_effect=AptusConnectionError("timeout")):
            coordinator = AptusDataUpdateCoordinator(hass, mock_client, mock_config_entry)
            await coordinator.async_refresh()

        assert coordinator.last_update_success is False
        assert isinstance(coordinator.last_exception, UpdateFailed)

    async def test_it_should_trigger_reauth_on_auth_error(
        self, hass: HomeAssistant, mock_config_entry
    ):
        mock_client = AsyncMock()

        with patch.object(doors, "list_doors", side_effect=AptusAuthError("expired")):
            coordinator = AptusDataUpdateCoordinator(hass, mock_client, mock_config_entry)
            await coordinator.async_refresh()

        assert coordinator.last_update_success is False
        assert isinstance(coordinator.last_exception, ConfigEntryAuthFailed)


class TestCoordinatorFeatureToggles:
    """Describe feature toggle behavior in the coordinator."""

    async def test_it_should_skip_apartment_door_when_disabled(self, hass: HomeAssistant):
        entry = MockEntryBuilder().without_apartment_door().build()
        mock_client = AsyncMock()

        with (
            patch.object(doors, "list_doors", return_value=MOCK_DOORS),
            patch.object(doors, "get_apartment_door_status") as mock_status,
            patch.object(laundry, "list_bookings", return_value=MOCK_BOOKINGS),
        ):
            coordinator = AptusDataUpdateCoordinator(hass, mock_client, entry)
            await coordinator.async_refresh()

        mock_status.assert_not_awaited()
        assert coordinator.data["apartment_status"] is None

    async def test_it_should_skip_laundry_when_disabled(self, hass: HomeAssistant):
        entry = MockEntryBuilder().without_laundry().build()
        mock_client = AsyncMock()

        with (
            patch.object(doors, "list_doors", return_value=MOCK_DOORS),
            patch.object(doors, "get_apartment_door_status", return_value=MOCK_DOOR_STATUS),
            patch.object(laundry, "list_bookings") as mock_bookings,
        ):
            coordinator = AptusDataUpdateCoordinator(hass, mock_client, entry)
            await coordinator.async_refresh()

        mock_bookings.assert_not_awaited()
        assert coordinator.data["bookings"] == []

    async def test_it_should_skip_entrance_doors_when_disabled(self, hass: HomeAssistant):
        entry = MockEntryBuilder().without_entrance_doors().build()
        mock_client = AsyncMock()

        with (
            patch.object(doors, "list_doors") as mock_list,
            patch.object(doors, "get_apartment_door_status", return_value=MOCK_DOOR_STATUS),
            patch.object(laundry, "list_bookings", return_value=MOCK_BOOKINGS),
        ):
            coordinator = AptusDataUpdateCoordinator(hass, mock_client, entry)
            await coordinator.async_refresh()

        mock_list.assert_not_awaited()
        assert coordinator.data["doors"] == []

    async def test_it_should_skip_all_when_all_disabled(self, hass: HomeAssistant):
        entry = (
            MockEntryBuilder()
            .without_entrance_doors()
            .without_apartment_door()
            .without_laundry()
            .build()
        )
        mock_client = AsyncMock()

        with (
            patch.object(doors, "list_doors") as mock_list,
            patch.object(doors, "get_apartment_door_status") as mock_status,
            patch.object(laundry, "list_bookings") as mock_bookings,
        ):
            coordinator = AptusDataUpdateCoordinator(hass, mock_client, entry)
            await coordinator.async_refresh()

        mock_list.assert_not_awaited()
        mock_status.assert_not_awaited()
        mock_bookings.assert_not_awaited()
        assert coordinator.data == {"doors": [], "apartment_status": None, "bookings": []}

    async def test_it_should_fetch_only_entrance_doors_when_others_disabled(
        self, hass: HomeAssistant
    ):
        entry = MockEntryBuilder().without_apartment_door().without_laundry().build()
        mock_client = AsyncMock()

        with (
            patch.object(doors, "list_doors", return_value=MOCK_DOORS) as mock_list,
            patch.object(doors, "get_apartment_door_status") as mock_status,
            patch.object(laundry, "list_bookings") as mock_bookings,
        ):
            coordinator = AptusDataUpdateCoordinator(hass, mock_client, entry)
            await coordinator.async_refresh()

        mock_list.assert_awaited_once()
        mock_status.assert_not_awaited()
        mock_bookings.assert_not_awaited()
        assert coordinator.data["doors"] == MOCK_DOORS

    async def test_it_should_fetch_only_laundry_when_others_disabled(self, hass: HomeAssistant):
        entry = MockEntryBuilder().without_entrance_doors().without_apartment_door().build()
        mock_client = AsyncMock()

        with (
            patch.object(doors, "list_doors") as mock_list,
            patch.object(doors, "get_apartment_door_status") as mock_status,
            patch.object(laundry, "list_bookings", return_value=MOCK_BOOKINGS) as mock_bookings,
        ):
            coordinator = AptusDataUpdateCoordinator(hass, mock_client, entry)
            await coordinator.async_refresh()

        mock_list.assert_not_awaited()
        mock_status.assert_not_awaited()
        mock_bookings.assert_awaited_once()
        assert coordinator.data["bookings"] == MOCK_BOOKINGS
