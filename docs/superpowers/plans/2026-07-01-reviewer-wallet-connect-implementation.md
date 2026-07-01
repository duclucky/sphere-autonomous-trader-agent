# Reviewer Wallet Connect Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Vercel-safe reviewer demo where reviewers connect a Sphere Testnet v2 wallet, configure strict limits, start once, and watch the agent run a clearly labeled dry-run or real testnet flow.

**Architecture:** Add focused wallet adapter, policy, and runner modules under `dashboard/src`, then make the reviewer demo the primary React surface. Keep the existing backend dashboard as optional data, and keep Vercel rendering independent from localhost.

**Tech Stack:** TypeScript, React 18, Vite, Vitest, `@unicitylabs/sphere-sdk` v0.11.0 Sphere Connect v2.

## Global Constraints

- First page renders on Vercel without localhost backend.
- Never ask reviewers to paste private keys or seeds in the browser.
- Use only verified Sphere Connect APIs: `autoConnect`, `SPHERE_NETWORKS.testnet2`, `sphere_getIdentity`, `sphere_getBalance`, `sphere_getAssets`, `send`, `dm`, `payment_request`, `sign_message`, `mint`.
- Use permission scopes: `identity:read`, `balance:read`, `transfer:request`, `dm:request`, `payment:request`, `sign:request`, `mint:request`.
- Fail closed on wrong network; do not invent runtime network switching.
- Real mode requires connected wallet, Testnet v2 network id 4, explicit start, amount limits, max executions, daily cap, allowed token, and idempotency.
- `SPHERE_WALLET_SEED` remains server/local only and must never be exposed with `VITE_`.
- Final verification: `npm test`, `npm run build`, and `cd dashboard && npm run build`.

---

### Task 1: Reviewer Policy

**Files:**
- Create: `dashboard/src/reviewerDemo/policy.ts`
- Test: `tests/reviewerPolicy.test.ts`

**Interfaces:**
- Produces: `createIdempotencyKey(input)`, `evaluateReviewerPolicy(input)`.
- Consumes: none.

- [ ] Write failing tests for no wallet, wrong network, missing explicit start, max execution limit, duplicate idempotency, and dry-run labeling.
- [ ] Run `npm test -- tests/reviewerPolicy.test.ts` and confirm the tests fail because the module does not exist.
- [ ] Implement `policy.ts` with fail-closed decisions and deterministic idempotency keys.
- [ ] Re-run `npm test -- tests/reviewerPolicy.test.ts` and confirm pass.

### Task 2: Wallet Adapter Types And Mocks

**Files:**
- Create: `dashboard/src/wallet/types.ts`
- Create: `dashboard/src/wallet/mockWalletAdapter.ts`
- Create: `dashboard/src/wallet/reviewerDemoWalletAdapter.ts`
- Test: `tests/walletAdapters.test.ts`

**Interfaces:**
- Produces: `SphereWalletAdapter`, `WalletConnectionState`, `WalletIntentResult`, `MockWalletAdapter`, `ReviewerDemoWalletAdapter`.
- Consumes: policy mode/status types.

- [ ] Write failing tests for connected demo wallet status, mock real intent proof, and safe disconnected defaults.
- [ ] Run `npm test -- tests/walletAdapters.test.ts` and confirm failure.
- [ ] Implement adapter types and deterministic adapters.
- [ ] Re-run adapter tests and confirm pass.

### Task 3: Real Sphere Connect Adapter

**Files:**
- Create: `dashboard/src/wallet/realSphereWalletAdapter.ts`
- Test: `tests/realSphereWalletAdapter.test.ts`

**Interfaces:**
- Produces: `createRealSphereWalletAdapter(deps?)`.
- Consumes: `SphereWalletAdapter` from Task 2.

- [ ] Write failing tests with injected fake `autoConnect` for success mapping, wrong network mapping, balance query failure, and intent failure.
- [ ] Run `npm test -- tests/realSphereWalletAdapter.test.ts` and confirm failure.
- [ ] Implement adapter using dynamic injected deps around Sphere Connect APIs.
- [ ] Re-run tests and confirm pass.

### Task 4: Reviewer Demo Runner

**Files:**
- Create: `dashboard/src/reviewerDemo/runner.ts`
- Test: `tests/reviewerRunner.test.ts`

**Interfaces:**
- Produces: `runReviewerDemo(input)` and reviewer step/proof types.
- Consumes: `SphereWalletAdapter`, `evaluateReviewerPolicy`, `createIdempotencyKey`.

- [ ] Write failing tests for dry-run proof, explicit start required, real mode waiting for wallet, real proof, duplicate prevention.
- [ ] Run `npm test -- tests/reviewerRunner.test.ts` and confirm failure.
- [ ] Implement state machine: scan, decide, negotiate, execute, show proof.
- [ ] Re-run runner tests and confirm pass.

### Task 5: React Integration And Styling

**Files:**
- Create: `dashboard/src/components/AgentFlow.tsx`
- Create: `dashboard/src/components/ReviewerDemoPanel.tsx`
- Modify: `dashboard/src/App.tsx`
- Modify: `dashboard/src/styles.css`
- Modify: `dashboard/src/types.ts`

**Interfaces:**
- Consumes: runner and wallet adapters.
- Produces: reviewer-first dashboard surface.

- [ ] Wire `ReviewerDemoPanel` into the first screen above existing tables.
- [ ] Add Connect Wallet buttons in header and hero.
- [ ] Show wallet identity, network, balance, transport status, signing capability, limits, proof, and visible statuses.
- [ ] Apply dark cyber trading style with orange glow and branding asset paths.

### Task 6: Config, Docs, And Vercel Compatibility

**Files:**
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `BUILDER_SUBMISSION.md`
- Modify: `dashboard/package.json`
- Modify: `dashboard/package-lock.json`

**Interfaces:**
- Consumes: all previous tasks.

- [ ] Add required reviewer env entries without exposing seed as `VITE_`.
- [ ] Add `@unicitylabs/sphere-sdk` to dashboard dependencies for Vercel root install.
- [ ] Document reviewer dry-run, real testnet, safety, proof verification, and Vercel settings.
- [ ] Update Builder submission with connect-wallet reviewer flow.

### Task 7: Final Verification

**Files:**
- All changed files.

- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Run `cd dashboard && npm run build`.
- [ ] Fix all failures and re-run failing commands.
