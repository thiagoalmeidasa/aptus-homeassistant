"""BDD tests for Aptus client laundry operations."""

from datetime import date
import re

import pytest

from custom_components.aptus.aptus_client.exceptions import AptusAuthError, AptusParseError
from custom_components.aptus.aptus_client.laundry import (
    book_slot,
    cancel_booking,
    get_first_available_slots,
    get_laundry_category_id,
    get_laundry_group_id,
    get_weekly_calendar,
    list_bookings,
    list_laundry_groups,
)
from custom_components.aptus.aptus_client.models import SlotState

# --- HTML fixtures ---

CATEGORY_ID_JSON = '{"status":"OK","Payload":"35|Multi"}'
CATEGORY_ID_BAD_JSON = '{"status":"Error","Payload":""}'
GROUP_ID_SINGLE_JSON = '{"status":"OK","Payload":"185"}'
GROUP_ID_MULTI_JSON = '{"status":"OK","Payload":"Multi"}'

LOCATION_GROUPS_HTML = """
<html><body>
<button class="btn" onclick="SelectBookingGroup(185)">Grupp 1</button>
<button class="btn" onclick="SelectBookingGroup(186)">Grupp 2</button>
</body></html>
"""

LOCATION_GROUPS_EMPTY_HTML = """
<html><body></body></html>
"""

FIRST_AVAILABLE_HTML = """
<html><body>
<div class="firstAvailableCard" onclick="BookFirstAvailable(3, '2026-04-10', 185)">
    <span class="time">08:30 - 11:00</span>
    <span class="group">Grupp 1</span>
</div>
<div class="firstAvailableCard" onclick="BookFirstAvailable(5, '2026-04-11', 186)">
    <span class="time">13:30 - 16:00</span>
    <span class="group">Grupp 2</span>
</div>
</body></html>
"""

FIRST_AVAILABLE_EMPTY_HTML = """
<html><body></body></html>
"""

WEEKLY_CALENDAR_HTML = """
<html><body>
<div class="dayColumn" data-date="2026-04-10">
    <div class="interval bookable" data-passno="3" onclick="Book(3, '2026-04-10', 185)">
        <span>08:30 - 11:00</span>
    </div>
    <div class="interval unavailable" data-passno="4">
        <span>11:00 - 13:30</span>
    </div>
    <div class="interval owned" data-passno="5">
        <span>13:30 - 16:00</span>
    </div>
</div>
</body></html>
"""

BOOKINGS_HTML = """
<html><body>
<div class="bookingCard" data-bookingid="42">
    <span class="group">Grupp 1</span>
    <span class="date">2026-04-10</span>
    <span class="time">13:30 - 16:00</span>
    <span class="passno">5</span>
</div>
<div class="bookingCard" data-bookingid="43">
    <span class="group">Grupp 2</span>
    <span class="date">2026-04-11</span>
    <span class="time">08:30 - 11:00</span>
    <span class="passno">3</span>
</div>
</body></html>
"""

BOOKINGS_EMPTY_HTML = """
<html><body></body></html>
"""


class TestGetCategoryId:
    """Describe get_laundry_category_id()."""

    async def test_it_should_call_json_get_single_customer_category_id(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/CustomerBooking/JsonGetSingleCustomerCategoryId.*"),
            body=CATEGORY_ID_JSON,
            content_type="application/json",
        )

        category_id = await get_laundry_category_id(client)

        has_call = any(
            "JsonGetSingleCustomerCategoryId" in str(url) for (_, url) in mock_aio.requests
        )
        assert has_call

    async def test_it_should_parse_category_id_from_payload(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/CustomerBooking/JsonGetSingleCustomerCategoryId.*"),
            body=CATEGORY_ID_JSON,
            content_type="application/json",
        )

        category_id = await get_laundry_category_id(client)

        assert category_id == "35"

    async def test_it_should_raise_parse_error_on_unexpected_response(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/CustomerBooking/JsonGetSingleCustomerCategoryId.*"),
            body=CATEGORY_ID_BAD_JSON,
            content_type="application/json",
        )

        with pytest.raises(AptusParseError):
            await get_laundry_category_id(client)


