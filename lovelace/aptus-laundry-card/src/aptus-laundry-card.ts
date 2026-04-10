import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type {
  AptusLaundryCardConfig,
  HomeAssistant,
  SectionConfig,
} from "./types";
import { DEFAULT_SECTIONS } from "./types";
import "./sections/my-bookings";
import "./sections/first-available";
import "./sections/calendar";

@customElement("aptus-laundry-card")
export class AptusLaundryCard extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
  `;

  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config!: AptusLaundryCardConfig;
  private _sections: SectionConfig[] = DEFAULT_SECTIONS;

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
  }

  disconnectedCallback(): void {
    this.removeEventListener("aptus-booking-changed", this._onBookingChanged);
    super.disconnectedCallback();
  }

  private _renderSection(section: SectionConfig) {
    switch (section.type) {
      case "my-bookings":
        return html`<aptus-laundry-bookings
          .hass=${this.hass}
        ></aptus-laundry-bookings>`;
      case "first-available":
        return html`<aptus-laundry-first-available
          .hass=${this.hass}
          .count=${this._config.first_available_count ?? 10}
        ></aptus-laundry-first-available>`;
      case "calendar":
        return html`<aptus-laundry-calendar
          .hass=${this.hass}
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
        ${this._sections.map((s) => this._renderSection(s))}
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
