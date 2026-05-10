import { LitElement, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { fetchBookings } from "../api";
import { sharedStyles } from "../styles";
import type { HomeAssistant, LaundryBooking } from "../types";
import { confirmDialog } from "../components/confirm-dialog";

@customElement("aptus-laundry-bookings")
export class AptusLaundryBookings extends LitElement {
  static styles = sharedStyles;

  @property({ attribute: false }) hass!: HomeAssistant;
  @property() entryId!: string;
  @state() private _bookings: LaundryBooking[] = [];
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
      this._bookings = await fetchBookings(this.hass, this.entryId);
    } catch {
      this._bookings = [];
    }
    this._loading = false;
  }

  private async _cancel(booking: LaundryBooking): Promise<void> {
    const detail = `${booking.date} · ${booking.start_time} – ${booking.end_time} · ${booking.group_name}`;
    const ok = await confirmDialog({
      title: "Cancel booking?",
      message: detail,
      confirmLabel: "Cancel booking",
      cancelLabel: "Keep",
      destructive: true,
    });
    if (!ok) return;
    await this.hass.callService("aptus", "cancel_laundry", {
      booking_id: booking.id,
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
                  <button class="btn-cancel" @click=${() => this._cancel(b)}>
                    Cancel
                  </button>
                </div>
              `
            )}
    `;
  }
}
