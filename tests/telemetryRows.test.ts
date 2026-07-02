import { describe, expect, it } from "vitest";
import { buildTelemetryRows } from "../dashboard/src/telemetryRows";
import type { Decision, ExecutionRecord, MarketIntent, NegotiationMessage } from "../dashboard/src/types";

const now = "2026-07-02T01:24:12.000Z";

describe("telemetry rows", () => {
  it("merges one swap run into a single readable row", () => {
    const intents: MarketIntent[] = [{
      id: "intent-sol-btc",
      counterparty: "sphere-swap",
      side: "sell",
      token: "SOL",
      amount: 1,
      price: 0.001295,
      fairValue: 0.00133,
      keywords: ["wallet-swap"],
      updatedAt: now,
      riskScore: 0.1
    }];
    const decisions: Decision[] = [{
      id: "decision-sol-btc",
      intentId: "intent-sol-btc",
      action: "EXECUTE_DIRECTLY",
      reason: "Wallet swap agent selected SOL->BTC execution 2/20: configured rate passed.",
      expectedProfitPct: 0.03,
      createdAt: now
    }];
    const negotiations: NegotiationMessage[] = [{
      id: "negotiation-sol-btc",
      intentId: "intent-sol-btc",
      counterparty: "sphere-swap",
      direction: "outbound",
      body: "Server seeded agent prepared wallet swap 2/20: 1 SOL -> 0.001295 BTC.",
      status: "simulated",
      mode: "real",
      createdAt: now
    }];
    const executions: ExecutionRecord[] = [{
      id: "execution-sol-btc",
      intentId: "intent-sol-btc",
      decisionId: "decision-sol-btc",
      idempotencyKey: "idem-sol-btc",
      mode: "real",
      txId: "f398172c-b35f-4f00-a323-ae9545949ac8",
      status: "confirmed",
      token: "SOL->BTC",
      amount: 1,
      counterparty: "sphere-swap",
      createdAt: now,
      note: "Wallet swap executed through Sphere payments.",
      quotedRate: 0.001295,
      executedRate: 0.001295,
      realizedProfitPct: 0.0123
    }];

    expect(buildTelemetryRows({ intents, decisions, negotiations, executions })).toEqual([{
      id: "execution-sol-btc",
      sequence: 1,
      timestamp: "01:24:12",
      swapPlan: "1 SOL -> 0.001295 BTC",
      swapDetail: "rate 0.001295 BTC/SOL",
      decision: "EXECUTE",
      decisionDetail: "Wallet swap agent selected SOL->BTC execution 2/20: configured rate passed.",
      status: "confirmed",
      resultDetail: "realized +1.23%",
      proof: "f398172c...949ac8",
      proofDetail: "REAL / sphere-swap",
      rawProof: "f398172c-b35f-4f00-a323-ae9545949ac8"
    }]);
  });
});
