import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { AptusLockCardConfig, HomeAssistant, HassEntity } from "../src/types";

function makeEntity(
  entityId: string,
  state: string,
  attributes: Partial<HassEntity["attributes"]> = {}
): HassEntity {
  return {
    entity_id: entityId,
    state,
    attributes: {
      friendly_name: entityId.replace("lock.", "").replace(/_/g, " "),
      ...attributes,
    },
  };
}

function makeHass(entities: HassEntity[]): HomeAssistant {
  const states: Record<string, HassEntity> = {};
  for (const e of entities) {
    states[e.entity_id] = e;
  }
  return {
    states,
    callService: vi.fn().mockResolvedValue(undefined),
  };
}

function createCard() {
  const el = document.createElement("aptus-lock-card");
  return el as HTMLElement & {
    setConfig(config: AptusLockCardConfig): void;
    hass: HomeAssistant;
    shadowRoot: ShadowRoot;
  };
}

async function renderCard(
  config: AptusLockCardConfig,
  hass: HomeAssistant
): Promise<ReturnType<typeof createCard>> {
  const card = createCard();
  card.setConfig(config);
  card.hass = hass;
  document.body.appendChild(card);
  await card.updateComplete;
  return card;
}

// Extend for Lit's updateComplete
declare global {
  interface HTMLElement {
    updateComplete: Promise<boolean>;
  }
}

