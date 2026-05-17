"""BDD tests for Aptus laundry calendar entity."""

from datetime import datetime
from unittest.mock import AsyncMock, patch

from homeassistant.components.calendar import DOMAIN as CALENDAR_DOMAIN
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util
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

    async def test_it_should_expose_bookings_as_calendar_events(self, hass: HomeAssistant):
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
            # The event attributes should be set — summary now includes the time slot
            # so the synced event is readable on a Google Calendar agenda view.
            assert state.attributes.get("message") == "Laundry Grupp 1 13:30-16:00"

    async def test_it_should_set_event_start_and_end_from_time_slot(self, hass: HomeAssistant):
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


class TestCalendarEventEnrichment:
    """Describe the enriched CalendarEvent fields that downstream sync blueprints depend on."""

    async def _setup_with_bookings(self, hass: HomeAssistant) -> None:
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

    async def test_it_should_set_calendar_event_uid_from_booking_id(self, hass: HomeAssistant):
        await self._setup_with_bookings(hass)

        cal_entity = hass.data[CALENDAR_DOMAIN].get_entity("calendar.laundry")
        tz = dt_util.DEFAULT_TIME_ZONE
        events = await cal_entity.async_get_events(
            hass,
            datetime(2026, 4, 1, tzinfo=tz),
            datetime(2026, 4, 30, tzinfo=tz),
        )
        assert len(events) == 1
        # MOCK_BOOKINGS[0].id is "42" — the portal's persistent booking ID,
        # used by aptus.cancel_laundry, stable across coordinator refreshes.
        assert events[0].uid == "42"

    async def test_it_should_include_time_slot_in_summary(self, hass: HomeAssistant):
        await self._setup_with_bookings(hass)

        state = hass.states.get("calendar.laundry")
        message = state.attributes.get("message")
        assert message is not None
        # pass_no 5 -> 13:30-16:00 per _TIME_SLOT_MAP
        assert "Grupp 1" in message
        assert "13:30" in message
        assert "16:00" in message

    async def test_it_should_set_description_with_group_and_slot(self, hass: HomeAssistant):
        await self._setup_with_bookings(hass)

        state = hass.states.get("calendar.laundry")
        description = state.attributes.get("description")
        assert description is not None
        assert "Grupp 1" in description
        # pass_no 5 surfaced for users who need to map back to a portal slot
        assert "5" in description
