import { beforeEach, describe, expect, it, vi } from "vitest";
import { RealSphereAdapter } from "../src/adapters/RealSphereAdapter";
import type { AgentConfig, Decision, MarketIntent } from "../src/storage/types";

const sdkMocks = vi.hoisted(() => {
  const send = vi.fn();
  const mintFungibleToken = vi.fn();
  const sphere = {
    identity: { directAddress: "DIRECT://agent", nametag: "autointent-trader" },
    payments: {
      send,
      mintFungibleToken,
      getAssets: vi.fn()
    }
  };
  return {
    send,
    mintFungibleToken,
    getAssets: sphere.payments.getAssets,
    sphere,
    init: vi.fn()
  };
});

vi.mock("@unicitylabs/sphere-sdk", () => ({
  Sphere: { init: sdkMocks.init },
  TokenRegistry: {
    getInstance: () => ({
      getDefinitionBySymbol: (symbol: string) => {
        if (symbol === "BTC") return { id: "btc-coin-id" };
        if (symbol === "UCT") return { id: "uct-coin-id" };
        return undefined;
      }
    })
  }
}));

vi.mock("@unicitylabs/sphere-sdk/impl/nodejs", () => ({
  createNodeProviders: vi.fn(() => ({ storage: {}, transport: {}, oracle: {} }))
}));

vi.mock("@unicitylabs/sphere-sdk/impl/shared/wallet-api", () => ({
  createWalletApiProviders: vi.fn((base) => ({ ...base, delivery: {}, walletApi: {}, tokenStorage: {} }))
}));

const config: AgentConfig = {
  network: "testnet-v2",
  walletSeed: "seed",
  agentNametag: "autointent-trader",
  mode: "real",
  walletApiBaseUrl: "https://wallet-api.unicity.network",
  oracleApiKey: "oracle",
  deviceId: "test-device",
  maxTradeAmount: 1,
  minProfitThreshold: 0.03,
  scanIntervalSeconds: 10,
  allowedTokens: ["BTC", "UCT"],
  keywordFilters: [],
  counterpartyBlocklist: [],
  spendingCapPerRun: 20,
  spendingCapPerDay: 20
};

const intent: MarketIntent = {
  id: "intent-1",
  counterparty: "sphere-swap",
  side: "sell",
  token: "BTC",
  amount: 1,
  price: 2,
  fairValue: 2.06,
  keywords: ["wallet-swap"],
  updatedAt: "2026-07-01T00:00:00.000Z",
  riskScore: 0.1
};

const decision: Decision = {
  id: "decision-1",
  intentId: intent.id,
  action: "EXECUTE_DIRECTLY",
  reason: "swap rule passed",
  expectedProfitPct: 0.03,
  createdAt: "2026-07-01T00:00:00.000Z"
};

describe("RealSphereAdapter wallet swap execution", () => {
  beforeEach(() => {
    sdkMocks.send.mockReset();
    sdkMocks.mintFungibleToken.mockReset();
    sdkMocks.getAssets.mockReset();
    sdkMocks.init.mockReset();
    sdkMocks.init.mockResolvedValue({ sphere: sdkMocks.sphere });
    sdkMocks.getAssets.mockResolvedValue([{ coinId: "btc-coin-id", symbol: "BTC", totalAmount: "10" }]);
    sdkMocks.send.mockResolvedValue({ id: "send-tx", status: "completed" });
    sdkMocks.mintFungibleToken.mockResolvedValue({ success: true, tokenId: "minted-uct" });
  });

  it("executes a wallet swap by sending input token to the swap stub and minting output token", async () => {
    const adapter = new RealSphereAdapter(config);

    const result = await adapter.executeValueTransfer({
      intent,
      decision,
      idempotencyKey: "idem-1",
      walletSwap: {
        fromToken: "BTC",
        toToken: "UCT",
        fromAmount: 1,
        toAmount: "2",
        rate: 2,
        recipient: "sphere-swap"
      }
    });

    expect(sdkMocks.send).toHaveBeenCalledWith({
      recipient: "sphere-swap",
      amount: "1",
      coinId: "btc-coin-id",
      memo: "Autonomous wallet swap for intent-1; idempotency=idem-1; pair=BTC->UCT"
    });
    expect(sdkMocks.mintFungibleToken).toHaveBeenCalledWith("uct-coin-id", 2n);
    expect(result).toEqual({
      txId: "send-tx+minted-uct",
      status: "confirmed",
      note: "Wallet swap executed: sent 1 BTC to sphere-swap, minted 2 UCT at configured rate 2."
    });
  });
});
