import express from "express";
import { afterEach, describe, expect, it } from "vitest";
import { createRoutes } from "../src/api/routes";
import type { SphereAdapter } from "../src/adapters/SphereAdapter";
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

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

function failingAdapter(): SphereAdapter & { requests: ExecuteValueTransferRequest[] } {
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
      throw new Error("Insufficient balance for this transaction");
    }
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("server seeded demo route", () => {
  it("does not consume the run limit when the backend wallet fails before any successful execution", async () => {
    process.env.ENABLE_SERVER_DEMO = "true";
    process.env.SERVER_DEMO_MAX_RUNS = "1";
    process.env.MAX_EXECUTIONS_PER_SERVER_DEMO = "20";
    process.env.SERVER_DEMO_AMOUNT = "1";
    process.env.SERVER_DEMO_DAILY_CAP = "20";
    process.env.SERVER_DEMO_TOKEN = testCoinId;

    const adapter = failingAdapter();
    const app = express();
    app.use("/api", createRoutes({
      config,
      store: new LocalStore(":memory:"),
      agent: { start() {}, stop() {} },
      adapter
    } as never));
    const server = app.listen(0);
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("test server did not bind to a port");
    const url = `http://127.0.0.1:${address.port}/api/server-demo/start`;

    try {
      const first = await fetch(url, { method: "POST" });
      expect(first.status).toBe(202);
      for (let attempt = 0; attempt < 20 && adapter.requests.length === 0; attempt += 1) {
        await delay(5);
      }
      await delay(5);

      const second = await fetch(url, { method: "POST" });

      expect(second.status).not.toBe(429);
      expect(second.status).toBe(202);
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });
});
