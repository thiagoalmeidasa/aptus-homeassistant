"""BDD tests for Aptus websocket commands."""

import asyncio
from datetime import date
from unittest.mock import AsyncMock, patch

from homeassistant.core import HomeAssistant
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.aptus.aptus_client import doors, laundry
from custom_components.aptus.aptus_client.exceptions import AptusAuthError, AptusConnectionError
from custom_components.aptus.aptus_client.models import SlotState, TimeSlot
from custom_components.aptus.const import DOMAIN

from .conftest import (
    MOCK_AVAILABLE_SLOTS,
    MOCK_BOOKINGS,
    MOCK_DOOR_STATUS,
    MOCK_DOORS,
    MOCK_LAUNDRY_GROUPS,
    TEST_BASE_URL,
    TEST_PASSWORD,
    TEST_USERNAME,
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


class TestEntriesCommand:
    """Describe aptus/entries websocket command."""

    async def test_it_should_return_configured_entries(self, hass: HomeAssistant, hass_ws_client):
        entry = MockEntryBuilder().build()
        await _setup_integration(hass, entry)

        client = await hass_ws_client(hass)
        await client.send_json({"id": 1, "type": "aptus/entries"})
        result = await client.receive_json()

        assert result["success"]
        assert len(result["result"]) == 1
        assert result["result"][0]["entry_id"] == entry.entry_id
        assert result["result"][0]["title"] == "Aptus Test"


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
            await client.send_json(
                {"id": 1, "type": "aptus/laundry/groups", "entry_id": entry.entry_id}
            )
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
            await client.send_json(
                {"id": 1, "type": "aptus/laundry/groups", "entry_id": entry.entry_id}
            )
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
            await client.send_json(
                {"id": 1, "type": "aptus/laundry/first_available", "entry_id": entry.entry_id}
            )
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
            await client.send_json(
                {
                    "id": 1,
                    "type": "aptus/laundry/first_available",
                    "entry_id": entry.entry_id,
                    "first_x": 5,
                }
            )
            await client.receive_json()

        mock_first.assert_awaited_once()


class TestLaundryWeeklyCalendarCommand:
    """Describe aptus/laundry/weekly_calendar websocket command."""

    async def test_it_should_return_weekly_slots_for_a_group(
        self, hass: HomeAssistant, hass_ws_client
    ):
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
                {
                    "id": 1,
                    "type": "aptus/laundry/weekly_calendar",
                    "entry_id": entry.entry_id,
                    "group_id": "185",
                }
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
                    "entry_id": entry.entry_id,
                    "group_id": "185",
                    "pass_date": "2026-04-14",
                }
            )
            await client.receive_json()

        mock_calendar.assert_awaited_once()
        assert "2026-04-14" in str(mock_calendar.call_args)


class TestLaundryBookingsCommand:
    """Describe aptus/laundry/bookings websocket command."""

    async def test_it_should_return_user_bookings(self, hass: HomeAssistant, hass_ws_client):
        entry = MockEntryBuilder().build()
        await _setup_integration(hass, entry)

        with patch.object(laundry, "list_bookings", return_value=MOCK_BOOKINGS):
            client = await hass_ws_client(hass)
            await client.send_json(
                {"id": 1, "type": "aptus/laundry/bookings", "entry_id": entry.entry_id}
            )
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
            await client.send_json(
                {"id": 1, "type": "aptus/laundry/bookings", "entry_id": entry.entry_id}
            )
            result = await client.receive_json()

        assert result["success"]
        assert result["result"] == []


