"""BDD tests for Aptus client data models."""

from datetime import date, datetime, time

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


class TestDoor:
    """Describe Door dataclass."""

    def test_it_should_store_id_name_and_door_type(self):
        door = Door(id="12227", name="Kilsmogatan 7 Entre", door_type=DoorType.ENTRANCE)

        assert door.id == "12227"
        assert door.name == "Kilsmogatan 7 Entre"
        assert door.door_type == DoorType.ENTRANCE

    def test_it_should_default_door_type_to_entrance(self):
        door = Door(id="100", name="Front Door")

        assert door.door_type == DoorType.ENTRANCE


class TestDoorStatus:
    """Describe DoorStatus dataclass."""

    def test_it_should_store_lock_state_and_battery_info(self):
        status = DoorStatus(is_locked=True, battery_low=False, status_text="Door is locked")

        assert status.is_locked is True
        assert status.battery_low is False
        assert status.status_text == "Door is locked"

    def test_it_should_allow_none_for_unknown_states(self):
        status = DoorStatus(is_locked=None, battery_low=None, status_text="Unknown")

        assert status.is_locked is None
        assert status.battery_low is None


class TestUnlockResult:
    """Describe UnlockResult dataclass."""

    def test_it_should_store_success_and_status_text(self):
        result = UnlockResult(success=True, status_text="Door is open")

        assert result.success is True
        assert result.status_text == "Door is open"


class TestLaundryGroup:
    """Describe LaundryGroup dataclass."""

    def test_it_should_store_id_and_name(self):
        group = LaundryGroup(id="185", name="Grupp 1")

        assert group.id == "185"
        assert group.name == "Grupp 1"


class TestTimeSlot:
    """Describe TimeSlot dataclass."""

    def test_it_should_store_pass_no_date_group_id_and_state(self):
        slot = TimeSlot(
            pass_no=3,
            date=date(2026, 4, 10),
            group_id="185",
            state=SlotState.AVAILABLE,
        )

        assert slot.pass_no == 3
        assert slot.date == date(2026, 4, 10)
        assert slot.group_id == "185"
        assert slot.state == SlotState.AVAILABLE

    def test_it_should_map_pass_no_to_time_range(self):
        slot = TimeSlot(
            pass_no=3,
            date=date(2026, 4, 10),
            group_id="185",
            state=SlotState.AVAILABLE,
        )

        assert slot.start_time == time(8, 30)
        assert slot.end_time == time(11, 0)

    def test_it_should_map_all_pass_numbers_to_expected_ranges(self):
        expected = {
            0: (time(2, 0), time(4, 0)),
            1: (time(4, 0), time(6, 0)),
            2: (time(6, 0), time(8, 30)),
            3: (time(8, 30), time(11, 0)),
            4: (time(11, 0), time(13, 30)),
            5: (time(13, 30), time(16, 0)),
            6: (time(16, 0), time(18, 30)),
            7: (time(18, 30), time(21, 0)),
            8: (time(21, 0), time(23, 30)),
            9: (time(23, 30), time(2, 0)),
        }
        for pass_no, (exp_start, exp_end) in expected.items():
            slot = TimeSlot(
                pass_no=pass_no,
                date=date(2026, 4, 10),
                group_id="185",
                state=SlotState.AVAILABLE,
            )
            assert slot.start_time == exp_start, f"pass_no={pass_no} start"
            assert slot.end_time == exp_end, f"pass_no={pass_no} end"

    def test_it_should_indicate_if_bookable(self):
        available = TimeSlot(
            pass_no=3,
            date=date(2026, 4, 10),
            group_id="185",
            state=SlotState.AVAILABLE,
        )
        unavailable = TimeSlot(
            pass_no=3,
            date=date(2026, 4, 10),
            group_id="185",
            state=SlotState.UNAVAILABLE,
        )
        owned = TimeSlot(
            pass_no=3,
            date=date(2026, 4, 10),
            group_id="185",
            state=SlotState.OWNED,
        )

        assert available.is_bookable is True
        assert unavailable.is_bookable is False
        assert owned.is_bookable is False


class TestLaundryBooking:
    """Describe LaundryBooking dataclass."""

    def test_it_should_store_id_group_name_date_and_time_range(self):
        booking = LaundryBooking(
            id="42",
            group_name="Grupp 1",
            date=date(2026, 4, 10),
            pass_no=5,
        )

        assert booking.id == "42"
        assert booking.group_name == "Grupp 1"
        assert booking.date == date(2026, 4, 10)
        assert booking.pass_no == 5

    def test_it_should_have_start_and_end_as_datetime(self):
        booking = LaundryBooking(
            id="42",
            group_name="Grupp 1",
            date=date(2026, 4, 10),
            pass_no=5,
        )

        assert booking.start == datetime(2026, 4, 10, 13, 30)
        assert booking.end == datetime(2026, 4, 10, 16, 0)