class TestGetLaundryGroupId:
    """Describe get_laundry_group_id()."""

    async def test_it_should_return_group_id_for_single_group(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/CustomerBooking/JsonGetSingleCustomerLocationGroupId.*"),
            body=GROUP_ID_SINGLE_JSON,
            content_type="application/json",
        )

        result = await get_laundry_group_id(client, "35")

        assert result == "185"

    async def test_it_should_return_none_for_multi_group(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/CustomerBooking/JsonGetSingleCustomerLocationGroupId.*"),
            body=GROUP_ID_MULTI_JSON,
            content_type="application/json",
        )

        result = await get_laundry_group_id(client, "35")

        assert result is None


class TestListLaundryGroups:
    """Describe list_laundry_groups()."""

    async def test_it_should_parse_group_buttons_from_html(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/CustomerBooking/CustomerLocationGroups.*"),
            body=LOCATION_GROUPS_HTML,
        )

        groups = await list_laundry_groups(client, category_id="35")

        assert len(groups) == 2

    async def test_it_should_return_group_id_and_name(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/CustomerBooking/CustomerLocationGroups.*"),
            body=LOCATION_GROUPS_HTML,
        )

        groups = await list_laundry_groups(client, category_id="35")

        assert groups[0].id == "185"
        assert groups[0].name == "Grupp 1"
        assert groups[1].id == "186"
        assert groups[1].name == "Grupp 2"

    async def test_it_should_return_empty_list_when_no_groups(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/CustomerBooking/CustomerLocationGroups.*"),
            body=LOCATION_GROUPS_EMPTY_HTML,
        )
        mock_aio.get(
            re.compile(r".*/CustomerBooking/FirstAvailable.*"),
            body=FIRST_AVAILABLE_EMPTY_HTML,
        )

        groups = await list_laundry_groups(client, category_id="35")

        assert groups == []


class TestGetFirstAvailableSlots:
    """Describe get_first_available_slots()."""

    async def test_it_should_call_first_available_endpoint_with_category_id(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/CustomerBooking/FirstAvailable.*"),
            body=FIRST_AVAILABLE_HTML,
        )

        await get_first_available_slots(client, category_id="35")

        has_call = any("FirstAvailable" in str(url) for (_, url) in mock_aio.requests)
        assert has_call

    async def test_it_should_parse_available_time_slots_from_html(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/CustomerBooking/FirstAvailable.*"),
            body=FIRST_AVAILABLE_HTML,
        )

        slots = await get_first_available_slots(client, category_id="35")

        assert len(slots) == 2

    async def test_it_should_extract_pass_no_date_and_group_id(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/CustomerBooking/FirstAvailable.*"),
            body=FIRST_AVAILABLE_HTML,
        )

        slots = await get_first_available_slots(client, category_id="35")

        assert slots[0].pass_no == 3
        assert slots[0].date == date(2026, 4, 10)
        assert slots[0].group_id == "185"
        assert slots[0].state == SlotState.AVAILABLE

    async def test_it_should_return_empty_list_when_no_slots(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/CustomerBooking/FirstAvailable.*"),
            body=FIRST_AVAILABLE_EMPTY_HTML,
        )

        slots = await get_first_available_slots(client, category_id="35")

        assert slots == []


