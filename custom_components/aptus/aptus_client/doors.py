"""Aptus portal door operations."""

from __future__ import annotations

import logging
import re
from typing import TYPE_CHECKING

from bs4 import BeautifulSoup

from .exceptions import AptusAuthError
from .models import Door, DoorStatus, DoorType, UnlockResult

_LOGGER = logging.getLogger(__name__)

if TYPE_CHECKING:
    from . import AptusClient


async def list_doors(client: AptusClient) -> list[Door]:
    """Parse entrance doors from the /Lock page HTML."""
    r = await client.get("Lock")
    body = await r.text()
    soup = BeautifulSoup(body, "html.parser")

    doors: list[Door] = []
    for card in soup.select(".lockCard"):
        card_id = card.get("id", "")
        match = re.search(r"_(\d+)$", card_id)
        if match:
            span = card.find("span")
            name = span.get_text(strip=True) if span else card_id
            doors.append(Door(id=match.group(1), name=name, door_type=DoorType.ENTRANCE))
    return doors


async def unlock_entrance_door(client: AptusClient, door_id: str) -> UnlockResult:
    """Unlock an entrance door by its ID."""
    r = await client.get_ajax(f"Lock/UnlockEntryDoor/{door_id}")
    data = await r.json()
    _LOGGER.debug("UnlockEntryDoor response: %s", data)
    return UnlockResult(
        success=data.get("HeaderStatusText") == "OK",
        status_text=data.get("StatusText", ""),
    )


async def get_apartment_door_status(client: AptusClient) -> DoorStatus | None:
    """Get the apartment (doorman) lock status. Returns None if not available."""
    try:
        await client.get("Lock/SetLockStatusTempData")
        r = await client.get("LockAsync/DoormanLockStatus")
        data = await r.json()
        return DoorStatus(
            is_locked=data.get("IsClosedAndLocked"),
            battery_low=data.get("BatteryLevelLow"),
            status_text=data.get("StatusText", ""),
        )
    except AptusAuthError:
        return None


async def lock_apartment_door(client: AptusClient) -> UnlockResult:
    """Lock the apartment (doorman) lock."""
    r = await client.get_ajax("Lock/LockDoormanLock")
    data = await r.json()
    return UnlockResult(
        success=data.get("HeaderStatusText") == "OK",
        status_text=data.get("StatusText", ""),
    )


async def unlock_apartment_door(client: AptusClient, code: str) -> UnlockResult:
    """Unlock the apartment (doorman) lock. Requires the account password as code."""
    r = await client.get_ajax("Lock/UnlockDoormanLock", params={"code": code})
    data = await r.json()
    return UnlockResult(
        success=data.get("HeaderStatusText") == "OK",
        status_text=data.get("StatusText", ""),
    )
