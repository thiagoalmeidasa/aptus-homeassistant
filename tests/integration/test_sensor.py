"""BDD tests for Aptus sensor entities."""

from unittest.mock import AsyncMock, patch

from homeassistant.const import STATE_UNKNOWN
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.aptus.aptus_client import doors, laundry
from custom_components.aptus.const import DOMAIN

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


class TestNextLaundryBookingSensor:
    """Describe the next laundry booking sensor."""

    async def test_it_should_show_next_booking_datetime_as_state(self, hass: HomeAssistant):
        entry = _make_entry(hass)

        with (
            patch("custom_components.aptus.AptusClient") as mock_client_cls,
            patch.object(doors, "list_doors", return_value=MOCK_DOORS),
            patch.object(doors, "get_apartment_door_status", return_value=MOCK_DOOR_STATUS),
            patch.object(laundry, "list_bookings", return_value=MOCK_BOOKINGS),
        ):
            mock_client_cls.return_value = AsyncMock()
            await hass.config_entries.async_setup(entry.entry_id)
            await hass.async_block_till_done()

            state = hass.states.get("sensor.next_laundry_booking")
            assert state is not None
            assert "2026-04-10" in state.state

    async def test_it_should_include_group_name_in_attributes(self, hass: HomeAssistant):
        entry = _make_entry(hass)

        with (
            patch("custom_components.aptus.AptusClient") as mock_client_cls,
            patch.object(doors, "list_doors", return_value=MOCK_DOORS),
            patch.object(doors, "get_apartment_door_status", return_value=MOCK_DOOR_STATUS),
            patch.object(laundry, "list_bookings", return_value=MOCK_BOOKINGS),
        ):
            mock_client_cls.return_value = AsyncMock()
            await hass.config_entries.async_setup(entry.entry_id)
            await hass.async_block_till_done()

            state = hass.states.get("sensor.next_laundry_booking")
            assert state.attributes.get("group_name") == "Grupp 1"

    async def test_it_should_show_unknown_when_no_bookings(self, hass: HomeAssistant):
        entry = _make_entry(hass)

        with (
            patch("custom_components.aptus.AptusClient") as mock_client_cls,
            patch.object(doors, "list_doors", return_value=MOCK_DOORS),
            patch.object(doors, "get_apartment_door_status", return_value=MOCK_DOOR_STATUS),
            patch.object(laundry, "list_bookings", return_value=[]),
        ):
            mock_client_cls.return_value = AsyncMock()
            await hass.config_entries.async_setup(entry.entry_id)
            await hass.async_block_till_done()

            state = hass.states.get("sensor.next_laundry_booking")
            assert state.state == STATE_UNKNOWN
