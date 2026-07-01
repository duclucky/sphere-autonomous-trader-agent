import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { newId, stableId } from "../utils/ids";
import type { SphereAdapter } from "./SphereAdapter";
import type {
  AgentConfig,
  ExecuteValueTransferRequest,
  ExecuteValueTransferResult,
  IntentFilters,
  MarketIntent,
  NegotiationMessage,
  WalletIdentity
} from "../storage/types";

export class MockSphereAdapter implements SphereAdapter {
  readonly mode = "dry-run" as const;
  private readonly config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = { ...config, mode: "dry-run" };
  }

  async loadWallet(): Promise<WalletIdentity> {
    return {
      address: stableId("dry_wallet", this.config.walletSeed ?? this.config.agentNametag),
      nametag: this.config.agentNametag,
      network: this.config.network,
      mode: "dry-run",
      status: "mock"
    };
  }

  async scanIntents(filters: IntentFilters): Promise<MarketIntent[]> {
    const fixturePath = resolve("fixtures", "intents.json");
    const intents = JSON.parse(readFileSync(fixturePath, "utf8")) as MarketIntent[];
    return intents.filter((intent) => {
      const keywordOk = !filters.keywords?.length || filters.keywords.some((keyword) => intent.keywords.includes(keyword));
      const tokenOk = !filters.tokens?.length || filters.tokens.includes(intent.token);
      const priceOk = filters.maxPrice === undefined || intent.price <= filters.maxPrice;
      const counterpartyOk = !filters.counterparties?.length || filters.counterparties.includes(intent.counterparty);
      return keywordOk && tokenOk && priceOk && counterpartyOk;
    });
  }

  async sendDirectMessage(message: Omit<NegotiationMessage, "id" | "createdAt" | "status">): Promise<NegotiationMessage> {
    return {
      ...message,
      id: newId("msg"),
      status: "simulated",
      mode: "dry-run",
      createdAt: new Date().toISOString()
    };
  }

  async executeValueTransfer(request: ExecuteValueTransferRequest): Promise<ExecuteValueTransferResult> {
    return {
      txId: stableId("dry-run-tx", request.idempotencyKey),
      status: "simulated",
      note: "Mock dry-run execution only. No real Sphere Testnet v2 value moved.",
      realizedProfitPct: undefined
    };
  }
}
