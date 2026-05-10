import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

export type ConfirmOpts = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

@customElement("aptus-confirm-dialog")
export class AptusConfirmDialog extends LitElement {
  static styles = css`
    dialog {
      border: none;
      border-radius: 8px;
      padding: 0;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
      max-width: 360px;
      width: calc(100vw - 32px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    }
    dialog::backdrop {
      background: rgba(0, 0, 0, 0.4);
    }
    .body {
      padding: 16px 20px 8px;
    }
    .title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--primary-text-color);
    }
    .message {
      font-size: 14px;
      color: var(--secondary-text-color);
      white-space: pre-wrap;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 12px 16px 16px;
    }
    button {
      cursor: pointer;
      border: none;
      border-radius: 4px;
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 500;
      font-family: inherit;
    }
    .btn-cancel {
      background: transparent;
      color: var(--primary-text-color);
    }
    .btn-cancel:hover {
      background: var(--divider-color);
    }
    .btn-confirm {
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
    }
    .btn-confirm.destructive {
      background: var(--error-color, #db4437);
      color: #fff;
    }
  `;

  @property({ attribute: false }) opts!: ConfirmOpts;
  private _resolve?: (v: boolean) => void;
  private _settled = false;

  setResolver(resolve: (v: boolean) => void): void {
    this._resolve = resolve;
  }

  firstUpdated(): void {
    const dialog = this.renderRoot.querySelector("dialog") as HTMLDialogElement;
    if (typeof dialog.showModal === "function") {
      try {
        dialog.showModal();
      } catch {
        dialog.setAttribute("open", "");
      }
    } else {
      dialog.setAttribute("open", "");
    }
    dialog.addEventListener("cancel", (e) => {
      e.preventDefault();
      this._settle(false);
    });
    dialog.addEventListener("close", () => this._cleanup());
  }

  private _settle(v: boolean): void {
    if (this._settled) return;
    this._settled = true;
    this._resolve?.(v);
    const dialog = this.renderRoot.querySelector("dialog") as HTMLDialogElement | null;
    if (dialog && typeof dialog.close === "function" && dialog.open) {
      dialog.close();
    } else {
      this._cleanup();
    }
  }

  private _cleanup(): void {
    if (!this._settled) {
      this._settled = true;
      this._resolve?.(false);
    }
    this.remove();
  }

  render() {
    const o = this.opts;
    const confirmClasses = `btn-confirm${o.destructive ? " destructive" : ""}`;
    return html`
      <dialog>
        <div class="body">
          <div class="title">${o.title}</div>
          <div class="message">${o.message}</div>
        </div>
        <div class="actions">
          <button class="btn-cancel" @click=${() => this._settle(false)}>
            ${o.cancelLabel ?? "Cancel"}
          </button>
          <button class=${confirmClasses} @click=${() => this._settle(true)}>
            ${o.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </dialog>
    `;
  }
}

export function confirmDialog(opts: ConfirmOpts): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const el = document.createElement("aptus-confirm-dialog") as AptusConfirmDialog;
    el.opts = opts;
    el.setResolver(resolve);
    document.body.appendChild(el);
  });
}
