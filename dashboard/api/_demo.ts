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
      spendingCapPerDay: 250,
      counterparty: "@counterparty-alpha",
      serverDemo: {
        enabled: false,
        executions: 20,
        amount: 1,
        dailyCap: 20,
        counterparty: "sphere-swap",
        token: "BTC",
        fromToken: "BTC",
        toToken: "UCT",
        rate: 1,
        swapPairs: [
          { fromToken: "BTC", toToken: "UCT", rate: 1 },
          { fromToken: "ETH", toToken: "UCT", rate: 1 },
          { fromToken: "SOL", toToken: "UCT", rate: 1 }
        ]
      }
    }
  };
}

export function intentsPayload() {
  return [
    {
      id: "vercel-demo-profitable-negotiate",
      counterparty: "sphere-swap",
      side: "sell",
      token: "BTC",
      amount: 1,
      price: 1,
      fairValue: 1.03,
      keywords: ["wallet-swap", "testnet"],
      updatedAt: now(),
      riskScore: 0.18
    },
    {
      id: "vercel-demo-missing-counterparty",
      counterparty: "sphere-swap",
      side: "sell",
      token: "ETH",
      amount: 10,
      price: 0.9,
      fairValue: 1,
      keywords: ["below-threshold"],
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
      action: "EXECUTE_DIRECTLY",
      reason: "Wallet swap rule passed: BTC->UCT, amount within cap, configured edge >= threshold",
      expectedProfitPct: 0.03,
      createdAt: now()
    },
    {
      id: "vercel-demo-decision-ignore",
      intentId: "vercel-demo-missing-counterparty",
      action: "IGNORE",
      reason: "Skipped: configured edge is below MIN_PROFIT_THRESHOLD",
      expectedProfitPct: -0.1,
      createdAt: now()
    }
  ];
}

export function negotiationsPayload() {
  return [
    {
      id: "vercel-demo-negotiation-outbound",
      intentId: "vercel-demo-profitable-negotiate",
      counterparty: "sphere-swap",
      direction: "outbound",
      body: "Agent prepares wallet swap preview: send BTC to sphere-swap, mint UCT output.",
      status: "simulated",
      mode: "dry-run",
      createdAt: now()
    },
    {
      id: "vercel-demo-negotiation-inbound",
      intentId: "vercel-demo-profitable-negotiate",
      counterparty: "sphere-swap",
      direction: "inbound",
      body: "Simulated wallet swap output minted.",
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
      token: "BTC->UCT",
      amount: 1,
      counterparty: "sphere-swap",
      createdAt: now(),
      note: "Vercel mock wallet swap preview. Render backend performs send + mintFungibleToken."
    }
  ];
}

export function logsPayload() {
  return [
    {
      id: "vercel-demo-log-1",
      level: "info",
      rule: "SWAP_PREVIEW",
      message: "Vercel mock API active. Real Render backend runs wallet swap automation.",
      createdAt: now()
    },
    {
      id: "vercel-demo-log-2",
      level: "warn",
      rule: "DEMO_TRACE",
      message: "This deployment does not run the local autonomous backend or move testnet value.",
      createdAt: now()
    }
  ];
}

export function serverDemoUnavailablePayload() {
  return {
    running: false,
    message: "Backend seeded wallet mode requires the Render API. Set VITE_API_BASE_URL to your Render service URL."
  };
}

export function json(res: ResponseLike, body: unknown, status = 200): void {
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json(body);
}

export function methodNotAllowed(res: ResponseLike): void {
  json(res, { error: "method_not_allowed" }, 405);
}
