import { useEffect, useMemo, useRef, useState } from "react";
import { runReviewerDemo, type ReviewerProof, type ReviewerRunResult, type ReviewerStep } from "../reviewerDemo/runner";
import type { ReviewerLimits } from "../reviewerDemo/policy";
import type { ReviewerDemoMode, SphereWalletAdapter, WalletConnectionState } from "../wallet/types";
import { disconnectedWalletState } from "../wallet/types";
import { createRealSphereWalletAdapter } from "../wallet/realSphereWalletAdapter";
import { AgentFlow } from "./AgentFlow";

const fallbackDemoCoinId = "1111111111111111111111111111111111111111111111111111111111111111";
const defaultCoinId = import.meta.env.VITE_SPHERE_TESTNET_COIN_ID || fallbackDemoCoinId;
const defaultCounterparty = import.meta.env.VITE_SPHERE_DEMO_COUNTERPARTY ?? "@autointent-trader";
const safeDefaultLimits: ReviewerLimits = {
  maxTradeAmount: 1,
  maxExecutions: 1,
  dailyCap: 5,
  allowedToken: defaultCoinId
};

const initialSteps: ReviewerStep[] = [
  "Connect Wallet",
  "Configure Limits",
  "Start Agent",
  "Scan Intent",
  "Decide",
  "Negotiate",
  "Execute",
  "Show Proof"
].map((label) => ({ label: label as ReviewerStep["label"], status: "idle", mode: "DEMO" }));

function compact(value?: string) {
  if (!value) return "not available";
  return value.length > 24 ? `${value.slice(0, 12)}...${value.slice(-8)}` : value;
}

function proofRows(proof: ReviewerProof) {
  return [
    ["Proof", proof.proofId],
    ["Timestamp", proof.timestamp],
    ["Amount", proof.amount.toString()],
    ["Token / Coin ID", proof.token],
    ["Source", proof.sourceWallet],
    ["Destination", proof.counterparty],
    ["Mode", proof.mode]
  ];
}

