import { useState } from "react";
import { AgentFlow, type AgentFlowStep } from "./AgentFlow";

interface BackendStartResult {
  requested?: number;
  message?: string;
}

interface ReviewerDemoPanelProps {
  onStartServerDemo?: () => Promise<BackendStartResult>;
}

const backendDefaults = [
  ["Network", "Testnet v2"],
  ["Wallet", "Render seeded wallet"],
  ["Swap rotation", "BTC/ETH/SOL -> UCT"],
  ["Action", "send + mint"],
  ["Amount", "1 base unit input"],
  ["Daily cap", "20 base units"],
  ["Recipient", "sphere-swap"]
];

const initialSteps: AgentFlowStep[] = [
  "Load Server Wallet",
  "Apply Defaults",
  "Start Agent",
  "Scan Balance",
  "Decide",
  "Build Swap",
  "Send Input",
  "Mint Output",
  "Write Telemetry"
].map((label) => ({ label, status: "idle", mode: "REAL TESTNET" }));

function runningSteps(): AgentFlowStep[] {
  return initialSteps.map((step) => ({
    ...step,
    status: step.label === "Send Input" || step.label === "Mint Output" ? "active" : "complete",
    mode: step.label === "Scan Balance" || step.label === "Build Swap" ? "AGENT" : "REAL TESTNET"
  }));
}

function completeSteps(): AgentFlowStep[] {
  return initialSteps.map((step) => ({
    ...step,
    status: "complete",
    mode: step.label === "Scan Balance" || step.label === "Build Swap" ? "AGENT" : "REAL TESTNET"
  }));
}

function blockedSteps(): AgentFlowStep[] {
  return initialSteps.map((step) => ({
    ...step,
    status: step.label === "Send Input" || step.label === "Mint Output" ? "blocked" : "complete",
    mode: "REAL TESTNET"
  }));
}

export function ReviewerDemoPanel({ onStartServerDemo }: ReviewerDemoPanelProps) {
  const [steps, setSteps] = useState<AgentFlowStep[]>(initialSteps);
  const [running, setRunning] = useState(false);
  const [statusText, setStatusText] = useState("READY");
  const [message, setMessage] = useState("Press the button once. The Render backend uses the configured server-side Sphere seed to run the wallet swap flow and write telemetry below.");
  const [isError, setIsError] = useState(false);

  const startBackendAgent = async () => {
    if (!onStartServerDemo) {
      setStatusText("BACKEND UNAVAILABLE");
      setMessage("Backend agent endpoint is not configured for this deployment.");
      setIsError(true);
      return;
    }

    setRunning(true);
    setIsError(false);
    setStatusText("RUNNING");
    setMessage("Backend agent request sent. Telemetry refreshes automatically after the run starts.");
    setSteps(runningSteps());

    try {
      const response = await onStartServerDemo();
      setStatusText("EXECUTION COMPLETE");
      setMessage(response.message ?? `Backend agent queued ${response.requested ?? 20} wallet swap action(s). Check Agent Telemetry below.`);
      setSteps(completeSteps());
    } catch (error) {
      setStatusText("BACKEND BLOCKED");
      setMessage(error instanceof Error ? error.message : "Backend seeded wallet agent could not start.");
      setIsError(true);
      setSteps(blockedSteps());
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="reviewer-panel">
      <div className="hero">
        <div className="hero-media" aria-hidden="true" />
        <div className="hero-content">
          <div className="brand-row">
            <img src="/branding/logo.png" alt="" />
            <span>AutoIntent Trader</span>
          </div>
          <h1>Backend Seeded Wallet Swap Agent</h1>
          <p>
            One-click Testnet v2 run from the Render backend wallet seed. The agent rotates across configured pairs, sends input to the swap stub, mints output, and records proof.
          </p>
          <div className="hero-actions">
            <button disabled={running} onClick={startBackendAgent} type="button">
              {running ? "Running..." : "Run Backend Agent"}
            </button>
            <span className="status-chip real">REAL TESTNET</span>
            <span className="status-chip success">SERVER SEEDED</span>
            <span className="status-chip">20 MAX</span>
          </div>
        </div>
      </div>

      <div className="panel-block backend-agent-card">
        <div className="backend-agent-copy">
          <h2>Backend Agent</h2>
          <p className="muted">
            The agent uses defaults from Render environment variables, executes the Sphere wallet swap flow from the server wallet, and fills the telemetry tables automatically.
          </p>
          <p className={isError ? "inline-error" : "proof-note"}>{message}</p>
        </div>

        <dl className="kv backend-defaults">
          {backendDefaults.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="panel-block flow-block">
        <div className="status-line">
          <strong>{statusText}</strong>
          <span>Backend seeded mode runs the wallet swap flow autonomously from the Render wallet seed and publishes proof through telemetry.</span>
        </div>
        <AgentFlow steps={steps} />
      </div>
    </section>
  );
}
