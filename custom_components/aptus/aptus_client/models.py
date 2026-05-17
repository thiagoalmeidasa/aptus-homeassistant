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


def _resolve_pass_time(pass_no: int, override: time | None, index: int) -> time:
    """
    Resolve a slot's start (index=0) or end (index=1) time.

    Prefers an explicit override (from HTML scraping); falls back to
    `_TIME_SLOT_MAP[pass_no]`. Raises `ValueError` for unmapped pass_nos
    without overrides instead of silently returning `time(0, 0)` — that
    silent fallback used to surface as 00:00-00:00 "ghost" events.
    """
    if override is not None:
        return override
    if pass_no not in _TIME_SLOT_MAP:
        raise ValueError(
            f"Unknown pass_no={pass_no}; not in _TIME_SLOT_MAP and no override set",
        )
    return _TIME_SLOT_MAP[pass_no][index]


@dataclass
class TimeSlot:
    pass_no: int
    date: date
    group_id: str
    state: SlotState
    group_name: str | None = None
    _start: time | None = field(default=None, repr=False)
    _end: time | None = field(default=None, repr=False)

    @property
    def start_time(self) -> time:
        return _resolve_pass_time(self.pass_no, self._start, 0)

    @property
    def end_time(self) -> time:
        return _resolve_pass_time(self.pass_no, self._end, 1)

    @property
    def is_bookable(self) -> bool:
        return self.state == SlotState.AVAILABLE


@dataclass
class LaundryBooking:
    id: str
    group_name: str
    date: date
    pass_no: int
    _start: time | None = field(default=None, repr=False)
    _end: time | None = field(default=None, repr=False)

    @property
    def start_time(self) -> time:
        return _resolve_pass_time(self.pass_no, self._start, 0)

    @property
    def end_time(self) -> time:
        return _resolve_pass_time(self.pass_no, self._end, 1)

    @property
    def start(self) -> datetime:
        return datetime.combine(self.date, self.start_time)

    @property
    def end(self) -> datetime:
        return datetime.combine(self.date, self.end_time)