describe("AptusLockCard", () => {
  beforeEach(async () => {
    document.body.innerHTML = "";
    await import("../src/aptus-lock-card");
  });

  describe("when configured with lock entities", () => {
    it("should render a row for each configured entity", async () => {
      const hass = makeHass([
        makeEntity("lock.entrance_front", "locked"),
        makeEntity("lock.entrance_back", "locked"),
      ]);

      const card = await renderCard(
        { type: "custom:aptus-lock-card", entities: ["lock.entrance_front", "lock.entrance_back"] },
        hass
      );

      const rows = card.shadowRoot!.querySelectorAll(".lock-row");
      expect(rows).toHaveLength(2);
    });

    it("should display the entity friendly name", async () => {
      const hass = makeHass([
        makeEntity("lock.entrance_front", "locked", { friendly_name: "Front Door" }),
      ]);

      const card = await renderCard(
        { type: "custom:aptus-lock-card", entities: ["lock.entrance_front"] },
        hass
      );

      const name = card.shadowRoot!.querySelector(".lock-name");
      expect(name?.textContent).toContain("Front Door");
    });

    it("should show locked state with a lock icon", async () => {
      const hass = makeHass([makeEntity("lock.entrance_front", "locked")]);

      const card = await renderCard(
        { type: "custom:aptus-lock-card", entities: ["lock.entrance_front"] },
        hass
      );

      const icon = card.shadowRoot!.querySelector("ha-icon");
      expect(icon?.getAttribute("icon")).toBe("mdi:lock");
    });

    it("should show unlocked state with an unlock icon", async () => {
      const hass = makeHass([makeEntity("lock.entrance_front", "unlocked")]);

      const card = await renderCard(
        { type: "custom:aptus-lock-card", entities: ["lock.entrance_front"] },
        hass
      );

      const icon = card.shadowRoot!.querySelector("ha-icon");
      expect(icon?.getAttribute("icon")).toBe("mdi:lock-open");
    });
  });

  describe("when the entity is locked", () => {
    it("should render a slide-to-unlock track", async () => {
      const hass = makeHass([makeEntity("lock.entrance_front", "locked")]);

      const card = await renderCard(
        { type: "custom:aptus-lock-card", entities: ["lock.entrance_front"] },
        hass
      );

      const slider = card.shadowRoot!.querySelector(".slider-track");
      expect(slider).not.toBeNull();

      const label = card.shadowRoot!.querySelector(".slider-label");
      expect(label?.textContent).toContain("Slide to unlock");
    });

    it("should not render the unlocked state", async () => {
      const hass = makeHass([makeEntity("lock.entrance_front", "locked")]);

      const card = await renderCard(
        { type: "custom:aptus-lock-card", entities: ["lock.entrance_front"] },
        hass
      );

      const unlocked = card.shadowRoot!.querySelector(".unlocked-state");
      expect(unlocked).toBeNull();
    });
  });

  describe("when the entity is unlocked", () => {
    it("should render the unlocked state indicator", async () => {
      const hass = makeHass([makeEntity("lock.entrance_front", "unlocked")]);

      const card = await renderCard(
        { type: "custom:aptus-lock-card", entities: ["lock.entrance_front"] },
        hass
      );

      const unlocked = card.shadowRoot!.querySelector(".unlocked-state");
      expect(unlocked).not.toBeNull();
      expect(unlocked?.textContent).toContain("Unlocked");
    });

    it("should not render the slider track", async () => {
      const hass = makeHass([makeEntity("lock.entrance_front", "unlocked")]);

      const card = await renderCard(
        { type: "custom:aptus-lock-card", entities: ["lock.entrance_front"] },
        hass
      );

      const slider = card.shadowRoot!.querySelector(".slider-track");
      expect(slider).toBeNull();
    });
  });

  describe("when an entity has a low battery", () => {
    it("should display a battery warning icon", async () => {
      const hass = makeHass([
        makeEntity("lock.apartment_door", "locked", { battery_low: true }),
      ]);

      const card = await renderCard(
        { type: "custom:aptus-lock-card", entities: ["lock.apartment_door"] },
        hass
      );

      const batteryIcon = card.shadowRoot!.querySelector(".battery-warning");
      expect(batteryIcon).not.toBeNull();
    });

    it("should not display a battery warning when battery is fine", async () => {
      const hass = makeHass([
        makeEntity("lock.apartment_door", "locked", { battery_low: false }),
      ]);

      const card = await renderCard(
        { type: "custom:aptus-lock-card", entities: ["lock.apartment_door"] },
        hass
      );

      const batteryIcon = card.shadowRoot!.querySelector(".battery-warning");
      expect(batteryIcon).toBeNull();
    });
  });

  describe("when the card title is configured", () => {
    it("should display the title in the card header", async () => {
      const hass = makeHass([makeEntity("lock.entrance_front", "locked")]);

      const card = await renderCard(
        { type: "custom:aptus-lock-card", entities: ["lock.entrance_front"], title: "Door Locks" },
        hass
      );

      const header = card.shadowRoot!.querySelector(".card-header");
      expect(header?.textContent).toContain("Door Locks");
    });

    it("should not render a header when no title is set", async () => {
      const hass = makeHass([makeEntity("lock.entrance_front", "locked")]);

      const card = await renderCard(
        { type: "custom:aptus-lock-card", entities: ["lock.entrance_front"] },
        hass
      );

      const header = card.shadowRoot!.querySelector(".card-header");
      expect(header).toBeNull();
    });
  });

  describe("when an entity is missing from hass states", () => {
    it("should render an unavailable row", async () => {
      const hass = makeHass([]);

      const card = await renderCard(
        { type: "custom:aptus-lock-card", entities: ["lock.nonexistent"] },
        hass
      );

      const row = card.shadowRoot!.querySelector(".lock-row");
      expect(row?.classList.contains("unavailable")).toBe(true);
    });
  });

  describe("unlock countdown animation", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    async function slideToUnlock(card: ReturnType<typeof createCard>, entityId: string) {
      const track = card.shadowRoot!.querySelector(".slider-track") as HTMLElement;
      // Simulate touch slide past 85%
      Object.defineProperty(track, "offsetWidth", { value: 300, configurable: true });
      track.dispatchEvent(new TouchEvent("touchstart", {
        touches: [{ clientX: 0 } as Touch],
      }));
      track.dispatchEvent(new TouchEvent("touchmove", {
        touches: [{ clientX: 260 } as Touch],
      }));
      track.dispatchEvent(new TouchEvent("touchend"));
      await card.updateComplete;
    }

    it("should call hass.callService when slide completes past 85%", async () => {
      const hass = makeHass([makeEntity("lock.entrance", "locked")]);
      const card = await renderCard(
        { type: "custom:aptus-lock-card", entities: ["lock.entrance"] },
        hass
      );

      await slideToUnlock(card, "lock.entrance");

      expect(hass.callService).toHaveBeenCalledWith(
        "lock", "unlock", {}, { entity_id: "lock.entrance" }
      );
    });

    it("should show completing state with thumb snapped to end", async () => {
      const hass = makeHass([makeEntity("lock.entrance", "locked")]);
      const card = await renderCard(
        { type: "custom:aptus-lock-card", entities: ["lock.entrance"] },
        hass
      );

      await slideToUnlock(card, "lock.entrance");

      const track = card.shadowRoot!.querySelector(".slider-track.completing");
      expect(track).not.toBeNull();
    });

    it("should enter countdown state after completing phase", async () => {
      const hass = makeHass([makeEntity("lock.entrance", "locked")]);
      const card = await renderCard(
        { type: "custom:aptus-lock-card", entities: ["lock.entrance"] },
        hass
      );

      await slideToUnlock(card, "lock.entrance");

      // Advance past the completing phase (300ms)
      vi.advanceTimersByTime(300);
      await card.updateComplete;

      const countdown = card.shadowRoot!.querySelector(".unlocked-countdown");
      expect(countdown).not.toBeNull();

      const bar = card.shadowRoot!.querySelector(".countdown-bar");
      expect(bar).not.toBeNull();
    });

    it("should show unlocked label during countdown", async () => {
      const hass = makeHass([makeEntity("lock.entrance", "locked")]);
      const card = await renderCard(
        { type: "custom:aptus-lock-card", entities: ["lock.entrance"] },
        hass
      );

      await slideToUnlock(card, "lock.entrance");
      vi.advanceTimersByTime(300);
      await card.updateComplete;

      const label = card.shadowRoot!.querySelector(".countdown-label");
      expect(label?.textContent).toContain("Unlocked");
    });

    it("should return to locked slider after countdown duration", async () => {
      const hass = makeHass([makeEntity("lock.entrance", "locked")]);
      const card = await renderCard(
        { type: "custom:aptus-lock-card", entities: ["lock.entrance"] },
        hass
      );

      await slideToUnlock(card, "lock.entrance");

      // Advance past completing (300ms) + countdown (5000ms)
      vi.advanceTimersByTime(5300);
      await card.updateComplete;

      const countdown = card.shadowRoot!.querySelector(".unlocked-countdown");
      expect(countdown).toBeNull();

      const slider = card.shadowRoot!.querySelector(".slider-track");
      expect(slider).not.toBeNull();
    });

    it("should clear countdown early when backend state returns to locked", async () => {
      const hass = makeHass([makeEntity("lock.entrance", "locked")]);
      const card = await renderCard(
        { type: "custom:aptus-lock-card", entities: ["lock.entrance"] },
        hass
      );

      await slideToUnlock(card, "lock.entrance");
      vi.advanceTimersByTime(300);
      await card.updateComplete;

      // Backend state returns to locked
      card.hass = makeHass([makeEntity("lock.entrance", "locked")]);
      await card.updateComplete;

      const countdown = card.shadowRoot!.querySelector(".unlocked-countdown");
      expect(countdown).toBeNull();
    });

    it("should use custom unlock_duration from config", async () => {
      const hass = makeHass([makeEntity("lock.entrance", "locked")]);
      const card = await renderCard(
        { type: "custom:aptus-lock-card", entities: ["lock.entrance"], unlock_duration: 3 },
        hass
      );

      await slideToUnlock(card, "lock.entrance");
      vi.advanceTimersByTime(300);
      await card.updateComplete;

      const countdown = card.shadowRoot!.querySelector(".unlocked-countdown") as HTMLElement;
      expect(countdown?.style.getPropertyValue("--countdown-duration")).toBe("3s");
    });

    it("should clear timers on disconnect", async () => {
      const hass = makeHass([makeEntity("lock.entrance", "locked")]);
      const card = await renderCard(
        { type: "custom:aptus-lock-card", entities: ["lock.entrance"] },
        hass
      );

      await slideToUnlock(card, "lock.entrance");
      vi.advanceTimersByTime(300);
      await card.updateComplete;

      // Remove card from DOM
      card.remove();

      // Advance past countdown - should not throw
      vi.advanceTimersByTime(5000);
    });
  });

  describe("when setConfig is called with invalid config", () => {
    it("should throw if entities is missing", async () => {
      await import("../src/aptus-lock-card");
      const card = createCard();

      expect(() => {
        card.setConfig({ type: "custom:aptus-lock-card" } as AptusLockCardConfig);
      }).toThrow();
    });

    it("should throw if entities is empty", async () => {
      await import("../src/aptus-lock-card");
      const card = createCard();

      expect(() => {
        card.setConfig({ type: "custom:aptus-lock-card", entities: [] });
      }).toThrow();
    });
  });
});
