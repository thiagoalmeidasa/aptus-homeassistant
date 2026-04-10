import { LitElement, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { fetchBookings } from "../api";
import { sharedStyles } from "../styles";
import type { HomeAssistant, LaundryBooking } from "../types";

@customElement("aptus-laundry-bookings")
export class AptusLaundryBookings extends LitElement {
  static styles = sharedStyles;

  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _bookings: LaundryBooking[] = [];
  @state() private _loading = false;

  connectedCallback(): void {
    super.connectedCallback();
    this.refresh();
  }

  async refresh(): Promise<void> {
    this._loading = true;
    try {
      this._bookings = await fetchBookings(this.hass);
    } catch {
      this._bookings = [];
    }
    this._loading = false;
  }

  private async _cancel(bookingId: string): Promise<void> {
    await this.hass.callService("aptus", "cancel_laundry", {
      booking_id: bookingId,
    });
    this.dispatchEvent(
      new CustomEvent("aptus-booking-changed", { bubbles: true, composed: true })
    );
    await this.refresh();
  }

  render() {
    return html`
      <div class="section-header">My bookings</div>
      ${this._loading
        ? html`<div class="loading">Loading...</div>`
        : this._bookings.length === 0
          ? html`<div class="empty">No upcoming bookings</div>`
          : this._bookings.map(
              (b) => html`
                <div class="slot-row">
                  <div class="slot-info">
                    <span class="slot-date">${b.date}</span>
                    <span class="slot-time">${b.start_time} – ${b.end_time}</span>
                    <span class="slot-group">${b.group_name}</span>
                  </div>
                  <button class="btn-cancel" @click=${() => this._cancel(b.id)}>
                    Cancel
                  </button>
                </div>
              `
            )}
    `;
  }
}
