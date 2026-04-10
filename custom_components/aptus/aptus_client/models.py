"""Aptus client data models."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, time
from enum import Enum


class DoorType(Enum):
    """Type of door in the Aptus portal."""

    ENTRANCE = "entrance"
    APARTMENT = "apartment"


class SlotState(Enum):
    """State of a laundry time slot."""

    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"
    OWNED = "owned"


# passNo -> (start_time, end_time)
_TIME_SLOT_MAP: dict[int, tuple[time, time]] = {
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


@dataclass
class Door:
    id: str
    name: str
    door_type: DoorType = DoorType.ENTRANCE


@dataclass
class DoorStatus:
    is_locked: bool | None
    battery_low: bool | None
    status_text: str


@dataclass
class UnlockResult:
    success: bool
    status_text: str


@dataclass
class LaundryGroup:
    id: str
    name: str


@dataclass
class TimeSlot:
    pass_no: int
    date: date
    group_id: str
    state: SlotState

    @property
    def start_time(self) -> time:
        return _TIME_SLOT_MAP[self.pass_no][0]

    @property
    def end_time(self) -> time:
        return _TIME_SLOT_MAP[self.pass_no][1]

    @property
    def is_bookable(self) -> bool:
        return self.state == SlotState.AVAILABLE


@dataclass
class LaundryBooking:
    id: str
    group_name: str
    date: date
    pass_no: int

    @property
    def start_time(self) -> time:
        return _TIME_SLOT_MAP[self.pass_no][0]

    @property
    def end_time(self) -> time:
        return _TIME_SLOT_MAP[self.pass_no][1]

    @property
    def start(self) -> datetime:
        return datetime.combine(self.date, self.start_time)

    @property
    def end(self) -> datetime:
        return datetime.combine(self.date, self.end_time)
