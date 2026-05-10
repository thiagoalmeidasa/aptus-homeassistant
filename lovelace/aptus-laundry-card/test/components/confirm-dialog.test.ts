import { describe, it, expect, beforeEach } from "vitest";
import { confirmDialog } from "../../src/components/confirm-dialog";

declare global {
  interface HTMLElement {
    updateComplete: Promise<boolean>;
  }
}

async function getMounted(): Promise<HTMLElement> {
  for (let i = 0; i < 10; i++) {
    const el = document.body.querySelector("aptus-confirm-dialog") as HTMLElement | null;
    if (el && el.shadowRoot && el.shadowRoot.querySelector("dialog")) {
      await el.updateComplete;
      return el;
    }
    await new Promise((r) => setTimeout(r, 5));
  }
  throw new Error("dialog never mounted");
}

async function waitFor(check: () => boolean, label = "condition"): Promise<void> {
  for (let i = 0; i < 20; i++) {
    if (check()) return;
    await new Promise((r) => setTimeout(r, 5));
  }
  throw new Error(`timeout waiting for ${label}`);
}

describe("confirmDialog", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  describe("when shown with a title and message", () => {
    it("should render the title, message, and both buttons", async () => {
      const promise = confirmDialog({
        title: "Book slot?",
        message: "2026-05-12 · 08:30 – 11:00",
      });
      const el = await getMounted();
      const root = el.shadowRoot!;
      expect(root.textContent).toContain("Book slot?");
      expect(root.textContent).toContain("2026-05-12 · 08:30 – 11:00");
      expect(root.querySelector(".btn-confirm")).not.toBeNull();
      expect(root.querySelector(".btn-cancel")).not.toBeNull();
      (root.querySelector(".btn-cancel") as HTMLButtonElement).click();
      await promise;
    });
  });

  describe("when the user clicks confirm", () => {
    it("should resolve the promise with true", async () => {
      const promise = confirmDialog({ title: "T", message: "M" });
      const el = await getMounted();
      (el.shadowRoot!.querySelector(".btn-confirm") as HTMLButtonElement).click();
      await expect(promise).resolves.toBe(true);
    });
  });

  describe("when the user clicks cancel", () => {
    it("should resolve the promise with false", async () => {
      const promise = confirmDialog({ title: "T", message: "M" });
      const el = await getMounted();
      (el.shadowRoot!.querySelector(".btn-cancel") as HTMLButtonElement).click();
      await expect(promise).resolves.toBe(false);
    });
  });

  describe("when the dialog is dismissed via Escape", () => {
    it("should resolve with false", async () => {
      const promise = confirmDialog({ title: "T", message: "M" });
      const el = await getMounted();
      const dialog = el.shadowRoot!.querySelector("dialog") as HTMLDialogElement;
      dialog.dispatchEvent(new Event("cancel"));
      if (typeof dialog.close === "function" && dialog.open) dialog.close();
      await expect(promise).resolves.toBe(false);
    });
  });

  describe("when destructive: true is passed", () => {
    it("should apply destructive styling to the confirm button", async () => {
      const promise = confirmDialog({
        title: "T",
        message: "M",
        destructive: true,
      });
      const el = await getMounted();
      const btn = el.shadowRoot!.querySelector(".btn-confirm") as HTMLElement;
      expect(btn.classList.contains("destructive")).toBe(true);
      btn.click();
      await promise;
    });
  });

  describe("after the dialog closes", () => {
    it("should remove itself from the DOM", async () => {
      const promise = confirmDialog({ title: "T", message: "M" });
      const el = await getMounted();
      (el.shadowRoot!.querySelector(".btn-cancel") as HTMLButtonElement).click();
      await promise;
      await waitFor(
        () => !document.body.querySelector("aptus-confirm-dialog"),
        "dialog removal"
      );
      expect(document.body.querySelector("aptus-confirm-dialog")).toBeNull();
    });
  });
});
