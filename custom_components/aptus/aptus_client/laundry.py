"""Aptus portal laundry booking operations."""

from __future__ import annotations

from datetime import date
import re
from typing import TYPE_CHECKING

from bs4 import BeautifulSoup

from .exceptions import AptusAuthError, AptusParseError
from .models import LaundryBooking, LaundryGroup, SlotState, TimeSlot

if TYPE_CHECKING:
    from . import AptusClient


async def get_laundry_category_id(client: AptusClient) -> str:
    """Get the laundry category ID via AJAX endpoint."""
    r = await client.get_ajax("CustomerBooking/JsonGetSingleCustomerCategoryId")
    data = await r.json(content_type=None)
    payload = data.get("Payload", "")
    if not payload or data.get("status") != "OK":
        raise AptusParseError(f"Unexpected category response: {data}")
    # Payload format: "35|Multi"
    return payload.split("|")[0]


async def list_laundry_groups(client: AptusClient, category_id: str) -> list[LaundryGroup]:
    """List available laundry groups/facilities for a category."""
    r = await client.get(
        "CustomerBooking/CustomerLocationGroups",
        params={"categoryId": category_id},
    )
    body = await r.text()
    soup = BeautifulSoup(body, "html.parser")

    groups: list[LaundryGroup] = []
    for btn in soup.select("button.btn[onclick*=SelectBookingGroup]"):
        onclick = btn.get("onclick", "")
        match = re.search(r"SelectBookingGroup\((\d+)\)", onclick)
        if match:
            groups.append(LaundryGroup(id=match.group(1), name=btn.get_text(strip=True)))
    return groups


async def get_first_available_slots(
    client: AptusClient, category_id: str, first_x: int = 10
) -> list[TimeSlot]:
    """Get the next N available laundry time slots across all groups."""
    r = await client.get(
        "CustomerBooking/FirstAvailable",
        params={"categoryId": category_id, "firstX": str(first_x)},
    )
    body = await r.text()
    soup = BeautifulSoup(body, "html.parser")

    slots: list[TimeSlot] = []
    for card in soup.select(".firstAvailableCard[onclick*=BookFirstAvailable]"):
        onclick = card.get("onclick", "")
        match = re.search(r"BookFirstAvailable\((\d+),\s*'([^']+)',\s*(\d+)\)", onclick)
        if match:
            slots.append(
                TimeSlot(
                    pass_no=int(match.group(1)),
                    date=date.fromisoformat(match.group(2)),
                    group_id=match.group(3),
                    state=SlotState.AVAILABLE,
                )
            )
    return slots


async def get_weekly_calendar(
    client: AptusClient,
    group_id: str,
    pass_date: str | None = None,
) -> list[TimeSlot]:
    """Get the weekly calendar for a laundry group."""
    params: dict[str, str] = {"bookingGroupId": group_id}
    if pass_date:
        params["passDate"] = pass_date

    r = await client.get("CustomerBooking/BookingCalendar", params=params)
    body = await r.text()
    soup = BeautifulSoup(body, "html.parser")

    slots: list[TimeSlot] = []
    for day_col in soup.select(".dayColumn[data-date]"):
        day_date = date.fromisoformat(day_col["data-date"])
        for interval in day_col.select(".interval[data-passno]"):
            pass_no = int(interval["data-passno"])
            css_classes = interval.get("class", [])
            if "bookable" in css_classes:
                state = SlotState.AVAILABLE
            elif "owned" in css_classes:
                state = SlotState.OWNED
            else:
                state = SlotState.UNAVAILABLE

            slots.append(
                TimeSlot(
                    pass_no=pass_no,
                    date=day_date,
                    group_id=group_id,
                    state=state,
                )
            )
    return slots


async def list_bookings(client: AptusClient) -> list[LaundryBooking]:
    """List the user's active laundry bookings. Returns [] if not available."""
    try:
        r = await client.get("CustomerBooking")
    except AptusAuthError:
        return []
    body = await r.text()
    soup = BeautifulSoup(body, "html.parser")

    bookings: list[LaundryBooking] = []
    for card in soup.select(".bookingCard[data-bookingid]"):
        booking_id = card["data-bookingid"]
        group_el = card.select_one(".group")
        date_el = card.select_one(".date")
        passno_el = card.select_one(".passno")

        if group_el and date_el and passno_el:
            bookings.append(
                LaundryBooking(
                    id=booking_id,
                    group_name=group_el.get_text(strip=True),
                    date=date.fromisoformat(date_el.get_text(strip=True)),
                    pass_no=int(passno_el.get_text(strip=True)),
                )
            )
    return bookings


async def book_slot(
    client: AptusClient,
    pass_no: int,
    pass_date: str,
    group_id: str,
) -> bool:
    """Book a laundry time slot. Returns True on success."""
    r = await client.get(
        "CustomerBooking/Book",
        params={
            "passNo": str(pass_no),
            "passDate": pass_date,
            "bookingGroupId": group_id,
        },
        allow_redirects=False,
    )
    return r.status in (200, 302)


async def cancel_booking(client: AptusClient, booking_id: str) -> bool:
    """Cancel a laundry booking. Returns True on success."""
    r = await client.get(
        f"CustomerBooking/Unbook/{booking_id}",
        allow_redirects=False,
    )
    return r.status in (200, 302)
