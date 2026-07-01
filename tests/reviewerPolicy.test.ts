import { createIdempotencyKey, evaluateReviewerPolicy } from "../dashboard/src/reviewerDemo/policy";

const limits = {
  maxTradeAmount: 1,
  maxExecutions: 1,
  dailyCap: 5,
  allowedToken: "1111111111111111111111111111111111111111111111111111111111111111"
};

const connectedWallet = {
  connected: true,
  address: "DIRECT://reviewer",
  networkId: 4
};

describe("reviewer demo policy", () => {
  it("blocks real testnet mode without a connected wallet", () => {
    const decision = evaluateReviewerPolicy({
      mode: "real-testnet",
      explicitStart: true,
      wallet: { connected: false },
      limits,
      amount: 0.1,
      token: limits.allowedToken,
      counterparty: "DIRECT://demo",
      runId: "run-1",
      executionsThisRun: 0,
      spentToday: 0,
      executedIdempotencyKeys: new Set()
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("connected wallet");
  });

  it("blocks real testnet mode on the wrong network", () => {
    const decision = evaluateReviewerPolicy({
      mode: "real-testnet",
      explicitStart: true,
      wallet: { ...connectedWallet, networkId: 1 },
      limits,
      amount: 0.1,
      token: limits.allowedToken,
      counterparty: "DIRECT://demo",
      runId: "run-1",
      executionsThisRun: 0,
      spentToday: 0,
      executedIdempotencyKeys: new Set()
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("Testnet v2");
  });

  it("blocks real execution before explicit reviewer start", () => {
    const decision = evaluateReviewerPolicy({
      mode: "real-testnet",
      explicitStart: false,
      wallet: connectedWallet,
      limits,
      amount: 0.1,
      token: limits.allowedToken,
      counterparty: "DIRECT://demo",
      runId: "run-1",
      executionsThisRun: 0,
      spentToday: 0,
      executedIdempotencyKeys: new Set()
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("explicit");
  });

  it("prevents duplicate real execution with the same idempotency key", () => {
    const idempotencyKey = createIdempotencyKey({
      walletAddress: connectedWallet.address,
      token: limits.allowedToken,
      counterparty: "DIRECT://demo",
      amount: 0.1,
      runId: "run-1"
    });

    const decision = evaluateReviewerPolicy({
      mode: "real-testnet",
      explicitStart: true,
      wallet: connectedWallet,
      limits,
      amount: 0.1,
      token: limits.allowedToken,
      counterparty: "DIRECT://demo",
      runId: "run-1",
      executionsThisRun: 0,
      spentToday: 0,
      executedIdempotencyKeys: new Set([idempotencyKey])
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("Duplicate");
  });

  it("blocks real execution after the max execution limit is reached", () => {
    const decision = evaluateReviewerPolicy({
      mode: "real-testnet",
      explicitStart: true,
      wallet: connectedWallet,
      limits,
      amount: 0.1,
      token: limits.allowedToken,
      counterparty: "DIRECT://demo",
      runId: "run-1",
      executionsThisRun: 1,
      spentToday: 0,
      executedIdempotencyKeys: new Set()
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("Max executions");
  });

  it("blocks real execution when the configured coin id is not 64-hex", () => {
    const decision = evaluateReviewerPolicy({
      mode: "real-testnet",
      explicitStart: true,
      wallet: connectedWallet,
      limits: { ...limits, allowedToken: "UNICITY" },
      amount: 0.1,
      token: "UNICITY",
      counterparty: "DIRECT://demo",
      runId: "run-1",
      executionsThisRun: 0,
      spentToday: 0,
      executedIdempotencyKeys: new Set()
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("64-hex");
  });

  it("allows dry-run demo without a connected wallet and labels it dry-run", () => {
    const decision = evaluateReviewerPolicy({
      mode: "dry-run",
      explicitStart: true,
      wallet: { connected: false },
      limits,
      amount: 0.1,
      token: limits.allowedToken,
      counterparty: "DIRECT://demo",
      runId: "run-1",
      executionsThisRun: 0,
      spentToday: 0,
      executedIdempotencyKeys: new Set()
    });

    expect(decision.allowed).toBe(true);
    expect(decision.modeLabel).toBe("DRY-RUN");
  });
});