class TestWebsocketErrorHandling:
    """Describe websocket commands when the portal returns errors."""

    async def test_groups_should_return_empty_list_on_auth_error(
        self, hass: HomeAssistant, hass_ws_client
    ):
        entry = MockEntryBuilder().build()
        await _setup_integration(hass, entry)

        with patch.object(
            laundry,
            "list_laundry_groups",
            side_effect=AptusAuthError("Portal redirected to error page"),
        ):
            client = await hass_ws_client(hass)
            await client.send_json(
                {"id": 1, "type": "aptus/laundry/groups", "entry_id": entry.entry_id}
            )
            result = await client.receive_json()

        assert result["success"]
        assert result["result"] == []

    async def test_groups_should_return_empty_list_on_connection_error(
        self, hass: HomeAssistant, hass_ws_client
    ):
        entry = MockEntryBuilder().build()
        await _setup_integration(hass, entry)

        with patch.object(
            laundry,
            "list_laundry_groups",
            side_effect=AptusConnectionError("timeout"),
        ):
            client = await hass_ws_client(hass)
            await client.send_json(
                {"id": 1, "type": "aptus/laundry/groups", "entry_id": entry.entry_id}
            )
            result = await client.receive_json()

        assert result["success"]
        assert result["result"] == []

    async def test_first_available_should_return_empty_list_on_auth_error(
        self, hass: HomeAssistant, hass_ws_client
    ):
        entry = MockEntryBuilder().build()
        await _setup_integration(hass, entry)

        with patch.object(
            laundry,
            "get_first_available_slots",
            side_effect=AptusAuthError("Portal redirected to error page"),
        ):
            client = await hass_ws_client(hass)
            await client.send_json(
                {"id": 1, "type": "aptus/laundry/first_available", "entry_id": entry.entry_id}
            )
            result = await client.receive_json()

        assert result["success"]
        assert result["result"] == []

    async def test_weekly_calendar_should_return_empty_list_on_auth_error(
        self, hass: HomeAssistant, hass_ws_client
    ):
        entry = MockEntryBuilder().build()
        await _setup_integration(hass, entry)

        with patch.object(
            laundry,
            "get_weekly_calendar",
            side_effect=AptusAuthError("Portal redirected to error page"),
        ):
            client = await hass_ws_client(hass)
            await client.send_json(
                {
                    "id": 1,
                    "type": "aptus/laundry/weekly_calendar",
                    "entry_id": entry.entry_id,
                    "group_id": "185",
                }
            )
            result = await client.receive_json()

        assert result["success"]
        assert result["result"] == []

    async def test_bookings_should_return_empty_list_on_auth_error(
        self, hass: HomeAssistant, hass_ws_client
    ):
        entry = MockEntryBuilder().build()
        await _setup_integration(hass, entry)

        with patch.object(
            laundry,
            "list_bookings",
            side_effect=AptusAuthError("Portal redirected to error page"),
        ):
            client = await hass_ws_client(hass)
            await client.send_json(
                {"id": 1, "type": "aptus/laundry/bookings", "entry_id": entry.entry_id}
            )
            result = await client.receive_json()

        assert result["success"]
        assert result["result"] == []

    async def test_should_return_error_for_unknown_entry_id(
        self, hass: HomeAssistant, hass_ws_client
    ):
        entry = MockEntryBuilder().build()
        await _setup_integration(hass, entry)

        client = await hass_ws_client(hass)
        await client.send_json({"id": 1, "type": "aptus/laundry/groups", "entry_id": "nonexistent"})
        result = await client.receive_json()

        assert not result["success"]
        assert result["error"]["code"] == "not_found"


def _build_second_entry() -> MockConfigEntry:
    """Build a second config entry with a distinct unique_id."""
    return MockConfigEntry(
        domain=DOMAIN,
        title="Aptus Second",
        data={
            "base_url": TEST_BASE_URL + "-second",
            "username": TEST_USERNAME + "-second",
            "password": TEST_PASSWORD,
        },
        options={
            "enable_entrance_doors": True,
            "enable_apartment_door": True,
            "enable_laundry": True,
        },
        unique_id=f"{TEST_BASE_URL}-second_{TEST_USERNAME}-second",
    )


