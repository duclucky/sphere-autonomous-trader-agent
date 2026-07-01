import { runReviewerDemo } from "../dashboard/src/reviewerDemo/runner";
import { MockWalletAdapter } from "../dashboard/src/wallet/mockWalletAdapter";

const coinId = "1111111111111111111111111111111111111111111111111111111111111111";
const limits = {
  maxTradeAmount: 1,
  maxExecutions: 1,
  dailyCap: 5,
  allowedToken: coinId
};

describe("reviewer demo runner", () => {
  it("runs a labeled dry-run flow without connected wallet", async () => {
    const result = await runReviewerDemo({
      mode: "dry-run",
      explicitStart: true,
      wallet: new MockWalletAdapter(),
      limits,
      amount: 0.1,
      counterparty: "DIRECT://demo",
      runId: "run-dry",
      executionLedger: new Set()
    });

    expect(result.proof?.mode).toBe("DRY-RUN");
    expect(result.steps.map((step) => step.label)).toEqual([
      "Connect Wallet",
      "Configure Limits",
      "Start Agent",
      "Scan Intent",
      "Decide",
      "Negotiate",
      "Execute",
      "Show Proof"
    ]);
  });

  it("does not run real execution without explicit start", async () => {
    const result = await runReviewerDemo({
      mode: "real-testnet",
      explicitStart: false,
      wallet: new MockWalletAdapter({
        connected: true,
        address: "DIRECT://reviewer",
        networkId: 4,
        networkName: "testnet2",
        canSign: true,
        transport: "mock"
      }),
      limits,
      amount: 0.1,
      counterparty: "DIRECT://demo",
      runId: "run-real",
      executionLedger: new Set()
    });

    expect(result.proof).toBeUndefined();
    expect(result.status).toBe("blocked");
    expect(result.message).toContain("explicit");
  });

  it("requests a real wallet intent and records proof when policy allows it", async () => {
    const result = await runReviewerDemo({
      mode: "real-testnet",
      explicitStart: true,
      wallet: new MockWalletAdapter({
        connected: true,
        address: "DIRECT://reviewer",
        networkId: 4,
        networkName: "testnet2",
        canSign: true,
        transport: "mock"
      }),
      limits,
      amount: 0.1,
      counterparty: "DIRECT://demo",
      runId: "run-real",
      executionLedger: new Set()
    });

    expect(result.status).toBe("complete");
    expect(result.proof?.mode).toBe("REAL TESTNET");
    expect(result.proof?.proofId).toContain("mock-payment_request");
    expect(result.steps.find((step) => step.label === "Execute")?.status).toBe("complete");
  });
});
