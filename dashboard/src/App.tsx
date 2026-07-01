import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { AgentStatus } from "./components/AgentStatus";
import { DecisionTable } from "./components/DecisionTable";
import { ExecutionTable } from "./components/ExecutionTable";
import { IntentTable } from "./components/IntentTable";
import { LogViewer } from "./components/LogViewer";
import { NegotiationPanel } from "./components/NegotiationPanel";
import { fetchDashboardState, startAgent, stopAgent, type StatusResponse } from "./api";
import type { Decision, ExecutionRecord, LogEntry, MarketIntent, NegotiationMessage } from "../../src/storage/types";
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
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 2000);
    return () => window.clearInterval(timer);
  }, []);

  const handleStart = async () => {
    await startAgent();
    await refresh();
  };

  const handleStop = async () => {
    await stopAgent();
    await refresh();
  };

  if (!data) {
    return <main className="shell"><div className="notice">{error ?? "Loading agent state..."}</div></main>;
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <h1>Sphere Autonomous Trader Agent</h1>
          <p>Autonomous Agents track dashboard</p>
        </div>
        <div className={`mode ${data.status.mode === "real" ? "real" : "dry"}`}>{data.status.mode === "real" ? "real testnet" : "mock dry-run"}</div>
      </header>

      {error ? <div className="notice error">{error}</div> : null}

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
