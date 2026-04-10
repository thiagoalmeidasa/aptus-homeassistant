import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { AptusLockCardConfig, HomeAssistant, HassEntity } from "./types";

@customElement("aptus-lock-card")
export class AptusLockCard extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config!: AptusLockCardConfig;
  @state() private _sliding: string | null = null;
  @state() private _slideProgress: number = 0;

  private _startX = 0;
  private _trackWidth = 0;

  setConfig(config: AptusLockCardConfig): void {
    if (!config.entities || config.entities.length === 0) {
      throw new Error("Please define at least one entity");
    }
    this._config = config;
  }

  getCardSize(): number {
    return (this._config?.entities?.length ?? 1) + (this._config?.title ? 1 : 0);
  }

  private _onTouchStart(e: TouchEvent, entityId: string): void {
    const track = (e.currentTarget as HTMLElement);
    this._startX = e.touches[0].clientX;
    this._trackWidth = track.offsetWidth;
    this._sliding = entityId;
    this._slideProgress = 0;
  }

  private _onTouchMove(e: TouchEvent): void {
    if (!this._sliding) return;
    const dx = e.touches[0].clientX - this._startX;
    this._slideProgress = Math.max(0, Math.min(1, dx / (this._trackWidth - 48)));
  }

  private _onTouchEnd(): void {
    if (!this._sliding) return;
    if (this._slideProgress > 0.85) {
      this.hass.callService("lock", "unlock", {}, { entity_id: this._sliding });
    }
    this._sliding = null;
    this._slideProgress = 0;
  }

  private _onMouseDown(e: MouseEvent, entityId: string): void {
    const track = (e.currentTarget as HTMLElement);
    this._startX = e.clientX;
    this._trackWidth = track.offsetWidth;
    this._sliding = entityId;
    this._slideProgress = 0;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - this._startX;
      this._slideProgress = Math.max(0, Math.min(1, dx / (this._trackWidth - 48)));
    };
    const onUp = () => {
      if (this._slideProgress > 0.85) {
        this.hass.callService("lock", "unlock", {}, { entity_id: this._sliding! });
      }
      this._sliding = null;
      this._slideProgress = 0;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
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
    const isSliding = this._sliding === entityId;
    const thumbOffset = isSliding ? this._slideProgress * 100 : 0;

    return html`
      <div class="lock-row">
        <ha-icon icon=${icon}></ha-icon>
        <span class="lock-name">${name}</span>
        ${batteryLow
          ? html`<ha-icon class="battery-warning" icon="mdi:battery-alert-variant-outline"></ha-icon>`
          : nothing}
      </div>
      ${isLocked
        ? html`
            <div
              class="slider-track ${isSliding ? "sliding" : ""}"
              @touchstart=${(e: TouchEvent) => this._onTouchStart(e, entityId)}
              @touchmove=${this._onTouchMove}
              @touchend=${this._onTouchEnd}
              @mousedown=${(e: MouseEvent) => this._onMouseDown(e, entityId)}
            >
              <div class="slider-fill" style="width: ${thumbOffset}%"></div>
              <div class="slider-thumb" style="left: ${thumbOffset}%">
                <ha-icon icon="mdi:chevron-right"></ha-icon>
              </div>
              <span class="slider-label">Slide to unlock</span>
            </div>
          `
        : html`
            <div class="unlocked-state">
              <ha-icon icon="mdi:lock-open-check"></ha-icon>
              <span>Unlocked</span>
            </div>
          `}
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

    .slider-track {
      position: relative;
      height: 48px;
      border-radius: 24px;
      background: var(--primary-color, #03a9f4);
      overflow: hidden;
      cursor: grab;
      user-select: none;
      touch-action: none;
      margin: 4px 0 12px;
    }

    .slider-track.sliding {
      cursor: grabbing;
    }

    .slider-fill {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 24px;
      transition: none;
    }

    .slider-thumb {
      position: absolute;
      top: 4px;
      left: 0;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 4px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      transition: none;
    }

    .slider-thumb ha-icon {
      color: var(--primary-color, #03a9f4);
      --mdc-icon-size: 24px;
    }

    .slider-label {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: rgba(255, 255, 255, 0.8);
      font-size: 14px;
      font-weight: 500;
      pointer-events: none;
    }

    .unlocked-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      margin: 4px 0 12px;
      border-radius: 24px;
      background: var(--success-color, #4caf50);
      color: #fff;
      font-size: 14px;
      font-weight: 500;
    }

    .unlocked-state ha-icon {
      color: #fff;
      --mdc-icon-size: 20px;
    }

    ha-icon {
      color: var(--state-icon-color, #44739e);
      --mdc-icon-size: 24px;
    }
  `;
}

// Register with HA card picker
(window as any).customCards = (window as any).customCards || [];  // eslint-disable-line @typescript-eslint/no-explicit-any
(window as any).customCards.push({  // eslint-disable-line @typescript-eslint/no-explicit-any
  type: "aptus-lock-card",
  name: "Aptus Lock Card",
  description: "Card for controlling Aptus door locks with slide-to-unlock",
});
