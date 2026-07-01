# Sphere Autonomous Trader Agent

Autonomous economic agent for the Unicity Builder Program, track: Autonomous Agents.

The agent monitors Sphere market intents, scores opportunities against budget and risk rules, negotiates through direct messages, and executes value-moving actions when allowed. In `dry-run` mode it uses fixtures and mock transactions only. In `real` mode it uses verified Sphere SDK surfaces from `@unicitylabs/sphere-sdk` v0.11.0: `Sphere.init`, `createNodeProviders`, `createWalletApiProviders`, `sphere.market.search`, `sphere.communications.sendDM`, `sphere.payments.send`, and `sphere.swap.proposeSwap`.

## Why It Is Agentic

A human sets goals, budgets, limits, allowed tokens, and risk rules. The agent independently scans, chooses counterparties, decides whether to ignore, negotiate, or execute directly, sends messages, and executes when constraints pass.

## Setup

```bash
npm install
cp .env.example .env
npm run demo:dry
```

## Environment

- `SPHERE_NETWORK=testnet-v2`
- `SPHERE_WALLET_SEED`
- `SPHERE_AGENT_NAMETAG`
- `SPHERE_MODE=dry-run|real`
- `SPHERE_WALLET_API_BASE_URL`
- `SPHERE_ORACLE_API_KEY`
- `SPHERE_DEVICE_ID`
- `SPHERE_ESCROW_ADDRESS`
- `MAX_TRADE_AMOUNT`
- `MIN_PROFIT_THRESHOLD`
- `SCAN_INTERVAL_SECONDS`
- `ALLOWED_TOKENS`
- `SPENDING_CAP_PER_RUN`
- `SPENDING_CAP_PER_DAY`

## Commands

```bash
npm run build
npm test
npm run demo:dry
npm run agent:dry
npm run agent:real
npm run dev
```

`npm run dev` starts the local API at `http://127.0.0.1:8787` and dashboard at `http://127.0.0.1:5173`.

## Reviewer Wallet Demo

The deployed dashboard is reviewer-first. It renders without a localhost backend and lets reviewers connect a Sphere wallet through Sphere Connect v2.

Reviewer flow:

1. Open the Vercel app URL.
2. Click `Connect Wallet` in the header or hero.
3. Approve the Sphere Connect session in the wallet.
4. Confirm the dashboard shows wallet address, nametag or identity, Testnet v2 network, balance, transport, and signing capability.
5. Select `Dry-run demo` or `Real testnet demo`.
6. Set strict limits: max trade amount, max executions, daily cap, allowed token/testnet coin id, and destination/counterparty.
7. Click `Start Reviewer Demo`.
8. Watch the flow: Connect Wallet -> Configure Limits -> Start Agent -> Scan Intent -> Decide -> Negotiate -> Execute -> Show Proof.

### Dry-run Demo

Dry-run mode does not require a connected wallet and never moves value. Intent scan, decision, negotiation, execution, and proof are simulated and labeled `DRY-RUN` or `DEMO`.

### Real Testnet Demo

Real testnet mode uses verified Sphere Connect v2 surfaces from `@unicitylabs/sphere-sdk` v0.11.0:

- `autoConnect`
- `SPHERE_NETWORKS.testnet2`
- `sphere_getIdentity`
- `sphere_getBalance`
- `sphere_getAssets`
- `payment_request` or `send` compatible wallet intent surfaces

The current reviewer flow executes a tiny `payment_request` intent through the connected wallet when policy allows it. Live intent discovery and negotiation are demo-labeled unless a live counterparty is configured. The value-moving wallet intent is labeled `REAL TESTNET`.

Wallet security may require approval for each real intent. The agent still decides autonomously when to request execution after the reviewer configures limits and clicks Start.

### Safety Limits

Real mode fails closed unless:

