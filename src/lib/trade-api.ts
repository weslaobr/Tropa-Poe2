export interface TradeQueryFilter {
  statId: string;
  value: number;
}

export interface TradeQuery {
  league: string;
  filters: TradeQueryFilter[];
  maxPriceChaos?: number;
}

export interface TradeListing {
  itemId: string;
  name: string;
  priceChaos: number;
  mods: Record<string, number>;
}

export interface UpgradeCandidate extends TradeListing {
  dpsPerOrb: number | null;
}

export class TradeApiNotImplementedError extends Error {
  constructor() {
    super('Integração com a API do Trade chega na v1.5.');
  }
}

export function calculateDpsPerOrb(dpsGain: number, priceChaos: number): number | null {
  if (priceChaos <= 0 || !Number.isFinite(dpsGain)) return null;
  return dpsGain / priceChaos;
}

export async function searchUpgrades(_query: TradeQuery): Promise<UpgradeCandidate[]> {
  void calculateDpsPerOrb;
  throw new TradeApiNotImplementedError();
}
