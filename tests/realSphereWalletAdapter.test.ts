import { createRealSphereWalletAdapter } from "../dashboard/src/wallet/realSphereWalletAdapter";

const identity = {
  chainPubkey: "02abcdef",
  directAddress: "DIRECT://reviewer",
  nametag: "@reviewer"
};

describe("real Sphere wallet adapter", () => {
  it("maps Sphere Connect identity, network, balance, and signing capability", async () => {
    const adapter = createRealSphereWalletAdapter({
      autoConnect: async () => ({
        client: {
          query: async (method: string) => {
            if (method === "sphere_getBalance") return [{ coinId: "coin", amount: "100" }];
            if (method === "sphere_getAssets") return [];
            return null;
          },
          intent: async () => ({ txId: "tx_real" }),
          walletNetwork: { id: 4, name: "testnet2" },
          permissions: ["identity:read", "balance:read", "payment:request"]
        },
        connection: {
          sessionId: "session-1",
          permissions: ["identity:read", "balance:read", "payment:request"],
          identity
        },
        transport: "popup",
        disconnect: async () => undefined
      })
    });

    const state = await adapter.connect();

    expect(state.connected).toBe(true);
    expect(state.address).toBe("DIRECT://reviewer");
    expect(state.nametag).toBe("@reviewer");
    expect(state.networkId).toBe(4);
    expect(state.canSign).toBe(true);
    expect(state.balanceLabel).toContain("100");
  });

  it("maps incompatible network errors into clean UI-safe state", async () => {
    const adapter = createRealSphereWalletAdapter({
      autoConnect: async () => {
        const error = new Error("wrong network") as Error & { code: number };
        error.code = 4008;
        throw error;
      }
    });

    const state = await adapter.connect();

    expect(state.connected).toBe(false);
    expect(state.networkId).toBeUndefined();
    expect(state.error).toContain("Testnet v2");
  });
});
