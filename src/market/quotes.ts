import type { SpendableCoinAsset } from "../adapters/coinSelection";

export interface MarketSwapPair {
  fromToken: string;
  toToken: string;
  rate: number;
}

function normalizeToken(value: string): string {
  return value.trim().toUpperCase();
}

function isPositiveFinite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function amountToNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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

export function buildAutoMarketSwapPairs(assets: SpendableCoinAsset[], minimumInputAmount: number): MarketSwapPair[] {
  const eligibleAssets = assets
    .filter((asset) => asset.symbol && isPositiveFinite(asset.priceUsd) && amountToNumber(asset.totalAmount) >= minimumInputAmount)
    .map((asset) => ({
      symbol: normalizeToken(asset.symbol),
      priceUsd: asset.priceUsd as number
    }))
    .filter((asset, index, all) => all.findIndex((candidate) => candidate.symbol === asset.symbol) === index);

  const pairs: MarketSwapPair[] = [];
  for (let leftIndex = 0; leftIndex < eligibleAssets.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < eligibleAssets.length; rightIndex += 1) {
      const left = eligibleAssets[leftIndex];
      const right = eligibleAssets[rightIndex];
      pairs.push({ fromToken: left.symbol, toToken: right.symbol, rate: left.priceUsd / right.priceUsd });
      pairs.push({ fromToken: right.symbol, toToken: left.symbol, rate: right.priceUsd / left.priceUsd });
    }
  }
  return pairs;
}
