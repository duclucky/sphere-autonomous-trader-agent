export type SphereMode = "dry-run" | "real";
export type DecisionAction = "IGNORE" | "NEGOTIATE" | "EXECUTE_DIRECTLY";

export interface WalletIdentity {
  address: string;
  nametag: string;
  network: string;
  mode: SphereMode;
  status: "mock" | "loaded" | "unavailable";
}

export interface MarketIntent {
  id: string;
  counterparty: string;
  side: "buy" | "sell";
  token: string;
  amount: number;
  price: number;
  fairValue: number;
  keywords: string[];
  updatedAt: string;
  riskScore: number;
}

export interface Decision {
  id: string;
  intentId: string;
  action: DecisionAction;
  reason: string;
  expectedProfitPct: number;
  createdAt: string;
}

export interface NegotiationMessage {
  id: string;
  intentId: string;
  counterparty: string;
  direction: "outbound" | "inbound";
  body: string;
  status: "sent" | "accepted" | "rejected" | "expired" | "simulated";
  mode: SphereMode;
  createdAt: string;
}

export interface ExecutionRecord {
  id: string;
  intentId: string;
  decisionId: string;
  idempotencyKey: string;
  mode: SphereMode;
  txId: string;
  status: "submitted" | "confirmed" | "simulated" | "blocked" | "failed";
  token: string;
  amount: number;
  counterparty: string;
  createdAt: string;
  note: string;
}

export interface LogEntry {
  id: string;
  level: "info" | "warn" | "error";
  message: string;
  createdAt: string;
}

export interface AgentState {
  running: boolean;
  wallet?: WalletIdentity;
  intents: MarketIntent[];
  decisions: Decision[];
  negotiations: NegotiationMessage[];
  executions: ExecutionRecord[];
  logs: LogEntry[];
}
