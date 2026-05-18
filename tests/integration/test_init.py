"""BDD tests for Aptus integration setup and unload."""

from datetime import timedelta
from unittest.mock import AsyncMock, patch

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.aptus.aptus_client import doors, laundry
from custom_components.aptus.aptus_client.exceptions import (
    AptusConnectionError,
)
from custom_components.aptus.const import (
    CONF_SCAN_INTERVAL,
    DEFAULT_SCAN_INTERVAL_MINUTES,
    DOMAIN,
    MIN_SCAN_INTERVAL_MINUTES,
)

from .conftest import (
    MOCK_BOOKINGS,
    MOCK_DOOR_STATUS,
    MOCK_DOORS,
    TEST_BASE_URL,
    TEST_PASSWORD,
    TEST_USERNAME,
)


def _make_entry(hass: HomeAssistant) -> MockConfigEntry:
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Aptus Test",
        data={
            "base_url": TEST_BASE_URL,
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD,
        },
        unique_id=f"{TEST_BASE_URL}_{TEST_USERNAME}",
    )
    entry.add_to_hass(hass)
    return entry


def _patch_data_fetchers():
    """Patch door and laundry data fetchers with mock data."""
    return (
        patch.object(doors, "list_doors", return_value=MOCK_DOORS),
        patch.object(doors, "get_apartment_door_status", return_value=MOCK_DOOR_STATUS),
        patch.object(laundry, "list_bookings", return_value=MOCK_BOOKINGS),
    )


class TestAsyncSetupEntry:
    """Describe async_setup_entry."""

    async def test_it_should_create_client_and_login(self, hass: HomeAssistant):
        entry = _make_entry(hass)

        p1, p2, p3 = _patch_data_fetchers()
        with (
            patch("custom_components.aptus.AptusClient") as mock_client_cls,
            p1,
            p2,
            p3,
        ):
            mock_client = AsyncMock()
            mock_client_cls.return_value = mock_client

            await hass.config_entries.async_setup(entry.entry_id)
            await hass.async_block_till_done()

        mock_client_cls.assert_called_once_with(
            base_url=TEST_BASE_URL,
            username=TEST_USERNAME,
            password=TEST_PASSWORD,
        )
        mock_client.login.assert_awaited_once()

    async def test_it_should_store_coordinator_in_runtime_data(self, hass: HomeAssistant):
        entry = _make_entry(hass)

        p1, p2, p3 = _patch_data_fetchers()
        with (
            patch("custom_components.aptus.AptusClient") as mock_client_cls,
            p1,
            p2,
            p3,
        ):
            mock_client = AsyncMock()
            mock_client_cls.return_value = mock_client

            await hass.config_entries.async_setup(entry.entry_id)
            await hass.async_block_till_done()

        assert entry.state == ConfigEntryState.LOADED
        assert entry.runtime_data is not None

    async def test_it_should_forward_to_lock_platform(self, hass: HomeAssistant):
        entry = _make_entry(hass)

        p1, p2, p3 = _patch_data_fetchers()
        with (
            patch("custom_components.aptus.AptusClient") as mock_client_cls,
            p1,
            p2,
            p3,
        ):
            mock_client = AsyncMock()
            mock_client_cls.return_value = mock_client

            await hass.config_entries.async_setup(entry.entry_id)
            await hass.async_block_till_done()

        assert entry.state == ConfigEntryState.LOADED

    async def test_it_should_raise_not_ready_on_connection_error(self, hass: HomeAssistant):
        entry = _make_entry(hass)

        with patch("custom_components.aptus.AptusClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.login.side_effect = AptusConnectionError("timeout")
            mock_client_cls.return_value = mock_client

            await hass.config_entries.async_setup(entry.entry_id)
            await hass.async_block_till_done()

        assert entry.state == ConfigEntryState.SETUP_RETRY


class TestAsyncUnloadEntry:
    """Describe async_unload_entry."""

    async def test_it_should_close_client_and_unload_platforms(self, hass: HomeAssistant):
        entry = _make_entry(hass)

        p1, p2, p3 = _patch_data_fetchers()
        with (
            patch("custom_components.aptus.AptusClient") as mock_client_cls,
            p1,
            p2,
            p3,
        ):
            mock_client = AsyncMock()
            mock_client_cls.return_value = mock_client

            await hass.config_entries.async_setup(entry.entry_id)
            await hass.async_block_till_done()

            await hass.config_entries.async_unload(entry.entry_id)
            await hass.async_block_till_done()

        mock_client.close.assert_awaited_once()
        assert entry.state == ConfigEntryState.NOT_LOADED


class TestEntryReloadOnScanIntervalChange:
    """Describe how an option change to scan_interval is propagated."""

    async def test_it_should_reload_the_entry_when_scan_interval_option_changes(
        self, hass: HomeAssistant
    ):
        # Behavioural assertion: after changing the option, the (newly built)
        # coordinator's update_interval reflects the new value. That only
        # happens if the update listener triggered a full reload — proving
        # the reload wiring is in place without mocking async_reload directly.
        entry = _make_entry(hass)

        p1, p2, p3 = _patch_data_fetchers()
        with (
            patch("custom_components.aptus.AptusClient") as mock_client_cls,
            p1,
            p2,
            p3,
        ):
            mock_client = AsyncMock()
            mock_client_cls.return_value = mock_client

            await hass.config_entries.async_setup(entry.entry_id)
            await hass.async_block_till_done()

            assert entry.runtime_data.update_interval == timedelta(
                minutes=DEFAULT_SCAN_INTERVAL_MINUTES
            )

            new_minutes = MIN_SCAN_INTERVAL_MINUTES + 2
            hass.config_entries.async_update_entry(
                entry,
                options={**entry.options, CONF_SCAN_INTERVAL: new_minutes},
            )
            await hass.async_block_till_done()

            assert entry.state == ConfigEntryState.LOADED
            assert entry.runtime_data.update_interval == timedelta(minutes=new_minutes)
