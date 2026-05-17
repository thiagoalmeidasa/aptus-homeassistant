/**
 * Regression: custom-element load race for the laundry card.
 * See aptus-lock-card/test/race.test.ts for full background.
 *
 * The laundry card overrides `connectedCallback` to kick off `_loadEntries`,
 * which reads `this._config`. If the element is attached to the DOM and the
 * module loads *before* `setConfig` is called, the browser-driven upgrade
 * fires `connectedCallback` with `_config === undefined` and the element
 * throws. That's the slow-device failure mode worth pinning down.
 */
import { describe, it, expect } from "vitest";

describe("aptus-laundry-card load race", () => {
  it("creating the element before the module loads leaves setConfig undefined", () => {
    expect(customElements.get("aptus-laundry-card")).toBeUndefined();

    const el = document.createElement("aptus-laundry-card") as HTMLElement & {
      setConfig?: (c: unknown) => void;
    };

    expect(typeof el.setConfig).toBe("undefined");
    expect(() => el.setConfig!({ entry_id: "x" })).toThrow(TypeError);
  });

  it("attach-then-upgrade does not crash when setConfig has not been called yet", async () => {
    // Reproduces the slow-device path: HA appends the placeholder element,
    // the module finishes downloading mid-frame, and the upgrade fires
    // connectedCallback before HA has had a chance to push config in.
    //
    // The bundle's `connectedCallback` calls `_loadEntries()` which reads
    // `this._config.entry_id` — undefined here — so the promise rejects.
    // Hooked at the process level because jsdom doesn't always route the
    // rejection through window listeners.
    const rejections: unknown[] = [];
    const onRejection = (reason: unknown) => rejections.push(reason);
    process.on("unhandledRejection", onRejection);

    const el = document.createElement("aptus-laundry-card") as HTMLElement & {
      setConfig?: (c: unknown) => void;
    };
    document.body.appendChild(el);

    try {
      await import("../src/aptus-laundry-card");
      // Give the upgrade-driven connectedCallback + its async _loadEntries a
      // few microtasks to settle so any rejection is observable.
      await new Promise((r) => setTimeout(r, 10));

      // After upgrade the element should be usable, not in a broken state.
      expect(typeof el.setConfig).toBe("function");
      expect(
        rejections,
        `connectedCallback rejected during upgrade: ${rejections.map(String).join(", ")}`,
      ).toEqual([]);
    } finally {
      process.off("unhandledRejection", onRejection);
    }
  });
});
