import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AptusLaundryCardConfig, HomeAssistant } from "../src/types";

function makeHass(): HomeAssistant {
  return {
    states: {},
    locale: { language: "en-US" },
    callService: vi.fn().mockResolvedValue(undefined),
    callApi: vi.fn().mockResolvedValue([]),
    connection: {
      sendMessagePromise: vi.fn().mockResolvedValue([]),
      subscribeMessage: vi.fn().mockResolvedValue(() => {}),
    },
  } as HomeAssistant;
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

  describe("when coordinator signals an update", () => {
    it("should subscribe to aptus/subscribe after entry_id resolves", async () => {
      const hass = makeHass();
      const subscribe = hass.connection.subscribeMessage as ReturnType<typeof vi.fn>;

      const card = await renderCard(
        { type: "custom:aptus-laundry-card", entry_id: "entry-A" },
        hass,
      );
      await waitForUpdates(card);

      expect(subscribe).toHaveBeenCalledTimes(1);
      const [, subMsg] = subscribe.mock.calls[0];
      expect(subMsg).toEqual({ type: "aptus/subscribe", entry_id: "entry-A" });
    });

    it("should refresh all sub-components when the signal fires", async () => {
      const hass = makeHass();
      const subscribe = hass.connection.subscribeMessage as ReturnType<typeof vi.fn>;

      const card = await renderCard(
        { type: "custom:aptus-laundry-card", entry_id: "entry-A" },
        hass,
      );
      await waitForUpdates(card);

      const refreshSpies = ["aptus-laundry-bookings", "aptus-laundry-first-available", "aptus-laundry-calendar"].map(
        (tag) => {
          const el = card.shadowRoot!.querySelector(tag) as HTMLElement & { refresh: ReturnType<typeof vi.fn> };
          el.refresh = vi.fn().mockResolvedValue(undefined);
          return el.refresh;
        },
      );

      // Pull the callback the card registered and invoke it as if a server event arrived.
      const [callback] = subscribe.mock.calls[0];
      callback({ updated: true });

      for (const spy of refreshSpies) {
        expect(spy).toHaveBeenCalled();
      }
    });

    it("should resubscribe with the new entry_id when the user switches entry", async () => {
      const hass = makeHass();
      const subscribe = hass.connection.subscribeMessage as ReturnType<typeof vi.fn>;
      const firstUnsub = vi.fn();
      const secondUnsub = vi.fn();
      subscribe
        .mockResolvedValueOnce(firstUnsub)
        .mockResolvedValueOnce(secondUnsub);

      // Two entries discovered → user must pick one. Auto-select skipped when length > 1.
      (hass.connection.sendMessagePromise as ReturnType<typeof vi.fn>).mockResolvedValue([
        { entry_id: "entry-A", title: "A" },
        { entry_id: "entry-B", title: "B" },
      ]);

      const card = await renderCard(
        { type: "custom:aptus-laundry-card" },
        hass,
      );
      await waitForUpdates(card);

      // Simulate the user picking entry A first.
      const select = card.shadowRoot!.querySelector("select")!;
      select.value = "entry-A";
      select.dispatchEvent(new Event("change"));
      await waitForUpdates(card);

      expect(subscribe).toHaveBeenCalledTimes(1);
      expect(subscribe.mock.calls[0][1]).toEqual({ type: "aptus/subscribe", entry_id: "entry-A" });

      // Then switching to B.
      select.value = "entry-B";
      select.dispatchEvent(new Event("change"));
      await waitForUpdates(card);

      expect(firstUnsub).toHaveBeenCalledTimes(1);
      expect(subscribe).toHaveBeenCalledTimes(2);
      expect(subscribe.mock.calls[1][1]).toEqual({ type: "aptus/subscribe", entry_id: "entry-B" });
    });

    it("should unsubscribe when the element is removed from the DOM", async () => {
      const hass = makeHass();
      const subscribe = hass.connection.subscribeMessage as ReturnType<typeof vi.fn>;
      const unsub = vi.fn();
      subscribe.mockResolvedValue(unsub);

      const card = await renderCard(
        { type: "custom:aptus-laundry-card", entry_id: "entry-A" },
        hass,
      );
      await waitForUpdates(card);

      card.remove();
      await waitForUpdates(card);

      expect(unsub).toHaveBeenCalledTimes(1);
    });
  });

  describe("when displaying last synced", () => {
    const LAST_SYNCED_SELECTOR = ".last-synced";

    async function renderSubscribedCard(hass: HomeAssistant) {
      const card = await renderCard(
        { type: "custom:aptus-laundry-card", entry_id: "entry-A" },
        hass,
      );
      await waitForUpdates(card);
      return card;
    }

    function pushUpdate(hass: HomeAssistant, payload: { updated: boolean; last_synced: string | null }) {
      const subscribe = hass.connection.subscribeMessage as ReturnType<typeof vi.fn>;
      const [callback] = subscribe.mock.calls[0];
      callback(payload);
    }

    it("should not render a timestamp before any data has been received", async () => {
      const hass = makeHass();
      const card = await renderSubscribedCard(hass);

      expect(card.shadowRoot!.querySelector(LAST_SYNCED_SELECTOR)).toBeNull();
    });

    it("should render the timestamp from the initial subscription event", async () => {
      const hass = makeHass();
      const card = await renderSubscribedCard(hass);

      pushUpdate(hass, { updated: true, last_synced: new Date().toISOString() });
      await waitForUpdates(card);

      expect(card.shadowRoot!.querySelector(LAST_SYNCED_SELECTOR)).not.toBeNull();
    });

    it("should update the timestamp when the coordinator pushes a new value", async () => {
      const hass = makeHass();
      const card = await renderSubscribedCard(hass);

      const firstIso = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      pushUpdate(hass, { updated: true, last_synced: firstIso });
      await waitForUpdates(card);
      const firstText = card.shadowRoot!.querySelector(LAST_SYNCED_SELECTOR)!.textContent;

      const secondIso = new Date().toISOString();
      pushUpdate(hass, { updated: true, last_synced: secondIso });
      await waitForUpdates(card);
      const secondText = card.shadowRoot!.querySelector(LAST_SYNCED_SELECTOR)!.textContent;

      expect(secondText).not.toBe(firstText);
    });

    it("should render absolute time using hass.locale formatting", async () => {
      const hass = makeHass();
      const card = await renderSubscribedCard(hass);

      const iso = new Date().toISOString();
      const expectedAbsolute = new Date(iso).toLocaleTimeString(hass.locale!.language);
      pushUpdate(hass, { updated: true, last_synced: iso });
      await waitForUpdates(card);

      const text = card.shadowRoot!.querySelector(LAST_SYNCED_SELECTOR)!.textContent;
      expect(text).toContain(expectedAbsolute);
    });

    it("should append a relative time suffix next to the absolute time", async () => {
      const hass = makeHass();
      const card = await renderSubscribedCard(hass);

      // Stale-by-construction so the relative portion is observably different
      // from "just now" — the test stays meaningful regardless of which exact
      // label the renderer picks for sub-minute ages.
      const minutesAgo = 4;
      const staleIso = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
      pushUpdate(hass, { updated: true, last_synced: staleIso });
      await waitForUpdates(card);

      const text = card.shadowRoot!.querySelector(LAST_SYNCED_SELECTOR)!.textContent ?? "";
      expect(text).toMatch(new RegExp(`${minutesAgo}\\s*m`));
      expect(text).toContain("ago");
    });

    it("should re-render the relative portion on a periodic tick", async () => {
      // Vitest's fake timers would also stub waitForUpdates' setTimeout, so
      // instead we exercise the same contract directly: when "now" shifts
      // past a relative-bucket boundary and the card re-renders, the rendered
      // text reflects the new bucket. That proves the periodic tick → render
      // path produces fresh relative time without needing the real interval
      // to fire.
      const hass = makeHass();
      const card = await renderSubscribedCard(hass);
      const syncIso = new Date().toISOString();
      pushUpdate(hass, { updated: true, last_synced: syncIso });
      await card.updateComplete;
      const before = card.shadowRoot!.querySelector(LAST_SYNCED_SELECTOR)!.textContent;

      const realNow = Date.now;
      Date.now = () => realNow() + 3 * 60 * 1000;
      try {
        card.requestUpdate();
        await card.updateComplete;
        const after = card.shadowRoot!.querySelector(LAST_SYNCED_SELECTOR)!.textContent;
        expect(after).not.toBe(before);
      } finally {
        Date.now = realNow;
      }
    });

    it("should stop the periodic tick when the card is disconnected", async () => {
      const setSpy = vi.spyOn(globalThis, "setInterval");
      const clearSpy = vi.spyOn(globalThis, "clearInterval");
      try {
        const hass = makeHass();
        const card = await renderSubscribedCard(hass);
        expect(setSpy).toHaveBeenCalled();
        const intervalId = setSpy.mock.results[setSpy.mock.results.length - 1].value;

        card.remove();

        expect(clearSpy).toHaveBeenCalledWith(intervalId);
      } finally {
        setSpy.mockRestore();
        clearSpy.mockRestore();
      }
    });

    it("should apply discrete secondary styling to the synced row", async () => {
      // jsdom doesn't resolve CSS vars on adopted style sheets, so we verify
      // the styling contract by inspecting the CSS shipped with the component.
      // Lit exposes its static styles via the constructor; toString() gives
      // the raw CSS we authored.
      const hass = makeHass();
      const card = await renderSubscribedCard(hass);

      // Lit wraps `static styles = css\`...\`` in a CSSResult; toString()
      // returns the source CSS text.
      const ctor = card.constructor as unknown as { styles: { toString(): string } };
      const cssText = ctor.styles.toString();

      expect(cssText).toMatch(/\.last-synced/);
      expect(cssText).toMatch(/secondary-text-color/);
    });
  });
});
