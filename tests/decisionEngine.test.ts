import { describe, expect, it } from "vitest";
import { DecisionEngine } from "../src/agent/DecisionEngine";
import { defaultConfig } from "../src/config/defaultConfig";
import type { MarketIntent } from "../src/storage/types";

const baseIntent: MarketIntent = {
  id: "intent-good",
  counterparty: "@alice",
  side: "sell",
  token: "UNICITY",
  amount: 40,
  price: 0.96,
  fairValue: 1,
  keywords: ["arbitrage"],
  updatedAt: "2026-07-01T00:00:00.000Z",
  riskScore: 0.18
};

describe("DecisionEngine", () => {
  it("skips opportunities above the max trade amount", () => {
    const engine = new DecisionEngine({ ...defaultConfig, maxTradeAmount: 10 });

    const [decision] = engine.evaluate([baseIntent]);

    expect(decision.action).toBe("IGNORE");
    expect(decision.reason).toContain("amount exceeds MAX_TRADE_AMOUNT");
  });

  it("skips opportunities for disallowed tokens", () => {
    const engine = new DecisionEngine({ ...defaultConfig, allowedTokens: ["USDC"] });

    const [decision] = engine.evaluate([baseIntent]);

    expect(decision.action).toBe("IGNORE");
    expect(decision.reason).toContain("token not allowed");
  });

  it("selects a profitable opportunity for negotiation", () => {
    const engine = new DecisionEngine({ ...defaultConfig, minProfitThreshold: 0.03 });

    const [decision] = engine.evaluate([baseIntent]);

    expect(decision.action).toBe("NEGOTIATE");
    expect(decision.expectedProfitPct).toBeGreaterThan(0.03);
    expect(decision.reason).toContain("Selected");
  });

  it("executes directly when spread is strong and risk is low", () => {
    const engine = new DecisionEngine({ ...defaultConfig, minProfitThreshold: 0.03 });

    const [decision] = engine.evaluate([{ ...baseIntent, id: "direct", price: 0.9, riskScore: 0.08 }]);

    expect(decision.action).toBe("EXECUTE_DIRECTLY");
    expect(decision.reason).toContain("direct execution");
  });

  it("skips opportunities without a resolvable counterparty", () => {
    const engine = new DecisionEngine(defaultConfig);

    const [decision] = engine.evaluate([{ ...baseIntent, counterparty: "unknown-counterparty" }]);

    expect(decision.action).toBe("IGNORE");
    expect(decision.reason).toContain("counterparty is not resolvable");
  });
});
