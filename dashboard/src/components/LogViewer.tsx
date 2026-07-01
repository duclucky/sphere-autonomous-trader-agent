import type { LogEntry } from "../types";

export function LogViewer({ logs }: { logs: LogEntry[] }) {
  return (
    <section>
      <h2>Live Logs</h2>
      <div className="logs">
        {logs.slice(-80).map((log) => (
          <div key={log.id} className={log.level}>
            <span>{log.createdAt}</span>
            <strong>{log.level}</strong>
            <p>{log.message}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
