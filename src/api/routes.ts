import { Router } from "express";
import type { AgentRuntime } from "../createAgent";

export function createRoutes(runtime: AgentRuntime): Router {
  const router = Router();

  router.get("/status", (_req, res) => {
    const state = runtime.store.getState();
    res.json({
      running: state.running,
      mode: runtime.config.mode,
      nametag: runtime.config.agentNametag,
      wallet: state.wallet,
      config: {
        network: runtime.config.network,
        maxTradeAmount: runtime.config.maxTradeAmount,
        minProfitThreshold: runtime.config.minProfitThreshold,
        scanIntervalSeconds: runtime.config.scanIntervalSeconds,
        allowedTokens: runtime.config.allowedTokens,
        spendingCapPerRun: runtime.config.spendingCapPerRun,
        spendingCapPerDay: runtime.config.spendingCapPerDay
      }
    });
  });

  router.get("/intents", (_req, res) => res.json(runtime.store.getState().intents));
  router.get("/decisions", (_req, res) => res.json(runtime.store.getState().decisions));
  router.get("/negotiations", (_req, res) => res.json(runtime.store.getState().negotiations));
  router.get("/executions", (_req, res) => res.json(runtime.store.getState().executions));
  router.get("/logs", (_req, res) => res.json(runtime.store.getState().logs));

  router.post("/agent/start", (_req, res) => {
    runtime.agent.start();
    res.json({ running: true });
  });

  router.post("/agent/stop", (_req, res) => {
    runtime.agent.stop();
    res.json({ running: false });
  });

  return router;
}
