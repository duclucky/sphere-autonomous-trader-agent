import type { Decision } from "../types";

function shortId(value: string) {
  return value.length <= 20 ? value : `${value.slice(0, 10)}…${value.slice(-6)}`;
}

export function DecisionTable({ decisions }: { decisions: Decision[] }) {
  return (
    <section>
      <h2>Agent Decisions</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Action</th><th>Intent</th><th>Profit</th><th>Reason</th></tr></thead>
          <tbody>
            {decisions.map((decision) => (
              <tr key={decision.id}>
                <td><span className={`pill ${decision.action.toLowerCase()}`}>{decision.action}</span></td>
                <td title={decision.intentId} className="mono-cell">{shortId(decision.intentId)}</td>
                <td>{(decision.expectedProfitPct * 100).toFixed(2)}%</td>
                <td title={decision.reason} className="truncate-cell">{decision.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
