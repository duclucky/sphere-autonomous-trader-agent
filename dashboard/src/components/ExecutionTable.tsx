import type { ExecutionRecord } from "../types";

function shortId(value: string) {
  return value.length <= 20 ? value : `${value.slice(0, 10)}…${value.slice(-6)}`;
}

function formatRate(rate?: number, execution?: { token: string }) {
  if (rate === undefined) {
    return "—";
  }
  const [fromToken, toToken] = execution?.token.split("->") ?? [];
  return fromToken && toToken ? `${rate.toFixed(4)} ${toToken}/${fromToken}` : rate.toFixed(4);
}

export function ExecutionTable({ executions }: { executions: ExecutionRecord[] }) {
  return (
    <section>
      <h2>Executions</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Status</th><th>Mode</th><th>Tx / Swap</th><th>Rate</th><th>Amount</th><th>Note</th></tr></thead>
          <tbody>
            {executions.map((execution) => (
              <tr key={execution.id}>
                <td>{execution.status}</td>
                <td><span className={`mode-inline ${execution.mode === "real" ? "real" : "dry"}`}>{execution.mode}</span></td>
                <td title={execution.txId} className="mono-cell">{shortId(execution.txId)}</td>
                <td title={execution.quotedRate !== undefined ? `Quote ${execution.quotedRate}; Executed ${execution.executedRate ?? execution.quotedRate}` : undefined}>
                  {formatRate(execution.executedRate, execution)}
                </td>
                <td>{execution.amount} {execution.token}</td>
                <td title={execution.note} className="truncate-cell">{execution.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
