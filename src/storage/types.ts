export type SphereMode = "dry-run" | "real";
export type DecisionAction = "IGNORE" | "NEGOTIATE" | "EXECUTE_DIRECTLY";

export interface AgentConfig {
  network: "testnet-v2";
  walletSeed?: string;
  agentNametag: string;
  mode: SphereMode;
  walletApiBaseUrl: string;
  oracleApiKey?: string;
  deviceId: string;
  escrowAddress?: string;
  maxTradeAmount: number;
  minProfitThreshold: number;
  scanIntervalSeconds: number;
  allowedTokens: string[];
  keywordFilters: string[];
  counterpartyBlocklist: string[];
  spendingCapPerRun: number;
  spendingCapPerDay: number;
}

export interface WalletIdentity {
  address: string;
  nametag: string;
  network: string;
  mode: SphereMode;
  status: "mock" | "loaded" | "unavailable";
}

export interface IntentFilters {
  keywords?: string[];
  tokens?: string[];
  maxPrice?: number;
  counterparties?: string[];
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
  quotedRate?: number;
  executedRate?: number;
  realizedProfitPct?: number;
}

export interface LogEntry {
  id: string;
  level: "info" | "warn" | "error";
  rule?: string;
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

export interface ScanResult {
  intents: MarketIntent[];
}

export interface NegotiationResult {
  outbound: NegotiationMessage;
  inbound?: NegotiationMessage;
  accepted: boolean;
}

export interface ExecuteValueTransferRequest {
  intent: MarketIntent;
  decision: Decision;
  idempotencyKey: string;
  walletSwap?: WalletSwapPlan;
}

export interface ExecuteValueTransferResult {
  txId: string;
  status: ExecutionRecord["status"];
  note: string;
  quotedRate?: number;
  executedRate?: number;
  realizedProfitPct?: number;
}

export interface WalletSwapPlan {
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: string;
  rate: number;
  recipient: string;
}
