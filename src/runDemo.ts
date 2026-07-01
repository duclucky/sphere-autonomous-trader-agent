import { createAgentRuntime } from "./createAgent";
import { defaultConfig } from "./config/defaultConfig";
import { LocalStore } from "./storage/LocalStore";

const config = {
  ...defaultConfig,
  mode: "dry-run" as const,
  maxTradeAmount: Number(process.env.MAX_TRADE_AMOUNT ?? defaultConfig.maxTradeAmount),
  minProfitThreshold: Number(process.env.MIN_PROFIT_THRESHOLD ?? defaultConfig.minProfitThreshold)
};

const runtime = await createAgentRuntime(config, new LocalStore(":memory:"));
const summary = await runtime.agent.runOnce();
const state = runtime.store.getState();

console.log("\nDry-run autonomous demo summary");
console.log("--------------------------------");
console.log(`Mode: ${runtime.config.mode} (mock only; no testnet value moved)`);
console.log(`Agent: ${state.wallet?.nametag} ${state.wallet?.address}`);
console.log(`Intents discovered: ${summary.intents}`);
console.log(`Decisions made: ${summary.decisions}`);
console.log(`Negotiation messages: ${summary.negotiations}`);
console.log(`Executions: ${summary.executions}`);
for (const execution of state.executions) {
  console.log(`- ${execution.status} ${execution.txId} ${execution.amount} ${execution.token} to ${execution.counterparty}`);
}
