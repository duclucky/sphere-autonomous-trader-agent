import type { SpendableCoinAsset } from "../adapters/coinSelection";

function normalizeToken(value: string): string {
  return value.trim().toUpperCase();
}

function isPositiveFinite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function buildMarketPriceMap(assets: SpendableCoinAsset[]): Map<string, number> {
  const prices = new Map<string, number>();
  for (const asset of assets) {
    if (!isPositiveFinite(asset.priceUsd)) {
      continue;
    }
    if (asset.symbol) {
      prices.set(normalizeToken(asset.symbol), asset.priceUsd);
    }
    if (asset.coinId) {
      prices.set(normalizeToken(asset.coinId), asset.priceUsd);
    }
  }
  return prices;
}

export function resolveMarketRate(fromToken: string, toToken: string, prices: ReadonlyMap<string, number>): number | undefined {
  const fromPrice = prices.get(normalizeToken(fromToken));
  const toPrice = prices.get(normalizeToken(toToken));
  if (!isPositiveFinite(fromPrice) || !isPositiveFinite(toPrice)) {
    return undefined;
  }
  return fromPrice / toPrice;
}
