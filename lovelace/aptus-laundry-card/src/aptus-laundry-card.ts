import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type {
  AptusLaundryCardConfig,
  HomeAssistant,
  CalendarEvent,
} from "./types";
import { TIME_SLOTS } from "./types";

@customElement("aptus-laundry-card")
export class AptusLaundryCard extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config!: AptusLaundryCardConfig;
  @state() private _events: CalendarEvent[] = [];
  @state() private _bookDate = "";
  @state() private _bookSlot = "";
  @state() private _bookGroup = "";

  setConfig(config: AptusLaundryCardConfig): void {
    if (!config.calendar_entity) {
      throw new Error("Please define a calendar_entity");
    }
    this._config = config;
  }

  getCardSize(): number {
    return 3 + this._events.length;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this._fetchEvents();
  }

  updated(changed: Map<string, unknown>): void {
    if (changed.has("hass") && this.hass) {
      this._fetchEvents();
    }
  }

  private async _fetchEvents(): Promise<void> {
    if (!this.hass || !this._config) return;

    const now = new Date();
    const start = now.toISOString();
    const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const entity = this._config.calendar_entity;

    try {
      this._events = await this.hass.callApi<CalendarEvent[]>(
        "GET",
        `calendars/${entity}?start=${start}&end=${end}`
      );
    } catch {
      this._events = [];
    }
  }

  private _formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  private _formatDate(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  private _handleCancel(uid: string): void {
    this.hass.callService("aptus", "cancel_laundry", { booking_id: uid });
  }

  private _handleBook(): void {
    if (!this._bookDate || !this._bookSlot || !this._bookGroup) return;

    this.hass.callService("aptus", "book_laundry", {
      pass_no: parseInt(this._bookSlot, 10),
      pass_date: this._bookDate,
      group_id: this._bookGroup,
    });
  }

  private _renderBookingRow(event: CalendarEvent) {
    return html`
      <div class="booking-row">
        <div class="booking-info">
          <span class="booking-summary">${event.summary}</span>
          <span class="booking-time">
            ${this._formatDate(event.start)} ${this._formatTime(event.start)} – ${this._formatTime(event.end)}
          </span>
        </div>
        ${event.uid
          ? html`<button
              class="cancel-button"
              @click=${() => this._handleCancel(event.uid!)}
            >
              Cancel
            </button>`
          : nothing}
      </div>
    `;
  }

  private _renderBookingForm() {
    return html`
      <div class="booking-form">
        <h3 class="form-title">Book a slot</h3>
        <div class="form-fields">
          <input
            type="date"
            .value=${this._bookDate}
            @change=${(e: Event) => {
              this._bookDate = (e.target as HTMLInputElement).value;
            }}
          />
          <select
            class="slot-select"
            .value=${this._bookSlot}
            @change=${(e: Event) => {
              this._bookSlot = (e.target as HTMLSelectElement).value;
            }}
          >
            <option value="" disabled selected>Time slot</option>
            ${TIME_SLOTS.map(
              (slot) =>
                html`<option value=${slot.passNo}>${slot.label}</option>`
            )}
          </select>
          <input
            type="text"
            class="group-input"
            placeholder="Group ID"
            .value=${this._bookGroup}
            @input=${(e: Event) => {
              this._bookGroup = (e.target as HTMLInputElement).value;
            }}
          />
          <button class="book-button" @click=${this._handleBook}>
            Book
          </button>
        </div>
      </div>
    `;
  }

  render() {
    if (!this._config || !this.hass) return nothing;

    return html`
      <ha-card>
        ${this._config.title
          ? html`<div class="card-header">${this._config.title}</div>`
          : nothing}
        <div class="card-content">
          ${this._events.length > 0
            ? this._events.map((e) => this._renderBookingRow(e))
            : html`<div class="empty-state">No upcoming bookings</div>`}
        </div>
        ${this._renderBookingForm()}
      </ha-card>
    `;
  }

  static styles = css`
    .card-header {
      padding: 16px 16px 0;
      font-size: 1.2em;
      font-weight: 500;
      color: var(--primary-text-color);
    }

    .card-content {
      padding: 16px;
    }

    .booking-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
    }

    .booking-row + .booking-row {
      border-top: 1px solid var(--divider-color, #e0e0e0);
    }

    .booking-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .booking-summary {
      font-size: 1em;
      color: var(--primary-text-color);
    }

    .booking-time {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }

    .empty-state {
      text-align: center;
      padding: 16px;
      color: var(--secondary-text-color);
      font-style: italic;
    }

    .cancel-button {
      background: var(--error-color, #db4437);
      color: #fff;
      border: none;
      border-radius: 4px;
      padding: 4px 12px;
      cursor: pointer;
      font-size: 0.85em;
    }

    .cancel-button:hover {
      opacity: 0.85;
    }

    .booking-form {
      padding: 0 16px 16px;
      border-top: 1px solid var(--divider-color, #e0e0e0);
    }

    .form-title {
      margin: 12px 0 8px;
      font-size: 0.95em;
      font-weight: 500;
      color: var(--primary-text-color);
    }

    .form-fields {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }

    .form-fields input,
    .form-fields select {
      padding: 6px 8px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 4px;
      font-size: 0.9em;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
    }

    .form-fields input[type="date"] {
      flex: 1;
      min-width: 130px;
    }

    .slot-select {
      flex: 1;
      min-width: 140px;
    }

    .group-input {
      flex: 1;
      min-width: 100px;
    }

    .book-button {
      background: var(--primary-color, #03a9f4);
      color: var(--text-primary-color, #fff);
      border: none;
      border-radius: 4px;
      padding: 6px 16px;
      cursor: pointer;
      font-size: 0.9em;
    }

    .book-button:hover {
      opacity: 0.85;
    }
  `;
}

// Register with HA card picker
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: "aptus-laundry-card",
  name: "Aptus Laundry Card",
  description: "Card for viewing and managing Aptus laundry bookings",
  preview: true,
});
