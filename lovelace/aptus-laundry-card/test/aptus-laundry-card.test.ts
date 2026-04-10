import { describe, it, expect, vi, beforeEach } from "vitest";
import type {
  AptusLaundryCardConfig,
  HomeAssistant,
  HassEntity,
  CalendarEvent,
} from "../src/types";

function makeEntity(
  entityId: string,
  state: string,
  attributes: Partial<HassEntity["attributes"]> = {}
): HassEntity {
  return {
    entity_id: entityId,
    state,
    attributes: {
      friendly_name: entityId.replace("sensor.", "").replace(/_/g, " "),
      ...attributes,
    },
  };
}

function makeCalendarEvents(events: Partial<CalendarEvent>[]): CalendarEvent[] {
  return events.map((e, i) => ({
    summary: e.summary ?? `Laundry - Room ${i + 1}`,
    start: e.start ?? "2026-04-11T08:30:00+02:00",
    end: e.end ?? "2026-04-11T11:00:00+02:00",
    ...e,
  }));
}

function makeHass(
  entities: HassEntity[],
  calendarEvents: CalendarEvent[] = []
): HomeAssistant {
  const states: Record<string, HassEntity> = {};
  for (const e of entities) {
    states[e.entity_id] = e;
  }
  return {
    states,
    callService: vi.fn().mockResolvedValue(undefined),
    callApi: vi.fn().mockResolvedValue(calendarEvents),
  };
}

function createCard() {
  const el = document.createElement("aptus-laundry-card");
  return el as HTMLElement & {
    setConfig(config: AptusLaundryCardConfig): void;
    hass: HomeAssistant;
    shadowRoot: ShadowRoot;
    updateComplete: Promise<boolean>;
  };
}

async function renderCard(
  config: AptusLaundryCardConfig,
  hass: HomeAssistant
): Promise<ReturnType<typeof createCard>> {
  const card = createCard();
  card.setConfig(config);
  card.hass = hass;
  document.body.appendChild(card);
  await card.updateComplete;
  // Wait for calendar API fetch to resolve
  await new Promise((r) => setTimeout(r, 0));
  await card.updateComplete;
  return card;
}

declare global {
  interface HTMLElement {
    updateComplete: Promise<boolean>;
  }
}

const defaultConfig: AptusLaundryCardConfig = {
  type: "custom:aptus-laundry-card",
  calendar_entity: "calendar.aptus_laundry",
};

