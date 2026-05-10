"""Lock platform for Aptus integration."""

from __future__ import annotations

from typing import Any

from homeassistant.components.lock import LockEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import CALLBACK_TYPE, HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.event import async_call_later
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .aptus_client import doors
from .aptus_client.models import Door
from .coordinator import AptusDataUpdateCoordinator


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Aptus lock entities."""
    coordinator: AptusDataUpdateCoordinator = entry.runtime_data
    entities: list[LockEntity] = [
        AptusEntranceDoorLock(coordinator, entry, door)
        for door in coordinator.data.get("doors", [])
    ]

    # Add apartment door if enabled in options
    if coordinator.apartment_door_enabled:
        entities.append(AptusApartmentDoorLock(coordinator, entry))

    async_add_entities(entities)


class AptusEntranceDoorLock(CoordinatorEntity[AptusDataUpdateCoordinator], LockEntity):
    """Entrance door lock entity — unlock only, auto-relocks."""

    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: AptusDataUpdateCoordinator,
        entry: ConfigEntry,
        door: Door,
    ) -> None:
        super().__init__(coordinator)
        self._door = door
        self._attr_unique_id = f"{entry.entry_id}_entrance_{door.id}"
        self._attr_name = door.name
        self._is_locked = True
        self._relock_unsub: CALLBACK_TYPE | None = None

    @property
    def is_locked(self) -> bool:
        return self._is_locked

    async def async_lock(self, **kwargs: Any) -> None:
        """No-op — entrance doors auto-lock."""

    async def async_unlock(self, **kwargs: Any) -> None:
        """Unlock the entrance door."""
        result = await doors.unlock_entrance_door(self.coordinator.client, self._door.id)
        if result.success:
            self._is_locked = False
            self.async_write_ha_state()
            # Auto-relock after 5 seconds (door auto-locks physically)
            if self._relock_unsub:
                self._relock_unsub()
            self._relock_unsub = async_call_later(self.hass, 5, self._async_relock)

    @callback
    def _async_relock(self, _now: Any) -> None:
        """Reset lock state after the physical door auto-relocks."""
        self._relock_unsub = None
        self._is_locked = True
        self.async_write_ha_state()


class AptusApartmentDoorLock(CoordinatorEntity[AptusDataUpdateCoordinator], LockEntity):
    """Apartment (doorman) door lock entity — full lock/unlock with status."""

    _attr_has_entity_name = True
    _attr_name = "Apartment Door"

    def __init__(
        self,
        coordinator: AptusDataUpdateCoordinator,
        entry: ConfigEntry,
    ) -> None:
        super().__init__(coordinator)
        self._entry = entry
        self._attr_unique_id = f"{entry.entry_id}_apartment_door"

    @property
    def is_locked(self) -> bool | None:
        status = self.coordinator.data.get("apartment_status")
        if status:
            return status.is_locked
        return None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        status = self.coordinator.data.get("apartment_status")
        if status:
            return {"battery_low": status.battery_low}
        return {}

    async def async_lock(self, **kwargs: Any) -> None:
        """Lock the apartment door."""
        await doors.lock_apartment_door(self.coordinator.client)
        await self.coordinator.async_request_refresh()

    async def async_unlock(self, **kwargs: Any) -> None:
        """Unlock the apartment door."""
        await doors.unlock_apartment_door(
            self.coordinator.client, code=self._entry.data["password"]
        )
        await self.coordinator.async_request_refresh()
