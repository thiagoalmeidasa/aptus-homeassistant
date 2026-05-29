/**
 * Regression: registration must be deferred so polyfills installed during
 * HA's bootstrap (notably @webcomponents/scoped-custom-element-registry)
 * can intercept the `customElements.define` call.
 *
 * The polyfill replaces `window.customElements` after HA frontend modules
 * load. If our card bundle calls `customElements.define` synchronously
 * during module evaluation, the call lands on whatever `customElements`
 * is in place at the time — typically the native registry. When the
 * polyfill replaces `window.customElements` later, its internal Map does
 * not contain our registration, so `customElements.get(tag)` returns
 * undefined and HA renders `hui-error-card` with
 * "Custom element doesn't exist: aptus-lock-card".
 *
 * The fix is to defer `customElements.define` to the next macrotask via
 * `setTimeout(0)`, so the polyfill — which installs within the current
 * task — is reliably in place by the time we register.
 *
 * See issues/cold-load-race-investigation.md (H8) for the full diagnosis.
 *
 * This file is isolated from race.test.ts because once the module is
 * imported, the registration sticks for the rest of the jsdom realm and
 * subsequent tests cannot observe the "before define" state.
 */
import { describe, it, expect } from "vitest";

describe("aptus-lock-card deferred registration", () => {
  it("does not register the custom element synchronously during module evaluation", async () => {
    expect(customElements.get("aptus-lock-card")).toBeUndefined();

    const mod = await import("../src/aptus-lock-card");

    // Module exports the class, but registration is queued for a later
    // macrotask — the registry is still empty at this point.
    expect(mod.AptusLockCard).toBeDefined();
    expect(customElements.get("aptus-lock-card")).toBeUndefined();
  });

  it("completes registration within one macrotask after module evaluation", async () => {
    // Same realm as the previous test — the import has already happened
    // and a setTimeout(0) was queued. Yielding once is enough.
    await new Promise((r) => setTimeout(r, 0));

    const registered = customElements.get("aptus-lock-card");
    expect(registered).toBeDefined();
    // The registered constructor must be the class the module exported.
    const mod = await import("../src/aptus-lock-card");
    expect(registered).toBe(mod.AptusLockCard);
  });
});
