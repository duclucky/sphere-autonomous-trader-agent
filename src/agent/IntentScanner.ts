import type { SphereAdapter } from "../adapters/SphereAdapter";
import type { AgentConfig, MarketIntent } from "../storage/types";
import type { LocalStore } from "../storage/LocalStore";

export class IntentScanner {
  private readonly adapter: SphereAdapter;
  private readonly store: LocalStore;
  private readonly config: AgentConfig;

  constructor(adapter: SphereAdapter, store: LocalStore, config: AgentConfig) {
    this.adapter = adapter;
    this.store = store;
    this.config = config;
  }

  async scan(): Promise<MarketIntent[]> {
    const intents = await this.adapter.scanIntents({
      keywords: this.config.keywordFilters,
      tokens: this.config.allowedTokens
    });
    this.store.saveIntents(intents);
    return intents;
  }
}
