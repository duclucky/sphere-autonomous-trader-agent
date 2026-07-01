import type { AgentConfig } from "../storage/types";

export const defaultConfig: AgentConfig = {
  network: "testnet-v2",
  agentNametag: "sphere-agent-demo",
  mode: "dry-run",
  walletApiBaseUrl: "https://wallet-api.unicity.network",
  oracleApiKey: "sk_ddc3cfcc001e4a28ac3fad7407f99590",
  deviceId: "sphere-autonomous-trader-agent-local",
  escrowAddress: undefined,
  maxTradeAmount: 100,
  minProfitThreshold: 0.03,
  scanIntervalSeconds: 10,
  allowedTokens: ["UNICITY", "USDC"],
  keywordFilters: [],
  counterpartyBlocklist: [],
  spendingCapPerRun: 100,
  spendingCapPerDay: 250
};
