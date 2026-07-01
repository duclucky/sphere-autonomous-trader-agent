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

## Vercel deployment

Deploy only the static dashboard on Vercel. The local Express agent API is not deployed by this configuration, so the dashboard renders demo data and shows a backend-offline notice when `/api/*` is unavailable.

Use these Vercel project settings:

- Root Directory: `dashboard`
- Build Command: `npm run build`
- Output Directory: `dist`

The dashboard folder has its own `package.json`, `index.html`, and Vite config. Its build output is `dashboard/dist`.

## Real Testnet Notes

Real mode requires a valid wallet mnemonic in `SPHERE_WALLET_SEED`. The SDK docs identify `testnet`/`testnet2` as the v2 network aliases; this project keeps the user-facing env value `testnet-v2` and maps it to SDK `testnet2`.

Value movement is testnet-ready only through verified SDK calls. If `SPHERE_ESCROW_ADDRESS` is set, execution prefers `sphere.swap.proposeSwap`; otherwise it falls back to `sphere.payments.send`.

## Safety

The execution engine enforces max trade amount, per-run cap, per-day cap, idempotency key, and duplicate intent prevention. Dry-run records are explicitly marked `dry-run` and never represented as real transactions.

## Structure

Core agent services live in `src/agent`, SDK boundary code in `src/adapters`, local JSON store in `src/storage`, API in `src/api`, and React dashboard in `dashboard/src`.
