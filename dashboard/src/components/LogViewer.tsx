import type { LogEntry } from "../types";

export function LogViewer({ logs }: { logs: LogEntry[] }) {
  return (
    <section>
      <div className="section-heading compact">
        <div>
          <h2>Live Logs</h2>
          <p className="muted">Each row includes the rule tag emitted by the backend so you can cross-check the decision path.</p>
        </div>
      </div>
      <div className="logs">
        <div className="log-head">
          <span>Timestamp</span>
          <span>Level</span>
          <span>Rule</span>
          <span>Message</span>
        </div>
        {logs.slice(-80).map((log) => (
          <div key={log.id} className={`log-entry ${log.level}`}>
            <span>{log.createdAt}</span>
            <strong>{log.level}</strong>
            <span className="log-rule">{log.rule ?? "trace"}</span>
            <p>{log.message}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
