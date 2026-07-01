import type { SphereAdapter } from "../adapters/SphereAdapter";
import type { LocalStore } from "../storage/LocalStore";
import type { AgentConfig, Decision, ExecutionRecord, MarketIntent, NegotiationMessage } from "../storage/types";
import { stableId } from "../utils/ids";

export interface ServerSeededDemoOptions {
  enabled: boolean;
  executions: number;
  maxRuns: number;
  amount: number;
  dailyCap: number;
  counterparty: string;
  token: string;
}

export interface ServerSeededDemoInput {
  config: AgentConfig;
  store: LocalStore;
  adapter: SphereAdapter;
  options: ServerSeededDemoOptions;
  runId: string;
}

export interface ServerSeededDemoResult {
  status: "disabled" | "blocked" | "complete" | "failed";
  runId: string;
  requested: number;
  completed: number;
  failed: number;
  message: string;
}

export interface ServerSeededDemoStartDecision {
  allowed: boolean;
  reason?: string;
}

const hardMaxExecutions = 20;

function numberFromEnv(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizedCounterparty(value: string | undefined, config: AgentConfig): string {
  if (value?.trim()) return value.trim();
  return config.agentNametag.startsWith("@") ? config.agentNametag : `@${config.agentNametag}`;
}

export function loadServerSeededDemoOptions(env: NodeJS.ProcessEnv, config: AgentConfig): ServerSeededDemoOptions {
  const executions = Math.min(hardMaxExecutions, Math.trunc(numberFromEnv(env.MAX_EXECUTIONS_PER_SERVER_DEMO, hardMaxExecutions)));
  const amount = numberFromEnv(env.SERVER_DEMO_AMOUNT, 1);
  return {
    enabled: env.ENABLE_SERVER_DEMO === "true",
    executions,
    maxRuns: Math.trunc(numberFromEnv(env.SERVER_DEMO_MAX_RUNS, 1)),
    amount,
    dailyCap: numberFromEnv(env.SERVER_DEMO_DAILY_CAP, executions * amount),
    counterparty: normalizedCounterparty(env.SERVER_DEMO_COUNTERPARTY, config),
    token: env.SERVER_DEMO_TOKEN?.trim() || config.allowedTokens[0] || "UCT"
  };
}

export function validateServerSeededDemoStart(config: AgentConfig, options: ServerSeededDemoOptions): ServerSeededDemoStartDecision {
  if (!options.enabled) {
    return { allowed: false, reason: "Server seeded demo is disabled." };
  }
  if (config.network !== "testnet-v2") {
    return { allowed: false, reason: "Server seeded demo only runs on testnet-v2." };
  }
  if (options.amount * options.executions > options.dailyCap) {
    return { allowed: false, reason: "Server seeded demo daily cap would be exceeded." };
  }
  return { allowed: true };
}

function now(): string {
  return new Date().toISOString();
}

function makeIntent(input: ServerSeededDemoInput, index: number): MarketIntent {
  const timestamp = now();
  return {
    id: stableId("server-intent", `${input.runId}:${index}`),
    counterparty: input.options.counterparty,
    side: "sell",
    token: input.options.token,
    amount: input.options.amount,
    price: 1,
    fairValue: 1 + input.config.minProfitThreshold,
    keywords: ["server-seeded", "autonomous", "testnet"],
    updatedAt: timestamp,
    riskScore: 0.1
  };
}

function makeDecision(input: ServerSeededDemoInput, intent: MarketIntent, index: number): Decision {
  return {
    id: stableId("server-decision", `${input.runId}:${index}`),
    intentId: intent.id,
    action: "EXECUTE_DIRECTLY",
    reason: `Server seeded wallet agent selected execution ${index}/${input.options.executions} under deployer limits.`,
    expectedProfitPct: input.config.minProfitThreshold,
    createdAt: now()
  };
}

function makeNegotiation(input: ServerSeededDemoInput, intent: MarketIntent, index: number): NegotiationMessage {
  return {
    id: stableId("server-negotiation", `${input.runId}:${index}`),
    intentId: intent.id,
    counterparty: intent.counterparty,
    direction: "outbound",
    body: `Server seeded agent prepared autonomous execution ${index}/${input.options.executions}.`,
    status: "simulated",
    mode: input.config.mode,
    createdAt: now()
  };
}

function failedExecution(input: ServerSeededDemoInput, intent: MarketIntent, decision: Decision, idempotencyKey: string, error: unknown): ExecutionRecord {
  const message = error instanceof Error ? error.message : String(error);
  return {
    id: stableId("execution", idempotencyKey),
    intentId: intent.id,
    decisionId: decision.id,
    idempotencyKey,
    mode: input.config.mode,
    txId: idempotencyKey,
    status: "failed",
    token: intent.token,
    amount: intent.amount,
    counterparty: intent.counterparty,
    createdAt: now(),
    note: message
  };
}

export async function runServerSeededDemo(input: ServerSeededDemoInput): Promise<ServerSeededDemoResult> {
  const { config, store, adapter, options, runId } = input;
  const startDecision = validateServerSeededDemoStart(config, options);
  if (!startDecision.allowed) {
    const message = startDecision.reason ?? "Server seeded demo is blocked.";
    const status = options.enabled ? "blocked" : "disabled";
    store.saveLog({ id: stableId("log", `${runId}:blocked`), level: "warn", message, createdAt: now() });
    return { status, runId, requested: options.enabled ? options.executions : 0, completed: 0, failed: 0, message };
  }

  let completed = 0;
  let failed = 0;
  store.setRunning(true);
  store.saveLog({ id: stableId("log", `${runId}:start`), level: "info", message: `Server seeded wallet demo started: ${options.executions} autonomous executions queued.`, createdAt: now() });

  for (let index = 1; index <= options.executions; index += 1) {
    const intent = makeIntent(input, index);
    const decision = makeDecision(input, intent, index);
    const negotiation = makeNegotiation(input, intent, index);
    const idempotencyKey = stableId("server-idem", `${runId}:${index}`);
    store.saveIntents([intent]);
    store.saveDecision(decision);
    store.saveNegotiation(negotiation);

    try {
      const result = await adapter.executeValueTransfer({ intent, decision, idempotencyKey });
      const execution: ExecutionRecord = {
        id: stableId("execution", idempotencyKey),
        intentId: intent.id,
        decisionId: decision.id,
        idempotencyKey,
        mode: config.mode,
        txId: result.txId,
        status: result.status,
        token: intent.token,
        amount: intent.amount,
        counterparty: intent.counterparty,
        createdAt: now(),
        note: result.note
      };
      store.saveExecution(execution);
      completed += 1;
      store.saveLog({ id: stableId("log", `${runId}:${index}:submitted`), level: "info", message: `Server seeded execution ${index}/${options.executions} submitted: ${result.txId}.`, createdAt: now() });
    } catch (error) {
      failed += 1;
      store.saveExecution(failedExecution(input, intent, decision, idempotencyKey, error));
      const message = error instanceof Error ? error.message : String(error);
      store.saveLog({ id: stableId("log", `${runId}:${index}:failed`), level: "error", message: `Server seeded execution ${index}/${options.executions} failed: ${message}`, createdAt: now() });
      store.setRunning(false);
      return { status: "failed", runId, requested: options.executions, completed, failed, message };
    }
  }

  store.setRunning(false);
  store.saveLog({ id: stableId("log", `${runId}:complete`), level: "info", message: `Server seeded wallet demo completed ${completed}/${options.executions} autonomous executions.`, createdAt: now() });
  return { status: "complete", runId, requested: options.executions, completed, failed, message: `Server seeded wallet demo completed ${completed}/${options.executions}.` };
}
