"""BDD tests for Aptus lock entities."""

from unittest.mock import AsyncMock, patch

from homeassistant.components.lock import DOMAIN as LOCK_DOMAIN, SERVICE_LOCK, SERVICE_UNLOCK
from homeassistant.const import ATTR_ENTITY_ID, STATE_LOCKED, STATE_UNLOCKED
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.aptus.aptus_client import doors, laundry
from custom_components.aptus.aptus_client.models import UnlockResult

from .conftest import (
    MOCK_BOOKINGS,
    MOCK_DOOR_STATUS,
    MOCK_DOORS,
    MockEntryBuilder,
)


def _make_entry(hass: HomeAssistant) -> MockConfigEntry:
    entry = MockEntryBuilder().build()
    entry.add_to_hass(hass)
    return entry


async def _setup_integration(hass: HomeAssistant, entry: MockConfigEntry):
    """Set up the integration with mocked data fetchers and client."""
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

    return mock_client


class TestAptusEntranceDoorLock:
    """Describe entrance door lock entity."""

    async def test_it_should_create_one_entity_per_entrance_door(self, hass: HomeAssistant):
        entry = _make_entry(hass)
        await _setup_integration(hass, entry)

        # Should have 2 entrance door entities
        state1 = hass.states.get("lock.kilsmogatan_7_entre")
        state2 = hass.states.get("lock.front_door")

        assert state1 is not None
        assert state2 is not None

    async def test_it_should_have_unique_id_from_entry_and_door_id(self, hass: HomeAssistant):
        entry = _make_entry(hass)
        await _setup_integration(hass, entry)

        from homeassistant.helpers import entity_registry as er

        entity_registry = er.async_get(hass)
        ent = entity_registry.async_get("lock.kilsmogatan_7_entre")
        assert ent is not None
        assert ent.unique_id == f"{entry.entry_id}_entrance_12227"

    async def test_it_should_report_locked_by_default(self, hass: HomeAssistant):
        entry = _make_entry(hass)
        await _setup_integration(hass, entry)

        state = hass.states.get("lock.kilsmogatan_7_entre")
        assert state.state == STATE_LOCKED

    async def test_it_should_unlock_via_api_on_unlock_command(self, hass: HomeAssistant):
        entry = _make_entry(hass)

        with (
            patch("custom_components.aptus.AptusClient") as mock_client_cls,
            patch.object(doors, "list_doors", return_value=MOCK_DOORS),
            patch.object(doors, "get_apartment_door_status", return_value=MOCK_DOOR_STATUS),
            patch.object(laundry, "list_bookings", return_value=MOCK_BOOKINGS),
            patch.object(
                doors,
                "unlock_entrance_door",
                return_value=UnlockResult(success=True, status_text="Door is open"),
            ) as mock_unlock,
        ):
            mock_client = AsyncMock()
            mock_client_cls.return_value = mock_client

            await hass.config_entries.async_setup(entry.entry_id)
            await hass.async_block_till_done()

            await hass.services.async_call(
                LOCK_DOMAIN,
                SERVICE_UNLOCK,
                {ATTR_ENTITY_ID: "lock.kilsmogatan_7_entre"},
                blocking=True,
            )

        mock_unlock.assert_awaited_once()

    async def test_it_should_report_unlocked_briefly_after_unlock(self, hass: HomeAssistant):
        entry = _make_entry(hass)

        with (
            patch("custom_components.aptus.AptusClient") as mock_client_cls,
            patch.object(doors, "list_doors", return_value=MOCK_DOORS),
            patch.object(doors, "get_apartment_door_status", return_value=MOCK_DOOR_STATUS),
            patch.object(laundry, "list_bookings", return_value=MOCK_BOOKINGS),
            patch.object(
                doors,
                "unlock_entrance_door",
                return_value=UnlockResult(success=True, status_text="Door is open"),
            ),
        ):
            mock_client = AsyncMock()
            mock_client_cls.return_value = mock_client

            await hass.config_entries.async_setup(entry.entry_id)
            await hass.async_block_till_done()

            await hass.services.async_call(
                LOCK_DOMAIN,
                SERVICE_UNLOCK,
                {ATTR_ENTITY_ID: "lock.kilsmogatan_7_entre"},
                blocking=True,
            )

        state = hass.states.get("lock.kilsmogatan_7_entre")
        assert state.state == STATE_UNLOCKED

    async def test_it_should_noop_on_lock_command(self, hass: HomeAssistant):
        entry = _make_entry(hass)
        await _setup_integration(hass, entry)

        # Lock should not raise, just be a no-op
        with patch.object(doors, "lock_apartment_door") as mock_lock:
            await hass.services.async_call(
                LOCK_DOMAIN,
                SERVICE_LOCK,
                {ATTR_ENTITY_ID: "lock.kilsmogatan_7_entre"},
                blocking=True,
            )

        # lock_apartment_door should NOT have been called (entrance doors can't lock)
        mock_lock.assert_not_awaited()


