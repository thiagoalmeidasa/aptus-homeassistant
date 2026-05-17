/**
 * Regression: custom-element load race.
 *
 * On slow devices the dashboard renders before the card bundle finishes
 * loading. HA Lovelace does:
 *
 *   const el = document.createElement("aptus-lock-card");
 *   el.setConfig(config);   // throws "setConfig is not a function"
 *
 * and replaces the card with hui-error-card → user sees "Configuration error".
 *
 * This file DOES NOT pre-import the card module in beforeEach — it explicitly
 * exercises the unregistered-then-upgraded sequence. Kept in a separate file
 * so the import is gated behind the test body and doesn't leak across files.
 */
import { describe, it, expect } from "vitest";

describe("aptus-lock-card load race", () => {
  it("creating the element before the module loads leaves setConfig undefined", () => {
    // Sanity: the tag must not be registered yet.
    expect(customElements.get("aptus-lock-card")).toBeUndefined();

    const el = document.createElement("aptus-lock-card") as HTMLElement & {
      setConfig?: (c: unknown) => void;
    };

    // This is exactly what HA Lovelace does next, and it's what blows up.
    expect(typeof el.setConfig).toBe("undefined");
    expect(() => el.setConfig!({ entities: ["lock.x"] })).toThrow(TypeError);
  });

  it("the element auto-upgrades and setConfig works after the module loads", async () => {
    // Create BEFORE import — same race the user hits on slow phones.
    const el = document.createElement("aptus-lock-card") as HTMLElement & {
      setConfig?: (c: unknown) => void;
      updateComplete?: Promise<boolean>;
    };
    document.body.appendChild(el);

    expect(typeof el.setConfig).toBe("undefined");

    // Module loads → customElements.define runs → browser upgrades el in place.
    await import("../src/aptus-lock-card");
    expect(customElements.get("aptus-lock-card")).toBeDefined();

    // After upgrade the same instance now has setConfig.
    expect(typeof el.setConfig).toBe("function");
    expect(() => el.setConfig!({ entities: ["lock.x"] })).not.toThrow();
  });
});
