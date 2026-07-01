import type { ExecutionRecord } from "../types";

export function ExecutionTable({ executions }: { executions: ExecutionRecord[] }) {
  return (
    <section>
      <h2>Executions</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Status</th><th>Mode</th><th>Tx / Swap</th><th>Amount</th><th>Note</th></tr></thead>
          <tbody>
            {executions.map((execution) => (
              <tr key={execution.id}>
                <td>{execution.status}</td>
                <td><span className={`mode-inline ${execution.mode === "real" ? "real" : "dry"}`}>{execution.mode}</span></td>
                <td>{execution.txId}</td>
                <td>{execution.amount} {execution.token}</td>
                <td>{execution.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
