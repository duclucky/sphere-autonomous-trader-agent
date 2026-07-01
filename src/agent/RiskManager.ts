import type { AgentConfig } from "../storage/types";

interface RiskResult {
  allowed: boolean;
  reason: string;
}

export class RiskManager {
  private spentThisRun = 0;
  private spentToday = 0;
  private readonly executedIntentIds = new Set<string>();
  private readonly config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  canSpend(amount: number): RiskResult {
    if (this.spentThisRun + amount > this.config.spendingCapPerRun) {
      return { allowed: false, reason: "Blocked: spending cap per run exceeded" };
    }
    if (this.spentToday + amount > this.config.spendingCapPerDay) {
      return { allowed: false, reason: "Blocked: spending cap per day exceeded" };
    }
    return { allowed: true, reason: "Allowed: spending caps satisfied" };
  }

  canExecuteIntent(intentId: string): RiskResult {
    if (this.executedIntentIds.has(intentId)) {
      return { allowed: false, reason: "Blocked: intent already executed" };
    }
    return { allowed: true, reason: "Allowed: idempotency key is new" };
  }

  recordExecution(intentId: string, amount: number): void {
    this.executedIntentIds.add(intentId);
    this.spentThisRun += amount;
    this.spentToday += amount;
  }
}
