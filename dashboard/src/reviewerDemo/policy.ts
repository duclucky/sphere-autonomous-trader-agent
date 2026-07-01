import type { ReviewerDemoMode, ReviewerModeLabel } from "../wallet/types";

export interface ReviewerLimits {
  maxTradeAmount: number;
  maxExecutions: number;
  dailyCap: number;
  allowedToken: string;
}

export interface ReviewerPolicyWallet {
  connected: boolean;
  address?: string;
  networkId?: number;
}

export interface IdempotencyInput {
  walletAddress?: string;
  token: string;
  counterparty: string;
  amount: number;
  runId: string;
}

export interface ReviewerPolicyInput {
  mode: ReviewerDemoMode;
  explicitStart: boolean;
  wallet: ReviewerPolicyWallet;
  limits: ReviewerLimits;
  amount: number;
  token: string;
  counterparty: string;
  runId: string;
  executionsThisRun: number;
  spentToday: number;
  executedIdempotencyKeys: ReadonlySet<string>;
}

export interface ReviewerPolicyDecision {
  allowed: boolean;
  modeLabel: ReviewerModeLabel;
  idempotencyKey: string;
  reason?: string;
}

export function createIdempotencyKey(input: IdempotencyInput): string {
  return [
    input.walletAddress ?? "disconnected",
    input.token.toLowerCase(),
    input.counterparty.toLowerCase(),
    input.amount.toString(),
    input.runId
  ].join("|");
}

export function evaluateReviewerPolicy(input: ReviewerPolicyInput): ReviewerPolicyDecision {
  const modeLabel: ReviewerModeLabel = input.mode === "real-testnet" ? "REAL TESTNET" : "DRY-RUN";
  const idempotencyKey = createIdempotencyKey({
    walletAddress: input.wallet.address,
    token: input.token,
    counterparty: input.counterparty,
    amount: input.amount,
    runId: input.runId
  });

  if (!input.explicitStart) {
    return { allowed: false, modeLabel, idempotencyKey, reason: "Real execution requires explicit reviewer start." };
  }

  if (input.mode === "dry-run") {
    return { allowed: true, modeLabel, idempotencyKey };
  }

  if (!input.wallet.connected) {
    return { allowed: false, modeLabel, idempotencyKey, reason: "Real testnet mode requires a connected wallet." };
  }

  if (input.wallet.networkId !== 4) {
    return { allowed: false, modeLabel, idempotencyKey, reason: "Wallet must be connected to Testnet v2." };
  }

  if (!input.limits.allowedToken || input.token.toLowerCase() !== input.limits.allowedToken.toLowerCase()) {
    return { allowed: false, modeLabel, idempotencyKey, reason: "Token is not in the allowed token list." };
  }

  if (!/^[0-9a-f]{64}$/i.test(input.limits.allowedToken)) {
    return { allowed: false, modeLabel, idempotencyKey, reason: "Real testnet mode requires a configured 64-hex coin id." };
  }

  if (input.amount <= 0 || input.amount > input.limits.maxTradeAmount) {
    return { allowed: false, modeLabel, idempotencyKey, reason: "Amount exceeds the reviewer max trade amount." };
  }

  if (input.executionsThisRun >= input.limits.maxExecutions) {
    return { allowed: false, modeLabel, idempotencyKey, reason: "Max executions for this run has been reached." };
  }

  if (input.spentToday + input.amount > input.limits.dailyCap) {
    return { allowed: false, modeLabel, idempotencyKey, reason: "Daily spend cap would be exceeded." };
  }

  if (input.executedIdempotencyKeys.has(idempotencyKey)) {
    return { allowed: false, modeLabel, idempotencyKey, reason: "Duplicate execution prevented by idempotency key." };
  }

  return { allowed: true, modeLabel, idempotencyKey };
}
