import { MockWalletAdapter } from "../dashboard/src/wallet/mockWalletAdapter";
import { ReviewerDemoWalletAdapter } from "../dashboard/src/wallet/reviewerDemoWalletAdapter";

describe("reviewer wallet adapters", () => {
  it("connects the reviewer demo wallet with safe testnet defaults", async () => {
    const adapter = new ReviewerDemoWalletAdapter();

    const state = await adapter.connect();

    expect(state.connected).toBe(true);
    expect(state.networkId).toBe(4);
    expect(state.networkName).toBe("testnet2");
    expect(state.canSign).toBe(false);
    expect(state.transport).toBe("reviewer-demo");
  });

  it("returns a real-looking proof from the mock adapter intent", async () => {
    const adapter = new MockWalletAdapter({
      connected: true,
      address: "DIRECT://reviewer",
      networkId: 4,
      networkName: "testnet2",
      canSign: true,
      transport: "mock",
      balanceLabel: "1 TEST"
    });

    const result = await adapter.requestIntent("payment_request", {
      to: "DIRECT://demo",
      amount: "1",
      coinId: "coin"
    });

    expect(result.status).toBe("submitted");
    expect(result.proofId).toContain("mock-payment_request");
  });

  it("uses disconnected defaults before connecting", async () => {
    const adapter = new MockWalletAdapter();

    const state = await adapter.getState();

    expect(state.connected).toBe(false);
    expect(state.canSign).toBe(false);
  });
});
