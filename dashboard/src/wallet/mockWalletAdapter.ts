import { disconnectedWalletState, type SphereWalletAdapter, type WalletConnectionState, type WalletIntentAction, type WalletIntentResult } from "./types";

export class MockWalletAdapter implements SphereWalletAdapter {
  private state: WalletConnectionState;

  constructor(initialState: Partial<WalletConnectionState> = {}) {
    this.state = { ...disconnectedWalletState(), ...initialState };
  }

  async connect(): Promise<WalletConnectionState> {
    this.state = {
      connected: true,
      address: this.state.address ?? "DIRECT://mock-reviewer",
      chainPubkey: this.state.chainPubkey ?? "mock-chain-pubkey",
      nametag: this.state.nametag ?? "@mock-reviewer",
      networkId: this.state.networkId ?? 4,
      networkName: this.state.networkName ?? "testnet2",
      canSign: this.state.canSign ?? true,
      transport: this.state.transport === "disconnected" ? "mock" : this.state.transport,
      balanceLabel: this.state.balanceLabel ?? "1 TEST"
    };
    return this.state;
  }

  async disconnect(): Promise<void> {
    this.state = disconnectedWalletState();
  }

  async getState(): Promise<WalletConnectionState> {
    return this.state;
  }

  async requestIntent(action: WalletIntentAction, params: Record<string, unknown>): Promise<WalletIntentResult> {
    if (!this.state.connected || !this.state.canSign) {
      return { status: "failed", error: "Wallet is not connected or cannot sign." };
    }
    const proofSeed = [action, params.to, params.amount, params.coinId].filter(Boolean).join("-");
    return {
      status: "submitted",
      proofId: `mock-${proofSeed || action}`,
      raw: { action, params }
    };
  }
}
