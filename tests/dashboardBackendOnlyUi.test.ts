import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const reviewerPanelSource = readFileSync("dashboard/src/components/ReviewerDemoPanel.tsx", "utf8");
const appSource = readFileSync("dashboard/src/App.tsx", "utf8");

describe("backend-only dashboard UI", () => {
  it("does not expose wallet-connect or dry-run reviewer controls on the main dashboard", () => {
    expect(appSource).not.toContain("Connect Wallet");
    expect(appSource).not.toContain("Legacy agent telemetry");
    expect(reviewerPanelSource).not.toContain("Connect Wallet");
    expect(reviewerPanelSource).not.toContain("Dry-run demo");
    expect(reviewerPanelSource).not.toContain("Start Reviewer Demo");
    expect(reviewerPanelSource).not.toContain("Advanced settings");
  });

  it("presents the single backend seeded wallet action", () => {
    expect(reviewerPanelSource).toContain("Backend Seeded Autonomous Agent");
    expect(reviewerPanelSource.match(/Run Backend Agent/g)).toHaveLength(1);
    expect(appSource).toContain("Agent Telemetry");
  });
});
