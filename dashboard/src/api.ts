import type { AgentState, Decision, ExecutionRecord, LogEntry, MarketIntent, NegotiationMessage, WalletIdentity } from "./types";
import { withApiBaseUrl } from "./apiBase";

export interface StatusResponse {
  running: boolean;
  mode: "dry-run" | "real";
  nametag: string;
  wallet?: WalletIdentity;
  config: {
    network: string;
    maxTradeAmount: number;
    minProfitThreshold: number;
    scanIntervalSeconds: number;
    allowedTokens: string[];
    spendingCapPerRun: number;
    spendingCapPerDay: number;
  };
}

async function getJson<T>(path: string): Promise<T> {
  const url = withApiBaseUrl(path);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status}${await errorDetail(res)}`);
  }
  return res.json() as Promise<T>;
}

async function postJson<T>(path: string): Promise<T> {
  const url = withApiBaseUrl(path);
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    throw new Error(`POST ${path} failed: ${res.status}${await errorDetail(res)}`);
  }
  return res.json() as Promise<T>;
}

async function errorDetail(res: Response): Promise<string> {
  try {
    const body = await res.json() as { message?: unknown; error?: unknown };
    const message = typeof body.message === "string" ? body.message : typeof body.error === "string" ? body.error : "";
    return message ? `: ${message}` : "";
  } catch {
    return "";
  }
}

export async function fetchDashboardState(): Promise<AgentState & { status: StatusResponse }> {
  const [status, intents, decisions, negotiations, executions, logs] = await Promise.all([
    getJson<StatusResponse>("/api/status"),
    getJson<MarketIntent[]>("/api/intents"),
    getJson<Decision[]>("/api/decisions"),
    getJson<NegotiationMessage[]>("/api/negotiations"),
    getJson<ExecutionRecord[]>("/api/executions"),
    getJson<LogEntry[]>("/api/logs")
  ]);
  return { running: status.running, wallet: status.wallet, intents, decisions, negotiations, executions, logs, status };
}

export const startAgent = () => postJson<{ running: boolean }>("/api/agent/start");
export const stopAgent = () => postJson<{ running: boolean }>("/api/agent/stop");
export const startServerSeededDemo = () => postJson<{ running: boolean; runId?: string; requested?: number; message?: string }>("/api/server-demo/start");

export function demoDashboardState(): AgentState & { status: StatusResponse } {
  const now = new Date().toISOString();
  const status: StatusResponse = {
    running: false,
    mode: "dry-run",
    nametag: "sphere-agent-demo",
    wallet: {
      address: "dry_wallet_demo",
      nametag: "sphere-agent-demo",
      network: "testnet-v2",
      mode: "dry-run",
      status: "mock"
    },
    config: {
      network: "testnet-v2",
      maxTradeAmount: 100,
      minProfitThreshold: 0.03,
      scanIntervalSeconds: 10,
      allowedTokens: ["UNICITY", "USDC"],
      spendingCapPerRun: 100,
      spendingCapPerDay: 250
    }
  };
  const intents: MarketIntent[] = [
    {
      id: "demo-profitable-intent",
      counterparty: "@counterparty-alpha",
      side: "sell",
      token: "UNICITY",
      amount: 40,
      price: 0.96,
      fairValue: 1,
      keywords: ["arbitrage", "swap"],
      updatedAt: now,
      riskScore: 0.18
    }
  ];
  const decisions: Decision[] = [
    {
      id: "demo-decision",
      intentId: "demo-profitable-intent",
      action: "NEGOTIATE",
      reason: "Selected: expected spread 4.2% > MIN_PROFIT_THRESHOLD",
      expectedProfitPct: 0.042,
      createdAt: now
    }
  ];
  const negotiations: NegotiationMessage[] = [
    {
      id: "demo-negotiation",
      intentId: "demo-profitable-intent",
      counterparty: "@counterparty-alpha",
      direction: "outbound",
      body: "Demo dry-run negotiation message. This legacy table uses simulated sample data on Vercel.",
      status: "simulated",
      mode: "dry-run",
      createdAt: now
    }
  ];
  const executions: ExecutionRecord[] = [
    {
      id: "demo-execution",
      intentId: "demo-profitable-intent",
      decisionId: "demo-decision",
      idempotencyKey: "demo-idempotency",
      mode: "dry-run",
      txId: "dry-run-tx_demo",
      status: "simulated",
      token: "UNICITY",
      amount: 40,
      counterparty: "@counterparty-alpha",
      createdAt: now,
      note: "Static demo record. No testnet value moved."
    }
  ];
  const logs: LogEntry[] = [
    {
      id: "demo-log",
      level: "info",
      message: "Reviewer demo is running client-side; legacy agent tables show simulated sample data.",
      createdAt: now
    }
  ];
  return { running: false, wallet: status.wallet, intents, decisions, negotiations, executions, logs, status };
}
