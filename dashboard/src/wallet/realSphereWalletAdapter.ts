import { disconnectedWalletState, type SphereWalletAdapter, type WalletConnectionState, type WalletIntentAction, type WalletIntentResult } from "./types";

type AutoConnectFn = (config: Record<string, unknown>) => Promise<{
  client: {
    query: (method: string, params?: Record<string, unknown>) => Promise<unknown>;
    intent: (action: string, params: Record<string, unknown>) => Promise<unknown>;
    walletNetwork?: { id: number; name?: string } | null;
    permissions?: readonly string[];
  };
  connection: {
    sessionId: string;
    permissions: readonly string[];
    identity: {
      chainPubkey: string;
      directAddress?: string;
      nametag?: string;
    };
  };
  transport: "iframe" | "extension" | "popup";
  disconnect: () => Promise<void>;
}>;

interface RealSphereWalletAdapterDeps {
  autoConnect?: AutoConnectFn;
  walletUrl?: string;
  origin?: string;
}

const requestedPermissions = [
  "identity:read",
  "balance:read",
  "transfer:request",
  "dm:request",
  "payment:request",
  "sign:request",
  "mint:request"
] as const;

const sessionKey = "sphere-session";

function savedSessionId(): string | undefined {
  if (typeof sessionStorage === "undefined") return undefined;
  return sessionStorage.getItem(sessionKey) ?? undefined;
}

function saveSessionId(sessionId: string): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(sessionKey, sessionId);
}

function clearSessionId(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(sessionKey);
}

function proofFromResult(action: WalletIntentAction, result: unknown): string {
  if (result && typeof result === "object") {
    const record = result as Record<string, unknown>;
    const proof = record.txId ?? record.transactionHash ?? record.requestId ?? record.tokenId ?? record.id;
    if (typeof proof === "string" && proof.length > 0) return proof;
  }
  return `sphere-${action}-${Date.now()}`;
}

function formatBalance(balance: unknown): string {
  if (Array.isArray(balance)) {
    const first = balance[0] as Record<string, unknown> | undefined;
    if (!first) return "0";
    const amount = first.amount ?? first.balance ?? "0";
    const coinId = first.coinId ? ` ${String(first.coinId).slice(0, 8)}...` : "";
    return `${String(amount)}${coinId}`;
  }
  if (balance && typeof balance === "object") {
    const record = balance as Record<string, unknown>;
    return String(record.balance ?? record.amount ?? JSON.stringify(record));
  }
  return String(balance ?? "0");
}

function mapConnectError(error: unknown): string {
  const code = typeof error === "object" && error && "code" in error ? (error as { code?: number }).code : undefined;
  if (code === 4008) {
    return "Wallet must be on Testnet v2. Switch or unlock the wallet outside this dApp, then connect again.";
  }
  if (code === 4003) return "Wallet request was rejected by the reviewer.";
  if (error instanceof Error && error.message) return error.message;
  return "Sphere wallet connection failed.";
}

async function loadDefaultAutoConnect(): Promise<AutoConnectFn> {
  const mod = await import("@unicitylabs/sphere-sdk/connect/browser");
  return mod.autoConnect as unknown as AutoConnectFn;
}

async function loadTestnetNetwork(): Promise<{ id: number; name: "testnet2" }> {
  const mod = await import("@unicitylabs/sphere-sdk/connect");
  return mod.SPHERE_NETWORKS.testnet2;
}

export function createRealSphereWalletAdapter(deps: RealSphereWalletAdapterDeps = {}): SphereWalletAdapter {
  let state: WalletConnectionState = disconnectedWalletState();
  let connected: Awaited<ReturnType<AutoConnectFn>> | null = null;

  return {
    async connect(options = {}) {
      try {
        const autoConnect = deps.autoConnect ?? await loadDefaultAutoConnect();
        const network = await loadTestnetNetwork();
        connected = await autoConnect({
          dapp: {
            name: "AutoIntent Trader",
            description: "Reviewer demo for Sphere autonomous testnet trading",
            url: deps.origin ?? (typeof location !== "undefined" ? location.origin : "http://localhost")
          },
          walletUrl: deps.walletUrl ?? import.meta.env.VITE_SPHERE_WALLET_URL ?? "https://sphere.unicity.network",
          network,
          permissions: requestedPermissions,
          resumeSessionId: savedSessionId(),
          silent: options.silent ?? false
        });
        saveSessionId(connected.connection.sessionId);

        const balance = await connected.client.query("sphere_getBalance").catch(() => undefined);
        await connected.client.query("sphere_getAssets").catch(() => undefined);
        const granted = connected.connection.permissions ?? connected.client.permissions ?? [];
        const identity = connected.connection.identity;

        state = {
          connected: true,
          address: identity.directAddress ?? identity.chainPubkey,
          chainPubkey: identity.chainPubkey,
          nametag: identity.nametag,
          networkId: connected.client.walletNetwork?.id ?? network.id,
          networkName: connected.client.walletNetwork?.name ?? network.name,
          balanceLabel: formatBalance(balance),
          canSign: granted.some((scope) => scope === "transfer:request" || scope === "payment:request" || scope === "sign:request" || scope === "mint:request"),
          transport: connected.transport
        };
        return state;
      } catch (error) {
        state = { ...disconnectedWalletState(mapConnectError(error)), transport: "sphere-connect" };
        return state;
      }
    },

    async disconnect() {
      if (connected) {
        await connected.disconnect();
      }
      connected = null;
      clearSessionId();
      state = disconnectedWalletState();
    },

    async getState() {
      return state;
    },

    async requestIntent(action: WalletIntentAction, params: Record<string, unknown>): Promise<WalletIntentResult> {
      if (!connected || !state.connected) {
        return { status: "failed", error: "Sphere wallet is not connected." };
      }
      try {
        const result = await connected.client.intent(action, params);
        return { status: "submitted", proofId: proofFromResult(action, result), raw: result };
      } catch (error) {
        return { status: "failed", error: mapConnectError(error) };
      }
    }
  };
}
