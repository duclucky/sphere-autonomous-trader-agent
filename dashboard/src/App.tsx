import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { AgentTelemetryTable } from "./components/AgentTelemetryTable";
import { LogViewer } from "./components/LogViewer";
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

function formatAverageProfit(executions: ExecutionRecord[]): string {
  const realized = executions
    .map((execution) => execution.realizedProfitPct)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (!realized.length) {
    return "0.00%";
  }
  const average = realized.reduce((sum, value) => sum + value, 0) / realized.length;
  const signed = average >= 0 ? "+" : "";
  return `${signed}${(average * 100).toFixed(2)}%`;
}

export default function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const telemetryRef = useRef<HTMLDetailsElement | null>(null);

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

  const confirmedExecutions = data.executions.filter((execution) => execution.status === "confirmed").length;
  const failedExecutions = data.executions.filter((execution) => execution.status === "failed" || execution.status === "blocked").length;

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
        telemetryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        const result = await startServerSeededDemo();
        void refresh();
        window.setTimeout(() => telemetryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
        return result;
      }} />

      <OperatingRules status={data.status} />

      <details className="legacy-telemetry" open ref={telemetryRef} id="agent-telemetry">
        <summary>Agent Telemetry</summary>
        <div className="telemetry-summary">
          <div><strong>{Math.max(data.intents.length, data.executions.length)}</strong><span>swap runs</span></div>
          <div><strong>{confirmedExecutions}</strong><span>confirmed swaps</span></div>
          <div><strong>{failedExecutions}</strong><span>failed swaps</span></div>
          <div><strong>{formatAverageProfit(data.executions)}</strong><span>avg realized</span></div>
        </div>
        <p className="muted">This view merges intent, decision, execution, and proof into one row per autonomous swap.</p>
        <AgentTelemetryTable intents={data.intents} decisions={data.decisions} negotiations={data.negotiations} executions={data.executions} />
        <details className="raw-logs">
          <summary>Raw Technical Logs</summary>
          <LogViewer logs={data.logs} />
        </details>
      </details>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
