import type { Decision, ExecutionRecord } from "../types";

function shortId(value: string) {
  return value.length <= 20 ? value : `${value.slice(0, 10)}…${value.slice(-6)}`;
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

export function DecisionTable({ decisions, executions }: { decisions: Decision[]; executions: ExecutionRecord[] }) {
  const executionByDecisionId = new Map(executions.map((execution) => [execution.decisionId, execution]));
  return (
    <section>
      <h2>Agent Decisions</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Action</th><th>Intent</th><th>Realized Profit</th><th>Reason</th></tr></thead>
          <tbody>
            {decisions.map((decision) => {
              const execution = executionByDecisionId.get(decision.id);
              const realizedProfitPct = execution?.realizedProfitPct ?? decision.expectedProfitPct;
              return (
                <tr key={decision.id}>
                  <td><span className={`pill ${decision.action.toLowerCase()}`}>{decision.action}</span></td>
                  <td title={decision.intentId} className="mono-cell">{shortId(decision.intentId)}</td>
                  <td title={execution ? `Execution result: ${execution.note}` : "Execution not recorded yet"}>
                    {formatPercent(realizedProfitPct)}
                  </td>
                  <td title={decision.reason} className="truncate-cell">{decision.reason}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