class TestGetWeeklyCalendar:
    """Describe get_weekly_calendar()."""

    async def test_it_should_call_booking_calendar_with_group_id(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/CustomerBooking/BookingCalendar.*"),
            body=WEEKLY_CALENDAR_HTML,
        )

        await get_weekly_calendar(client, group_id="185")

        has_call = any("BookingCalendar" in str(url) for (_, url) in mock_aio.requests)
        assert has_call

    async def test_it_should_parse_day_columns_with_time_slots(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/CustomerBooking/BookingCalendar.*"),
            body=WEEKLY_CALENDAR_HTML,
        )

        slots = await get_weekly_calendar(client, group_id="185")

        assert len(slots) == 3

    async def test_it_should_mark_slots_as_bookable_owned_or_unavailable(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/CustomerBooking/BookingCalendar.*"),
            body=WEEKLY_CALENDAR_HTML,
        )

        slots = await get_weekly_calendar(client, group_id="185")

        assert slots[0].state == SlotState.AVAILABLE
        assert slots[1].state == SlotState.UNAVAILABLE
        assert slots[2].state == SlotState.OWNED

    async def test_it_should_support_date_navigation(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/CustomerBooking/BookingCalendar.*"),
            body=WEEKLY_CALENDAR_HTML,
        )

        await get_weekly_calendar(client, group_id="185", pass_date="2026-04-10")

        has_call = any("BookingCalendar" in str(url) for (_, url) in mock_aio.requests)
        assert has_call


class TestListBookings:
    """Describe list_bookings()."""

    async def test_it_should_call_customer_booking_endpoint(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/CustomerBooking$"),
            body=BOOKINGS_HTML,
        )

        await list_bookings(client)

        has_call = any("CustomerBooking" in str(url) for (_, url) in mock_aio.requests)
        assert has_call

    async def test_it_should_parse_active_bookings_from_html(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/CustomerBooking$"),
            body=BOOKINGS_HTML,
        )

        bookings = await list_bookings(client)

        assert len(bookings) == 2

    async def test_it_should_extract_booking_id_group_date_and_time(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/CustomerBooking$"),
            body=BOOKINGS_HTML,
        )

        bookings = await list_bookings(client)

        assert bookings[0].id == "42"
        assert bookings[0].group_name == "Grupp 1"
        assert bookings[0].date == date(2026, 4, 10)
        assert bookings[0].pass_no == 5

    async def test_it_should_return_empty_list_when_no_bookings(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/CustomerBooking$"),
            body=BOOKINGS_EMPTY_HTML,
        )

        bookings = await list_bookings(client)

        assert bookings == []


class TestListBookingsUnavailable:
    """Describe list_bookings() when laundry feature is not available."""

    async def test_it_should_return_empty_list_when_portal_redirects_to_error_page(
        self, logged_in_client
    ):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/CustomerBooking$"),
            exception=AptusAuthError("Portal redirected to error page"),
        )

        bookings = await list_bookings(client)

        assert bookings == []


class TestBookSlot:
    """Describe book_slot()."""

    async def test_it_should_call_book_endpoint_with_pass_no_date_group(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/CustomerBooking/Book.*"),
            status=302,
        )

        await book_slot(client, pass_no=3, pass_date="2026-04-10", group_id="185")

        has_call = any("CustomerBooking/Book" in str(url) for (_, url) in mock_aio.requests)
        assert has_call

    async def test_it_should_return_success_on_redirect(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/CustomerBooking/Book.*"),
            status=302,
        )

        result = await book_slot(client, pass_no=3, pass_date="2026-04-10", group_id="185")

        assert result is True

    async def test_it_should_return_failure_when_slot_taken(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/CustomerBooking/Book.*"),
            status=409,
        )

        result = await book_slot(client, pass_no=3, pass_date="2026-04-10", group_id="185")

        assert result is False


class TestCancelBooking:
    """Describe cancel_booking()."""

    async def test_it_should_call_unbook_endpoint_with_booking_id(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/CustomerBooking/Unbook/42"),
            status=302,
        )

        await cancel_booking(client, booking_id="42")

        has_call = any("Unbook/42" in str(url) for (_, url) in mock_aio.requests)
        assert has_call

    async def test_it_should_return_success_on_redirect(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/CustomerBooking/Unbook/42"),
            status=302,
        )

        result = await cancel_booking(client, booking_id="42")

        assert result is True
