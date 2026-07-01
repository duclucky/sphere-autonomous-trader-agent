import type { StatusResponse } from "../api";

interface Props {
  status: StatusResponse;
  onStart: () => Promise<void>;
  onStop: () => Promise<void>;
}

export function AgentStatus({ status, onStart, onStop }: Props) {
  return (
    <section className="status-band">
      <div>
        <span className="label">Status</span>
        <strong>{status.running ? "running" : "stopped"}</strong>
      </div>
      <div>
        <span className="label">Nametag</span>
        <strong>{status.wallet?.nametag ?? status.nametag}</strong>
      </div>
      <div>
        <span className="label">Wallet</span>
        <strong>{status.wallet?.status ?? "unknown"}</strong>
        <small>{status.wallet?.address ?? "not loaded"}</small>
      </div>
      <div>
        <span className="label">Limits</span>
        <strong>{status.config.maxTradeAmount} max / {(status.config.minProfitThreshold * 100).toFixed(1)}% min</strong>
        <small>{status.config.allowedTokens.join(", ")}</small>
      </div>
      <div className="actions">
        <button onClick={() => void onStart()} disabled={status.running}>Start</button>
        <button onClick={() => void onStop()} disabled={!status.running}>Stop</button>
      </div>
    </section>
  );
}
