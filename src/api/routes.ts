import { Router } from "express";
import type { AgentRuntime } from "../createAgent";
import { loadServerSeededDemoOptions, runServerSeededDemo, validateServerSeededDemoStart } from "./serverSeededDemo";
import { newId } from "../utils/ids";

export function createRoutes(runtime: AgentRuntime): Router {
  const router = Router();
  let serverDemoRunning = false;
  let serverDemoRunsConsumed = 0;

  router.get("/status", (_req, res) => {
    const state = runtime.store.getState();
    const serverDemo = loadServerSeededDemoOptions(process.env, runtime.config);
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
        spendingCapPerDay: runtime.config.spendingCapPerDay,
        counterparty: serverDemo.counterparty,
        serverDemo: {
          enabled: serverDemo.enabled,
          executions: serverDemo.executions,
          amount: serverDemo.amount,
          dailyCap: serverDemo.dailyCap,
          counterparty: serverDemo.counterparty,
          token: serverDemo.token,
          fromToken: serverDemo.fromToken,
          toToken: serverDemo.toToken,
          rate: serverDemo.rate,
          swapPairs: serverDemo.swapPairs
        }
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

  router.post("/server-demo/start", (_req, res) => {
    const options = loadServerSeededDemoOptions(process.env, runtime.config);
    if (!options.enabled) {
      res.status(403).json({ running: false, message: "Server seeded demo is disabled. Set ENABLE_SERVER_DEMO=true on the backend." });
      return;
    }
    if (serverDemoRunning) {
      res.status(409).json({ running: true, message: "Server seeded demo is already running." });
      return;
    }
    if (serverDemoRunsConsumed >= options.maxRuns) {
      res.status(429).json({ running: false, message: `Server seeded demo run limit reached (${options.maxRuns}). Increase SERVER_DEMO_MAX_RUNS or redeploy to run again.` });
      return;
    }
    const startDecision = validateServerSeededDemoStart(runtime.config, options);
    if (!startDecision.allowed) {
      res.status(400).json({ running: false, message: startDecision.reason ?? "Server seeded demo is blocked." });
      return;
    }

    const runId = newId("server-demo");
    serverDemoRunning = true;
    void runServerSeededDemo({ config: runtime.config, store: runtime.store, adapter: runtime.adapter, options, runId })
      .then((result) => {
        if (result.completed > 0) {
          serverDemoRunsConsumed += 1;
        }
      })
      .finally(() => {
        serverDemoRunning = false;
      });
    res.status(202).json({ running: true, runId, requested: options.executions });
  });

  return router;
}
