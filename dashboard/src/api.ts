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
    counterparty: string;
    serverDemo: {
      enabled: boolean;
      executions: number;
      amount: number;
      dailyCap: number;
      counterparty: string;
      token: string;
      fromToken: string;
      toToken: string;
      rate: number;
      swapPairs: Array<{ fromToken: string; toToken: string; rate: number }>;
    };
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
      spendingCapPerDay: 250,
      counterparty: "@counterparty-alpha",
      serverDemo: {
        enabled: false,
        executions: 20,
        amount: 1,
        dailyCap: 20,
        counterparty: "sphere-swap",
        token: "BTC",
        fromToken: "BTC",
        toToken: "UCT",
        rate: 1,
        swapPairs: [
          { fromToken: "BTC", toToken: "UCT", rate: 1 },
          { fromToken: "ETH", toToken: "UCT", rate: 1 },
          { fromToken: "SOL", toToken: "UCT", rate: 1 }
        ]
      }
    }
  };
  const intents: MarketIntent[] = [
    {
      id: "demo-profitable-intent",
      counterparty: "sphere-swap",
      side: "sell",
      token: "BTC",
      amount: 1,
      price: 1,
      fairValue: 1.03,
      keywords: ["wallet-swap", "testnet"],
      updatedAt: now,
      riskScore: 0.18
    }
  ];
  const decisions: Decision[] = [
    {
      id: "demo-decision",
      intentId: "demo-profitable-intent",
      action: "EXECUTE_DIRECTLY",
      reason: "Wallet swap rule passed: BTC->UCT, amount within cap, configured edge >= threshold",
      expectedProfitPct: 0.03,
      createdAt: now
    }
  ];
  const negotiations: NegotiationMessage[] = [
    {
      id: "demo-negotiation",
      intentId: "demo-profitable-intent",
      counterparty: "sphere-swap",
      direction: "outbound",
      body: "Demo wallet swap prepared: send BTC to sphere-swap and mint UCT output.",
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
      token: "BTC->UCT",
      amount: 1,
      counterparty: "sphere-swap",
      createdAt: now,
      note: "Static wallet swap preview. Real backend sends input token then mints output token.",
      quotedRate: 1,
      executedRate: 1.125,
      realizedProfitPct: 0.125
    }
  ];
  const logs: LogEntry[] = [
    {
      id: "demo-log",
      level: "info",
      rule: "SWAP_PREVIEW",
      message: "Static preview: backend wallet swap automation uses send + mintFungibleToken on Render.",
      createdAt: now
    }
  ];
  return { running: false, wallet: status.wallet, intents, decisions, negotiations, executions, logs, status };
}
