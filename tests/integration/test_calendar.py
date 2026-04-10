"""BDD tests for Aptus laundry calendar entity."""

from datetime import date, datetime
from unittest.mock import AsyncMock, patch

import pytest

from custom_components.aptus.const import DOMAIN
from custom_components.aptus.aptus_client import doors, laundry

from homeassistant.core import HomeAssistant

from pytest_homeassistant_custom_component.common import MockConfigEntry

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


class TestAptusLaundryCalendar:
    """Describe AptusLaundryCalendar entity."""

    async def test_it_should_create_a_calendar_entity(self, hass: HomeAssistant):
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

            state = hass.states.get("calendar.laundry")
            assert state is not None

    async def test_it_should_expose_bookings_as_calendar_events(
        self, hass: HomeAssistant
    ):
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

            state = hass.states.get("calendar.laundry")
            # Calendar has a booking (shows as "off" if not currently active,
            # "on" if within the event window)
            assert state.state in ("on", "off")
            # The event attributes should be set
            assert state.attributes.get("message") == "Laundry - Grupp 1"

    async def test_it_should_set_event_start_and_end_from_time_slot(
        self, hass: HomeAssistant
    ):
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

            state = hass.states.get("calendar.laundry")
            attrs = state.attributes
            assert "start_time" in attrs
            assert "end_time" in attrs

    async def test_it_should_return_off_when_no_bookings(self, hass: HomeAssistant):
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

            state = hass.states.get("calendar.laundry")
            assert state.state == "off"
