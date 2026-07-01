import { createAgentRuntime } from "./createAgent";

const runtime = await createAgentRuntime();
runtime.agent.start();

console.log(`Sphere Autonomous Trader Agent running in ${runtime.config.mode} mode.`);
console.log(`Agent: ${runtime.store.getState().wallet?.nametag}`);
console.log(`Scan interval: ${runtime.config.scanIntervalSeconds}s`);

const shutdown = () => {
  runtime.agent.stop();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
