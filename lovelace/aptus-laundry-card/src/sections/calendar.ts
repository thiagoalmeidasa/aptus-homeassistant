import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { fetchGroups, fetchWeeklyCalendar } from "../api";
import { sharedStyles } from "../styles";
import type { HomeAssistant, LaundryGroup, TimeSlot } from "../types";

@customElement("aptus-laundry-calendar")
export class AptusLaundryCalendar extends LitElement {
  static styles = [
    sharedStyles,
    css`
      .group-selector {
        display: flex;
        gap: 8px;
        padding: 8px 0;
        flex-wrap: wrap;
      }

      .group-btn {
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 12px;
        border: 1px solid var(--divider-color);
        background: transparent;
        color: var(--primary-text-color);
      }

      .group-btn.active {
        background: var(--primary-color);
        color: var(--text-primary-color, #fff);
        border-color: var(--primary-color);
      }

      .week-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 0;
      }

      .week-nav button {
        background: transparent;
        color: var(--primary-text-color);
        font-size: 16px;
        padding: 4px 8px;
      }

      .calendar-grid {
        display: grid;
        grid-template-columns: 90px repeat(var(--days, 7), 1fr);
        gap: 2px;
        font-size: 11px;
      }

      .grid-header {
        text-align: center;
        font-weight: 500;
        padding: 4px 2px;
        font-size: 10px;
        color: var(--secondary-text-color);
      }

      .grid-label {
        display: flex;
        align-items: center;
        font-size: 10px;
        color: var(--secondary-text-color);
        padding: 2px 4px;
      }

      .grid-cell {
        text-align: center;
        padding: 6px 2px;
        border-radius: 4px;
        cursor: default;
        font-size: 10px;
      }

      .grid-cell.available {
        background: var(--success-color, #4caf50);
        color: #fff;
        cursor: pointer;
      }

      .grid-cell.unavailable {
        background: var(--disabled-color, #e0e0e0);
        color: var(--secondary-text-color);
      }

      .grid-cell.owned {
        background: var(--primary-color);
        color: var(--text-primary-color, #fff);
      }
    `,
  ];

  @property({ attribute: false }) hass!: HomeAssistant;
  @property() entryId!: string;
  @state() private _groups: LaundryGroup[] = [];
  @state() private _selectedGroup: string | null = null;
  @state() private _slots: TimeSlot[] = [];
  @state() private _loading = false;
  @state() private _weekStart: string | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    this._loadGroups();
  }

  async refresh(): Promise<void> {
    if (this._selectedGroup) {
      await this._loadCalendar(this._selectedGroup);
    }
  }

  private async _loadGroups(): Promise<void> {
    this._loading = true;
    try {
      this._groups = await fetchGroups(this.hass, this.entryId);
      if (this._groups.length > 0 && !this._selectedGroup) {
        this._selectedGroup = this._groups[0].id;
        await this._loadCalendar(this._selectedGroup);
      }
    } catch {
      this._groups = [];
    }
    this._loading = false;
  }

  private async _loadCalendar(groupId: string): Promise<void> {
    this._loading = true;
    try {
      this._slots = await fetchWeeklyCalendar(
        this.hass,
        this.entryId,
        groupId,
        this._weekStart ?? undefined
      );
    } catch {
      this._slots = [];
    }
    this._loading = false;
  }

  private _selectGroup(groupId: string): void {
    this._selectedGroup = groupId;
    this._weekStart = null;
    this._loadCalendar(groupId);
  }

  private _navigateWeek(offset: number): void {
    const dates = this._uniqueDates();
    if (dates.length === 0) return;

    const base = new Date(offset > 0 ? dates[dates.length - 1] : dates[0]);
    base.setDate(base.getDate() + (offset > 0 ? 1 : -7));
    this._weekStart = base.toISOString().split("T")[0];
    if (this._selectedGroup) {
      this._loadCalendar(this._selectedGroup);
    }
  }

  private _uniqueDates(): string[] {
    return [...new Set(this._slots.map((s) => s.date))].sort();
  }

  private _uniquePassNos(): { pass_no: number; label: string }[] {
    const seen = new Map<number, string>();
    for (const s of this._slots) {
      if (!seen.has(s.pass_no)) {
        seen.set(s.pass_no, `${s.start_time} – ${s.end_time}`);
      }
    }
    return [...seen.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([pass_no, label]) => ({ pass_no, label }));
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

  private _formatDay(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
  }

  render() {
    const dates = this._uniqueDates();
    const passNos = this._uniquePassNos();

    return html`
      <div class="section-header">Calendar</div>

      ${this._groups.length > 1
        ? html`
            <div class="group-selector">
              ${this._groups.map(
                (g) => html`
                  <button
                    class="group-btn ${g.id === this._selectedGroup ? "active" : ""}"
                    @click=${() => this._selectGroup(g.id)}
                  >
                    ${g.name}
                  </button>
                `
              )}
            </div>
          `
        : ""}
      ${this._loading
        ? html`<div class="loading">Loading...</div>`
        : dates.length === 0
          ? html`<div class="empty">No calendar data</div>`
          : html`
              <div class="week-nav">
                <button @click=${() => this._navigateWeek(-1)}>&larr; Prev</button>
                <span>${dates[0]} – ${dates[dates.length - 1]}</span>
                <button @click=${() => this._navigateWeek(1)}>Next &rarr;</button>
              </div>
              <div class="calendar-grid" style="--days: ${dates.length}">
                <div class="grid-header"></div>
                ${dates.map(
                  (d) => html`<div class="grid-header">${this._formatDay(d)}</div>`
                )}
                ${passNos.map(
                  (pn) => html`
                    <div class="grid-label">${pn.label}</div>
                    ${dates.map((d) => {
                      const slot = this._slots.find(
                        (s) => s.date === d && s.pass_no === pn.pass_no
                      );
                      const state = slot?.state ?? "unavailable";
                      return html`
                        <div
                          class="grid-cell ${state}"
                          @click=${state === "available" && slot
                            ? () => this._book(slot)
                            : undefined}
                          title=${state === "available"
                            ? "Click to book"
                            : state === "owned"
                              ? "Your booking"
                              : "Unavailable"}
                        >
                          ${state === "available"
                            ? "⊕"
                            : state === "owned"
                              ? "●"
                              : ""}
                        </div>
                      `;
                    })}
                  `
                )}
              </div>
            `}
    `;
  }
}
