"""Shared fixtures for HA integration tests."""

from __future__ import annotations

from datetime import date
from unittest.mock import AsyncMock, patch

import pytest


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    """Enable custom integrations for all integration tests."""
    yield

from custom_components.aptus.aptus_client.models import (
    Door,
    DoorStatus,
    DoorType,
    LaundryBooking,
    LaundryGroup,
    SlotState,
    TimeSlot,
    UnlockResult,
)
from custom_components.aptus.const import DOMAIN

from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry

from pytest_homeassistant_custom_component.common import MockConfigEntry

TEST_BASE_URL = "https://bokning.test.se/Aptusportal"
TEST_USERNAME = "testuser"
TEST_PASSWORD = "testpass"

MOCK_DOORS = [
    Door(id="12227", name="Entity Example", door_type=DoorType.ENTRANCE),
    Door(id="100", name="Front Door", door_type=DoorType.ENTRANCE),
]

MOCK_DOOR_STATUS = DoorStatus(
    is_locked=True, battery_low=False, status_text="Door is locked"
)

MOCK_LAUNDRY_GROUPS = [
    LaundryGroup(id="185", name="Grupp 1"),
    LaundryGroup(id="186", name="Grupp 2"),
]

MOCK_BOOKINGS = [
    LaundryBooking(
        id="42", group_name="Grupp 1", date=date(2026, 4, 10), pass_no=5
    ),
]

MOCK_AVAILABLE_SLOTS = [
    TimeSlot(
        pass_no=3,
        date=date(2026, 4, 10),
        group_id="185",
        state=SlotState.AVAILABLE,
    ),
]


@pytest.fixture
def mock_config_entry() -> MockConfigEntry:
    """Create a mock config entry for the Aptus integration."""
    return MockConfigEntry(
        domain=DOMAIN,
        title="Aptus Test",
        data={
            "base_url": TEST_BASE_URL,
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD,
        },
        unique_id=f"{TEST_BASE_URL}_{TEST_USERNAME}",
    )


@pytest.fixture
def mock_aptus_client():
    """Create a mocked AptusClient."""
    client = AsyncMock()
    client.login = AsyncMock()
    client.close = AsyncMock()
    return client


@pytest.fixture
def mock_client_with_data(mock_aptus_client):
    """Create a mocked AptusClient with standard test data wired up."""
    from custom_components.aptus.aptus_client import doors, laundry

    with (
        patch.object(doors, "list_doors", return_value=MOCK_DOORS),
        patch.object(
            doors, "get_apartment_door_status", return_value=MOCK_DOOR_STATUS
        ),
        patch.object(
            doors, "unlock_entrance_door",
            return_value=UnlockResult(success=True, status_text="Door is open"),
        ),
        patch.object(
            doors, "lock_apartment_door",
            return_value=UnlockResult(success=True, status_text="Door is locked"),
        ),
        patch.object(
            doors, "unlock_apartment_door",
            return_value=UnlockResult(success=True, status_text="Door is open"),
        ),
        patch.object(laundry, "list_bookings", return_value=MOCK_BOOKINGS),
        patch.object(
            laundry,
            "get_first_available_slots",
            return_value=MOCK_AVAILABLE_SLOTS,
        ),
        patch.object(
            laundry,
            "get_laundry_category_id",
            return_value="35",
        ),
        patch.object(
            laundry,
            "list_laundry_groups",
            return_value=MOCK_LAUNDRY_GROUPS,
        ),
    ):
        yield mock_aptus_client
