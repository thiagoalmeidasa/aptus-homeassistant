export interface SectionConfig {
  type: "my-bookings" | "first-available" | "calendar";
}

export interface AptusLaundryCardConfig {
  type: string;
  title?: string;
  sections?: SectionConfig[];
  first_available_count?: number;
  /** @deprecated Use sections instead */
  calendar_entity?: string;
}

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: {
    friendly_name?: string;
    group_name?: string;
    pass_no?: number;
    booking_id?: string;
    [key: string]: unknown;
  };
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  callService(
    domain: string,
    service: string,
    data?: Record<string, unknown>,
    target?: { entity_id: string }
  ): Promise<void>;
  callApi<T>(method: string, path: string): Promise<T>;
  connection: {
    sendMessagePromise<T>(msg: Record<string, unknown>): Promise<T>;
  };
}

export interface LaundryGroup {
  id: string;
  name: string;
}

export interface TimeSlot {
  pass_no: number;
  date: string;
  group_id: string;
  state: "available" | "unavailable" | "owned";
  start_time: string;
  end_time: string;
}

export interface LaundryBooking {
  id: string;
  group_name: string;
  date: string;
  pass_no: number;
  start_time: string;
  end_time: string;
}

export interface TimeSlotInfo {
  passNo: number;
  label: string;
  start: string;
  end: string;
}

export const TIME_SLOTS: TimeSlotInfo[] = [
  { passNo: 0, label: "02:00 – 04:00", start: "02:00", end: "04:00" },
  { passNo: 1, label: "04:00 – 06:00", start: "04:00", end: "06:00" },
  { passNo: 2, label: "06:00 – 08:30", start: "06:00", end: "08:30" },
  { passNo: 3, label: "08:30 – 11:00", start: "08:30", end: "11:00" },
  { passNo: 4, label: "11:00 – 13:30", start: "11:00", end: "13:30" },
  { passNo: 5, label: "13:30 – 16:00", start: "13:30", end: "16:00" },
  { passNo: 6, label: "16:00 – 18:30", start: "16:00", end: "18:30" },
  { passNo: 7, label: "18:30 – 21:00", start: "18:30", end: "21:00" },
  { passNo: 8, label: "21:00 – 23:30", start: "21:00", end: "23:30" },
  { passNo: 9, label: "23:30 – 02:00", start: "23:30", end: "02:00" },
];

export const DEFAULT_SECTIONS: SectionConfig[] = [
  { type: "my-bookings" },
  { type: "first-available" },
  { type: "calendar" },
];
