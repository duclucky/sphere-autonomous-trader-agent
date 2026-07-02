import { describe, expect, it } from "vitest";
import type { SphereAdapter } from "../src/adapters/SphereAdapter";
import { loadServerSeededDemoOptions, runServerSeededDemo, validateServerSeededDemoStart } from "../src/api/serverSeededDemo";
import { LocalStore } from "../src/storage/LocalStore";
import type { AgentConfig, ExecuteValueTransferRequest } from "../src/storage/types";
import type { SpendableCoinAsset } from "../src/adapters/coinSelection";

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
  allowedTokens: ["UNICITY"],
  keywordFilters: [],
  counterpartyBlocklist: [],
  spendingCapPerRun: 20,
  spendingCapPerDay: 20
};

const testCoinId = "1111111111111111111111111111111111111111111111111111111111111111";
const testTokenSymbol = "UCT";

function createAdapter(failAt?: number, assets: SpendableCoinAsset[] = []): SphereAdapter & { requests: ExecuteValueTransferRequest[] } {
  const requests: ExecuteValueTransferRequest[] = [];
  return {
    mode: "real",
    requests,
    async loadWallet() {
      return { address: "DIRECT://server", nametag: "autointent-trader", network: "testnet-v2", mode: "real", status: "loaded" };
    },
    async scanIntents() {
      return [];
    },
    async sendDirectMessage(message) {
      return { ...message, id: "dm", createdAt: new Date().toISOString(), status: "simulated" };
    },
    async getWalletAssets() {
      return assets;
    },
    async executeValueTransfer(request) {
      requests.push(request);
      if (failAt && requests.length === failAt) {
        throw new Error(`execution ${failAt} failed`);
      }
      return { txId: `tx-${requests.length}`, status: "submitted", note: "fake submitted", quotedRate: 2, executedRate: 2.25, realizedProfitPct: 0.125 };
    }
  };
}

