import { newId } from "../utils/ids";
import { isResolvableCounterparty } from "../utils/counterparty";
import type { AgentConfig, Decision, MarketIntent } from "../storage/types";

export class DecisionEngine {
  private readonly config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  evaluate(intents: MarketIntent[]): Decision[] {
    return [...intents]
      .sort((a, b) => this.scoreIntent(b) - this.scoreIntent(a))
      .map((intent) => this.evaluateOne(intent));
  }

  private evaluateOne(intent: MarketIntent): Decision {
    const expectedProfitPct = (intent.fairValue - intent.price) / intent.price;
    const createdAt = new Date().toISOString();

    if (intent.amount > this.config.maxTradeAmount) {
      return this.decision(intent.id, "IGNORE", "Skipped: amount exceeds MAX_TRADE_AMOUNT", expectedProfitPct, createdAt);
    }
    if (!this.config.allowedTokens.includes(intent.token)) {
      return this.decision(intent.id, "IGNORE", "Skipped: token not allowed by ALLOWED_TOKENS", expectedProfitPct, createdAt);
    }
    if (!isResolvableCounterparty(intent.counterparty)) {
      return this.decision(intent.id, "IGNORE", "Skipped: counterparty is not resolvable", expectedProfitPct, createdAt);
    }
    if (this.config.counterpartyBlocklist.includes(intent.counterparty)) {
      return this.decision(intent.id, "IGNORE", "Skipped: counterparty is blacklisted", expectedProfitPct, createdAt);
    }
    if (expectedProfitPct < this.config.minProfitThreshold) {
      return this.decision(intent.id, "IGNORE", "Skipped: expected spread below MIN_PROFIT_THRESHOLD", expectedProfitPct, createdAt);
    }
    if (expectedProfitPct >= this.config.minProfitThreshold * 2 && intent.riskScore <= 0.12) {
      return this.decision(
        intent.id,
        "EXECUTE_DIRECTLY",
        `Selected for direct execution: expected spread ${(expectedProfitPct * 100).toFixed(1)}% and low risk`,
        expectedProfitPct,
        createdAt
      );
    }
    return this.decision(
      intent.id,
      "NEGOTIATE",
      `Selected: expected spread ${(expectedProfitPct * 100).toFixed(1)}% > MIN_PROFIT_THRESHOLD`,
      expectedProfitPct,
      createdAt
    );
  }

  private scoreIntent(intent: MarketIntent): number {
    const expectedProfitPct = (intent.fairValue - intent.price) / intent.price;
    const recency = Date.parse(intent.updatedAt) / 1_000_000_000_000;
    return expectedProfitPct * 100 - intent.riskScore * 5 + recency;
  }

  private decision(
    intentId: string,
    action: Decision["action"],
    reason: string,
    expectedProfitPct: number,
    createdAt: string
  ): Decision {
    return { id: newId("decision"), intentId, action, reason, expectedProfitPct, createdAt };
  }
}
