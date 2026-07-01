# Builder Submission

## Short Description

Sphere Autonomous Trader Agent is an autonomous TypeScript agent that monitors Sphere intents, negotiates with counterparties, and executes trades under configured risk rules.

## Track

Autonomous Agents.

## Why It Is Agentic

The operator sets budgets, allowed tokens, and risk thresholds. The agent decides which intent to pursue, whether to negotiate or execute, what message to send, and whether a value-moving action is allowed.

Reviewers can also connect their own Sphere Testnet v2 wallet in the deployed dashboard, configure strict demo limits, click Start once, and watch the agent run the scan -> decide -> negotiate -> execute -> proof loop.

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

The deployed reviewer demo uses Sphere Connect v2 client-side wallet intents. Intent discovery and negotiation may be labeled `DEMO`; the wallet intent execution is labeled `REAL TESTNET` when a connected Testnet v2 wallet approves it and a valid testnet coin id is configured.

## AstridOS

No direct AstridOS integration is implemented. The app is Node/Vite based and should be portable if AstridOS supports Node.js services and environment variables.

## Demo Steps

```bash
npm install
npm run demo:dry
npm run dev
```

Open `http://127.0.0.1:5173`, press Start, and watch intents, decisions, negotiations, executions, and logs update.

For deployed review:

1. Open the Vercel URL.
2. Click `Connect Wallet`.
3. Approve the Sphere Connect session.
4. Choose `Dry-run demo` or `Real testnet demo`.
5. Configure max trade amount, max executions, daily cap, allowed token/coin id, and counterparty.
6. Click `Start Reviewer Demo`.
7. Review the proof panel for `DRY-RUN`, `DEMO`, or `REAL TESTNET` labels.

## Repo Structure

See `src/agent`, `src/adapters`, `src/api`, `dashboard/src`, `fixtures`, and `tests`.

## Known Limitations

Real mode requires a funded/testnet wallet, valid nametag or direct-address resolution for counterparties, a configured 64-hex testnet coin id, and a reachable Sphere wallet. Fixture market data is intentionally synthetic. Sphere Connect wallet security may require reviewer approval for each real intent; the agent independently decides when to request that approval.

## Roadmap

- Add richer price feeds and external liquidity sources.
- Add signed strategy policies.
- Add persistent SQLite storage.
- Add full swap lifecycle monitoring after escrow proposal.
