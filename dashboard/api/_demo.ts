type ResponseLike = {
  status: (code: number) => ResponseLike;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

const now = () => new Date().toISOString();

export function statusPayload() {
  return {
    running: false,
    mode: "dry-run",
    nametag: "sphere-agent-demo",
    wallet: {
      address: "dry_wallet_vercel_demo",
      nametag: "sphere-agent-demo",
      network: "testnet-v2",
      mode: "dry-run",
      status: "mock"
    },
    config: {
      network: "testnet-v2",
      maxTradeAmount: 100,
      minProfitThreshold: 0.03,
      scanIntervalSeconds: 10,
      allowedTokens: ["UNICITY", "USDC"],
      spendingCapPerRun: 100,
      spendingCapPerDay: 250
    }
  };
}

export function intentsPayload() {
  return [
    {
      id: "vercel-demo-profitable-negotiate",
      counterparty: "@counterparty-alpha",
      side: "sell",
      token: "UNICITY",
      amount: 40,
      price: 0.96,
      fairValue: 1,
      keywords: ["arbitrage", "unicity", "swap"],
      updatedAt: now(),
      riskScore: 0.18
    },
    {
      id: "vercel-demo-missing-counterparty",
      counterparty: "unknown-counterparty",
      side: "sell",
      token: "UNICITY",
      amount: 10,
      price: 0.9,
      fairValue: 1,
      keywords: ["real-market-safety"],
      updatedAt: now(),
      riskScore: 0.12
    }
  ];
}

export function decisionsPayload() {
  return [
    {
      id: "vercel-demo-decision-negotiate",
      intentId: "vercel-demo-profitable-negotiate",
      action: "NEGOTIATE",
      reason: "Selected: expected spread 4.2% > MIN_PROFIT_THRESHOLD",
      expectedProfitPct: 0.042,
      createdAt: now()
    },
    {
      id: "vercel-demo-decision-ignore",
      intentId: "vercel-demo-missing-counterparty",
      action: "IGNORE",
      reason: "Skipped: counterparty is not resolvable",
      expectedProfitPct: 0.11,
      createdAt: now()
    }
  ];
}

export function negotiationsPayload() {
  return [
    {
      id: "vercel-demo-negotiation-outbound",
      intentId: "vercel-demo-profitable-negotiate",
      counterparty: "@counterparty-alpha",
      direction: "outbound",
      body: "Agent sphere-agent-demo proposes an autonomous dry-run trade. This Vercel endpoint is mock/demo only.",
      status: "simulated",
      mode: "dry-run",
      createdAt: now()
    },
    {
      id: "vercel-demo-negotiation-inbound",
      intentId: "vercel-demo-profitable-negotiate",
      counterparty: "@counterparty-alpha",
      direction: "inbound",
      body: "Simulated acceptance from @counterparty-alpha.",
      status: "accepted",
      mode: "dry-run",
      createdAt: now()
    }
  ];
}

export function executionsPayload() {
  return [
    {
      id: "vercel-demo-execution",
      intentId: "vercel-demo-profitable-negotiate",
      decisionId: "vercel-demo-decision-negotiate",
      idempotencyKey: "vercel-demo-idempotency",
      mode: "dry-run",
      txId: "dry-run-tx_vercel_demo",
      status: "simulated",
      token: "UNICITY",
      amount: 40,
      counterparty: "@counterparty-alpha",
      createdAt: now(),
      note: "Vercel mock API record. No real testnet value moved."
    }
  ];
}

export function logsPayload() {
  return [
    {
      id: "vercel-demo-log-1",
      level: "info",
      message: "Vercel mock API active. Dashboard is connected to demo serverless endpoints.",
      createdAt: now()
    },
    {
      id: "vercel-demo-log-2",
      level: "warn",
      message: "This deployment does not run the local autonomous backend or move testnet value.",
      createdAt: now()
    }
  ];
}

export function json(res: ResponseLike, body: unknown, status = 200): void {
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json(body);
}

export function methodNotAllowed(res: ResponseLike): void {
  json(res, { error: "method_not_allowed" }, 405);
}
