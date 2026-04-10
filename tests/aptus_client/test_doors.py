"""BDD tests for Aptus client door operations."""

import re

from custom_components.aptus.aptus_client.doors import (
    get_apartment_door_status,
    list_doors,
    lock_apartment_door,
    unlock_apartment_door,
    unlock_entrance_door,
)
from custom_components.aptus.aptus_client.exceptions import AptusAuthError
from custom_components.aptus.aptus_client.models import DoorType

from .conftest import (
    LOCK_PAGE_EMPTY_HTML,
    LOCK_PAGE_INVALID_ID_HTML,
    LOCK_PAGE_MULTIPLE_DOORS_HTML,
    LOCK_PAGE_SINGLE_DOOR_HTML,
)


class TestListDoors:
    """Describe list_doors()."""

    async def test_it_should_parse_entrance_doors_from_lock_page_html(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(re.compile(r".*/Lock$"), body=LOCK_PAGE_SINGLE_DOOR_HTML)

        doors = await list_doors(client)

        assert len(doors) == 1
        assert doors[0].door_type == DoorType.ENTRANCE

    async def test_it_should_extract_door_id_from_div_id_attribute(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(re.compile(r".*/Lock$"), body=LOCK_PAGE_SINGLE_DOOR_HTML)

        doors = await list_doors(client)

        assert doors[0].id == "12227"

    async def test_it_should_extract_door_name_from_span_text(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(re.compile(r".*/Lock$"), body=LOCK_PAGE_SINGLE_DOOR_HTML)

        doors = await list_doors(client)

        assert doors[0].name == "Entity Example"

    async def test_it_should_return_empty_list_when_no_doors_found(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(re.compile(r".*/Lock$"), body=LOCK_PAGE_EMPTY_HTML)

        doors = await list_doors(client)

        assert doors == []

    async def test_it_should_handle_multiple_doors(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(re.compile(r".*/Lock$"), body=LOCK_PAGE_MULTIPLE_DOORS_HTML)

        doors = await list_doors(client)

        assert len(doors) == 3
        assert doors[0].id == "12227"
        assert doors[1].id == "100"
        assert doors[2].id == "200"

    async def test_it_should_skip_divs_without_valid_door_ids(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(re.compile(r".*/Lock$"), body=LOCK_PAGE_INVALID_ID_HTML)

        doors = await list_doors(client)

        assert doors == []


class TestUnlockEntranceDoor:
    """Describe unlock_entrance_door()."""

    async def test_it_should_call_unlock_entry_door_endpoint_with_door_id(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/Lock/UnlockEntryDoor/12227"),
            payload={"StatusText": "Door is open", "HeaderStatusText": "OK"},
        )

        result = await unlock_entrance_door(client, "12227")

        has_unlock_call = any("UnlockEntryDoor/12227" in str(url) for (_, url) in mock_aio.requests)
        assert has_unlock_call

    async def test_it_should_return_unlock_result_with_status_text(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/Lock/UnlockEntryDoor/.*"),
            payload={"StatusText": "Door is open", "HeaderStatusText": "OK"},
        )

        result = await unlock_entrance_door(client, "12227")

        assert result.status_text == "Door is open"

    async def test_it_should_return_success_true_when_door_opens(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/Lock/UnlockEntryDoor/.*"),
            payload={"StatusText": "Door is open", "HeaderStatusText": "OK"},
        )

        result = await unlock_entrance_door(client, "12227")

        assert result.success is True

    async def test_it_should_return_success_false_on_error_response(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/Lock/UnlockEntryDoor/.*"),
            payload={"StatusText": "Error", "HeaderStatusText": "Error"},
        )

        result = await unlock_entrance_door(client, "12227")

        assert result.success is False


class TestApartmentDoorStatus:
    """Describe get_apartment_door_status()."""

    async def test_it_should_call_doorman_lock_status_endpoint(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(re.compile(r".*/Lock/SetLockStatusTempData"), status=200)
        mock_aio.get(
            re.compile(r".*/LockAsync/DoormanLockStatus"),
            payload={
                "IsClosedAndLocked": True,
                "StatusText": "Door is locked",
                "BatteryLevelLow": False,
            },
        )

        status = await get_apartment_door_status(client)

        has_status_call = any("DoormanLockStatus" in str(url) for (_, url) in mock_aio.requests)
        assert has_status_call

    async def test_it_should_return_locked_when_is_closed_and_locked(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(re.compile(r".*/Lock/SetLockStatusTempData"), status=200)
        mock_aio.get(
            re.compile(r".*/LockAsync/DoormanLockStatus"),
            payload={
                "IsClosedAndLocked": True,
                "StatusText": "Door is locked",
                "BatteryLevelLow": False,
            },
        )

        status = await get_apartment_door_status(client)

        assert status.is_locked is True

    async def test_it_should_return_unlocked_when_door_is_open(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(re.compile(r".*/Lock/SetLockStatusTempData"), status=200)
        mock_aio.get(
            re.compile(r".*/LockAsync/DoormanLockStatus"),
            payload={
                "IsClosedAndLocked": False,
                "StatusText": "Door is open",
                "BatteryLevelLow": False,
            },
        )

        status = await get_apartment_door_status(client)

        assert status.is_locked is False

    async def test_it_should_report_battery_low_from_response(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(re.compile(r".*/Lock/SetLockStatusTempData"), status=200)
        mock_aio.get(
            re.compile(r".*/LockAsync/DoormanLockStatus"),
            payload={
                "IsClosedAndLocked": True,
                "StatusText": "Door is locked",
                "BatteryLevelLow": True,
            },
        )

        status = await get_apartment_door_status(client)

        assert status.battery_low is True


class TestLockApartmentDoor:
    """Describe lock_apartment_door()."""

    async def test_it_should_call_lock_doorman_lock_endpoint(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/Lock/LockDoormanLock"),
            payload={"StatusText": "Door is locked", "HeaderStatusText": "OK"},
        )

        await lock_apartment_door(client)

        has_lock_call = any("LockDoormanLock" in str(url) for (_, url) in mock_aio.requests)
        assert has_lock_call

    async def test_it_should_return_success_on_200(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/Lock/LockDoormanLock"),
            payload={"StatusText": "Door is locked", "HeaderStatusText": "OK"},
        )

        result = await lock_apartment_door(client)

        assert result.success is True


class TestApartmentDoorStatusUnavailable:
    """Describe get_apartment_door_status() when feature is not available."""

    async def test_it_should_return_none_when_portal_redirects_to_error_page(
        self, logged_in_client
    ):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/Lock/SetLockStatusTempData"),
            exception=AptusAuthError("Portal redirected to error page"),
        )

        status = await get_apartment_door_status(client)

        assert status is None


class TestUnlockApartmentDoor:
    """Describe unlock_apartment_door()."""

    async def test_it_should_call_unlock_doorman_lock_with_code_param(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/Lock/UnlockDoormanLock.*"),
            payload={"StatusText": "Door is open", "HeaderStatusText": "OK"},
        )

        await unlock_apartment_door(client, code="mypass")

        has_unlock_call = any("UnlockDoormanLock" in str(url) for (_, url) in mock_aio.requests)
        assert has_unlock_call

    async def test_it_should_return_success_on_200(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/Lock/UnlockDoormanLock.*"),
            payload={"StatusText": "Door is open", "HeaderStatusText": "OK"},
        )

        result = await unlock_apartment_door(client, code="mypass")

        assert result.success is True
