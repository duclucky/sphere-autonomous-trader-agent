import "dotenv/config";
import { z } from "zod";
import { defaultConfig } from "./defaultConfig";
import type { AgentConfig } from "../storage/types";

const envSchema = z.object({
  SPHERE_NETWORK: z.literal("testnet-v2").default(defaultConfig.network),
  SPHERE_WALLET_SEED: z.string().optional(),
  SPHERE_AGENT_NAMETAG: z.string().min(1).default(defaultConfig.agentNametag),
  SPHERE_MODE: z.enum(["dry-run", "real"]).default(defaultConfig.mode),
  SPHERE_WALLET_API_BASE_URL: z.string().url().default(defaultConfig.walletApiBaseUrl),
  SPHERE_ORACLE_API_KEY: z.string().optional().default("sk_ddc3cfcc001e4a28ac3fad7407f99590"),
  SPHERE_DEVICE_ID: z.string().min(1).default(defaultConfig.deviceId),
  SPHERE_ESCROW_ADDRESS: z.string().optional(),
  MAX_TRADE_AMOUNT: z.coerce.number().positive().default(defaultConfig.maxTradeAmount),
  MIN_PROFIT_THRESHOLD: z.coerce.number().min(0).default(defaultConfig.minProfitThreshold),
  SCAN_INTERVAL_SECONDS: z.coerce.number().int().positive().default(defaultConfig.scanIntervalSeconds),
  ALLOWED_TOKENS: z.string().default(defaultConfig.allowedTokens.join(",")),
  KEYWORD_FILTERS: z.string().default(""),
  COUNTERPARTY_BLOCKLIST: z.string().default(""),
  SPENDING_CAP_PER_RUN: z.coerce.number().positive().default(defaultConfig.spendingCapPerRun),
  SPENDING_CAP_PER_DAY: z.coerce.number().positive().default(defaultConfig.spendingCapPerDay)
});

const splitCsv = (value: string): string[] =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AgentConfig {
  const parsed = envSchema.parse(env);
  if (parsed.SPHERE_MODE === "real" && !parsed.SPHERE_WALLET_SEED) {
    throw new Error("SPHERE_WALLET_SEED is required when SPHERE_MODE=real");
  }

  return {
    network: parsed.SPHERE_NETWORK,
    walletSeed: parsed.SPHERE_WALLET_SEED,
    agentNametag: parsed.SPHERE_AGENT_NAMETAG,
    mode: parsed.SPHERE_MODE,
    walletApiBaseUrl: parsed.SPHERE_WALLET_API_BASE_URL,
    oracleApiKey: parsed.SPHERE_ORACLE_API_KEY,
    deviceId: parsed.SPHERE_DEVICE_ID,
    escrowAddress: parsed.SPHERE_ESCROW_ADDRESS,
    maxTradeAmount: parsed.MAX_TRADE_AMOUNT,
    minProfitThreshold: parsed.MIN_PROFIT_THRESHOLD,
    scanIntervalSeconds: parsed.SCAN_INTERVAL_SECONDS,
    allowedTokens: splitCsv(parsed.ALLOWED_TOKENS),
    keywordFilters: splitCsv(parsed.KEYWORD_FILTERS),
    counterpartyBlocklist: splitCsv(parsed.COUNTERPARTY_BLOCKLIST),
    spendingCapPerRun: parsed.SPENDING_CAP_PER_RUN,
    spendingCapPerDay: parsed.SPENDING_CAP_PER_DAY
  };
}
