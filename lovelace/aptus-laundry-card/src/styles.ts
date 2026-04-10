import { css } from "lit";

export const sharedStyles = css`
  :host {
    display: block;
    padding: 0 16px 16px;
  }

  .section-header {
    font-size: 14px;
    font-weight: 500;
    color: var(--primary-text-color);
    padding: 12px 0 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .loading {
    display: flex;
    justify-content: center;
    padding: 16px;
    color: var(--secondary-text-color);
  }

  .empty {
    color: var(--secondary-text-color);
    font-style: italic;
    padding: 8px 0;
  }

  .slot-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid var(--divider-color);
  }

  .slot-row:last-child {
    border-bottom: none;
  }

  .slot-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .slot-date {
    font-size: 14px;
    font-weight: 500;
  }

  .slot-time {
    font-size: 12px;
    color: var(--secondary-text-color);
  }

  .slot-group {
    font-size: 12px;
    color: var(--secondary-text-color);
  }

  button {
    cursor: pointer;
    border: none;
    border-radius: 4px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .btn-book {
    background: var(--primary-color);
    color: var(--text-primary-color, #fff);
  }

  .btn-cancel {
    background: var(--error-color, #db4437);
    color: #fff;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
