import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { AgentStatus } from "./components/AgentStatus";
import { DecisionTable } from "./components/DecisionTable";
import { ExecutionTable } from "./components/ExecutionTable";
import { IntentTable } from "./components/IntentTable";
import { LogViewer } from "./components/LogViewer";
import { NegotiationPanel } from "./components/NegotiationPanel";
import { ReviewerDemoPanel } from "./components/ReviewerDemoPanel";
import { demoDashboardState, fetchDashboardState, startAgent, stopAgent, type StatusResponse } from "./api";
import { backendActionOfflineMessage, backendOfflineMessage } from "./backendOffline";
import type { Decision, ExecutionRecord, LogEntry, MarketIntent, NegotiationMessage } from "./types";
import "./styles.css";

interface DashboardData {
  status: StatusResponse;
  intents: MarketIntent[];
  decisions: Decision[];
  negotiations: NegotiationMessage[];
  executions: ExecutionRecord[];
  logs: LogEntry[];
}

export default function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const next = await fetchDashboardState();
      setData(next);
      setError(null);
    } catch (err) {
      setData(demoDashboardState());
      setError(backendOfflineMessage(err));
    }
  };

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 2000);
    return () => window.clearInterval(timer);
  }, []);

  const handleStart = async () => {
    try {
      await startAgent();
      await refresh();
    } catch (err) {
      setData(demoDashboardState());
      setError(backendActionOfflineMessage("start", err));
    }
  };

  const handleStop = async () => {
    try {
      await stopAgent();
      await refresh();
    } catch (err) {
      setData(demoDashboardState());
      setError(backendActionOfflineMessage("stop", err));
    }
  };

  if (!data) {
    return <main className="shell"><div className="notice">{error ?? "Loading agent state..."}</div></main>;
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <h1>Sphere Autonomous Trader Agent</h1>
          <p>Reviewer wallet connect and autonomous Testnet v2 demo</p>
        </div>
        <div className="topbar-actions">
          <button onClick={() => document.getElementById("reviewer-connect")?.click()} type="button">Connect Wallet</button>
          <div className={`mode ${data.status.mode === "real" ? "real" : "dry"}`}>{data.status.mode === "real" ? "real testnet" : "mock dry-run"}</div>
        </div>
      </header>

      {error ? <div className="notice error">{error}</div> : null}

      <ReviewerDemoPanel />

      <AgentStatus status={data.status} onStart={handleStart} onStop={handleStop} />

      <section className="grid two">
        <IntentTable intents={data.intents} />
        <DecisionTable decisions={data.decisions} />
      </section>

      <section className="grid two">
        <NegotiationPanel negotiations={data.negotiations} />
        <ExecutionTable executions={data.executions} />
      </section>

      <LogViewer logs={data.logs} />
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
