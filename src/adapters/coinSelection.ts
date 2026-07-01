export interface SpendableCoinAsset {
  coinId: string;
  symbol: string;
  totalAmount: string;
}

function normalizeToken(value: string): string {
  return value.trim().toUpperCase();
}

function amountToNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function chooseSpendableCoinId(assets: SpendableCoinAsset[], preferredToken: string, amount: number): string | undefined {
  const normalizedToken = normalizeToken(preferredToken);
  const matchingAssets = assets.filter((asset) => {
    return normalizeToken(asset.symbol) === normalizedToken || normalizeToken(asset.coinId) === normalizedToken;
  });

  const spendableAssets = matchingAssets
    .filter((asset) => amountToNumber(asset.totalAmount) >= amount)
    .sort((left, right) => amountToNumber(right.totalAmount) - amountToNumber(left.totalAmount));

  if (spendableAssets.length > 0) {
    return spendableAssets[0].coinId;
  }

  const fallbackAssets = matchingAssets.sort((left, right) => amountToNumber(right.totalAmount) - amountToNumber(left.totalAmount));
  if (fallbackAssets.length > 0) {
    return fallbackAssets[0].coinId;
  }

  return undefined;
}
