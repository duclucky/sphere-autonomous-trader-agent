import { stableId } from "../utils/ids";
import type { SphereAdapter } from "../adapters/SphereAdapter";
import type { RiskManager } from "./RiskManager";
import type { LocalStore } from "../storage/LocalStore";
import type { AgentConfig, Decision, ExecutionRecord, MarketIntent } from "../storage/types";

export class ExecutionEngine {
  private readonly adapter: SphereAdapter;
  private readonly risk: RiskManager;
  private readonly store: LocalStore;
  private readonly config: AgentConfig;

  constructor(adapter: SphereAdapter, risk: RiskManager, store: LocalStore, config: AgentConfig) {
    this.adapter = adapter;
    this.risk = risk;
    this.store = store;
    this.config = config;
  }

  async execute(intent: MarketIntent, decision: Decision): Promise<ExecutionRecord> {
    const intentCheck = this.risk.canExecuteIntent(intent.id);
    if (!intentCheck.allowed || this.store.hasExecutionForIntent(intent.id)) {
      throw new Error(intentCheck.allowed ? "Blocked: intent already executed" : intentCheck.reason);
    }

    const spendCheck = this.risk.canSpend(intent.amount);
    if (!spendCheck.allowed) {
      throw new Error(spendCheck.reason);
    }

    const idempotencyKey = stableId("idem", `${intent.id}:${decision.id}`);
    const result = await this.adapter.executeValueTransfer({ intent, decision, idempotencyKey });
    const execution: ExecutionRecord = {
      id: stableId("execution", idempotencyKey),
      intentId: intent.id,
      decisionId: decision.id,
      idempotencyKey,
      mode: this.config.mode,
      txId: result.txId,
      status: result.status,
      token: intent.token,
      amount: intent.amount,
      counterparty: intent.counterparty,
      createdAt: new Date().toISOString(),
      note: result.note,
      quotedRate: result.quotedRate,
      executedRate: result.executedRate,
      realizedProfitPct: result.realizedProfitPct
    };
    this.risk.recordExecution(intent.id, intent.amount);
    this.store.saveExecution(execution);
    return execution;
  }
}
