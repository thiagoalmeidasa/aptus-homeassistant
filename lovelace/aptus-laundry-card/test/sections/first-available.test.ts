import { describe, it, expect, vi, beforeEach } from "vitest";
import type { HomeAssistant, TimeSlot } from "../../src/types";

vi.mock("../../src/components/confirm-dialog", () => ({
  confirmDialog: vi.fn(),
}));

import { confirmDialog } from "../../src/components/confirm-dialog";
import "../../src/sections/first-available";

const mockConfirm = vi.mocked(confirmDialog);

declare global {
  interface HTMLElement {
    updateComplete: Promise<boolean>;
  }
}

const SLOT: TimeSlot = {
  pass_no: 3,
  date: "2026-05-12",
  group_id: "g-7",
  state: "available",
  start_time: "08:30",
  end_time: "11:00",
  group_name: "Block A",
};

function makeHass(slots: TimeSlot[]): HomeAssistant {
  return {
    states: {},
    callService: vi.fn().mockResolvedValue(undefined),
    callApi: vi.fn().mockResolvedValue([]),
    connection: {
      sendMessagePromise: vi.fn().mockResolvedValue(slots),
    },
  };
}

async function mountSection(hass: HomeAssistant) {
  const el = document.createElement(
    "aptus-laundry-first-available"
  ) as HTMLElement & { hass: HomeAssistant; entryId: string };
  el.hass = hass;
  el.entryId = "entry-1";
  document.body.appendChild(el);
  for (let i = 0; i < 8; i++) {
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 5));
  }
  return el;
}

function clickBook(el: HTMLElement): void {
  const btn = el.shadowRoot!.querySelector(".btn-book") as HTMLButtonElement;
  if (!btn) throw new Error("no Book button rendered");
  btn.click();
}

async function flush(): Promise<void> {
  for (let i = 0; i < 4; i++) {
    await new Promise((r) => setTimeout(r, 5));
  }
}

describe("AptusLaundryFirstAvailable booking", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    mockConfirm.mockReset();
  });

  describe("when the user clicks Book", () => {
    it("should prompt for confirmation before calling the service", async () => {
      mockConfirm.mockResolvedValue(false);
      const hass = makeHass([SLOT]);
      const el = await mountSection(hass);
      clickBook(el);
      await Promise.resolve();
      expect(mockConfirm).toHaveBeenCalledTimes(1);
      expect(hass.callService).not.toHaveBeenCalled();
    });
  });

  describe("when the user confirms the booking", () => {
    it("should call aptus.book_laundry with pass_no, pass_date and group_id", async () => {
      mockConfirm.mockResolvedValue(true);
      const hass = makeHass([SLOT]);
      const el = await mountSection(hass);
      clickBook(el);
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
      const hass = makeHass([SLOT]);
      const el = await mountSection(hass);
      clickBook(el);
      await flush();
      expect(hass.callService).not.toHaveBeenCalled();
    });
  });

  describe("the confirmation message", () => {
    it("should include the slot date and time", async () => {
      mockConfirm.mockResolvedValue(false);
      const hass = makeHass([SLOT]);
      const el = await mountSection(hass);
      clickBook(el);
      await Promise.resolve();
      const opts = mockConfirm.mock.calls[0][0];
      expect(opts.message).toContain("2026-05-12");
      expect(opts.message).toContain("08:30");
    });
  });

  describe("after a confirmed booking", () => {
    it("should dispatch aptus-booking-changed and refresh", async () => {
      mockConfirm.mockResolvedValue(true);
      const hass = makeHass([SLOT]);
      const el = await mountSection(hass);
      const send = hass.connection.sendMessagePromise as ReturnType<typeof vi.fn>;
      const initialFetchCount = send.mock.calls.length;
      const eventPromise = new Promise<Event>((resolve) =>
        el.addEventListener("aptus-booking-changed", resolve, { once: true })
      );
      clickBook(el);
      await eventPromise;
      await flush();
      expect(send.mock.calls.length).toBeGreaterThan(initialFetchCount);
    });
  });
});
