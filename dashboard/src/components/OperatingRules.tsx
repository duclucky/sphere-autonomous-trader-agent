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
  const swapPairs = status.config.serverDemo.swapPairs.length
    ? status.config.serverDemo.swapPairs
    : [{ fromToken: status.config.serverDemo.fromToken, toToken: status.config.serverDemo.toToken, rate: status.config.serverDemo.rate }];
  const swapRotation = swapPairs.map((pair) => `${pair.fromToken}->${pair.toToken}`).join(", ");
  const quoteRules = swapPairs.map((pair) => `${pair.rate} ${pair.toToken}/${pair.fromToken}`).join(", ");
  const rules = [
    { label: "Run gate", value: status.running ? "RUNNING" : "IDLE", detail: "The backend starts only when the operator clicks Run Backend Agent." },
    { label: "Network", value: status.config.network, detail: "Only Testnet v2 is allowed." },
    { label: "Mode", value: modeLabel, detail: "Real mode performs the same send + mint flow used by the Sphere wallet swap screen." },
    { label: "Source wallet", value: sourceWallet, detail: walletAddress },
    { label: "Swap rotation", value: swapRotation, detail: `Round-robin across ${swapPairs.length} configured pair(s). Allowed scan tokens: ${status.config.allowedTokens.join(", ")}.` },
    { label: "Swap recipient", value: status.config.serverDemo.counterparty, detail: "The input token is sent to the same swap stub used by the wallet UI." },
    { label: "Quote rules", value: quoteRules, detail: `Minimum configured edge is ${(status.config.minProfitThreshold * 100).toFixed(2)}%.` },
    { label: "Execution size", value: `${status.config.serverDemo.amount} base unit each`, detail: `${status.config.serverDemo.executions} max swaps; demo cap is ${formatCap(status.config.serverDemo.dailyCap)}.` }
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
        <span>Logs should move through RUN_GATE, SWAP_SUBMITTED, and RUN_COMPLETE; failures include the token pair and coin id that caused the stop.</span>
      </div>
    </section>
  );
}
