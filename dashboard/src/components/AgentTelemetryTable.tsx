import { buildTelemetryRows } from "../telemetryRows";
import type { Decision, ExecutionRecord, MarketIntent, NegotiationMessage } from "../types";

interface AgentTelemetryTableProps {
  intents: MarketIntent[];
  decisions: Decision[];
  negotiations: NegotiationMessage[];
  executions: ExecutionRecord[];
}

function statusClass(status: string): string {
  if (status === "confirmed") {
    return "confirmed";
  }
  if (status === "failed" || status === "blocked") {
    return "failed";
  }
  return "pending";
}

export function AgentTelemetryTable({ intents, decisions, negotiations, executions }: AgentTelemetryTableProps) {
  const rows = buildTelemetryRows({ intents, decisions, negotiations, executions });

  return (
    <section className="telemetry-table">
      <div className="section-heading compact">
        <div>
          <h2>Autonomous Swap Runs</h2>
          <p className="muted">Each row follows one agent action from planned swap through decision, result, and proof.</p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="col-sequence">#</th>
              <th>Swap Plan</th>
              <th>Decision</th>
              <th>Result</th>
              <th>Proof</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="run-sequence">
                  <strong>{row.sequence}</strong>
                  <span>{row.timestamp}</span>
                </td>
                <td>
                  <strong className="cell-main">{row.swapPlan}</strong>
                  <span className="cell-sub">{row.swapDetail}</span>
                </td>
                <td>
                  <span className={`pill ${row.decision.toLowerCase()}`}>{row.decision}</span>
                  <span className="cell-sub" title={row.decisionDetail}>{row.decisionDetail}</span>
                </td>
                <td>
                  <span className={`run-status ${statusClass(row.status)}`}>{row.status}</span>
                  <span className="cell-sub" title={row.resultDetail}>{row.resultDetail}</span>
                </td>
                <td>
                  <span className="mono-cell proof-id" title={row.rawProof || row.proof}>{row.proof}</span>
                  <span className="cell-sub">{row.proofDetail}</span>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">Run the backend agent to populate swap telemetry.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
