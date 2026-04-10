import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AptusLaundryCardConfig, HomeAssistant } from "../src/types";

function makeHass(): HomeAssistant {
  return {
    states: {},
    callService: vi.fn().mockResolvedValue(undefined),
    callApi: vi.fn().mockResolvedValue([]),
    connection: {
      sendMessagePromise: vi.fn().mockResolvedValue([]),
    },
  };
}

function createCard() {
  const el = document.createElement("aptus-laundry-card");
  return el as HTMLElement & {
    setConfig(config: AptusLaundryCardConfig): void;
    hass: HomeAssistant;
    shadowRoot: ShadowRoot;
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
  return card;
}

declare global {
  interface HTMLElement {
    updateComplete: Promise<boolean>;
  }
}

async function waitForUpdates(card: HTMLElement, tries = 5): Promise<void> {
  for (let i = 0; i < tries; i++) {
    await card.updateComplete;
    await new Promise((r) => setTimeout(r, 10));
  }
}

describe("AptusLaundryCard", () => {
  beforeEach(async () => {
    document.body.innerHTML = "";
    await import("../src/aptus-laundry-card");
  });

  describe("when configured with default sections", () => {
    it("should render all three sections", async () => {
      const hass = makeHass();
      // Mock entries response for auto-select
      (hass.connection.sendMessagePromise as ReturnType<typeof vi.fn>).mockResolvedValue([
        { entry_id: "test-entry", title: "Aptus Test" },
      ]);

      const card = await renderCard(
        { type: "custom:aptus-laundry-card" },
        hass
      );
      await waitForUpdates(card);

      const bookings = card.shadowRoot!.querySelector("aptus-laundry-bookings");
      const firstAvailable = card.shadowRoot!.querySelector("aptus-laundry-first-available");
      const calendar = card.shadowRoot!.querySelector("aptus-laundry-calendar");

      expect(bookings).not.toBeNull();
      expect(firstAvailable).not.toBeNull();
      expect(calendar).not.toBeNull();
    });
  });

  describe("when configured with specific sections", () => {
    it("should render only the configured sections", async () => {
      const hass = makeHass();
      (hass.connection.sendMessagePromise as ReturnType<typeof vi.fn>).mockResolvedValue([
        { entry_id: "test-entry", title: "Aptus Test" },
      ]);

      const card = await renderCard(
        {
          type: "custom:aptus-laundry-card",
          sections: [{ type: "my-bookings" }],
        },
        hass
      );
      await waitForUpdates(card);

      const bookings = card.shadowRoot!.querySelector("aptus-laundry-bookings");
      const firstAvailable = card.shadowRoot!.querySelector("aptus-laundry-first-available");
      const calendar = card.shadowRoot!.querySelector("aptus-laundry-calendar");

      expect(bookings).not.toBeNull();
      expect(firstAvailable).toBeNull();
      expect(calendar).toBeNull();
    });
  });

  describe("when entry_id is set in config", () => {
    it("should skip entry discovery", async () => {
      const hass = makeHass();

      const card = await renderCard(
        {
          type: "custom:aptus-laundry-card",
          entry_id: "my-entry-id",
        },
        hass
      );

      // Should not call aptus/entries
      const calls = (hass.connection.sendMessagePromise as ReturnType<typeof vi.fn>).mock.calls;
      const entryCalls = calls.filter((c: unknown[]) => (c[0] as Record<string, unknown>).type === "aptus/entries");
      expect(entryCalls).toHaveLength(0);
    });
  });

  describe("when the card title is configured", () => {
    it("should display the title in the card header", async () => {
      const hass = makeHass();
      (hass.connection.sendMessagePromise as ReturnType<typeof vi.fn>).mockResolvedValue([
        { entry_id: "test-entry", title: "Aptus Test" },
      ]);

      const card = await renderCard(
        { type: "custom:aptus-laundry-card", title: "Laundry" },
        hass
      );

      const header = card.shadowRoot!.querySelector(".card-header");
      expect(header?.textContent).toContain("Laundry");
    });

    it("should not render a header when no title is set", async () => {
      const hass = makeHass();
      (hass.connection.sendMessagePromise as ReturnType<typeof vi.fn>).mockResolvedValue([
        { entry_id: "test-entry", title: "Aptus Test" },
      ]);

      const card = await renderCard(
        { type: "custom:aptus-laundry-card" },
        hass
      );

      const header = card.shadowRoot!.querySelector(".card-header");
      expect(header).toBeNull();
    });
  });
});
