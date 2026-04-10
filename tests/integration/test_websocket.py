"""BDD tests for Aptus laundry websocket commands."""

from unittest.mock import AsyncMock, patch

from homeassistant.core import HomeAssistant

from custom_components.aptus.aptus_client import doors, laundry
from custom_components.aptus.aptus_client.models import SlotState, TimeSlot

from .conftest import (
    MOCK_AVAILABLE_SLOTS,
    MOCK_BOOKINGS,
    MOCK_DOOR_STATUS,
    MOCK_DOORS,
    MOCK_LAUNDRY_GROUPS,
    MockEntryBuilder,
)


async def _setup_integration(hass, entry):
    """Set up the integration with mocked data fetchers."""
    entry.add_to_hass(hass)
    with (
        patch("custom_components.aptus.AptusClient") as mock_client_cls,
        patch.object(doors, "list_doors", return_value=MOCK_DOORS),
        patch.object(doors, "get_apartment_door_status", return_value=MOCK_DOOR_STATUS),
        patch.object(laundry, "list_bookings", return_value=MOCK_BOOKINGS),
    ):
        mock_client = AsyncMock()
        mock_client_cls.return_value = mock_client
        await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    # Pre-cache the category ID so websocket commands don't hit the real API
    entry.runtime_data._category_id = "35"


class TestLaundryGroupsCommand:
    """Describe aptus/laundry/groups websocket command."""

    async def test_it_should_return_available_laundry_groups(
        self, hass: HomeAssistant, hass_ws_client
    ):
        entry = MockEntryBuilder().build()
        await _setup_integration(hass, entry)

        with (
            patch.object(laundry, "get_laundry_category_id", return_value="35"),
            patch.object(laundry, "list_laundry_groups", return_value=MOCK_LAUNDRY_GROUPS),
        ):
            client = await hass_ws_client(hass)
            await client.send_json({"id": 1, "type": "aptus/laundry/groups"})
            result = await client.receive_json()

        assert result["success"]
        assert len(result["result"]) == 2
        assert result["result"][0] == {"id": "185", "name": "Grupp 1"}
        assert result["result"][1] == {"id": "186", "name": "Grupp 2"}

    async def test_it_should_return_empty_list_when_no_groups(
        self, hass: HomeAssistant, hass_ws_client
    ):
        entry = MockEntryBuilder().build()
        await _setup_integration(hass, entry)

        with (
            patch.object(laundry, "get_laundry_category_id", return_value="35"),
            patch.object(laundry, "list_laundry_groups", return_value=[]),
        ):
            client = await hass_ws_client(hass)
            await client.send_json({"id": 1, "type": "aptus/laundry/groups"})
            result = await client.receive_json()

        assert result["success"]
        assert result["result"] == []


class TestLaundryFirstAvailableCommand:
    """Describe aptus/laundry/first_available websocket command."""

    async def test_it_should_return_first_available_slots(
        self, hass: HomeAssistant, hass_ws_client
    ):
        entry = MockEntryBuilder().build()
        await _setup_integration(hass, entry)

        with (
            patch.object(laundry, "get_laundry_category_id", return_value="35"),
            patch.object(laundry, "get_first_available_slots", return_value=MOCK_AVAILABLE_SLOTS),
        ):
            client = await hass_ws_client(hass)
            await client.send_json({"id": 1, "type": "aptus/laundry/first_available"})
            result = await client.receive_json()

        assert result["success"]
        assert len(result["result"]) == 1
        slot = result["result"][0]
        assert slot["pass_no"] == 3
        assert slot["date"] == "2026-04-10"
        assert slot["group_id"] == "185"
        assert slot["state"] == "available"
        assert slot["start_time"] == "08:30"
        assert slot["end_time"] == "11:00"

    async def test_it_should_pass_first_x_parameter(self, hass: HomeAssistant, hass_ws_client):
        entry = MockEntryBuilder().build()
        await _setup_integration(hass, entry)

        with (
            patch.object(laundry, "get_laundry_category_id", return_value="35"),
            patch.object(laundry, "get_first_available_slots", return_value=[]) as mock_first,
        ):
            client = await hass_ws_client(hass)
            await client.send_json({"id": 1, "type": "aptus/laundry/first_available", "first_x": 5})
            await client.receive_json()

        mock_first.assert_awaited_once()
        assert mock_first.call_args[1].get("first_x") == 5 or mock_first.call_args[0][1] == "35"


