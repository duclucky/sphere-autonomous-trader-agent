import type { SphereAdapter } from "./SphereAdapter";
import { chooseSpendableCoinId, type SpendableCoinAsset } from "./coinSelection";
import { normalizeMarketCounterparty } from "../utils/counterparty";
import type {
  AgentConfig,
  ExecuteValueTransferRequest,
  ExecuteValueTransferResult,
  IntentFilters,
  MarketIntent,
  NegotiationMessage,
  WalletIdentity
} from "../storage/types";

type SphereLike = {
  identity?: { directAddress?: string; nametag?: string; chainPubkey?: string };
  market?: {
    search(query: string, opts?: { filters?: Record<string, unknown>; limit?: number }): Promise<{
      intents: Array<{
        id: string;
        score?: number;
        agentNametag?: string;
        description: string;
        intentType: string;
        price?: number;
        currency: string;
        contactHandle?: string;
        createdAt: string;
      }>;
    }>;
  };
  communications?: { sendDM(recipient: string, content: string): Promise<{ id: string }> };
  payments?: {
    send(request: { recipient: string; amount: string; coinId: string; memo?: string }): Promise<{ id?: string; status: string; deliveryPending?: boolean }>;
    getAssets?(coinId?: string): Promise<SpendableCoinAsset[]>;
  };
  swap?: {
    proposeSwap(
      deal: {
        partyA: string;
        partyB: string;
        partyACurrency: string;
        partyAAmount: string;
        partyBCurrency: string;
        partyBAmount: string;
        timeout: number;
        escrowAddress?: string;
      },
      options?: { message?: string }
    ): Promise<{ swapId: string; status?: string }>;
  };
};

export class RealSphereAdapter implements SphereAdapter {
  readonly mode = "real" as const;
  private readonly config: AgentConfig;
  private sphere?: SphereLike;

  constructor(config: AgentConfig) {
    this.config = { ...config, mode: "real" };
  }

  async loadWallet(): Promise<WalletIdentity> {
    const sphere = await this.getSphere();
    return {
      address: sphere.identity?.directAddress ?? sphere.identity?.chainPubkey ?? "unknown",
      nametag: sphere.identity?.nametag ?? this.config.agentNametag,
      network: this.config.network,
      mode: "real",
      status: "loaded"
    };
  }

  async scanIntents(filters: IntentFilters): Promise<MarketIntent[]> {
    const sphere = await this.getSphere();
    if (!sphere.market?.search) {
      this.failUnverified("RealSphereAdapter.scanIntents");
    }
    const query = filters.keywords?.join(" ") || this.config.allowedTokens.join(" ");
    const result = await sphere.market.search(query, {
      filters: { maxPrice: filters.maxPrice },
      limit: 50
    });
    return result.intents
      .filter((intent) => !filters.tokens?.length || filters.tokens.includes(intent.currency))
      .map((intent) => ({
        id: intent.id,
        counterparty: normalizeMarketCounterparty(intent.contactHandle, intent.agentNametag),
        side: intent.intentType === "buy" ? "buy" : "sell",
        token: intent.currency,
        amount: 1,
        price: intent.price ?? 0,
        fairValue: intent.price ? intent.price * (1 + this.config.minProfitThreshold * 1.5) : 0,
        keywords: intent.description.toLowerCase().split(/\W+/).filter(Boolean),
        updatedAt: intent.createdAt,
        riskScore: 1 - Math.min(1, intent.score ?? 0.5)
      }));
  }

  async sendDirectMessage(message: Omit<NegotiationMessage, "id" | "createdAt" | "status">): Promise<NegotiationMessage> {
    const sphere = await this.getSphere();
    if (!sphere.communications?.sendDM) {
      this.failUnverified("RealSphereAdapter.sendDirectMessage");
    }
    const sent = await sphere.communications.sendDM(message.counterparty, message.body);
    return {
      ...message,
      id: sent.id,
      status: "sent",
      mode: "real",
      createdAt: new Date().toISOString()
    };
  }

