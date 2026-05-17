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


class TestCoordinatorEventEmission:
    """
    Describe aptus_event bus events fired from the coordinator's booking diff.

    The blueprint at blueprints/automation/aptus/calendar_sync.yaml subscribes to
    these events to react to bookings made/cancelled either via the HA service
    or directly in the Aptus portal. Both paths are covered because the diff
    runs on every refresh regardless of who initiated the change.
    """

    async def test_it_should_not_fire_events_on_first_refresh(
        self, hass: HomeAssistant, mock_config_entry
    ):
        """First observed snapshot is the baseline — no flood of created events on HA start."""
        mock_client = AsyncMock()
        received: list = []
        hass.bus.async_listen("aptus_event", lambda e: received.append(e))

        with (
            patch.object(doors, "list_doors", return_value=MOCK_DOORS),
            patch.object(doors, "get_apartment_door_status", return_value=MOCK_DOOR_STATUS),
            patch.object(laundry, "list_bookings", return_value=MOCK_BOOKINGS),
        ):
            coordinator = AptusDataUpdateCoordinator(hass, mock_client, mock_config_entry)
            await coordinator.async_refresh()
            await hass.async_block_till_done()

        assert received == []

    async def test_it_should_fire_booking_created_event_when_new_booking_appears(
        self, hass: HomeAssistant, mock_config_entry
    ):
        mock_client = AsyncMock()
        received: list = []
        hass.bus.async_listen("aptus_event", lambda e: received.append(e))

        with (
            patch.object(doors, "list_doors", return_value=MOCK_DOORS),
            patch.object(doors, "get_apartment_door_status", return_value=MOCK_DOOR_STATUS),
            patch.object(laundry, "list_bookings", return_value=[]) as mock_bookings,
        ):
            coordinator = AptusDataUpdateCoordinator(hass, mock_client, mock_config_entry)
            await coordinator.async_refresh()  # baseline: no bookings
            await hass.async_block_till_done()

            mock_bookings.return_value = MOCK_BOOKINGS
            await coordinator.async_refresh()
            await hass.async_block_till_done()

        created = [e for e in received if e.data.get("type") == "booking_created"]
        assert len(created) == 1
        assert created[0].data["booking_id"] == "42"

    async def test_it_should_fire_booking_cancelled_event_when_booking_disappears(
        self, hass: HomeAssistant, mock_config_entry
    ):
        mock_client = AsyncMock()
        received: list = []
        hass.bus.async_listen("aptus_event", lambda e: received.append(e))

        with (
            patch.object(doors, "list_doors", return_value=MOCK_DOORS),
            patch.object(doors, "get_apartment_door_status", return_value=MOCK_DOOR_STATUS),
            patch.object(laundry, "list_bookings", return_value=MOCK_BOOKINGS) as mock_bookings,
        ):
            coordinator = AptusDataUpdateCoordinator(hass, mock_client, mock_config_entry)
            await coordinator.async_refresh()  # baseline: one booking
            await hass.async_block_till_done()

            mock_bookings.return_value = []
            await coordinator.async_refresh()
            await hass.async_block_till_done()

        cancelled = [e for e in received if e.data.get("type") == "booking_cancelled"]
        assert len(cancelled) == 1
        assert cancelled[0].data["booking_id"] == "42"

    async def test_it_should_fire_aptus_event_with_type_field_and_full_payload(
        self, hass: HomeAssistant, mock_config_entry
    ):
        """
        Single event type 'aptus_event' with a 'type' discriminator follows HA convention.

        See https://developers.home-assistant.io/docs/integration_events/ —
        integrations should fire <domain>_event with payload fields that
        distinguish event types (mirrors zha_event's 'command' pattern).
        """
        mock_client = AsyncMock()
        received: list = []
        hass.bus.async_listen("aptus_event", lambda e: received.append(e))

        with (
            patch.object(doors, "list_doors", return_value=MOCK_DOORS),
            patch.object(doors, "get_apartment_door_status", return_value=MOCK_DOOR_STATUS),
            patch.object(laundry, "list_bookings", return_value=[]) as mock_bookings,
        ):
            coordinator = AptusDataUpdateCoordinator(hass, mock_client, mock_config_entry)
            await coordinator.async_refresh()
            await hass.async_block_till_done()

            mock_bookings.return_value = MOCK_BOOKINGS
            await coordinator.async_refresh()
            await hass.async_block_till_done()

        assert len(received) == 1
        event = received[0]
        assert event.event_type == "aptus_event"
        assert event.data["type"] == "booking_created"
        assert event.data["booking_id"] == "42"
        assert event.data["group_name"] == "Grupp 1"
        assert event.data["pass_no"] == 5
        assert event.data["date"] == "2026-04-10"

    async def test_it_should_not_fire_cancellation_when_laundry_disabled(self, hass: HomeAssistant):
        """Toggling laundry off must not look like a mass cancellation."""
        mock_client = AsyncMock()
        received: list = []
        hass.bus.async_listen("aptus_event", lambda e: received.append(e))

        enabled_entry = MockEntryBuilder().build()
        with (
            patch.object(doors, "list_doors", return_value=MOCK_DOORS),
            patch.object(doors, "get_apartment_door_status", return_value=MOCK_DOOR_STATUS),
            patch.object(laundry, "list_bookings", return_value=MOCK_BOOKINGS),
        ):
            coordinator = AptusDataUpdateCoordinator(hass, mock_client, enabled_entry)
            await coordinator.async_refresh()  # baseline with 1 booking
            await hass.async_block_till_done()
            received.clear()

        # Same coordinator, but now laundry is disabled (entry rebuilt off-test
        # to flip the toggle deterministically without options-update plumbing).
        disabled_entry = MockEntryBuilder().without_laundry().build()
        coordinator.entry = disabled_entry
        with (
            patch.object(doors, "list_doors", return_value=MOCK_DOORS),
            patch.object(doors, "get_apartment_door_status", return_value=MOCK_DOOR_STATUS),
            patch.object(laundry, "list_bookings") as mock_bookings,
        ):
            await coordinator.async_refresh()
            await hass.async_block_till_done()

        mock_bookings.assert_not_awaited()
        cancelled = [e for e in received if e.data.get("type") == "booking_cancelled"]
        assert cancelled == []
