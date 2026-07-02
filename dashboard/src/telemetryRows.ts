import type { Decision, ExecutionRecord, MarketIntent, NegotiationMessage } from "./types";

export interface TelemetryRow {
  id: string;
  sequence: number;
  timestamp: string;
  swapPlan: string;
  swapDetail: string;
  decision: string;
  decisionDetail: string;
  status: ExecutionRecord["status"] | "planned";
  resultDetail: string;
  proof: string;
  proofDetail: string;
  rawProof: string;
}

interface BuildTelemetryRowsInput {
  intents: MarketIntent[];
  decisions: Decision[];
  negotiations: NegotiationMessage[];
  executions: ExecutionRecord[];
}

function shortId(value: string): string {
  return value.length <= 18 ? value : `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }
  if (Number.isInteger(value)) {
    return value.toLocaleString();
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 12 });
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString().slice(11, 19);
}

function formatProfit(value?: number): string {
  if (value === undefined || !Number.isFinite(value)) {
    return "profit pending";
  }
  const signed = value >= 0 ? "+" : "";
  return `realized ${signed}${(value * 100).toFixed(2)}%`;
}

function displayDecision(action?: Decision["action"]): string {
  if (action === "EXECUTE_DIRECTLY") {
    return "EXECUTE";
  }
  return action ?? "PLANNED";
}

function planFromExecution(execution: ExecutionRecord): { plan: string; detail: string } {
  const [fromToken, toToken] = execution.token.split("->");
  const rate = execution.executedRate ?? execution.quotedRate;
  if (fromToken && toToken && rate !== undefined) {
    const outputAmount = execution.amount * rate;
    return {
      plan: `${formatNumber(execution.amount)} ${fromToken} -> ${formatNumber(outputAmount)} ${toToken}`,
      detail: `rate ${formatNumber(rate)} ${toToken}/${fromToken}`
    };
  }
  return {
    plan: `${formatNumber(execution.amount)} ${execution.token}`,
    detail: execution.counterparty
  };
}

function planFromIntent(intent: MarketIntent, negotiation?: NegotiationMessage): { plan: string; detail: string } {
  if (negotiation?.body) {
    const match = negotiation.body.match(/: ([^.]+)\.$/);
    if (match?.[1]) {
      return { plan: match[1], detail: negotiation.counterparty };
    }
  }
  return {
    plan: `${formatNumber(intent.amount)} ${intent.token}`,
    detail: `market ${formatNumber(intent.price)}`
  };
}

export function buildTelemetryRows({ intents, decisions, negotiations, executions }: BuildTelemetryRowsInput): TelemetryRow[] {
  const intentById = new Map(intents.map((intent) => [intent.id, intent]));
  const decisionByIntentId = new Map(decisions.map((decision) => [decision.intentId, decision]));
  const negotiationByIntentId = new Map(negotiations.map((negotiation) => [negotiation.intentId, negotiation]));
  const rows: TelemetryRow[] = [];
  const seenIntentIds = new Set<string>();

  for (const execution of executions) {
    const intent = intentById.get(execution.intentId);
    const decision = decisionByIntentId.get(execution.intentId);
    const plan = planFromExecution(execution);
    seenIntentIds.add(execution.intentId);
    rows.push({
      id: execution.id,
      sequence: rows.length + 1,
      timestamp: formatTimestamp(execution.createdAt),
      swapPlan: plan.plan,
      swapDetail: plan.detail,
      decision: displayDecision(decision?.action),
      decisionDetail: decision?.reason ?? intent?.counterparty ?? "Decision not recorded yet",
      status: execution.status,
      resultDetail: execution.status === "confirmed" ? formatProfit(execution.realizedProfitPct) : execution.note,
      proof: shortId(execution.txId),
      proofDetail: `${execution.mode.toUpperCase()} / ${execution.counterparty}`,
      rawProof: execution.txId
    });
  }

  for (const intent of intents) {
    if (seenIntentIds.has(intent.id)) {
      continue;
    }
    const decision = decisionByIntentId.get(intent.id);
    const negotiation = negotiationByIntentId.get(intent.id);
    const plan = planFromIntent(intent, negotiation);
    rows.push({
      id: intent.id,
      sequence: rows.length + 1,
      timestamp: formatTimestamp(decision?.createdAt ?? negotiation?.createdAt ?? intent.updatedAt),
      swapPlan: plan.plan,
      swapDetail: plan.detail,
      decision: displayDecision(decision?.action),
      decisionDetail: decision?.reason ?? "Waiting for decision",
      status: "planned",
      resultDetail: negotiation?.body ?? "Execution not recorded yet",
      proof: "pending",
      proofDetail: negotiation?.status ?? "no proof yet",
      rawProof: ""
    });
  }

  return rows;
}