  async executeValueTransfer(request: ExecuteValueTransferRequest): Promise<ExecuteValueTransferResult> {
    const sphere = await this.getSphere();
    if (this.config.escrowAddress && sphere.swap?.proposeSwap && sphere.identity?.directAddress) {
      const coinId = await this.resolveSpendableCoinId(sphere, request.intent.token, request.intent.amount);
      const swap = await sphere.swap.proposeSwap(
        {
          partyA: sphere.identity.directAddress,
          partyB: request.intent.counterparty,
          partyACurrency: coinId,
          partyAAmount: String(Math.trunc(request.intent.amount)),
          partyBCurrency: "UCT",
          partyBAmount: String(Math.max(1, Math.trunc(request.intent.amount * request.intent.price))),
          timeout: 600,
          escrowAddress: this.config.escrowAddress
        },
        { message: `Autonomous trade execution for intent ${request.intent.id}` }
      );
      return {
        txId: swap.swapId,
        status: "submitted",
        note: "Real Sphere SDK swap.proposeSwap submitted using configured escrow."
      };
    }

    if (!sphere.payments?.send) {
      this.failUnverified("RealSphereAdapter.executeValueTransfer");
    }
    const coinId = await this.resolveSpendableCoinId(sphere, request.intent.token, request.intent.amount);
    const result = await sphere.payments.send({
      recipient: request.intent.counterparty,
      amount: String(Math.trunc(request.intent.amount)),
      coinId,
      memo: `Autonomous execution for ${request.intent.id}; idempotency=${request.idempotencyKey}`
    });
    return {
      txId: result.id ?? request.idempotencyKey,
      status: result.status === "completed" ? "confirmed" : "submitted",
      note: result.deliveryPending ? "Certified by SDK send; mailbox delivery pending." : "Executed through Sphere payments.send."
    };
  }

  private async getSphere(): Promise<SphereLike> {
    if (this.sphere) {
      return this.sphere;
    }
    if (!this.config.walletSeed) {
      throw new Error("SPHERE_WALLET_SEED is required for real mode wallet initialization.");
    }
    if (!this.config.oracleApiKey) {
      throw new Error("SPHERE_ORACLE_API_KEY is required for real mode v2 wallet operations.");
    }
    const [{ Sphere }, { createNodeProviders }, { createWalletApiProviders }] = await Promise.all([
      import("@unicitylabs/sphere-sdk"),
      import("@unicitylabs/sphere-sdk/impl/nodejs"),
      import("@unicitylabs/sphere-sdk/impl/shared/wallet-api")
    ]);
    const base = createNodeProviders({
      network: "testnet2",
      dataDir: "./data/wallet",
      tokensDir: "./data/tokens",
      oracle: { apiKey: this.config.oracleApiKey }
    });
    const providers = createWalletApiProviders(base, {
      baseUrl: this.config.walletApiBaseUrl,
      network: "testnet2",
      deviceId: this.config.deviceId
    });
    const initResult = await Sphere.init({
      ...providers,
      network: "testnet2",
      mnemonic: this.config.walletSeed,
      nametag: this.config.agentNametag,
      autoGenerate: false,
      market: true,
      communications: {},
      swap: this.config.escrowAddress ? { defaultEscrowAddress: this.config.escrowAddress } : true
    });
    this.sphere = initResult.sphere as SphereLike;
    return this.sphere;
  }

  private async resolveSpendableCoinId(sphere: SphereLike, preferredToken: string, amount: number): Promise<string> {
    const assets = await sphere.payments?.getAssets?.().catch(() => undefined);
    if (assets && assets.length > 0) {
      const selected = chooseSpendableCoinId(assets, preferredToken, amount);
      if (selected) {
        return selected;
      }
    }
    return preferredToken;
  }

  private failUnverified(functionName: string): never {
    throw new Error(
      `${functionName} is fail-closed because the expected Sphere SDK module was not available at runtime. ` +
        `Verified SDK surfaces: Sphere.init, createNodeProviders, createWalletApiProviders, market.search, communications.sendDM, payments.send, swap.proposeSwap. ` +
        `Configured network=${this.config.network}.`
    );
  }
}
