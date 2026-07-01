# Builder Submission

## Short Description

Sphere Autonomous Trader Agent is an autonomous TypeScript agent that runs a backend-seeded Sphere wallet swap flow under configured risk rules and records a full decision/execution trace.

## Track

Autonomous Agents.

## Why It Is Agentic

The operator sets budgets, allowed tokens, swap pair, run caps, and risk thresholds. The agent decides when the configured wallet swap action is allowed, builds the swap plan, executes from the Render server wallet seed, and records the reasoning, SDK calls, and proof IDs.

## Sphere SDK Primitives Used

Verified in `@unicitylabs/sphere-sdk` v0.11.0:

- Wallet initialization: `Sphere.init`
- Node providers: `createNodeProviders`
- Wallet API rails: `createWalletApiProviders`
- Payments: `sphere.payments.send`
- Self-mint output asset: `sphere.payments.mintFungibleToken`

## What Moves Value on Testnet v2

Real backend mode follows the same practical wallet swap flow used by the Sphere wallet UI: send the input asset to the `sphere-swap` stub recipient, then mint the configured output asset into the backend wallet. Dry-run and Vercel fallback data never move value.

## AstridOS

No direct AstridOS integration is implemented. The app is Node/Vite based and should be portable if AstridOS supports Node.js services and environment variables.

## Demo Steps

```bash
npm install
npm run demo:dry
npm run dev
```

Open `http://127.0.0.1:5173`, press `Run Backend Agent`, and watch intents, decisions, swap preparation, executions, and logs update.

For deployed review:

1. Open the Vercel URL.
2. Ensure `VITE_API_BASE_URL` points to the Render backend.
3. Click `Run Backend Agent`.
4. Review Operating Rules and Agent Telemetry to verify the swap pair, send step, mint step, and proof IDs.

## Repo Structure

See `src/agent`, `src/adapters`, `src/api`, `dashboard/src`, `fixtures`, and `tests`.

## Known Limitations

Real mode requires a funded Testnet v2 backend wallet seed, a reachable Sphere wallet API, and a configured swap pair supported by the SDK token registry. The wallet swap flow uses the current wallet-style testnet conversion model rather than a production external liquidity venue.

## Roadmap

- Add richer price feeds and external liquidity sources.
- Add signed strategy policies.
- Add persistent SQLite storage.
- Add full quote-based routing once a production swap quote/execute API is available.
