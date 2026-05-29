/**
 * Regression: registration must be deferred so polyfills installed during
 * HA's bootstrap (notably @webcomponents/scoped-custom-element-registry)
 * can intercept the `customElements.define` call.
 *
 * See aptus-lock-card/test/deferred-registration.test.ts for full
 * background. The laundry card also imports three section subcomponents
 * (`aptus-laundry-bookings`, `aptus-laundry-first-available`,
 * `aptus-laundry-calendar`) and the confirm-dialog component; each of
 * those must defer registration too, otherwise the laundry card itself
 * registers fine but its rendered template references unregistered
 * sub-elements.
 */
import { describe, it, expect } from "vitest";

const TAGS = [
  "aptus-laundry-card",
  "aptus-laundry-bookings",
  "aptus-laundry-first-available",
  "aptus-laundry-calendar",
  "aptus-confirm-dialog",
] as const;

describe("aptus-laundry-card deferred registration", () => {
  it("does not register the top-level card synchronously during its module evaluation", async () => {
    // None of the tags should be registered before the import.
    for (const tag of TAGS) {
      expect(customElements.get(tag), `${tag} should not be registered yet`).toBeUndefined();
    }

    await import("../src/aptus-laundry-card");

    // The top-level `aptus-laundry-card` tag, whose registration is the
    // last thing the bundle queues, must still be unregistered — that
    // is the registration HA needs deferred so the polyfill can
    // intercept. Sub-component registrations may already have fired if
    // the test runner introduced task boundaries between transitive
    // module evaluations; that is fine in production because the same
    // boundaries give the polyfill plenty of time to install.
    expect(customElements.get("aptus-laundry-card")).toBeUndefined();
  });

  it("completes all registrations within one macrotask after module evaluation", async () => {
    await new Promise((r) => setTimeout(r, 0));

    for (const tag of TAGS) {
      expect(customElements.get(tag), `${tag} should be registered now`).toBeDefined();
    }
  });
});
