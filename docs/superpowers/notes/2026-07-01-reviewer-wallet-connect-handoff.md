# Reviewer Wallet Connect Handoff

Paused on 2026-07-01 after implementing the client-side Sphere Connect reviewer demo. Work was later resumed in the same thread and the provided branding images were installed.

## Current Status

- Design spec committed earlier: `5acd594 Document reviewer wallet connect design`.
- Implementation was not committed at the time of the pause note.
- Full test/build verification completed before pause and again after resume:
  - `npm test`: 11 files, 30 tests passed.
  - `npm run build`: passed.
  - `cd dashboard && npm run build`: passed.
- User-provided branding images are now installed at `dashboard/public/branding/logo.png` and `dashboard/public/branding/banner.png`.
- Build no longer warns about unresolved `/branding/banner.png`.
- Dev server was not started. A sandboxed background start failed; user declined escalated start permission.

## Major Implemented Files

- `dashboard/src/wallet/types.ts`
- `dashboard/src/wallet/realSphereWalletAdapter.ts`
- `dashboard/src/wallet/reviewerDemoWalletAdapter.ts`
- `dashboard/src/wallet/mockWalletAdapter.ts`
- `dashboard/src/reviewerDemo/policy.ts`
- `dashboard/src/reviewerDemo/runner.ts`
- `dashboard/src/components/ReviewerDemoPanel.tsx`
- `dashboard/src/components/AgentFlow.tsx`
- `dashboard/src/vite-env.d.ts`
- `tests/reviewerPolicy.test.ts`
- `tests/walletAdapters.test.ts`
- `tests/realSphereWalletAdapter.test.ts`
- `tests/reviewerRunner.test.ts`
- `docs/superpowers/plans/2026-07-01-reviewer-wallet-connect-implementation.md`

## Also Present From Previous Vercel Work

These files were already in the dirty working tree before this implementation and are still uncommitted:

- `dashboard/src/backendOffline.ts`
- `tests/backendOfflineMessage.test.ts`
- `dashboard/api/_demo.ts`
- `dashboard/api/status.ts`
- `dashboard/api/intents.ts`
- `dashboard/api/decisions.ts`
- `dashboard/api/negotiations.ts`
- `dashboard/api/executions.ts`
- `dashboard/api/logs.ts`
- `dashboard/api/agent/start.ts`
- `dashboard/api/agent/stop.ts`
- `tests/vercelDemoApi.test.ts`

## Key Behavior

- Vercel first page renders without local API.
- Reviewer demo is now primary first-screen experience.
- Header and hero both expose Connect Wallet.
- Real wallet path uses Sphere Connect v2:
  - `autoConnect`
  - `SPHERE_NETWORKS.testnet2`
  - query: `sphere_getBalance`, `sphere_getAssets`
  - intent: `payment_request` in runner
- Real mode fails closed unless wallet connected, network id is 4, reviewer explicitly started, amount and caps pass, token is a 64-hex coin id, and idempotency is unused.
- UI shows `WAITING FOR WALLET` before wallet intent.
- Copy states reviewer approval is required by wallet security, while the agent independently decides when to request execution.

## Next Session Suggested Steps

1. Run `git status --short --untracked-files=all`.
2. Inspect final diff for unintended files, generated files, and missing assets.
3. Optionally start dashboard dev server with user approval and visually inspect `http://127.0.0.1:5176/`.
4. Commit implementation.
5. Push to GitHub if user asks.
