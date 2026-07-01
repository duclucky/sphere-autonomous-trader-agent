import { newId } from "../utils/ids";
import type { SphereAdapter } from "../adapters/SphereAdapter";
import type { LocalStore } from "../storage/LocalStore";
import type { AgentConfig, Decision, MarketIntent, NegotiationResult } from "../storage/types";

export class NegotiationEngine {
  private readonly adapter: SphereAdapter;
  private readonly store: LocalStore;
  private readonly config: AgentConfig;

  constructor(adapter: SphereAdapter, store: LocalStore, config: AgentConfig) {
    this.adapter = adapter;
    this.store = store;
    this.config = config;
  }

  async negotiate(intent: MarketIntent, decision: Decision): Promise<NegotiationResult> {
    const proposedPrice = Number((intent.price * 0.995).toFixed(6));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const body = [
      `Agent ${this.config.agentNametag} proposes autonomous Sphere trade.`,
      `Intent: ${intent.id}`,
      `Amount: ${intent.amount} ${intent.token}`,
      `Proposed price: ${proposedPrice}`,
      `Expires: ${expiresAt}`,
      `Terms: prefer atomic swap/escrow when verified; otherwise verified payment flow. Decision=${decision.action}.`
    ].join("\n");

    const outbound = await this.adapter.sendDirectMessage({
      intentId: intent.id,
      counterparty: intent.counterparty,
      direction: "outbound",
      body,
      mode: this.config.mode
    });
    this.store.saveNegotiation(outbound);

    if (this.config.mode === "dry-run") {
      const inbound = {
        id: newId("msg"),
        intentId: intent.id,
        counterparty: intent.counterparty,
        direction: "inbound" as const,
        body: `Simulated acceptance from ${intent.counterparty} for ${intent.amount} ${intent.token}.`,
        status: "accepted" as const,
        mode: "dry-run" as const,
        createdAt: new Date().toISOString()
      };
      this.store.saveNegotiation(inbound);
      return { outbound, inbound, accepted: true };
    }

    return { outbound, accepted: false };
  }
}
