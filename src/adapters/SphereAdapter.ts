import type {
  AgentConfig,
  ExecuteValueTransferRequest,
  ExecuteValueTransferResult,
  IntentFilters,
  MarketIntent,
  NegotiationMessage,
  WalletIdentity
} from "../storage/types";

export interface SphereAdapter {
  readonly mode: AgentConfig["mode"];
  loadWallet(): Promise<WalletIdentity>;
  scanIntents(filters: IntentFilters): Promise<MarketIntent[]>;
  sendDirectMessage(message: Omit<NegotiationMessage, "id" | "createdAt" | "status">): Promise<NegotiationMessage>;
  executeValueTransfer(request: ExecuteValueTransferRequest): Promise<ExecuteValueTransferResult>;
}