- a wallet is connected
- the wallet is on Testnet v2 (`network.id === 4`)
- the reviewer explicitly clicked Start
- the amount is within `MAX_TRADE_AMOUNT`
- max executions for the run is not exceeded
- daily cap is not exceeded
- the configured token is a 64-hex testnet coin id
- the idempotency key has not executed before

The browser never asks for or stores a private key or seed. `SPHERE_WALLET_SEED` is local/server-only and must never be exposed as a `VITE_` variable.

## Vercel deployment

Deploy the dashboard on Vercel with the reviewer wallet demo as the primary page. The local Express agent API is not required for the first render. Vercel `/api/*` routes are demo-only fallback data for the legacy tables; reviewer wallet connect and real testnet approval run client-side through Sphere Connect.

Use these Vercel project settings:

- Root Directory: `dashboard`
- Build Command: `npm run build`
- Output Directory: `dist`

The dashboard folder has its own `package.json`, `index.html`, and Vite config. Its build output is `dashboard/dist`.

Set public reviewer variables in Vercel as needed:

- `VITE_PUBLIC_APP_MODE=reviewer-demo`
- `VITE_API_BASE_URL=https://your-render-service.onrender.com`
- `VITE_SPHERE_NETWORK=testnet-v2`
- `VITE_SPHERE_WALLET_URL=https://sphere.unicity.network`
- `VITE_SPHERE_TESTNET_COIN_ID=1111111111111111111111111111111111111111111111111111111111111111`
- `VITE_SPHERE_DEMO_COUNTERPARTY=@autointent-trader` or a `DIRECT://...` address

## Render backend deployment

Deploy the Express agent API as a Render Web Service so Vercel can call a public backend.

Use these Render settings:

- Root Directory: leave blank
- Build Command: `npm install && npm run build`
- Start Command: `npm run api:start`
- Instance Type: Free or paid

Set Render environment variables:

- `NODE_VERSION=22`
- `HOST=0.0.0.0`
- `SPHERE_NETWORK=testnet-v2`
- `SPHERE_MODE=real`
- `SPHERE_WALLET_SEED=<server-side testnet wallet seed>`
- `SPHERE_AGENT_NAMETAG=autointent-trader`
- `SPHERE_WALLET_API_BASE_URL=https://wallet-api.unicity.network`
- `SPHERE_ORACLE_API_KEY=<if required by the SDK>`
- `SPHERE_DEVICE_ID=sphere-autonomous-trader-agent-render`
- `MAX_TRADE_AMOUNT=1`
- `MIN_PROFIT_THRESHOLD=0.03`
- `SCAN_INTERVAL_SECONDS=10`
- `SPENDING_CAP_PER_RUN=1`
- `SPENDING_CAP_PER_DAY=5`

After Render deploys, open `https://your-render-service.onrender.com/api/status`. Then set the same service URL in Vercel as `VITE_API_BASE_URL`.

## Real Testnet Notes

Real mode requires a valid wallet mnemonic in `SPHERE_WALLET_SEED`. The SDK docs identify `testnet`/`testnet2` as the v2 network aliases; this project keeps the user-facing env value `testnet-v2` and maps it to SDK `testnet2`.

Value movement is testnet-ready only through verified SDK calls. If `SPHERE_ESCROW_ADDRESS` is set, execution prefers `sphere.swap.proposeSwap`; otherwise it falls back to `sphere.payments.send`.

For the deployed reviewer demo, real testnet execution does not use `SPHERE_WALLET_SEED`; it uses the reviewer's connected wallet through Sphere Connect. For local seeded agent demos, keep secrets only in `.env` on the server/operator machine.

## Safety

The execution engine enforces max trade amount, per-run cap, per-day cap, idempotency key, and duplicate intent prevention. Dry-run records are explicitly marked `dry-run` and never represented as real transactions.

## Structure

Core agent services live in `src/agent`, SDK boundary code in `src/adapters`, local JSON store in `src/storage`, API in `src/api`, and React dashboard in `dashboard/src`.
