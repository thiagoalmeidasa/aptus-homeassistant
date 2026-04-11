export interface AptusLockCardConfig {
  type: string;
  entities: string[];
  title?: string;
  unlock_duration?: number;
}

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: {
    friendly_name?: string;
    battery_low?: boolean;
    [key: string]: unknown;
  };
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  callService(
    domain: string,
    service: string,
    data?: Record<string, unknown>,
    target?: { entity_id: string }
  ): Promise<void>;
}
