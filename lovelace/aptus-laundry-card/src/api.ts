import type { HomeAssistant, AptusEntry, LaundryGroup, TimeSlot, LaundryBooking } from "./types";

export async function fetchEntries(hass: HomeAssistant): Promise<AptusEntry[]> {
  return hass.connection.sendMessagePromise<AptusEntry[]>({
    type: "aptus/entries",
  });
}

export async function fetchGroups(hass: HomeAssistant, entryId: string): Promise<LaundryGroup[]> {
  return hass.connection.sendMessagePromise<LaundryGroup[]>({
    type: "aptus/laundry/groups",
    entry_id: entryId,
  });
}

export async function fetchBookings(hass: HomeAssistant, entryId: string): Promise<LaundryBooking[]> {
  return hass.connection.sendMessagePromise<LaundryBooking[]>({
    type: "aptus/laundry/bookings",
    entry_id: entryId,
  });
}

export async function fetchFirstAvailable(
  hass: HomeAssistant,
  entryId: string,
  count = 10
): Promise<TimeSlot[]> {
  return hass.connection.sendMessagePromise<TimeSlot[]>({
    type: "aptus/laundry/first_available",
    entry_id: entryId,
    first_x: count,
  });
}

export async function fetchWeeklyCalendar(
  hass: HomeAssistant,
  entryId: string,
  groupId: string,
  passDate?: string
): Promise<TimeSlot[]> {
  const msg: Record<string, unknown> = {
    type: "aptus/laundry/weekly_calendar",
    entry_id: entryId,
    group_id: groupId,
  };
  if (passDate) {
    msg.pass_date = passDate;
  }
  return hass.connection.sendMessagePromise<TimeSlot[]>(msg);
}
