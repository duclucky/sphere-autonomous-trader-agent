import { describe, expect, it } from "vitest";
import { AutonomousTraderAgent } from "../src/agent/AutonomousTraderAgent";
import { DecisionEngine } from "../src/agent/DecisionEngine";
import { ExecutionEngine } from "../src/agent/ExecutionEngine";
import { IntentScanner } from "../src/agent/IntentScanner";
import { NegotiationEngine } from "../src/agent/NegotiationEngine";
import { RiskManager } from "../src/agent/RiskManager";
import { MockSphereAdapter } from "../src/adapters/MockSphereAdapter";
import { defaultConfig } from "../src/config/defaultConfig";
import { LocalStore } from "../src/storage/LocalStore";
import type { MarketIntent } from "../src/storage/types";

class FailingScanner extends IntentScanner {
  async scan(): Promise<MarketIntent[]> {
    throw new Error("scanner unavailable");
  }
}

describe("AutonomousTraderAgent", () => {
  it("completes one autonomous dry-run cycle with mock adapter", async () => {
    const config = { ...defaultConfig, minProfitThreshold: 0.03, maxTradeAmount: 100 };
    const store = new LocalStore(":memory:");
    const adapter = new MockSphereAdapter(config);
    const risk = new RiskManager(config);
    const agent = new AutonomousTraderAgent({
      config,
      store,
      scanner: new IntentScanner(adapter, store, config),
      decisionEngine: new DecisionEngine(config),
      negotiationEngine: new NegotiationEngine(adapter, store, config),
      executionEngine: new ExecutionEngine(adapter, risk, store, config)
    });

    const summary = await agent.runOnce();

    expect(summary.intents).toBeGreaterThan(0);
    expect(summary.decisions).toBeGreaterThan(0);
    expect(summary.negotiations).toBeGreaterThan(0);
    expect(summary.executions).toBeGreaterThan(0);
  });

  it("start records loop failures instead of surfacing an unhandled rejection", async () => {
    const store = new LocalStore(":memory:");
    const config = { ...defaultConfig, scanIntervalSeconds: 60 };
    const adapter = new MockSphereAdapter(config);
    const agent = new AutonomousTraderAgent({
      config,
      store,
      scanner: new FailingScanner(adapter, store, config),
      decisionEngine: new DecisionEngine(config),
      negotiationEngine: new NegotiationEngine(adapter, store, config),
      executionEngine: new ExecutionEngine(adapter, new RiskManager(config), store, config)
    });

    agent.start();
    await new Promise((resolve) => setTimeout(resolve, 20));
    agent.stop();

    expect(store.getState().logs.some((log) => log.level === "error" && log.message.includes("scanner unavailable"))).toBe(true);
  });
});
