import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type {
  AptusLaundryCardConfig,
  AptusEntry,
  HomeAssistant,
  SectionConfig,
} from "./types";
import { DEFAULT_SECTIONS } from "./types";
import { fetchEntries } from "./api";
import "./sections/my-bookings";
import "./sections/first-available";
import "./sections/calendar";

@customElement("aptus-laundry-card")
export class AptusLaundryCard extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .entry-select {
      padding: 8px 16px;
    }
    .entry-select select {
      width: 100%;
      padding: 6px 8px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 4px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
      font-size: 14px;
    }
  `;

  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config!: AptusLaundryCardConfig;
  @state() private _entries: AptusEntry[] = [];
  @state() private _selectedEntryId: string | null = null;
  private _sections: SectionConfig[] = DEFAULT_SECTIONS;
  private _entriesLoaded = false;

  setConfig(config: AptusLaundryCardConfig): void {
    this._config = config;
    this._sections = config.sections ?? DEFAULT_SECTIONS;
  }

  getCardSize(): number {
    return 3 + this._sections.length * 3;
  }

  private _onBookingChanged = (): void => {
    const selectors =
      "aptus-laundry-bookings, aptus-laundry-first-available, aptus-laundry-calendar";
    this.shadowRoot?.querySelectorAll(selectors).forEach((el) => {
      if ("refresh" in el && typeof (el as any).refresh === "function") {  // eslint-disable-line @typescript-eslint/no-explicit-any
        (el as any).refresh();  // eslint-disable-line @typescript-eslint/no-explicit-any
      }
    });
  };

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener("aptus-booking-changed", this._onBookingChanged);
    this._loadEntries();
  }

  disconnectedCallback(): void {
    this.removeEventListener("aptus-booking-changed", this._onBookingChanged);
    super.disconnectedCallback();
  }

  private async _loadEntries(): Promise<void> {
    if (this._entriesLoaded) return;
    try {
      this._entries = await fetchEntries(this.hass);
      if (this._entries.length === 1) {
        this._selectedEntryId = this._entries[0].entry_id;
      }
      this._entriesLoaded = true;
    } catch {
      this._entries = [];
    }
  }

  private _onEntrySelect(e: Event): void {
    this._selectedEntryId = (e.target as HTMLSelectElement).value;
  }

  private _renderSection(section: SectionConfig) {
    const entryId = this._selectedEntryId!;
    switch (section.type) {
      case "my-bookings":
        return html`<aptus-laundry-bookings
          .hass=${this.hass}
          .entryId=${entryId}
        ></aptus-laundry-bookings>`;
      case "first-available":
        return html`<aptus-laundry-first-available
          .hass=${this.hass}
          .entryId=${entryId}
          .count=${this._config.first_available_count ?? 10}
        ></aptus-laundry-first-available>`;
      case "calendar":
        return html`<aptus-laundry-calendar
          .hass=${this.hass}
          .entryId=${entryId}
        ></aptus-laundry-calendar>`;
    }
  }

  render() {
    if (!this._config || !this.hass) return html``;

    return html`
      <ha-card>
        ${this._config.title
          ? html`<div class="card-header">${this._config.title}</div>`
          : ""}
        ${this._entries.length > 1
          ? html`
              <div class="entry-select">
                <select @change=${this._onEntrySelect}>
                  <option value="" disabled ?selected=${!this._selectedEntryId}>
                    Select account...
                  </option>
                  ${this._entries.map(
                    (e) => html`
                      <option
                        value=${e.entry_id}
                        ?selected=${e.entry_id === this._selectedEntryId}
                      >
                        ${e.title}
                      </option>
                    `
                  )}
                </select>
              </div>
            `
          : ""}
        ${this._selectedEntryId
          ? this._sections.map((s) => this._renderSection(s))
          : this._entries.length > 1
            ? html`<div style="padding: 16px; color: var(--secondary-text-color)">
                Select an account above
              </div>`
            : html`<div style="padding: 16px; color: var(--secondary-text-color)">
                Loading...
              </div>`}
      </ha-card>
    `;
  }

  static getStubConfig() {
    return {
      title: "Laundry",
      sections: DEFAULT_SECTIONS,
    };
  }
}

// Register with HA card picker
(window as any).customCards = (window as any).customCards || [];  // eslint-disable-line @typescript-eslint/no-explicit-any
(window as any).customCards.push({  // eslint-disable-line @typescript-eslint/no-explicit-any
  type: "aptus-laundry-card",
  name: "Aptus Laundry Card",
  description: "Manage laundry bookings via Aptus portal",
});