describe("server seeded wallet demo", () => {
  it("is disabled by default", () => {
    const options = loadServerSeededDemoOptions({}, config);

    expect(options.enabled).toBe(false);
    expect(options.maxRuns).toBe(1);
  });

  it("defaults backend demo transfers to a wallet swap from BTC to UCT", () => {
    const options = loadServerSeededDemoOptions({}, config);

    expect(options.token).toBe("BTC");
    expect(options.fromToken).toBe("BTC");
    expect(options.toToken).toBe("UCT");
    expect(options.counterparty).toBe("sphere-swap");
  });

  it("parses multiple backend wallet swap pairs from env", () => {
    const options = loadServerSeededDemoOptions({
      SERVER_DEMO_SWAP_PAIRS: "BTC:UCT:1, ETH:UCT:2, SOL:UCT:3"
    }, config);

    expect(options.swapPairs).toEqual([
      { fromToken: "BTC", toToken: "UCT", rate: 1 },
      { fromToken: "ETH", toToken: "UCT", rate: 2 },
      { fromToken: "SOL", toToken: "UCT", rate: 3 }
    ]);
    expect(options.fromToken).toBe("BTC");
    expect(options.toToken).toBe("UCT");
    expect(options.rate).toBe(1);
  });

  it("records twenty autonomous executions into legacy telemetry", async () => {
    const store = new LocalStore(":memory:");
    const adapter = createAdapter();

    const result = await runServerSeededDemo({
      config,
      store,
      adapter,
      options: {
        enabled: true,
        executions: 20,
        maxRuns: 1,
        amount: 1,
        dailyCap: 20,
        counterparty: "@autointent-trader",
        token: "BTC",
        fromToken: "BTC",
        toToken: testTokenSymbol,
        rate: 1
      },
      runId: "server-run"
    });

    const state = store.getState();
    expect(result.status).toBe("complete");
    expect(adapter.requests).toHaveLength(20);
    expect(new Set(adapter.requests.map((request) => request.idempotencyKey)).size).toBe(20);
    expect(state.intents).toHaveLength(20);
    expect(state.decisions).toHaveLength(20);
    expect(state.negotiations).toHaveLength(20);
    expect(state.executions).toHaveLength(20);
    expect(state.executions[0].mode).toBe("real");
    expect(state.executions[0].quotedRate).toBe(2);
    expect(state.executions[0].executedRate).toBe(2.25);
    expect(state.executions[0].realizedProfitPct).toBe(0.125);
    expect(state.logs.some((log) => log.message.includes("completed 20/20"))).toBe(true);
  });

  it("derives preview prices from live wallet asset valuations when available", async () => {
    const store = new LocalStore(":memory:");
    const adapter = createAdapter(undefined, [
      { coinId: "btc", symbol: "BTC", totalAmount: "1", priceUsd: 60000 },
      { coinId: "uct", symbol: "UCT", totalAmount: "1000", priceUsd: 1 }
    ]);
    adapter.executeValueTransfer = async (request) => {
      adapter.requests.push(request);
      return {
        txId: "tx-market",
        status: "submitted",
        note: "market quote echoed",
        quotedRate: request.walletSwap?.rate,
        executedRate: request.walletSwap?.rate,
        realizedProfitPct: 0
      };
    };

    const result = await runServerSeededDemo({
      config,
      store,
      adapter,
      options: {
        enabled: true,
        executions: 1,
        maxRuns: 1,
        amount: 1,
        dailyCap: 1,
        counterparty: "sphere-swap",
        token: "BTC",
        fromToken: "BTC",
        toToken: testTokenSymbol,
        rate: 1
      },
      runId: "server-run-market"
    });

    const state = store.getState();
    expect(result.status).toBe("complete");
    expect(state.intents[0].price).toBe(60000);
    expect(state.intents[0].fairValue).toBe(61800);
    expect(adapter.requests[0].walletSwap?.rate).toBe(60000);
    expect(adapter.requests[0].walletSwap?.toAmount).toBe("60000");
    expect(state.negotiations[0].body).toContain("60000");
    expect(state.decisions[0].reason).toContain("market quote");
  });

  it("rejects unsafe server demo options before execution starts", () => {
    const decision = validateServerSeededDemoStart(config, {
      enabled: true,
      executions: 20,
      maxRuns: 1,
      amount: 1,
      dailyCap: 5,
      counterparty: "@autointent-trader",
      token: "BTC",
      fromToken: "BTC",
      toToken: "UCT",
      rate: 1
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("daily cap");
  });

  it("accepts named tokens in real server demo because wallet swap can resolve symbols", () => {
    const decision = validateServerSeededDemoStart(config, {
      enabled: true,
      executions: 20,
      maxRuns: 1,
      amount: 1,
      dailyCap: 20,
      counterparty: "@autointent-trader",
      token: "BTC",
      fromToken: "BTC",
      toToken: testTokenSymbol,
      rate: 1
    });

    expect(decision.allowed).toBe(true);
  });

  it("passes a wallet swap plan to the execution adapter", async () => {
    const store = new LocalStore(":memory:");
    const adapter = createAdapter();

    const result = await runServerSeededDemo({
      config,
      store,
      adapter,
      options: {
        enabled: true,
        executions: 1,
        maxRuns: 1,
        amount: 1,
        dailyCap: 1,
        counterparty: "sphere-swap",
        token: "BTC",
        fromToken: "BTC",
        toToken: testTokenSymbol,
        rate: 2
      },
      runId: "server-run-symbol"
    });

    expect(result.status).toBe("complete");
    expect(adapter.requests[0].intent.token).toBe("BTC");
    expect(adapter.requests[0].walletSwap).toEqual({
      fromToken: "BTC",
      toToken: testTokenSymbol,
      fromAmount: 1,
      toAmount: "2",
      rate: 2,
      recipient: "sphere-swap"
    });
  });

  it("round-robins multiple swap pairs across a server demo run", async () => {
    const store = new LocalStore(":memory:");
    const adapter = createAdapter();

    const result = await runServerSeededDemo({
      config,
      store,
      adapter,
      options: {
        enabled: true,
        executions: 5,
        maxRuns: 1,
        amount: 1,
        dailyCap: 5,
        counterparty: "sphere-swap",
        token: "BTC",
        fromToken: "BTC",
        toToken: testTokenSymbol,
        rate: 1,
        swapPairs: [
          { fromToken: "BTC", toToken: testTokenSymbol, rate: 1 },
          { fromToken: "ETH", toToken: testTokenSymbol, rate: 2 },
          { fromToken: "SOL", toToken: testTokenSymbol, rate: 3 }
        ]
      },
      runId: "server-run-round-robin"
    });

    expect(result.status).toBe("complete");
    expect(adapter.requests.map((request) => request.walletSwap?.fromToken)).toEqual(["BTC", "ETH", "SOL", "BTC", "ETH"]);
    expect(adapter.requests.map((request) => request.walletSwap?.toAmount)).toEqual(["1", "2", "3", "1", "2"]);
    expect(store.getState().executions.map((execution) => execution.token)).toEqual(["BTC->UCT", "ETH->UCT", "SOL->UCT", "BTC->UCT", "ETH->UCT"]);
  });

  it("auto-generates two-way market swap pairs from spendable wallet assets", async () => {
    const store = new LocalStore(":memory:");
    const adapter = createAdapter(undefined, [
      { coinId: "btc", symbol: "BTC", totalAmount: "2", priceUsd: 60000 },
      { coinId: "eth", symbol: "ETH", totalAmount: "2", priceUsd: 3000 },
      { coinId: "uct", symbol: "UCT", totalAmount: "1000", priceUsd: 1 }
    ]);
    adapter.executeValueTransfer = async (request) => {
      adapter.requests.push(request);
      return {
        txId: `tx-auto-${adapter.requests.length}`,
        status: "submitted",
        note: "auto market quote echoed",
        quotedRate: request.walletSwap?.rate,
        executedRate: request.walletSwap?.rate,
        realizedProfitPct: 0
      };
    };

    const result = await runServerSeededDemo({
      config,
      store,
      adapter,
      options: {
        enabled: true,
        executions: 6,
        maxRuns: 1,
        amount: 1,
        dailyCap: 6,
        counterparty: "sphere-swap",
        token: "BTC",
        fromToken: "BTC",
        toToken: testTokenSymbol,
        rate: 1,
        swapPairs: [{ fromToken: "BTC", toToken: testTokenSymbol, rate: 1 }]
      },
      runId: "server-run-auto-pairs"
    });

    expect(result.status).toBe("complete");
    expect(adapter.requests.map((request) => `${request.walletSwap?.fromToken}->${request.walletSwap?.toToken}`)).toEqual([
      "BTC->ETH",
      "ETH->BTC",
      "BTC->UCT",
      "UCT->BTC",
      "ETH->UCT",
      "UCT->ETH"
    ]);
    expect(adapter.requests.map((request) => request.walletSwap?.rate)).toEqual([
      20,
      0.05,
      60000,
      1 / 60000,
      3000,
      1 / 3000
    ]);
    expect(store.getState().logs.some((log) => log.rule === "AUTO_MARKET_PAIRS" && log.message.includes("6 two-way market pairs"))).toBe(true);
  });

  it("stops and records a failed execution when the backend wallet errors", async () => {
    const store = new LocalStore(":memory:");
    const adapter = createAdapter(3);

    const result = await runServerSeededDemo({
      config,
      store,
      adapter,
      options: {
        enabled: true,
        executions: 20,
        maxRuns: 1,
        amount: 1,
        dailyCap: 20,
        counterparty: "@autointent-trader",
        token: "BTC",
        fromToken: "BTC",
        toToken: testTokenSymbol,
        rate: 1
      },
      runId: "server-run-fail"
    });

    const state = store.getState();
    expect(result.status).toBe("failed");
    expect(adapter.requests).toHaveLength(3);
    expect(state.executions).toHaveLength(3);
    expect(state.executions[2].status).toBe("failed");
    expect(state.logs.some((log) => log.level === "error" && log.message.includes("execution 3 failed"))).toBe(true);
  });
});
