import { describe, it, expect, vi, beforeEach } from "vitest";
import type { HomeAssistant, LaundryBooking } from "../../src/types";

vi.mock("../../src/components/confirm-dialog", () => ({
  confirmDialog: vi.fn(),
}));

import { confirmDialog } from "../../src/components/confirm-dialog";
import "../../src/sections/my-bookings";

const mockConfirm = vi.mocked(confirmDialog);

declare global {
  interface HTMLElement {
    updateComplete: Promise<boolean>;
  }
}

const BOOKING: LaundryBooking = {
  id: "booking-42",
  group_name: "Block A",
  date: "2026-05-12",
  pass_no: 3,
  start_time: "08:30",
  end_time: "11:00",
};

function makeHass(bookings: LaundryBooking[]): HomeAssistant {
  return {
    states: {},
    callService: vi.fn().mockResolvedValue(undefined),
    callApi: vi.fn().mockResolvedValue([]),
    connection: {
      sendMessagePromise: vi.fn().mockResolvedValue(bookings),
    },
  };
}

async function mountSection(hass: HomeAssistant) {
  const el = document.createElement("aptus-laundry-bookings") as HTMLElement & {
    hass: HomeAssistant;
    entryId: string;
  };
  el.hass = hass;
  el.entryId = "entry-1";
  document.body.appendChild(el);
  for (let i = 0; i < 8; i++) {
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 5));
  }
  return el;
}

function clickCancel(el: HTMLElement): void {
  const btn = el.shadowRoot!.querySelector(".btn-cancel") as HTMLButtonElement;
  if (!btn) throw new Error("no Cancel button rendered");
  btn.click();
}

async function flush(): Promise<void> {
  for (let i = 0; i < 4; i++) {
    await new Promise((r) => setTimeout(r, 5));
  }
}

describe("AptusLaundryBookings cancel", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    mockConfirm.mockReset();
  });

  describe("when the user clicks Cancel", () => {
    it("should prompt for confirmation before calling the service", async () => {
      mockConfirm.mockResolvedValue(false);
      const hass = makeHass([BOOKING]);
      const el = await mountSection(hass);
      clickCancel(el);
      await Promise.resolve();
      expect(mockConfirm).toHaveBeenCalledTimes(1);
      expect(hass.callService).not.toHaveBeenCalled();
    });
  });

  describe("when the user confirms the cancellation", () => {
    it("should call aptus.cancel_laundry with the booking id", async () => {
      mockConfirm.mockResolvedValue(true);
      const hass = makeHass([BOOKING]);
      const el = await mountSection(hass);
      clickCancel(el);
      await flush();
      expect(hass.callService).toHaveBeenCalledWith("aptus", "cancel_laundry", {
        booking_id: "booking-42",
      });
    });
  });

  describe("when the user dismisses the confirmation", () => {
    it("should NOT call aptus.cancel_laundry", async () => {
      mockConfirm.mockResolvedValue(false);
      const hass = makeHass([BOOKING]);
      const el = await mountSection(hass);
      clickCancel(el);
      await flush();
      expect(hass.callService).not.toHaveBeenCalled();
    });
  });

  describe("the confirmation message", () => {
    it("should include the booking date, time and group", async () => {
      mockConfirm.mockResolvedValue(false);
      const hass = makeHass([BOOKING]);
      const el = await mountSection(hass);
      clickCancel(el);
      await Promise.resolve();
      const opts = mockConfirm.mock.calls[0][0];
      expect(opts.message).toContain("2026-05-12");
      expect(opts.message).toContain("08:30");
      expect(opts.message).toContain("Block A");
    });
  });

  describe("the confirmation styling", () => {
    it("should use destructive styling", async () => {
      mockConfirm.mockResolvedValue(false);
      const hass = makeHass([BOOKING]);
      const el = await mountSection(hass);
      clickCancel(el);
      await Promise.resolve();
      const opts = mockConfirm.mock.calls[0][0];
      expect(opts.destructive).toBe(true);
    });
  });

  describe("after a confirmed cancel", () => {
    it("should dispatch aptus-booking-changed and refresh", async () => {
      mockConfirm.mockResolvedValue(true);
      const hass = makeHass([BOOKING]);
      const el = await mountSection(hass);
      const send = hass.connection.sendMessagePromise as ReturnType<typeof vi.fn>;
      const initialFetchCount = send.mock.calls.length;
      const eventPromise = new Promise<Event>((resolve) =>
        el.addEventListener("aptus-booking-changed", resolve, { once: true })
      );
      clickCancel(el);
      await eventPromise;
      await flush();
      expect(send.mock.calls.length).toBeGreaterThan(initialFetchCount);
    });
  });
});
