# Sphere Autonomous Trader Agent

Autonomous economic agent for the Unicity Builder Program, track: Autonomous Agents.

The agent monitors Sphere market intents, scores opportunities against budget and risk rules, negotiates through direct messages, and executes value-moving actions when allowed. In `dry-run` mode it uses fixtures and mock transactions only. In backend seeded real mode it follows the Sphere wallet swap screen flow through verified SDK surfaces from `@unicitylabs/sphere-sdk` v0.11.0: `Sphere.init`, `createNodeProviders`, `createWalletApiProviders`, `sphere.payments.send`, and `sphere.payments.mintFungibleToken`.

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

## Dashboard Demo

The deployed dashboard is backend-first. It renders without a localhost backend and exposes one primary action: `Run Backend Agent`. Reviewers do not connect a browser wallet or configure per-run values in the UI; the Render backend reads the server-side environment variables and publishes telemetry for inspection.

Reviewer flow:

1. Open the Vercel app URL.
2. Confirm the status pill shows the configured Render backend mode.
3. Click `Run Backend Agent`.
4. Watch the flow: Load Server Wallet -> Apply Defaults -> Start Agent -> Scan Balance -> Decide -> Build Swap -> Send Input -> Mint Output -> Write Telemetry.
5. Compare Operating Rules with Agent Telemetry and Live Logs.

Backend seeded wallet flow:

1. Deploy the Render backend with `SPHERE_MODE=real`, `SPHERE_WALLET_SEED`, and `ENABLE_SERVER_DEMO=true`.
2. Set Vercel `VITE_API_BASE_URL` to the Render service URL.
3. Open the Vercel dashboard and click `Run Backend Agent`.
4. The Render backend uses the server-side seeded wallet to run up to 20 autonomous wallet swap actions and writes intents, decisions, negotiations, executions, and logs into Agent Telemetry.

### Backend Seeded Wallet Demo

The `Run Backend Agent` button calls the Render backend route `POST /api/server-demo/start`. This mode does not connect a reviewer wallet. It uses the server-side `SPHERE_WALLET_SEED` already configured on Render and writes directly to the telemetry tables.

Backend seeded mode is disabled unless `ENABLE_SERVER_DEMO=true` is set on the backend. The route is capped by `MAX_EXECUTIONS_PER_SERVER_DEMO` with a hard maximum of 20, and `SERVER_DEMO_MAX_RUNS` defaults to 1 per backend process to prevent repeated public triggering.
Each action builds a configured wallet swap plan, sends the input token to the wallet swap stub recipient, then mints the output token into the same backend wallet. Before the send step, the backend inspects wallet inventory and picks a spendable coin object for the configured input symbol, so it can move on to the next funded coin object when one runs out.

### Safety Limits

Real mode fails closed unless:

- a wallet is connected
- the wallet is on Testnet v2 (`network.id === 4`)
- the reviewer explicitly clicked Start
- the amount is within `MAX_TRADE_AMOUNT`
- max executions for the run is not exceeded
- daily cap is not exceeded
- the configured token is accepted by the SDK as a token symbol or a 64-hex coin id
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
- `ENABLE_SERVER_DEMO=true`
- `MAX_EXECUTIONS_PER_SERVER_DEMO=20`
- `SERVER_DEMO_MAX_RUNS=1`
- `SERVER_DEMO_AMOUNT=1`
- `SERVER_DEMO_DAILY_CAP=20`
- `SERVER_DEMO_SWAP_RECIPIENT=sphere-swap`
- `SERVER_DEMO_FROM_TOKEN=BTC`
- `SERVER_DEMO_TO_TOKEN=UCT`
- `SERVER_DEMO_SWAP_RATE=1`

After Render deploys, open `https://your-render-service.onrender.com/api/status`. Then set the same service URL in Vercel as `VITE_API_BASE_URL`.

## Real Testnet Notes

Real mode requires a valid wallet mnemonic in `SPHERE_WALLET_SEED`. The SDK docs identify `testnet`/`testnet2` as the v2 network aliases; this project keeps the user-facing env value `testnet-v2` and maps it to SDK `testnet2`.

Backend seeded value movement follows the same practical flow used by the Sphere wallet swap screen: send the input asset to `sphere-swap`, then self-mint the output asset with `mintFungibleToken`. This is not the P2P escrow `swap.proposeSwap` flow and does not require `SPHERE_ESCROW_ADDRESS`.

The deployed dashboard's primary real testnet path is `Run Backend Agent`, which uses the Render server-side `SPHERE_WALLET_SEED`. Keep all seeds only in `.env` or Render environment variables; never expose them as `VITE_` variables.

## Safety

The execution engine enforces max trade amount, per-run cap, per-day cap, idempotency key, and duplicate intent prevention. Dry-run records are explicitly marked `dry-run` and never represented as real transactions.

## Structure

Core agent services live in `src/agent`, SDK boundary code in `src/adapters`, local JSON store in `src/storage`, API in `src/api`, and React dashboard in `dashboard/src`.
