export interface AptusLaundryCardConfig {
  type: string;
  calendar_entity: string;
  sensor_entity?: string;
  title?: string;
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

export interface CalendarEvent {
  summary: string;
  start: string;
  end: string;
  description?: string;
  uid?: string;
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
