"""BDD tests for Aptus laundry services."""

from unittest.mock import AsyncMock, patch

import pytest

from custom_components.aptus.const import DOMAIN
from custom_components.aptus.aptus_client import doors, laundry

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceNotFound

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


class TestBookLaundryService:
    """Describe aptus.book_laundry service."""

    async def test_it_should_call_client_book_slot(self, hass: HomeAssistant):
        entry = _make_entry(hass)

        with (
            patch("custom_components.aptus.AptusClient") as mock_client_cls,
            patch.object(doors, "list_doors", return_value=MOCK_DOORS),
            patch.object(doors, "get_apartment_door_status", return_value=MOCK_DOOR_STATUS),
            patch.object(laundry, "list_bookings", return_value=MOCK_BOOKINGS),
            patch.object(laundry, "book_slot", return_value=True) as mock_book,
        ):
            mock_client = AsyncMock()
            mock_client_cls.return_value = mock_client

            await hass.config_entries.async_setup(entry.entry_id)
            await hass.async_block_till_done()

            await hass.services.async_call(
                DOMAIN,
                "book_laundry",
                {
                    "pass_no": 3,
                    "pass_date": "2026-04-10",
                    "group_id": "185",
                },
                blocking=True,
            )

        mock_book.assert_awaited_once()

    async def test_it_should_raise_on_booking_failure(self, hass: HomeAssistant):
        entry = _make_entry(hass)

        with (
            patch("custom_components.aptus.AptusClient") as mock_client_cls,
            patch.object(doors, "list_doors", return_value=MOCK_DOORS),
            patch.object(doors, "get_apartment_door_status", return_value=MOCK_DOOR_STATUS),
            patch.object(laundry, "list_bookings", return_value=MOCK_BOOKINGS),
            patch.object(laundry, "book_slot", return_value=False),
        ):
            mock_client = AsyncMock()
            mock_client_cls.return_value = mock_client

            await hass.config_entries.async_setup(entry.entry_id)
            await hass.async_block_till_done()

            with pytest.raises(Exception):
                await hass.services.async_call(
                    DOMAIN,
                    "book_laundry",
                    {
                        "pass_no": 3,
                        "pass_date": "2026-04-10",
                        "group_id": "185",
                    },
                    blocking=True,
                )


class TestCancelLaundryService:
    """Describe aptus.cancel_laundry service."""

    async def test_it_should_call_client_cancel_booking(self, hass: HomeAssistant):
        entry = _make_entry(hass)

        with (
            patch("custom_components.aptus.AptusClient") as mock_client_cls,
            patch.object(doors, "list_doors", return_value=MOCK_DOORS),
            patch.object(doors, "get_apartment_door_status", return_value=MOCK_DOOR_STATUS),
            patch.object(laundry, "list_bookings", return_value=MOCK_BOOKINGS),
            patch.object(laundry, "cancel_booking", return_value=True) as mock_cancel,
        ):
            mock_client = AsyncMock()
            mock_client_cls.return_value = mock_client

            await hass.config_entries.async_setup(entry.entry_id)
            await hass.async_block_till_done()

            await hass.services.async_call(
                DOMAIN,
                "cancel_laundry",
                {"booking_id": "42"},
                blocking=True,
            )

        mock_cancel.assert_awaited_once()