class TestAptusApartmentDoorLock:
    """Describe apartment door lock entity."""

    async def test_it_should_reflect_locked_state_from_coordinator(self, hass: HomeAssistant):
        entry = _make_entry(hass)
        await _setup_integration(hass, entry)

        state = hass.states.get("lock.apartment_door")
        assert state is not None
        assert state.state == STATE_LOCKED

    async def test_it_should_call_lock_api_on_lock_command(self, hass: HomeAssistant):
        entry = _make_entry(hass)

        with (
            patch("custom_components.aptus.AptusClient") as mock_client_cls,
            patch.object(doors, "list_doors", return_value=MOCK_DOORS),
            patch.object(doors, "get_apartment_door_status", return_value=MOCK_DOOR_STATUS),
            patch.object(laundry, "list_bookings", return_value=MOCK_BOOKINGS),
            patch.object(
                doors,
                "lock_apartment_door",
                return_value=UnlockResult(success=True, status_text="Locked"),
            ) as mock_lock,
        ):
            mock_client = AsyncMock()
            mock_client_cls.return_value = mock_client

            await hass.config_entries.async_setup(entry.entry_id)
            await hass.async_block_till_done()

            await hass.services.async_call(
                LOCK_DOMAIN,
                SERVICE_LOCK,
                {ATTR_ENTITY_ID: "lock.apartment_door"},
                blocking=True,
            )

        mock_lock.assert_awaited_once()

    async def test_it_should_call_unlock_api_on_unlock_command(self, hass: HomeAssistant):
        entry = _make_entry(hass)

        with (
            patch("custom_components.aptus.AptusClient") as mock_client_cls,
            patch.object(doors, "list_doors", return_value=MOCK_DOORS),
            patch.object(doors, "get_apartment_door_status", return_value=MOCK_DOOR_STATUS),
            patch.object(laundry, "list_bookings", return_value=MOCK_BOOKINGS),
            patch.object(
                doors,
                "unlock_apartment_door",
                return_value=UnlockResult(success=True, status_text="Open"),
            ) as mock_unlock,
        ):
            mock_client = AsyncMock()
            mock_client_cls.return_value = mock_client

            await hass.config_entries.async_setup(entry.entry_id)
            await hass.async_block_till_done()

            await hass.services.async_call(
                LOCK_DOMAIN,
                SERVICE_UNLOCK,
                {ATTR_ENTITY_ID: "lock.apartment_door"},
                blocking=True,
            )

        mock_unlock.assert_awaited_once()

    async def test_it_should_report_battery_low_as_attribute(self, hass: HomeAssistant):
        entry = _make_entry(hass)
        await _setup_integration(hass, entry)

        state = hass.states.get("lock.apartment_door")
        assert state.attributes.get("battery_low") is False
