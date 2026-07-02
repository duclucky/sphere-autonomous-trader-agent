import type { SphereAdapter } from "../adapters/SphereAdapter";
import { buildMarketPriceMap, resolveMarketRate } from "../market/quotes";
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
  fromToken: string;
  toToken: string;
  rate: number;
  swapPairs?: ServerDemoSwapPair[];
}

export interface ServerDemoSwapPair {
  fromToken: string;
  toToken: string;
  rate: number;
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

function parseSwapPairs(value: string | undefined): ServerDemoSwapPair[] {
  if (!value?.trim()) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [fromToken, toToken, rawRate] = item.split(":").map((part) => part.trim());
      const rate = Number(rawRate);
      return {
        fromToken: fromToken || "",
        toToken: toToken || "",
        rate: Number.isFinite(rate) && rate > 0 ? rate : 0
      };
    });
}

export function loadServerSeededDemoOptions(env: NodeJS.ProcessEnv, config: AgentConfig): ServerSeededDemoOptions {
  const executions = Math.min(hardMaxExecutions, Math.trunc(numberFromEnv(env.MAX_EXECUTIONS_PER_SERVER_DEMO, hardMaxExecutions)));
  const amount = numberFromEnv(env.SERVER_DEMO_AMOUNT, 1);
  const fromToken = env.SERVER_DEMO_FROM_TOKEN?.trim() || env.SERVER_DEMO_TOKEN?.trim() || "BTC";
  const toToken = env.SERVER_DEMO_TO_TOKEN?.trim() || "UCT";
  const fallbackPair = { fromToken, toToken, rate: numberFromEnv(env.SERVER_DEMO_SWAP_RATE, 1) };
  const swapPairs = parseSwapPairs(env.SERVER_DEMO_SWAP_PAIRS);
  const primaryPair = swapPairs[0] ?? fallbackPair;
  return {
    enabled: env.ENABLE_SERVER_DEMO === "true",
    executions,
    maxRuns: Math.trunc(numberFromEnv(env.SERVER_DEMO_MAX_RUNS, 1)),
    amount,
    dailyCap: numberFromEnv(env.SERVER_DEMO_DAILY_CAP, executions * amount),
    counterparty: env.SERVER_DEMO_SWAP_RECIPIENT?.trim() || normalizedCounterparty(env.SERVER_DEMO_COUNTERPARTY ?? "sphere-swap", config),
    token: primaryPair.fromToken,
    fromToken: primaryPair.fromToken,
    toToken: primaryPair.toToken,
    rate: primaryPair.rate,
    swapPairs: swapPairs.length > 0 ? swapPairs : [fallbackPair]
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
  for (const pair of swapPairsForOptions(options)) {
    if (!pair.fromToken || !pair.toToken) {
      return { allowed: false, reason: "Server seeded demo swap pairs must use FROM:TO:RATE." };
    }
    if (pair.fromToken.trim().toUpperCase() === pair.toToken.trim().toUpperCase()) {
      return { allowed: false, reason: "Server seeded demo requires different swap input and output tokens." };
    }
    if (!Number.isFinite(pair.rate) || pair.rate <= 0) {
      return { allowed: false, reason: "Server seeded demo swap rate must be positive." };
    }
  }
  return { allowed: true };
}

function now(): string {
  return new Date().toISOString();
}

function swapPairForIndex(options: ServerSeededDemoOptions, index: number): ServerDemoSwapPair {
  const pairs = swapPairsForOptions(options);
  return pairs[(index - 1) % pairs.length];
}

function swapPairsForOptions(options: ServerSeededDemoOptions): ServerDemoSwapPair[] {
  return options.swapPairs?.length ? options.swapPairs : [{ fromToken: options.fromToken, toToken: options.toToken, rate: options.rate }];
}

function makeIntent(input: ServerSeededDemoInput, index: number, marketRate?: number): MarketIntent {
  const timestamp = now();
  const pair = swapPairForIndex(input.options, index);
  const quoteRate = marketRate ?? pair.rate;
  return {
    id: stableId("server-intent", `${input.runId}:${index}`),
    counterparty: input.options.counterparty,
    side: "sell",
    token: pair.fromToken,
    amount: input.options.amount,
    price: quoteRate,
    fairValue: quoteRate * (1 + input.config.minProfitThreshold),
    keywords: ["server-seeded", "autonomous", "wallet-swap", "testnet"],
    updatedAt: timestamp,
    riskScore: 0.1
  };
}

function makeDecision(input: ServerSeededDemoInput, intent: MarketIntent, index: number, marketRate?: number): Decision {
  const pair = swapPairForIndex(input.options, index);
  const quoteLabel = marketRate ? `market quote ${marketRate.toFixed(6)} ${pair.toToken}/${pair.fromToken}` : `configured rate ${pair.rate}`;
  return {
    id: stableId("server-decision", `${input.runId}:${index}`),
    intentId: intent.id,
    action: "EXECUTE_DIRECTLY",
    reason: `Wallet swap agent selected ${pair.fromToken}->${pair.toToken} execution ${index}/${input.options.executions}: ${quoteLabel} and deployer limits passed.`,
    expectedProfitPct: input.config.minProfitThreshold,
    createdAt: now()
  };
}

function makeNegotiation(input: ServerSeededDemoInput, intent: MarketIntent, index: number, marketRate?: number): NegotiationMessage {
  const pair = swapPairForIndex(input.options, index);
  const quoteAmount = marketRate ? Math.max(1, Math.trunc(input.options.amount * marketRate)) : Math.max(1, Math.trunc(input.options.amount * pair.rate));
  return {
    id: stableId("server-negotiation", `${input.runId}:${index}`),
    intentId: intent.id,
    counterparty: intent.counterparty,
    direction: "outbound",
    body: `Server seeded agent prepared wallet swap ${index}/${input.options.executions}: ${input.options.amount} ${pair.fromToken} -> ${quoteAmount} ${pair.toToken}.`,
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
    store.saveLog({ id: stableId("log", `${runId}:blocked`), level: "warn", rule: "RUN_GATE", message, createdAt: now() });
    return { status, runId, requested: options.enabled ? options.executions : 0, completed: 0, failed: 0, message };
  }

  let completed = 0;
  let failed = 0;
  const marketAssets = adapter.getWalletAssets ? await adapter.getWalletAssets().catch(() => []) : [];
  const marketPrices = buildMarketPriceMap(marketAssets ?? []);
  store.setRunning(true);
  store.saveLog({ id: stableId("log", `${runId}:start`), level: "info", rule: "RUN_GATE", message: `Server seeded wallet demo started: ${options.executions} autonomous executions queued.`, createdAt: now() });
  if (marketPrices.size === 0) {
    store.saveLog({ id: stableId("log", `${runId}:market`), level: "warn", rule: "MARKET_PRICE", message: "Live market prices were unavailable; execution rules still use configured swap rates.", createdAt: now() });
  }

  for (let index = 1; index <= options.executions; index += 1) {
    const pair = swapPairForIndex(options, index);
    const marketRate = resolveMarketRate(pair.fromToken, pair.toToken, marketPrices);
    const intent = makeIntent(input, index, marketRate);
    const decision = makeDecision(input, intent, index, marketRate);
    const negotiation = makeNegotiation(input, intent, index, marketRate);
    const idempotencyKey = stableId("server-idem", `${runId}:${index}`);
    store.saveIntents([intent]);
    store.saveDecision(decision);
    store.saveNegotiation(negotiation);

    try {
      const result = await adapter.executeValueTransfer({
        intent,
        decision,
        idempotencyKey,
        walletSwap: {
          fromToken: pair.fromToken,
          toToken: pair.toToken,
          fromAmount: options.amount,
          toAmount: String(Math.max(1, Math.trunc(options.amount * (marketRate ?? pair.rate)))),
          rate: marketRate ?? pair.rate,
          recipient: options.counterparty
        }
      });
      const execution: ExecutionRecord = {
        id: stableId("execution", idempotencyKey),
        intentId: intent.id,
        decisionId: decision.id,
        idempotencyKey,
        mode: config.mode,
        txId: result.txId,
        status: result.status,
        token: `${pair.fromToken}->${pair.toToken}`,
        amount: intent.amount,
        counterparty: intent.counterparty,
        createdAt: now(),
        note: result.note,
        quotedRate: result.quotedRate,
        executedRate: result.executedRate,
        realizedProfitPct: result.realizedProfitPct
      };
      store.saveExecution(execution);
      completed += 1;
      store.saveLog({ id: stableId("log", `${runId}:${index}:submitted`), level: "info", rule: "SWAP_SUBMITTED", message: `Server seeded wallet swap ${index}/${options.executions} submitted: ${result.txId}.`, createdAt: now() });
    } catch (error) {
      failed += 1;
      store.saveExecution(failedExecution(input, intent, decision, idempotencyKey, error));
      const message = error instanceof Error ? error.message : String(error);
      store.saveLog({ id: stableId("log", `${runId}:${index}:failed`), level: "error", rule: "BALANCE_CHECK", message: `Server seeded execution ${index}/${options.executions} failed: ${message}`, createdAt: now() });
      store.setRunning(false);
      return { status: "failed", runId, requested: options.executions, completed, failed, message };
    }
  }

  store.setRunning(false);
  store.saveLog({ id: stableId("log", `${runId}:complete`), level: "info", rule: "RUN_COMPLETE", message: `Server seeded wallet demo completed ${completed}/${options.executions} autonomous executions.`, createdAt: now() });
  return { status: "complete", runId, requested: options.executions, completed, failed, message: `Server seeded wallet demo completed ${completed}/${options.executions}.` };
}