class TestSubscribeCommand:
    """Describe aptus/subscribe websocket subscription."""

    async def test_it_should_register_subscription_and_send_initial_result(
        self, hass: HomeAssistant, hass_ws_client
    ):
        entry = MockEntryBuilder().build()
        await _setup_integration(hass, entry)

        client = await hass_ws_client(hass)
        await client.send_json({"id": 1, "type": "aptus/subscribe", "entry_id": entry.entry_id})
        result = await client.receive_json()

        assert result["success"]
        assert result["id"] == 1

    async def test_it_should_send_event_when_coordinator_refreshes(
        self, hass: HomeAssistant, hass_ws_client
    ):
        entry = MockEntryBuilder().build()
        await _setup_integration(hass, entry)

        client = await hass_ws_client(hass)
        await client.send_json({"id": 1, "type": "aptus/subscribe", "entry_id": entry.entry_id})
        ack = await client.receive_json()
        assert ack["success"]
        # Drain the initial state event so the next message is the refresh event.
        await client.receive_json()

        with (
            patch.object(doors, "list_doors", return_value=MOCK_DOORS),
            patch.object(doors, "get_apartment_door_status", return_value=MOCK_DOOR_STATUS),
            patch.object(laundry, "list_bookings", return_value=MOCK_BOOKINGS),
        ):
            await entry.runtime_data.async_refresh()
            await hass.async_block_till_done()

        event = await client.receive_json()
        assert event["id"] == 1
        assert event["type"] == "event"
        assert event["event"]["updated"] is True
        assert event["event"]["last_synced"] == (
            entry.runtime_data.last_update_success_time.isoformat()
        )

    async def test_it_should_send_initial_last_synced_event_immediately_after_subscribing(
        self, hass: HomeAssistant, hass_ws_client
    ):
        # Subscribers shouldn't have to wait for the next refresh (up to the
        # full scan interval away) to learn the current last_synced — the
        # subscription should push the coordinator's current state straight
        # after the ack so cards can render their timestamp on first load.
        entry = MockEntryBuilder().build()
        await _setup_integration(hass, entry)
        expected_iso = entry.runtime_data.last_update_success_time.isoformat()

        client = await hass_ws_client(hass)
        await client.send_json({"id": 1, "type": "aptus/subscribe", "entry_id": entry.entry_id})
        ack = await client.receive_json()
        assert ack["success"]

        initial_event = await client.receive_json()
        assert initial_event["id"] == 1
        assert initial_event["type"] == "event"
        assert initial_event["event"]["updated"] is True
        assert initial_event["event"]["last_synced"] == expected_iso

    async def test_it_should_send_null_last_synced_when_no_refresh_has_succeeded(
        self, hass: HomeAssistant, hass_ws_client
    ):
        # Edge case: coordinator alive but no successful refresh yet (e.g.
        # transient portal outage at HA startup). The card must still get
        # a well-formed payload so it can render a "never synced" state.
        entry = MockEntryBuilder().build()
        await _setup_integration(hass, entry)
        entry.runtime_data.last_update_success_time = None

        client = await hass_ws_client(hass)
        await client.send_json({"id": 1, "type": "aptus/subscribe", "entry_id": entry.entry_id})
        ack = await client.receive_json()
        assert ack["success"]

        initial_event = await client.receive_json()
        assert initial_event["event"]["last_synced"] is None

    async def test_it_should_return_error_for_unknown_entry_id(
        self, hass: HomeAssistant, hass_ws_client
    ):
        entry = MockEntryBuilder().build()
        await _setup_integration(hass, entry)

        client = await hass_ws_client(hass)
        await client.send_json({"id": 1, "type": "aptus/subscribe", "entry_id": "nonexistent"})
        result = await client.receive_json()

        assert not result["success"]
        assert result["error"]["code"] == "not_found"

    async def test_it_should_isolate_subscriptions_per_entry(
        self, hass: HomeAssistant, hass_ws_client
    ):
        entry_a = MockEntryBuilder().build()
        await _setup_integration(hass, entry_a)

        entry_b = _build_second_entry()
        await _setup_integration(hass, entry_b)

        client = await hass_ws_client(hass)
        await client.send_json({"id": 1, "type": "aptus/subscribe", "entry_id": entry_a.entry_id})
        ack = await client.receive_json()
        assert ack["success"]
        # Drain the initial state event so the isolation check below only
        # observes messages caused by entry B's refresh (which should be none).
        await client.receive_json()

        # Refresh entry B's coordinator — entry A's subscriber should NOT hear it.
        with (
            patch.object(doors, "list_doors", return_value=MOCK_DOORS),
            patch.object(doors, "get_apartment_door_status", return_value=MOCK_DOOR_STATUS),
            patch.object(laundry, "list_bookings", return_value=MOCK_BOOKINGS),
        ):
            await entry_b.runtime_data.async_refresh()
            await hass.async_block_till_done()

        with pytest.raises(asyncio.TimeoutError):
            await asyncio.wait_for(client.receive_json(), timeout=0.2)

    async def test_it_should_unsubscribe_when_connection_closes(
        self, hass: HomeAssistant, hass_ws_client
    ):
        entry = MockEntryBuilder().build()
        await _setup_integration(hass, entry)
        coordinator = entry.runtime_data
        listeners_before = len(coordinator._listeners)

        client = await hass_ws_client(hass)
        await client.send_json({"id": 1, "type": "aptus/subscribe", "entry_id": entry.entry_id})
        ack = await client.receive_json()
        assert ack["success"]
        assert len(coordinator._listeners) == listeners_before + 1

        await client.close()
        await hass.async_block_till_done()

        assert len(coordinator._listeners) == listeners_before