describe("AptusLaundryCard", () => {
  beforeEach(async () => {
    document.body.innerHTML = "";
    await import("../src/aptus-laundry-card");
  });

  describe("when configured with a calendar entity", () => {
    it("should fetch events from the calendar API", async () => {
      const hass = makeHass([], []);
      await renderCard(defaultConfig, hass);

      expect(hass.callApi).toHaveBeenCalledWith(
        "GET",
        expect.stringContaining("calendars/calendar.aptus_laundry")
      );
    });

    it("should render a booking row for each calendar event", async () => {
      const events = makeCalendarEvents([
        { summary: "Laundry - Room A", start: "2026-04-11T08:30:00+02:00", end: "2026-04-11T11:00:00+02:00" },
        { summary: "Laundry - Room B", start: "2026-04-12T13:30:00+02:00", end: "2026-04-12T16:00:00+02:00" },
      ]);
      const hass = makeHass([], events);
      const card = await renderCard(defaultConfig, hass);

      const rows = card.shadowRoot!.querySelectorAll(".booking-row");
      expect(rows).toHaveLength(2);
    });

    it("should display the event summary in each booking row", async () => {
      const events = makeCalendarEvents([
        { summary: "Laundry - Tvättstuga 1" },
      ]);
      const hass = makeHass([], events);
      const card = await renderCard(defaultConfig, hass);

      const summary = card.shadowRoot!.querySelector(".booking-summary");
      expect(summary?.textContent).toContain("Laundry - Tvättstuga 1");
    });

    it("should display the date and time for each booking", async () => {
      const events = makeCalendarEvents([
        { start: "2026-04-11T08:30:00+02:00", end: "2026-04-11T11:00:00+02:00" },
      ]);
      const hass = makeHass([], events);
      const card = await renderCard(defaultConfig, hass);

      const time = card.shadowRoot!.querySelector(".booking-time");
      expect(time?.textContent).toContain("08:30");
      expect(time?.textContent).toContain("11:00");
    });

    it("should show an empty state when there are no bookings", async () => {
      const hass = makeHass([], []);
      const card = await renderCard(defaultConfig, hass);

      const empty = card.shadowRoot!.querySelector(".empty-state");
      expect(empty).not.toBeNull();
      expect(empty?.textContent).toContain("No upcoming bookings");
    });
  });

  describe("when the user cancels a booking", () => {
    it("should render a cancel button on each booking row", async () => {
      const events = makeCalendarEvents([
        { summary: "Laundry - Room A", uid: "booking-123" },
      ]);
      const hass = makeHass([], events);
      const card = await renderCard(defaultConfig, hass);

      const cancelBtn = card.shadowRoot!.querySelector(".cancel-button");
      expect(cancelBtn).not.toBeNull();
    });

    it("should call aptus.cancel_laundry with the booking uid", async () => {
      const events = makeCalendarEvents([
        { summary: "Laundry - Room A", uid: "booking-456" },
      ]);
      const hass = makeHass([], events);
      const card = await renderCard(defaultConfig, hass);

      const cancelBtn = card.shadowRoot!.querySelector(".cancel-button") as HTMLElement;
      cancelBtn.click();

      expect(hass.callService).toHaveBeenCalledWith("aptus", "cancel_laundry", {
        booking_id: "booking-456",
      });
    });
  });

  describe("when the user books a new slot", () => {
    it("should render a booking form section", async () => {
      const hass = makeHass([], []);
      const card = await renderCard(defaultConfig, hass);

      const form = card.shadowRoot!.querySelector(".booking-form");
      expect(form).not.toBeNull();
    });

    it("should have a date input", async () => {
      const hass = makeHass([], []);
      const card = await renderCard(defaultConfig, hass);

      const dateInput = card.shadowRoot!.querySelector('input[type="date"]');
      expect(dateInput).not.toBeNull();
    });

    it("should have a time slot selector", async () => {
      const hass = makeHass([], []);
      const card = await renderCard(defaultConfig, hass);

      const slotSelect = card.shadowRoot!.querySelector(".slot-select");
      expect(slotSelect).not.toBeNull();
    });

    it("should have a group ID input", async () => {
      const hass = makeHass([], []);
      const card = await renderCard(defaultConfig, hass);

      const groupInput = card.shadowRoot!.querySelector(".group-input");
      expect(groupInput).not.toBeNull();
    });

    it("should call aptus.book_laundry when the book button is clicked", async () => {
      const hass = makeHass([], []);
      const card = await renderCard(defaultConfig, hass);

      // Fill in the form
      const dateInput = card.shadowRoot!.querySelector('input[type="date"]') as HTMLInputElement;
      dateInput.value = "2026-04-15";
      dateInput.dispatchEvent(new Event("change"));

      const slotSelect = card.shadowRoot!.querySelector(".slot-select") as HTMLSelectElement;
      slotSelect.value = "3";
      slotSelect.dispatchEvent(new Event("change"));

      const groupInput = card.shadowRoot!.querySelector(".group-input") as HTMLInputElement;
      groupInput.value = "group-1";
      groupInput.dispatchEvent(new Event("input"));

      await card.updateComplete;

      const bookBtn = card.shadowRoot!.querySelector(".book-button") as HTMLElement;
      bookBtn.click();

      expect(hass.callService).toHaveBeenCalledWith("aptus", "book_laundry", {
        pass_no: 3,
        pass_date: "2026-04-15",
        group_id: "group-1",
      });
    });
  });

  describe("when the card title is configured", () => {
    it("should display the title in the card header", async () => {
      const hass = makeHass([], []);
      const card = await renderCard(
        { ...defaultConfig, title: "Laundry Bookings" },
        hass
      );

      const header = card.shadowRoot!.querySelector(".card-header");
      expect(header?.textContent).toContain("Laundry Bookings");
    });

    it("should not render a header when no title is set", async () => {
      const hass = makeHass([], []);
      const card = await renderCard(defaultConfig, hass);

      const header = card.shadowRoot!.querySelector(".card-header");
      expect(header).toBeNull();
    });
  });

  describe("when setConfig is called with invalid config", () => {
    it("should throw if calendar_entity is missing", async () => {
      await import("../src/aptus-laundry-card");
      const card = createCard();

      expect(() => {
        card.setConfig({ type: "custom:aptus-laundry-card" } as AptusLaundryCardConfig);
      }).toThrow();
    });
  });
});
