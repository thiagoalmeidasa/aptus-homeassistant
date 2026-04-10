import type { HomeAssistant, LaundryGroup, TimeSlot, LaundryBooking } from "./types";

export async function fetchGroups(hass: HomeAssistant): Promise<LaundryGroup[]> {
  return hass.connection.sendMessagePromise<LaundryGroup[]>({
    type: "aptus/laundry/groups",
  });
}

export async function fetchBookings(hass: HomeAssistant): Promise<LaundryBooking[]> {
  return hass.connection.sendMessagePromise<LaundryBooking[]>({
    type: "aptus/laundry/bookings",
  });
}

export async function fetchFirstAvailable(
  hass: HomeAssistant,
  count = 10
): Promise<TimeSlot[]> {
  return hass.connection.sendMessagePromise<TimeSlot[]>({
    type: "aptus/laundry/first_available",
    first_x: count,
  });
}

export async function fetchWeeklyCalendar(
  hass: HomeAssistant,
  groupId: string,
  passDate?: string
): Promise<TimeSlot[]> {
  const msg: Record<string, unknown> = {
    type: "aptus/laundry/weekly_calendar",
    group_id: groupId,
  };
  if (passDate) {
    msg.pass_date = passDate;
  }
  return hass.connection.sendMessagePromise<TimeSlot[]>(msg);
}
