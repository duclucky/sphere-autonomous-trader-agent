import { describe, expect, it } from "vitest";
import { RiskManager } from "../src/agent/RiskManager";
import { defaultConfig } from "../src/config/defaultConfig";

describe("RiskManager", () => {
  it("blocks execution that exceeds the per-run spending cap", () => {
    const risk = new RiskManager({ ...defaultConfig, spendingCapPerRun: 50 });

    const result = risk.canSpend(60);

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("spending cap per run");
  });

  it("blocks duplicate intent execution by idempotency key", () => {
    const risk = new RiskManager(defaultConfig);

    risk.recordExecution("same-intent", 10);
    const result = risk.canExecuteIntent("same-intent");

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("already executed");
  });
});
