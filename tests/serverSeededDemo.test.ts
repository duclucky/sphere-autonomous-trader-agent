import { describe, expect, it } from "vitest";
import type { SphereAdapter } from "../src/adapters/SphereAdapter";
import { loadServerSeededDemoOptions, runServerSeededDemo, validateServerSeededDemoStart } from "../src/api/serverSeededDemo";
import { LocalStore } from "../src/storage/LocalStore";
import type { AgentConfig, ExecuteValueTransferRequest } from "../src/storage/types";

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

function createAdapter(failAt?: number): SphereAdapter & { requests: ExecuteValueTransferRequest[] } {
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
    async executeValueTransfer(request) {
      requests.push(request);
      if (failAt && requests.length === failAt) {
        throw new Error(`execution ${failAt} failed`);
      }
      return { txId: `tx-${requests.length}`, status: "submitted", note: "fake submitted" };
    }
  };
}

describe("server seeded wallet demo", () => {
  it("is disabled by default", () => {
    const options = loadServerSeededDemoOptions({}, config);

    expect(options.enabled).toBe(false);
    expect(options.maxRuns).toBe(1);
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
        token: testTokenSymbol
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
    expect(state.logs.some((log) => log.message.includes("completed 20/20"))).toBe(true);
  });

  it("rejects unsafe server demo options before execution starts", () => {
    const decision = validateServerSeededDemoStart(config, {
      enabled: true,
      executions: 20,
      maxRuns: 1,
      amount: 1,
      dailyCap: 5,
      counterparty: "@autointent-trader",
      token: "UNICITY"
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("daily cap");
  });

  it("accepts named tokens in real server demo because payments.send can resolve symbols", () => {
    const decision = validateServerSeededDemoStart(config, {
      enabled: true,
      executions: 20,
      maxRuns: 1,
      amount: 1,
      dailyCap: 20,
      counterparty: "@autointent-trader",
      token: testTokenSymbol
    });

    expect(decision.allowed).toBe(true);
  });

  it("preserves the configured token symbol on the transfer request", async () => {
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
        counterparty: "@autointent-trader",
        token: testTokenSymbol
      },
      runId: "server-run-symbol"
    });

    expect(result.status).toBe("complete");
    expect(adapter.requests[0].intent.token).toBe(testTokenSymbol);
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
        token: testTokenSymbol
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
