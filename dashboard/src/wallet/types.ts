export type ReviewerDemoMode = "dry-run" | "real-testnet";
export type ReviewerModeLabel = "DRY-RUN" | "REAL TESTNET";
export type WalletIntentAction = "send" | "dm" | "payment_request" | "sign_message" | "mint";

export interface WalletConnectionState {
  connected: boolean;
  address?: string;
  chainPubkey?: string;
  nametag?: string;
  networkId?: number;
  networkName?: string;
  balanceLabel?: string;
  canSign: boolean;
  transport: "disconnected" | "sphere-connect" | "popup" | "extension" | "iframe" | "reviewer-demo" | "mock";
  error?: string;
}

export interface WalletIntentResult {
  status: "submitted" | "rejected" | "failed";
  proofId?: string;
  raw?: unknown;
  error?: string;
}

export interface SphereWalletAdapter {
  connect(options?: { silent?: boolean }): Promise<WalletConnectionState>;
  disconnect(): Promise<void>;
  getState(): Promise<WalletConnectionState>;
  requestIntent(action: WalletIntentAction, params: Record<string, unknown>): Promise<WalletIntentResult>;
}

export const disconnectedWalletState = (error?: string): WalletConnectionState => ({
  connected: false,
  canSign: false,
  transport: "disconnected",
  error
});
