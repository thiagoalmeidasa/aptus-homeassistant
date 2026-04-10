import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { fetchFirstAvailable } from "../api";
import { sharedStyles } from "../styles";
import type { HomeAssistant, TimeSlot } from "../types";

@customElement("aptus-laundry-first-available")
export class AptusLaundryFirstAvailable extends LitElement {
  static styles = sharedStyles;

  @property({ attribute: false }) hass!: HomeAssistant;
  @property() entryId!: string;
  @property({ type: Number }) count = 10;
  @state() private _slots: TimeSlot[] = [];
  @state() private _loading = false;
  private _initialized = false;

  connectedCallback(): void {
    super.connectedCallback();
    if (!this._initialized) {
      this._initialized = true;
      this.refresh();
    }
  }

  async refresh(): Promise<void> {
    this._loading = true;
    try {
      this._slots = await fetchFirstAvailable(this.hass, this.entryId, this.count);
    } catch {
      this._slots = [];
    }
    this._loading = false;
  }

  private async _book(slot: TimeSlot): Promise<void> {
    await this.hass.callService("aptus", "book_laundry", {
      pass_no: slot.pass_no,
      pass_date: slot.date,
      group_id: slot.group_id,
    });
    this.dispatchEvent(
      new CustomEvent("aptus-booking-changed", { bubbles: true, composed: true })
    );
    await this.refresh();
  }

  render() {
    return html`
      <div class="section-header">First available</div>
      ${this._loading
        ? html`<div class="loading">Loading...</div>`
        : this._slots.length === 0
          ? html`<div class="empty">No available slots</div>`
          : this._slots.map(
              (s) => html`
                <div class="slot-row">
                  <div class="slot-info">
                    <span class="slot-date">${s.date}</span>
                    <span class="slot-time">${s.start_time} – ${s.end_time}</span>
                  </div>
                  <button class="btn-book" @click=${() => this._book(s)}>Book</button>
                </div>
              `
            )}
    `;
  }
}