class TestLaundryWeeklyCalendarCommand:
    """Describe aptus/laundry/weekly_calendar websocket command."""

    async def test_it_should_return_weekly_slots_for_a_group(
        self, hass: HomeAssistant, hass_ws_client
    ):
        from datetime import date

        weekly_slots = [
            TimeSlot(pass_no=3, date=date(2026, 4, 10), group_id="185", state=SlotState.AVAILABLE),
            TimeSlot(
                pass_no=4, date=date(2026, 4, 10), group_id="185", state=SlotState.UNAVAILABLE
            ),
            TimeSlot(pass_no=5, date=date(2026, 4, 10), group_id="185", state=SlotState.OWNED),
        ]

        entry = MockEntryBuilder().build()
        await _setup_integration(hass, entry)

        with patch.object(laundry, "get_weekly_calendar", return_value=weekly_slots):
            client = await hass_ws_client(hass)
            await client.send_json(
                {"id": 1, "type": "aptus/laundry/weekly_calendar", "group_id": "185"}
            )
            result = await client.receive_json()

        assert result["success"]
        assert len(result["result"]) == 3
        assert result["result"][0]["state"] == "available"
        assert result["result"][1]["state"] == "unavailable"
        assert result["result"][2]["state"] == "owned"

    async def test_it_should_support_optional_pass_date(self, hass: HomeAssistant, hass_ws_client):
        entry = MockEntryBuilder().build()
        await _setup_integration(hass, entry)

        with patch.object(laundry, "get_weekly_calendar", return_value=[]) as mock_calendar:
            client = await hass_ws_client(hass)
            await client.send_json(
                {
                    "id": 1,
                    "type": "aptus/laundry/weekly_calendar",
                    "group_id": "185",
                    "pass_date": "2026-04-14",
                }
            )
            await client.receive_json()

        mock_calendar.assert_awaited_once()
        call_kwargs = mock_calendar.call_args
        assert "2026-04-14" in str(call_kwargs)


class TestLaundryBookingsCommand:
    """Describe aptus/laundry/bookings websocket command."""

    async def test_it_should_return_user_bookings(self, hass: HomeAssistant, hass_ws_client):
        entry = MockEntryBuilder().build()
        await _setup_integration(hass, entry)

        with patch.object(laundry, "list_bookings", return_value=MOCK_BOOKINGS):
            client = await hass_ws_client(hass)
            await client.send_json({"id": 1, "type": "aptus/laundry/bookings"})
            result = await client.receive_json()

        assert result["success"]
        assert len(result["result"]) == 1
        booking = result["result"][0]
        assert booking["id"] == "42"
        assert booking["group_name"] == "Grupp 1"
        assert booking["date"] == "2026-04-10"
        assert booking["pass_no"] == 5
        assert booking["start_time"] == "13:30"
        assert booking["end_time"] == "16:00"

    async def test_it_should_return_empty_list_when_no_bookings(
        self, hass: HomeAssistant, hass_ws_client
    ):
        entry = MockEntryBuilder().build()
        await _setup_integration(hass, entry)

        with patch.object(laundry, "list_bookings", return_value=[]):
            client = await hass_ws_client(hass)
            await client.send_json({"id": 1, "type": "aptus/laundry/bookings"})
            result = await client.receive_json()

        assert result["success"]
        assert result["result"] == []
