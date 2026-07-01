import { AutonomousTraderAgent } from "./agent/AutonomousTraderAgent";
import { DecisionEngine } from "./agent/DecisionEngine";
import { ExecutionEngine } from "./agent/ExecutionEngine";
import { IntentScanner } from "./agent/IntentScanner";
import { NegotiationEngine } from "./agent/NegotiationEngine";
import { RiskManager } from "./agent/RiskManager";
import { MockSphereAdapter } from "./adapters/MockSphereAdapter";
import { RealSphereAdapter } from "./adapters/RealSphereAdapter";
import type { SphereAdapter } from "./adapters/SphereAdapter";
import { loadConfig } from "./config/env";
import { LocalStore } from "./storage/LocalStore";
import type { AgentConfig } from "./storage/types";

export interface AgentRuntime {
  config: AgentConfig;
  store: LocalStore;
  agent: AutonomousTraderAgent;
  adapter: SphereAdapter;
}

export async function createAgentRuntime(config = loadConfig(), store = new LocalStore()): Promise<AgentRuntime> {
  const adapter = config.mode === "real" ? new RealSphereAdapter(config) : new MockSphereAdapter(config);
  const wallet = await adapter.loadWallet();
  store.setWallet(wallet);

  const risk = new RiskManager(config);
  const agent = new AutonomousTraderAgent({
    config,
    store,
    scanner: new IntentScanner(adapter, store, config),
    decisionEngine: new DecisionEngine(config),
    negotiationEngine: new NegotiationEngine(adapter, store, config),
    executionEngine: new ExecutionEngine(adapter, risk, store, config)
  });

  return { config, store, agent, adapter };
}
