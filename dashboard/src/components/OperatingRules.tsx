import type { StatusResponse } from "../api";

interface OperatingRulesProps {
  status: StatusResponse;
}

function formatCap(value: number): string {
  return `${value} base units`;
}

export function OperatingRules({ status }: OperatingRulesProps) {
  const sourceWallet = status.wallet?.nametag ?? "Render seeded wallet";
  const walletAddress = status.wallet?.address ?? "waiting for backend wallet";
  const modeLabel = status.mode === "real" ? "REAL TESTNET" : "DRY-RUN";
  const rules = [
    { label: "Run gate", value: status.running ? "RUNNING" : "IDLE", detail: "The backend starts only when the operator clicks Run Backend Agent." },
    { label: "Network", value: status.config.network, detail: "Only Testnet v2 is allowed." },
    { label: "Mode", value: modeLabel, detail: "Real mode moves testnet value; dry-run stays simulated." },
    { label: "Source wallet", value: sourceWallet, detail: walletAddress },
    { label: "Token selection", value: status.config.allowedTokens.join(", "), detail: "The backend resolves a spendable coin object from wallet inventory before each send." },
    { label: "Spend cap", value: `${formatCap(status.config.spendingCapPerRun)} / ${formatCap(status.config.spendingCapPerDay)} daily`, detail: "Agent must stay within run and daily limits." },
    { label: "Execution size", value: `${status.config.maxTradeAmount} max trade`, detail: "Each execution stays within the configured amount ceiling." },
    { label: "Counterparty", value: status.config.counterparty, detail: "Telemetry should match the configured destination and logs should show the same target." }
  ];

  return (
    <section className="panel-block operating-rules">
      <div className="section-heading">
        <div>
          <h2>Operating Rules</h2>
          <p className="muted">These are the gates the backend follows. Compare each item against the live logs below.</p>
        </div>
        <span className={`status-chip ${status.mode === "real" ? "real" : "dry"}`}>{modeLabel}</span>
      </div>
      <div className="rule-grid">
        {rules.map((rule) => (
          <article key={rule.label} className="rule-card">
            <span className="rule-label">{rule.label}</span>
            <strong>{rule.value}</strong>
            <p>{rule.detail}</p>
          </article>
        ))}
      </div>
      <div className="rule-trace">
        <strong>Trace format</strong>
        <span>Every log row now includes a rule tag when the backend emits one, so you can map behavior back to the gate that allowed or blocked it.</span>
      </div>
    </section>
  );
}
