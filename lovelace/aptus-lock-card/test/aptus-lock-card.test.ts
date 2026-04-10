import { describe, it, expect, vi, beforeEach } from "vitest";
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
    // Dynamic import so custom element is registered
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

  describe("when the user taps the unlock button", () => {
    it("should call the lock.unlock service for a locked entity", async () => {
      const hass = makeHass([makeEntity("lock.entrance_front", "locked")]);

      const card = await renderCard(
        { type: "custom:aptus-lock-card", entities: ["lock.entrance_front"] },
        hass
      );

      const button = card.shadowRoot!.querySelector(".lock-button") as HTMLElement;
      button.click();

      expect(hass.callService).toHaveBeenCalledWith(
        "lock",
        "unlock",
        {},
        { entity_id: "lock.entrance_front" }
      );
    });

    it("should call the lock.lock service for an unlocked entity", async () => {
      const hass = makeHass([makeEntity("lock.entrance_front", "unlocked")]);

      const card = await renderCard(
        { type: "custom:aptus-lock-card", entities: ["lock.entrance_front"] },
        hass
      );

      const button = card.shadowRoot!.querySelector(".lock-button") as HTMLElement;
      button.click();

      expect(hass.callService).toHaveBeenCalledWith(
        "lock",
        "lock",
        {},
        { entity_id: "lock.entrance_front" }
      );
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
