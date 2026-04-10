import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { AptusLockCardConfig, HomeAssistant, HassEntity } from "./types";

@customElement("aptus-lock-card")
export class AptusLockCard extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config!: AptusLockCardConfig;

  setConfig(config: AptusLockCardConfig): void {
    if (!config.entities || config.entities.length === 0) {
      throw new Error("Please define at least one entity");
    }
    this._config = config;
  }

  getCardSize(): number {
    return (this._config?.entities?.length ?? 1) + (this._config?.title ? 1 : 0);
  }

  private _handleClick(entityId: string, isLocked: boolean): void {
    const service = isLocked ? "unlock" : "lock";
    this.hass.callService("lock", service, {}, { entity_id: entityId });
  }

  private _renderRow(entityId: string) {
    const entity: HassEntity | undefined = this.hass.states[entityId];

    if (!entity) {
      return html`
        <div class="lock-row unavailable">
          <ha-icon icon="mdi:lock-question"></ha-icon>
          <span class="lock-name">${entityId}</span>
          <span class="lock-state">Unavailable</span>
        </div>
      `;
    }

    const isLocked = entity.state === "locked";
    const icon = isLocked ? "mdi:lock" : "mdi:lock-open";
    const name = entity.attributes.friendly_name ?? entityId;
    const batteryLow = entity.attributes.battery_low === true;

    return html`
      <div class="lock-row">
        <ha-icon icon=${icon}></ha-icon>
        <span class="lock-name">${name}</span>
        ${batteryLow
          ? html`<ha-icon class="battery-warning" icon="mdi:battery-alert-variant-outline"></ha-icon>`
          : nothing}
        <button class="lock-button" @click=${() => this._handleClick(entityId, isLocked)}>
          ${isLocked ? "Unlock" : "Lock"}
        </button>
      </div>
    `;
  }

  render() {
    if (!this._config || !this.hass) {
      return nothing;
    }

    return html`
      <ha-card>
        ${this._config.title
          ? html`<div class="card-header">${this._config.title}</div>`
          : nothing}
        <div class="card-content">
          ${this._config.entities.map((id) => this._renderRow(id))}
        </div>
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

    .lock-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
    }

    .lock-row + .lock-row {
      border-top: 1px solid var(--divider-color, #e0e0e0);
    }

    .lock-row.unavailable {
      opacity: 0.5;
    }

    .lock-name {
      flex: 1;
      font-size: 1em;
      color: var(--primary-text-color);
    }

    .lock-state {
      font-size: 0.9em;
      color: var(--secondary-text-color);
    }

    .battery-warning {
      color: var(--warning-color, #ff9800);
    }

    .lock-button {
      background: var(--primary-color, #03a9f4);
      color: var(--text-primary-color, #fff);
      border: none;
      border-radius: 4px;
      padding: 6px 16px;
      cursor: pointer;
      font-size: 0.9em;
    }

    .lock-button:hover {
      opacity: 0.85;
    }

    ha-icon {
      color: var(--state-icon-color, #44739e);
      --mdc-icon-size: 24px;
    }
  `;
}

// Register with HA card picker
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: "aptus-lock-card",
  name: "Aptus Lock Card",
  description: "Card for controlling Aptus door locks",
  preview: true,
});
