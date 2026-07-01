import type { AgentState, Decision, ExecutionRecord, LogEntry, MarketIntent, NegotiationMessage, WalletIdentity } from "../../src/storage/types";

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
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function postJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { method: "POST" });
  if (!res.ok) {
    throw new Error(`POST ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
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
