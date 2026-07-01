import { describe, expect, it } from "vitest";
import { ExecutionEngine } from "../src/agent/ExecutionEngine";
import { RiskManager } from "../src/agent/RiskManager";
import { MockSphereAdapter } from "../src/adapters/MockSphereAdapter";
import { defaultConfig } from "../src/config/defaultConfig";
import { LocalStore } from "../src/storage/LocalStore";
import type { Decision, MarketIntent } from "../src/storage/types";

const intent: MarketIntent = {
  id: "intent-exec",
  counterparty: "bob.sphere",
  side: "sell",
  token: "UNICITY",
  amount: 25,
  price: 0.93,
  fairValue: 1,
  keywords: ["swap"],
  updatedAt: "2026-07-01T00:00:00.000Z",
  riskScore: 0.1
};

const decision: Decision = {
  id: "decision-exec",
  intentId: intent.id,
  action: "EXECUTE_DIRECTLY",
  reason: "Selected for direct execution",
  expectedProfitPct: 0.07,
  createdAt: "2026-07-01T00:00:00.000Z"
};

describe("ExecutionEngine", () => {
  it("marks dry-run executions clearly", async () => {
    const store = new LocalStore(":memory:");
    const engine = new ExecutionEngine(new MockSphereAdapter(defaultConfig), new RiskManager(defaultConfig), store, defaultConfig);

    const execution = await engine.execute(intent, decision);

    expect(execution.mode).toBe("dry-run");
    expect(execution.txId).toContain("dry-run");
    expect(execution.status).toBe("simulated");
  });

  it("prevents duplicate execution through idempotency", async () => {
    const store = new LocalStore(":memory:");
    const engine = new ExecutionEngine(new MockSphereAdapter(defaultConfig), new RiskManager(defaultConfig), store, defaultConfig);

    await engine.execute(intent, decision);
    await expect(engine.execute(intent, decision)).rejects.toThrow("already executed");
  });
});
