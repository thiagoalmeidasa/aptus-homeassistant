import { describe, it, expect, vi, beforeEach } from "vitest";
import type { HomeAssistant, TimeSlot, LaundryGroup } from "../../src/types";

vi.mock("../../src/components/confirm-dialog", () => ({
  confirmDialog: vi.fn(),
}));

import { confirmDialog } from "../../src/components/confirm-dialog";
import "../../src/sections/calendar";

const mockConfirm = vi.mocked(confirmDialog);

declare global {
  interface HTMLElement {
    updateComplete: Promise<boolean>;
  }
}

const GROUP: LaundryGroup = { id: "g-7", name: "Block A" };
const SLOT: TimeSlot = {
  pass_no: 3,
  date: "2026-05-12",
  group_id: "g-7",
  state: "available",
  start_time: "08:30",
  end_time: "11:00",
  group_name: "Block A",
};

function makeHass(): HomeAssistant {
  const send = vi.fn().mockImplementation((msg: { type: string }) => {
    if (msg.type === "aptus/laundry/groups") return Promise.resolve([GROUP]);
    if (msg.type === "aptus/laundry/weekly_calendar") return Promise.resolve([SLOT]);
    return Promise.resolve([]);
  });
  return {
    states: {},
    callService: vi.fn().mockResolvedValue(undefined),
    callApi: vi.fn().mockResolvedValue([]),
    connection: { sendMessagePromise: send },
  };
}

async function mountSection(hass: HomeAssistant) {
  const el = document.createElement("aptus-laundry-calendar") as HTMLElement & {
    hass: HomeAssistant;
    entryId: string;
  };
  el.hass = hass;
  el.entryId = "entry-1";
  document.body.appendChild(el);
  for (let i = 0; i < 10; i++) {
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 5));
  }
  return el;
}

function clickAvailableCell(el: HTMLElement): void {
  const cell = el.shadowRoot!.querySelector(".grid-cell.available") as HTMLElement;
  if (!cell) throw new Error("no available cell rendered");
  cell.click();
}

async function flush(): Promise<void> {
  for (let i = 0; i < 4; i++) {
    await new Promise((r) => setTimeout(r, 5));
  }
}

describe("AptusLaundryCalendar booking", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    mockConfirm.mockReset();
  });

  describe("when the user clicks an available slot", () => {
    it("should prompt for confirmation before calling the service", async () => {
      mockConfirm.mockResolvedValue(false);
      const hass = makeHass();
      const el = await mountSection(hass);
      clickAvailableCell(el);
      await Promise.resolve();
      expect(mockConfirm).toHaveBeenCalledTimes(1);
      expect(hass.callService).not.toHaveBeenCalled();
    });
  });

  describe("when the user confirms the booking", () => {
    it("should call aptus.book_laundry with pass_no, pass_date and group_id", async () => {
      mockConfirm.mockResolvedValue(true);
      const hass = makeHass();
      const el = await mountSection(hass);
      clickAvailableCell(el);
      await flush();
      expect(hass.callService).toHaveBeenCalledWith("aptus", "book_laundry", {
        pass_no: 3,
        pass_date: "2026-05-12",
        group_id: "g-7",
      });
    });
  });

  describe("when the user cancels the confirmation", () => {
    it("should NOT call aptus.book_laundry", async () => {
      mockConfirm.mockResolvedValue(false);
      const hass = makeHass();
      const el = await mountSection(hass);
      clickAvailableCell(el);
      await flush();
      expect(hass.callService).not.toHaveBeenCalled();
    });
  });

  describe("the confirmation message", () => {
    it("should include the slot date and time", async () => {
      mockConfirm.mockResolvedValue(false);
      const hass = makeHass();
      const el = await mountSection(hass);
      clickAvailableCell(el);
      await Promise.resolve();
      const opts = mockConfirm.mock.calls[0][0];
      expect(opts.message).toContain("2026-05-12");
      expect(opts.message).toContain("08:30");
    });
  });

  describe("after a confirmed booking", () => {
    it("should dispatch aptus-booking-changed and refresh", async () => {
      mockConfirm.mockResolvedValue(true);
      const hass = makeHass();
      const el = await mountSection(hass);
      const send = hass.connection.sendMessagePromise as ReturnType<typeof vi.fn>;
      const initialFetchCount = send.mock.calls.length;
      const eventPromise = new Promise<Event>((resolve) =>
        el.addEventListener("aptus-booking-changed", resolve, { once: true })
      );
      clickAvailableCell(el);
      await eventPromise;
      await flush();
      expect(send.mock.calls.length).toBeGreaterThan(initialFetchCount);
    });
  });
});
