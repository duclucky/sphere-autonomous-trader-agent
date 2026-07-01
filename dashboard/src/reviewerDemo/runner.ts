import { evaluateReviewerPolicy, type ReviewerLimits } from "./policy";
import type { ReviewerDemoMode, ReviewerModeLabel, SphereWalletAdapter } from "../wallet/types";

export type ReviewerStepStatus = "idle" | "active" | "complete" | "blocked";
export type ReviewerStepLabel =
  | "Connect Wallet"
  | "Configure Limits"
  | "Start Agent"
  | "Scan Intent"
  | "Decide"
  | "Negotiate"
  | "Execute"
  | "Show Proof";

export interface ReviewerStep {
  label: ReviewerStepLabel;
  status: ReviewerStepStatus;
  mode: "DEMO" | "DRY-RUN" | "REAL TESTNET";
}

export interface ReviewerProof {
  proofId: string;
  timestamp: string;
  amount: number;
  token: string;
  sourceWallet: string;
  counterparty: string;
  mode: ReviewerModeLabel;
  raw?: unknown;
}

export interface ReviewerRunInput {
  mode: ReviewerDemoMode;
  explicitStart: boolean;
  wallet: SphereWalletAdapter;
  limits: ReviewerLimits;
  amount: number;
  counterparty: string;
  runId: string;
  executionLedger: Set<string>;
  spentToday?: number;
  executionsThisRun?: number;
}

export interface ReviewerRunResult {
  status: "blocked" | "complete";
  message: string;
  steps: ReviewerStep[];
  proof?: ReviewerProof;
  idempotencyKey?: string;
}

const stepLabels: ReviewerStepLabel[] = [
  "Connect Wallet",
  "Configure Limits",
  "Start Agent",
  "Scan Intent",
  "Decide",
  "Negotiate",
  "Execute",
  "Show Proof"
];

function makeSteps(mode: ReviewerDemoMode, executeStatus: ReviewerStepStatus, proofStatus: ReviewerStepStatus): ReviewerStep[] {
  const modeLabel = mode === "real-testnet" ? "REAL TESTNET" : "DRY-RUN";
  return stepLabels.map((label) => ({
    label,
    status: label === "Execute" ? executeStatus : label === "Show Proof" ? proofStatus : "complete",
    mode: label === "Scan Intent" || label === "Negotiate" ? "DEMO" : modeLabel
  }));
}

function toBaseUnitAmount(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "1";
  return Math.max(1, Math.ceil(amount)).toString();
}

export async function runReviewerDemo(input: ReviewerRunInput): Promise<ReviewerRunResult> {
  const walletState = await input.wallet.getState();
  const policy = evaluateReviewerPolicy({
    mode: input.mode,
    explicitStart: input.explicitStart,
    wallet: {
      connected: walletState.connected,
      address: walletState.address,
      networkId: walletState.networkId
    },
    limits: input.limits,
    amount: input.amount,
    token: input.limits.allowedToken,
    counterparty: input.counterparty,
    runId: input.runId,
    executionsThisRun: input.executionsThisRun ?? 0,
    spentToday: input.spentToday ?? 0,
    executedIdempotencyKeys: input.executionLedger
  });

  if (!policy.allowed) {
    return {
      status: "blocked",
      message: policy.reason ?? "Reviewer demo blocked by policy.",
      steps: makeSteps(input.mode, "blocked", "idle"),
      idempotencyKey: policy.idempotencyKey
    };
  }

  if (input.mode === "dry-run") {
    const proof: ReviewerProof = {
      proofId: `dry-run-proof-${input.runId}`,
      timestamp: new Date().toISOString(),
      amount: input.amount,
      token: input.limits.allowedToken,
      sourceWallet: walletState.address ?? "dry-run-reviewer",
      counterparty: input.counterparty,
      mode: "DRY-RUN",
      raw: { simulated: true }
    };
    return {
      status: "complete",
      message: "Dry-run reviewer demo completed with simulated proof.",
      steps: makeSteps(input.mode, "complete", "complete"),
      proof,
      idempotencyKey: policy.idempotencyKey
    };
  }

  const intent = await input.wallet.requestIntent("payment_request", {
    to: input.counterparty,
    amount: toBaseUnitAmount(input.amount),
    coinId: input.limits.allowedToken,
    message: "AutoIntent Trader reviewer demo"
  });

  if (intent.status !== "submitted" || !intent.proofId) {
    return {
      status: "blocked",
      message: intent.error ?? "Wallet intent was not submitted.",
      steps: makeSteps(input.mode, "blocked", "idle"),
      idempotencyKey: policy.idempotencyKey
    };
  }

  input.executionLedger.add(policy.idempotencyKey);
  const proof: ReviewerProof = {
    proofId: intent.proofId,
    timestamp: new Date().toISOString(),
    amount: input.amount,
    token: input.limits.allowedToken,
    sourceWallet: walletState.address ?? "connected-reviewer",
    counterparty: input.counterparty,
    mode: "REAL TESTNET",
    raw: intent.raw
  };

  return {
    status: "complete",
    message: "Reviewer approval is required by wallet security, but the agent independently decides when to request execution.",
    steps: makeSteps(input.mode, "complete", "complete"),
    proof,
    idempotencyKey: policy.idempotencyKey
  };
}
