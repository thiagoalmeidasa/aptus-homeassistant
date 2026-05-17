"""BDD tests for Aptus laundry calendar entity."""

from datetime import date, datetime, time, timedelta, timezone
from unittest.mock import AsyncMock, patch

from homeassistant.components.calendar import DOMAIN as CALENDAR_DOMAIN
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry


@pytest.fixture(autouse=True)
def _frozen_now(freezer):
    """Pin the test clock so MOCK_BOOKINGS (date=2026-04-10) stays in the future."""
    # Without this, tests start failing the moment real time crosses that date —
    # `event` correctly stops surfacing past bookings after the fix.
    freezer.move_to("2026-04-01T08:00:00+00:00")


from custom_components.aptus.aptus_client import doors, laundry
from custom_components.aptus.aptus_client.models import LaundryBooking
from custom_components.aptus.const import DOMAIN

from .conftest import (
    MOCK_BOOKING_END_TIME,
    MOCK_BOOKING_PASS_NO,
    MOCK_BOOKING_START_TIME,
    MOCK_BOOKING_TIME_RANGE,
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
            # Summary includes the time slot derived from _TIME_SLOT_MAP[pass_no]
            # so the synced event is readable on a Google Calendar agenda view.
            assert state.attributes.get("message") == f"Laundry Grupp 1 {MOCK_BOOKING_TIME_RANGE}"

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
        # Substrings derived from _TIME_SLOT_MAP[MOCK_BOOKING_PASS_NO] —
        # asserting components separately keeps the test robust to summary
        # format tweaks while still pinning the time-slot mapping.
        assert "Grupp 1" in message
        assert f"{MOCK_BOOKING_START_TIME:%H:%M}" in message
        assert f"{MOCK_BOOKING_END_TIME:%H:%M}" in message

    async def test_it_should_set_description_with_group_and_slot(self, hass: HomeAssistant):
        await self._setup_with_bookings(hass)

        state = hass.states.get("calendar.laundry")
        description = state.attributes.get("description")
        assert description is not None
        assert "Grupp 1" in description
        # pass_no surfaced for users who need to map back to a portal slot
        assert str(MOCK_BOOKING_PASS_NO) in description


class TestCalendarEventSemantics:
    """Pin down what `event` returns under each booking-set shape."""

    async def _setup_with(self, hass: HomeAssistant, bookings: list[LaundryBooking]) -> None:
        entry = _make_entry(hass)
        with (
            patch("custom_components.aptus.AptusClient") as mock_client_cls,
            patch.object(doors, "list_doors", return_value=MOCK_DOORS),
            patch.object(doors, "get_apartment_door_status", return_value=MOCK_DOOR_STATUS),
            patch.object(laundry, "list_bookings", return_value=bookings),
        ):
            mock_client_cls.return_value = AsyncMock()
            await hass.config_entries.async_setup(entry.entry_id)
            await hass.async_block_till_done()

    async def test_it_should_return_off_when_only_past_bookings(self, hass: HomeAssistant):
        """
        A list of past bookings is just as "nothing upcoming" as an empty list.

        The previous implementation fell back to "most recent past booking" when
        no future bookings existed, which made `state == "off"` ambiguous: empty
        list was off, past-only list returned a stale event. Now both produce
        "off" so the entity's state is a reliable upcoming-event indicator.
        """
        past_only = [
            LaundryBooking(
                id="past-1",
                group_name="Grupp 1",
                date=(dt_util.now().date() - timedelta(days=14)),
                pass_no=MOCK_BOOKING_PASS_NO,
            ),
        ]
        await self._setup_with(hass, past_only)

        state = hass.states.get("calendar.laundry")
        assert state.state == "off"
        # No leaky stale event surfaced via message/start_time attributes either.
        assert state.attributes.get("message") in (None, "")
        assert state.attributes.get("start_time") is None
        assert state.attributes.get("end_time") is None

    async def test_it_should_preserve_explicit_timezone_on_event(self, hass: HomeAssistant):
        """
        A booking whose times are already tz-aware must not be silently rezoned.

        `_booking_to_event` previously did `start.replace(tzinfo=DEFAULT_TIME_ZONE)`
        unconditionally, which would clobber an explicit tz and shift the wall
        clock. The fix only attaches the default tz to naive datetimes.

        Using UTC+9 (deliberately different from the HA test framework's default
        of US/Pacific = UTC-7) so any silent replace is detectable via offset.
        """
        aware_tz = timezone(timedelta(hours=9))
        booking = LaundryBooking(
            id="tz-1",
            group_name="Grupp 1",
            date=date(2026, 4, 10),
            pass_no=MOCK_BOOKING_PASS_NO,
            _start=time(13, 30, tzinfo=aware_tz),
            _end=time(16, 0, tzinfo=aware_tz),
        )
        await self._setup_with(hass, [booking])

        cal_entity = hass.data[CALENDAR_DOMAIN].get_entity("calendar.laundry")
        events = await cal_entity.async_get_events(
            hass,
            datetime(2026, 4, 1, tzinfo=aware_tz),
            datetime(2026, 4, 30, tzinfo=aware_tz),
        )
        assert len(events) == 1
        # The explicit tz must be preserved, not silently swapped to whatever
        # dt_util.DEFAULT_TIME_ZONE happens to be in the runtime.
        assert events[0].start.utcoffset() == aware_tz.utcoffset(None)
        assert events[0].end.utcoffset() == aware_tz.utcoffset(None)

    async def test_it_should_skip_booking_with_unmapped_pass_no(self, hass: HomeAssistant, caplog):
        """An unparsable pass_no (no override, not in _TIME_SLOT_MAP) is skipped + warned."""
        # The old behavior silently returned time(0, 0), producing a 00:00-00:00 "ghost"
        # event. The fix surfaces a ValueError that the calendar entity catches and logs.
        bogus = LaundryBooking(
            id="bogus-99",
            group_name="Grupp 1",
            date=date(2026, 4, 10),
            pass_no=99,
        )
        with caplog.at_level("WARNING"):
            await self._setup_with(hass, [bogus])

        state = hass.states.get("calendar.laundry")
        # No event surfaced from the bogus booking
        assert state.state == "off"
        cal_entity = hass.data[CALENDAR_DOMAIN].get_entity("calendar.laundry")
        events = await cal_entity.async_get_events(
            hass,
            datetime(2026, 4, 1, tzinfo=dt_util.DEFAULT_TIME_ZONE),
            datetime(2026, 4, 30, tzinfo=dt_util.DEFAULT_TIME_ZONE),
        )
        assert events == []
        # And the user gets a log entry pointing at the offending booking
        assert any(
            "bogus-99" in record.message for record in caplog.records
        ), "expected a warning mentioning the booking id"
