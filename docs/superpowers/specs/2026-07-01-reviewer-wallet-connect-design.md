# Reviewer Wallet Connect Design

## Objective

Upgrade AutoIntent Trader so a reviewer can open the deployed Vercel dashboard, connect a Sphere/Unicity Testnet v2 wallet, configure strict limits, start the agent once, and observe an autonomous reviewer demo. The first page must render without a localhost backend. Private seeds must never be requested in the browser.

## Verified SDK Surface

The app will use Sphere Connect v2 from `@unicitylabs/sphere-sdk` v0.11.0:

- `autoConnect` from `@unicitylabs/sphere-sdk/connect/browser`
- `SPHERE_NETWORKS.testnet2` from `@unicitylabs/sphere-sdk/connect`
- query methods: `sphere_getIdentity`, `sphere_getBalance`, `sphere_getAssets`
- intent actions: `send`, `dm`, `payment_request`, `sign_message`, `mint`
- permission scopes: `identity:read`, `balance:read`, `transfer:request`, `dm:request`, `payment:request`, `sign:request`, `mint:request`

Connect rejects wrong-network handshakes with `INCOMPATIBLE_NETWORK`. There is no runtime network-switch API, so the app will fail closed and ask the reviewer to switch/unlock the wallet outside the dApp.

## Architecture

The Vercel dashboard remains a Vite React app rooted at `dashboard`. It gets a new client-side reviewer demo layer that does not require the local Express API to render.

New frontend modules:

- `wallet/types.ts`: shared wallet adapter types and reviewer status model.
- `wallet/realSphereWalletAdapter.ts`: Sphere Connect implementation around `autoConnect`.
- `wallet/reviewerDemoWalletAdapter.ts`: deterministic reviewer demo adapter for no-wallet environments.
- `wallet/mockWalletAdapter.ts`: test-only adapter.
- `reviewerDemo/policy.ts`: validates network, explicit start, limits, allowed token, max executions, daily cap, and idempotency.
- `reviewerDemo/runner.ts`: state machine for the autonomous demo flow.
- `components/ReviewerDemoPanel.tsx`: wallet connection, limit controls, start/stop/reset, proof display.
- `components/AgentFlow.tsx`: visual step tracker.

The existing dashboard tables stay in place, but the reviewer demo becomes the primary first-screen experience. Existing `/api/*` calls remain optional: if unavailable, the dashboard shows local demo data without blocking wallet connect.

## Reviewer Flow

1. Reviewer opens the Vercel URL.
2. App silently attempts reconnect when a previous Sphere Connect session exists.
3. Reviewer clicks `Connect Wallet`.
4. App connects with `SPHERE_NETWORKS.testnet2`, displays wallet identity, nametag if available, network, balance, transport status, and signing capability.
5. Reviewer selects `Dry-run demo` or `Real testnet demo` and configures limits.
6. Reviewer clicks `Start Reviewer Demo`.
7. The agent runs: scan intent, decide, negotiate, execute, show proof.
8. Reviewer can stop or reset the demo state.

## Real Testnet Behavior

Real mode is allowed only when all of these are true:

- wallet is connected
- wallet network is Testnet v2 (`network.id === 4`)
- reviewer explicitly pressed Start
- amount is within max trade amount
- executions for this run are below `MAX_EXECUTIONS_PER_RUN`
- daily cap is not exceeded
- idempotency key has not executed before
- token is allowed

The preferred real execution is a tiny Connect `send` or `payment_request` intent using a configured 64-hex testnet coin id. Intent discovery and negotiation may stay demo-labeled if a live counterparty is not configured. The UI will clearly label each step as `DEMO`, `DRY-RUN`, or `REAL TESTNET`.

Because Sphere Connect intents open wallet UI for user confirmation, the dashboard will show `WAITING FOR WALLET` during execution. The copy will state: reviewer approval is required by wallet security, but the agent independently decides when to request execution.

## Safety

Default real execution amount is tiny. Real mode defaults to max one execution per run. Duplicate execution prevention uses an idempotency key based on wallet, token, counterparty, amount, and run id. The app never stores frontend private keys, never exposes server seeds with `VITE_`, and never runs real mode without explicit reviewer start.

If required configuration is missing, the app fails closed and keeps the reviewer in dry-run/demo mode.

## UX

The dashboard will move to a premium dark cyber trading style with orange glow accents, using:

- `dashboard/public/branding/logo.png`
- `dashboard/public/branding/banner.png`

If those files are absent locally, the UI will use branded text/fallback styling while preserving the expected asset paths.

Visible statuses:

- `WALLET CONNECTED`
- `TESTNET v2`
- `AGENTIC MODE`
- `DRY-RUN`
- `REAL TESTNET`
- `WAITING FOR WALLET`
- `EXECUTION COMPLETE`

## Proof Display

After execution, the dashboard shows:

- proof id or transaction hash returned by the wallet intent
- timestamp
- amount
- token/coin id
- source wallet
- destination/counterparty
- mode
- explorer link only if a verified explorer URL pattern is available

If no explorer pattern is verified, the raw proof id is shown with documentation explaining that it should be verified in the Sphere wallet/network tooling.

## Vercel And Backend

Vercel deployment remains:

- Root Directory: `dashboard`
- Build Command: `npm run build`
- Output Directory: `dist`

The reviewer wallet flow is client-side. The existing local Express API and seeded real agent remain for local operator demos. If a future server-side real agent is deployed, README will document Railway/Render/Fly requirements and required non-`VITE_` secrets.

## Environment

Add or verify:

```env
SPHERE_NETWORK=testnet-v2
SPHERE_MODE=dry-run
SPHERE_AGENT_NAMETAG=autointent-trader
MAX_TRADE_AMOUNT=1
MAX_EXECUTIONS_PER_RUN=1
DAILY_SPEND_CAP=5
ALLOWED_TOKENS=
VITE_PUBLIC_APP_MODE=reviewer-demo
VITE_SPHERE_NETWORK=testnet-v2
VITE_SPHERE_WALLET_URL=https://sphere.unicity.network
VITE_SPHERE_TESTNET_COIN_ID=
```

`SPHERE_WALLET_SEED` remains server/local only and must never be exposed as `VITE_`.

## Tests

Add focused tests for:

- real testnet demo cannot start without connected wallet
- real mode fails closed on wrong network
- max execution limit prevents duplicate execution
- dry-run labels are preserved
- real execution requires explicit reviewer start
- idempotency prevents repeated transaction
- Sphere Connect adapter maps identity, network, balance, and intent errors into UI-safe statuses

Final verification commands:

```bash
npm test
npm run build
cd dashboard
npm run build
```
