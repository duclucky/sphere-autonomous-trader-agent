# Builder Submission

## Short Description

Sphere Autonomous Trader Agent is an autonomous TypeScript agent that monitors Sphere intents, negotiates with counterparties, and executes trades under configured risk rules.

## Track

Autonomous Agents.

## Why It Is Agentic

The operator sets budgets, allowed tokens, and risk thresholds. The agent decides which intent to pursue, whether to negotiate or execute, what message to send, and whether a value-moving action is allowed.

## Sphere SDK Primitives Used

Verified in `@unicitylabs/sphere-sdk` v0.11.0:

- Wallet initialization: `Sphere.init`
- Node providers: `createNodeProviders`
- Wallet API rails: `createWalletApiProviders`
- Intent market: `sphere.market.search`
- Messaging: `sphere.communications.sendDM`
- Payments: `sphere.payments.send`
- Atomic swap/escrow proposal: `sphere.swap.proposeSwap`

## What Moves Value on Testnet v2

Real mode can call `sphere.payments.send`. When `SPHERE_ESCROW_ADDRESS` is configured, execution prefers `sphere.swap.proposeSwap`. Dry-run mode never moves value.

## AstridOS

No direct AstridOS integration is implemented. The app is Node/Vite based and should be portable if AstridOS supports Node.js services and environment variables.

## Demo Steps

```bash
npm install
npm run demo:dry
npm run dev
```

Open `http://127.0.0.1:5173`, press Start, and watch intents, decisions, negotiations, executions, and logs update.

## Repo Structure

See `src/agent`, `src/adapters`, `src/api`, `dashboard/src`, `fixtures`, and `tests`.

## Known Limitations

Real mode requires a funded/testnet wallet, valid nametag resolution for counterparties, and a reachable Sphere wallet API. Fixture market data is intentionally synthetic.

## Roadmap

- Add richer price feeds and external liquidity sources.
- Add signed strategy policies.
- Add persistent SQLite storage.
- Add full swap lifecycle monitoring after escrow proposal.
