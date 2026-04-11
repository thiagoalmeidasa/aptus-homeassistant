import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { AptusLockCardConfig, HomeAssistant, HassEntity } from "./types";

@customElement("aptus-lock-card")
export class AptusLockCard extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config!: AptusLockCardConfig;
  @state() private _sliding: string | null = null;
  @state() private _slideProgress: number = 0;
  @state() private _completing: string | null = null;
  @state() private _unlockingEntities: Map<string, { timerId: number }> = new Map();

  private _startX = 0;
  private _trackWidth = 0;

  private get _unlockDuration(): number {
    return this._config.unlock_duration ?? 5;
  }

  setConfig(config: AptusLockCardConfig): void {
    if (!config.entities || config.entities.length === 0) {
      throw new Error("Please define at least one entity");
    }
    this._config = config;
  }

  getCardSize(): number {
    return (this._config?.entities?.length ?? 1) + (this._config?.title ? 1 : 0);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    for (const { timerId } of this._unlockingEntities.values()) {
      clearTimeout(timerId);
    }
    this._unlockingEntities.clear();
  }

  willUpdate(changedProps: Map<string, unknown>): void {
    super.willUpdate(changedProps);
    if (changedProps.has("hass") && this._unlockingEntities.size > 0) {
      let changed = false;
      for (const [entityId, { timerId }] of this._unlockingEntities) {
        const entity = this.hass.states[entityId];
        if (entity?.state === "locked") {
          clearTimeout(timerId);
          this._unlockingEntities.delete(entityId);
          changed = true;
        }
      }
      if (changed) {
        this._unlockingEntities = new Map(this._unlockingEntities);
      }
    }
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
      this._handleSlideComplete(this._sliding);
    } else {
      this._sliding = null;
      this._slideProgress = 0;
    }
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
        this._handleSlideComplete(this._sliding!);
      } else {
        this._sliding = null;
        this._slideProgress = 0;
      }
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  private _handleSlideComplete(entityId: string): void {
    this.hass.callService("lock", "unlock", {}, { entity_id: entityId });

    // Phase 1: snap thumb to end
    this._completing = entityId;
    this._slideProgress = 1;

    setTimeout(() => {
      // Phase 2: transition to countdown
      this._sliding = null;
      this._slideProgress = 0;
      this._completing = null;

      const timerId = window.setTimeout(() => {
        this._unlockingEntities.delete(entityId);
        this._unlockingEntities = new Map(this._unlockingEntities);
      }, this._unlockDuration * 1000);

      this._unlockingEntities = new Map(this._unlockingEntities).set(entityId, { timerId });
    }, 300);
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
    const isUnlocking = this._unlockingEntities.has(entityId);
    const isCompleting = this._completing === entityId;
    const icon = isLocked && !isUnlocking && !isCompleting ? "mdi:lock" : "mdi:lock-open";
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
      ${isUnlocking
        ? html`
            <div class="unlocked-countdown"
                 style="--countdown-duration: ${this._unlockDuration}s">
              <div class="countdown-bar"></div>
              <span class="countdown-label">
                <ha-icon icon="mdi:lock-open-check"></ha-icon>
                Unlocked
              </span>
            </div>
          `
        : isLocked || isCompleting
          ? html`
              <div
                class="slider-track ${isSliding ? "sliding" : ""} ${isCompleting ? "completing" : ""}"
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

    .slider-track.completing .slider-fill {
      transition: width 0.3s ease-out;
      width: 100% !important;
    }

    .slider-track.completing .slider-thumb {
      transition: left 0.3s ease-out;
      left: calc(100% - 44px) !important;
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

    .unlocked-countdown {
      position: relative;
      height: 48px;
      border-radius: 24px;
      background: var(--success-color, #4caf50);
      overflow: hidden;
      margin: 4px 0 12px;
      animation: unlock-pulse 1.5s ease-in-out infinite;
    }

    .countdown-bar {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 24px;
      animation: countdown-shrink var(--countdown-duration, 5s) linear forwards;
    }

    .countdown-label {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #fff;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .countdown-label ha-icon {
      color: #fff;
      --mdc-icon-size: 20px;
    }

    @keyframes countdown-shrink {
      from { width: 100%; }
      to   { width: 0%; }
    }

    @keyframes unlock-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4); }
      50%      { box-shadow: 0 0 12px 4px rgba(76, 175, 80, 0.6); }
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
