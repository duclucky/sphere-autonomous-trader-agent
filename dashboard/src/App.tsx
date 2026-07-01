import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { DecisionTable } from "./components/DecisionTable";
import { ExecutionTable } from "./components/ExecutionTable";
import { IntentTable } from "./components/IntentTable";
import { LogViewer } from "./components/LogViewer";
import { NegotiationPanel } from "./components/NegotiationPanel";
import { OperatingRules } from "./components/OperatingRules";
import { ReviewerDemoPanel } from "./components/ReviewerDemoPanel";
import { demoDashboardState, fetchDashboardState, startServerSeededDemo, type StatusResponse } from "./api";
import { backendOfflineMessage } from "./backendOffline";
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

  if (!data) {
    return <main className="shell"><div className="notice">{error ?? "Loading agent state..."}</div></main>;
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <h1>Sphere Autonomous Trader Agent</h1>
          <p>Backend seeded wallet agent for autonomous Testnet v2 execution</p>
        </div>
        <div className="topbar-actions">
          <div className={`mode ${data.status.mode === "real" ? "real" : "dry"}`}>{data.status.mode === "real" ? "real testnet" : "backend preview"}</div>
        </div>
      </header>

      {error ? <div className="notice">{error}</div> : null}

      <ReviewerDemoPanel onStartServerDemo={async () => {
        const result = await startServerSeededDemo();
        void refresh();
        return result;
      }} />

      <OperatingRules status={data.status} />

      <details className="legacy-telemetry" open>
        <summary>Agent Telemetry</summary>
        <p className="muted">These tables show backend agent telemetry. Use Run Backend Agent above to populate them from the Render seeded wallet and compare each row against the rule snapshot.</p>
        <section className="grid two">
          <IntentTable intents={data.intents} />
          <DecisionTable decisions={data.decisions} />
        </section>
        <section className="grid two">
          <NegotiationPanel negotiations={data.negotiations} />
          <ExecutionTable executions={data.executions} />
        </section>
        <LogViewer logs={data.logs} />
      </details>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