export function ReviewerDemoPanel({ adapter, onStartServerDemo }: { adapter?: SphereWalletAdapter; onStartServerDemo?: () => Promise<{ requested?: number; message?: string }> }) {
  const walletAdapter = useMemo(() => adapter ?? createRealSphereWalletAdapter(), [adapter]);
  const executionLedger = useRef(new Set<string>());
  const [wallet, setWallet] = useState<WalletConnectionState>(disconnectedWalletState());
  const [mode, setMode] = useState<ReviewerDemoMode>("dry-run");
  const [limits, setLimits] = useState<ReviewerLimits>(safeDefaultLimits);
  const [amount, setAmount] = useState(1);
  const [counterparty, setCounterparty] = useState(defaultCounterparty);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [steps, setSteps] = useState<ReviewerStep[]>(initialSteps);
  const [result, setResult] = useState<ReviewerRunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [statusText, setStatusText] = useState("AGENTIC MODE");

  useEffect(() => {
    const hasSession = typeof sessionStorage !== "undefined" && sessionStorage.getItem("sphere-session");
    if (!hasSession) return;
    void walletAdapter.connect({ silent: true }).then(setWallet);
  }, [walletAdapter]);

  const connectWallet = async () => {
    setStatusText("CONNECTING WALLET");
    const next = await walletAdapter.connect();
    setWallet(next);
    setStatusText(next.connected ? "WALLET CONNECTED" : "CONNECT WALLET");
  };

  const startDemo = async () => {
    setRunning(true);
    setResult(null);
    setStatusText(mode === "real-testnet" ? "WAITING FOR WALLET" : "DRY-RUN");
    setSteps(initialSteps.map((step) => step.label === "Execute" ? { ...step, status: "active", mode: mode === "real-testnet" ? "REAL TESTNET" : "DRY-RUN" } : { ...step, status: "complete" }));

    const next = await runReviewerDemo({
      mode,
      explicitStart: true,
      wallet: walletAdapter,
      limits,
      amount,
      counterparty,
      runId: `reviewer-${Date.now()}`,
      executionLedger: executionLedger.current
    });

    setResult(next);
    setSteps(next.steps);
    setStatusText(next.status === "complete" ? "EXECUTION COMPLETE" : "AGENT BLOCKED");
    setWallet(await walletAdapter.getState());
    setRunning(false);
  };

  const startBackendAgent = async () => {
    if (!onStartServerDemo) {
      setStatusText("BACKEND AGENT UNAVAILABLE");
      return;
    }
    setRunning(true);
    setResult(null);
    setStatusText("BACKEND AGENT RUNNING");
    setSteps(initialSteps.map((step) => ({ ...step, status: "complete", mode: step.label === "Scan Intent" || step.label === "Negotiate" ? "DEMO" : "REAL TESTNET" })));
    try {
      const response = await onStartServerDemo();
      setStatusText(`BACKEND AGENT QUEUED ${response.requested ?? 20}`);
    } catch (error) {
      setStatusText("BACKEND AGENT BLOCKED");
      setResult({
        status: "blocked",
        message: error instanceof Error ? error.message : "Backend seeded wallet agent could not start.",
        steps: initialSteps.map((step) => ({ ...step, status: step.label === "Execute" ? "blocked" : "complete", mode: "REAL TESTNET" }))
      });
    } finally {
      setRunning(false);
    }
  };

  const stopDemo = () => {
    setRunning(false);
    setStatusText("AGENT STOPPED");
  };

  const resetDemo = () => {
    executionLedger.current.clear();
    setSteps(initialSteps);
    setResult(null);
    setStatusText("AGENTIC MODE");
  };

  const useSafeDefaults = () => {
    setLimits(safeDefaultLimits);
    setAmount(1);
    setCounterparty(defaultCounterparty);
    setStatusText("SAFE DEFAULTS LOADED");
  };

  const hasRealConfig = Boolean(limits.allowedToken && counterparty);
  const realReady = wallet.connected && wallet.networkId === 4 && hasRealConfig;

  return (
    <section className="reviewer-panel">
      <div className="hero">
        <div className="hero-media" aria-hidden="true" />
        <div className="hero-content">
          <div className="brand-row">
            <img src="/branding/logo.png" alt="" />
            <span>AutoIntent Trader</span>
          </div>
          <h1>Sphere Testnet v2 Reviewer Demo</h1>
          <p>
            Connect a Sphere wallet, set strict limits, start once, and watch the agent scan, decide, negotiate, execute, and show proof.
          </p>
          <div className="hero-actions">
            <button id="reviewer-connect" onClick={connectWallet} type="button">{wallet.connected ? "Reconnect Wallet" : "Connect Wallet"}</button>
            <span className={`status-chip ${wallet.connected ? "success" : ""}`}>{wallet.connected ? "WALLET CONNECTED" : "CONNECT WALLET"}</span>
            <span className="status-chip">TESTNET v2</span>
            <span className={`status-chip ${mode === "real-testnet" ? "real" : "dry"}`}>{mode === "real-testnet" ? "REAL TESTNET" : "DRY-RUN"}</span>
          </div>
        </div>
      </div>

      <div className="reviewer-grid">
        <div className="panel-block wallet-block">
          <h2>Reviewer Wallet</h2>
          {wallet.error ? <div className="inline-error">{wallet.error}</div> : null}
          <dl className="kv">
            <div><dt>Address</dt><dd title={wallet.address}>{compact(wallet.address)}</dd></div>
            <div><dt>Identity</dt><dd>{wallet.nametag ?? wallet.chainPubkey ?? "not connected"}</dd></div>
            <div><dt>Network</dt><dd>{wallet.networkName ?? "Testnet v2 target"} {wallet.networkId ? `(${wallet.networkId})` : ""}</dd></div>
            <div><dt>Balance</dt><dd>{wallet.balanceLabel ?? "not loaded"}</dd></div>
            <div><dt>Transport</dt><dd>{wallet.transport}</dd></div>
            <div><dt>Signing</dt><dd>{wallet.canSign ? "available" : "not available"}</dd></div>
          </dl>
        </div>

        <div className="panel-block controls-block">
          <h2>Reviewer Demo</h2>
          <p className="muted">Reviewer wallet mode asks the wallet for approval. Backend agent mode uses the deployer seeded wallet on Render and fills legacy telemetry.</p>
          <div className="segmented">
            <button className={mode === "dry-run" ? "selected" : ""} onClick={() => setMode("dry-run")} type="button">Dry-run demo</button>
            <button className={mode === "real-testnet" ? "selected" : ""} onClick={() => setMode("real-testnet")} type="button">Real testnet demo</button>
          </div>
          <div className="config-summary">
            <div><strong>{amount}</strong><span>base-unit amount</span></div>
            <div><strong>{limits.maxExecutions}</strong><span>execution per run</span></div>
            <div><strong>{limits.dailyCap}</strong><span>daily cap</span></div>
          </div>
          <div className="button-row">
            <button className="secondary" onClick={useSafeDefaults} type="button">Use safe demo defaults</button>
            <button disabled={running || (mode === "real-testnet" && !realReady)} onClick={startDemo} type="button">Start Reviewer Demo</button>
            <button className="secondary" disabled={running} onClick={startBackendAgent} type="button">Run Backend Agent</button>
            <button className="secondary" onClick={stopDemo} type="button">Stop Agent</button>
            <button className="ghost" onClick={resetDemo} type="button">Reset Demo State</button>
          </div>
          {mode === "real-testnet" && !realReady ? <small>Real testnet needs a connected Testnet v2 wallet and deployer demo token settings. You can run dry-run now.</small> : null}
          <button className="ghost advanced-toggle" onClick={() => setShowAdvanced((value) => !value)} type="button">
            {showAdvanced ? "Hide advanced settings" : "Advanced settings"}
          </button>
          {showAdvanced ? (
            <div className="advanced-settings">
              <label>
                Max trade amount
                <input min="0.000001" step="0.01" type="number" value={limits.maxTradeAmount} onChange={(event) => setLimits({ ...limits, maxTradeAmount: Number(event.target.value) })} />
              </label>
              <label>
                Max executions
                <input min="1" max="1" step="1" type="number" value={limits.maxExecutions} onChange={(event) => setLimits({ ...limits, maxExecutions: Number(event.target.value) })} />
              </label>
              <label>
                Daily cap
                <input min="0.000001" step="0.01" type="number" value={limits.dailyCap} onChange={(event) => setLimits({ ...limits, dailyCap: Number(event.target.value) })} />
              </label>
              <label>
                Amount (base units)
                <input min="1" step="1" type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
              </label>
              <label>
                Allowed token / testnet coin id
                <input value={limits.allowedToken} onChange={(event) => setLimits({ ...limits, allowedToken: event.target.value.trim() })} placeholder="64-hex testnet coin id" />
              </label>
              <label>
                Destination / counterparty
                <input value={counterparty} onChange={(event) => setCounterparty(event.target.value.trim())} placeholder="@nametag or DIRECT://..." />
              </label>
            </div>
          ) : null}
        </div>
      </div>

      <div className="panel-block flow-block">
        <div className="status-line">
          <strong>{statusText}</strong>
          <span>Backend seeded mode runs autonomously from the Render wallet seed; reviewer wallet mode keeps wallet approval as the checkpoint.</span>
        </div>
        <AgentFlow steps={steps} />
      </div>

      <div className="panel-block proof-block">
        <h2>Proof</h2>
        {result?.message ? <p className={result.status === "blocked" ? "inline-error" : "proof-note"}>{result.message}</p> : null}
        {result?.proof ? (
          <dl className="proof-grid">
            {proofRows(result.proof).map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd title={value}>{compact(value)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="muted">No execution proof yet. Start a dry-run or real testnet reviewer demo.</p>
        )}
        <small>No verified explorer URL pattern is configured. Verify raw proof ids in Sphere wallet or network tooling.</small>
      </div>
    </section>
  );
}
