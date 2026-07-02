import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const reviewerPanelSource = readFileSync("dashboard/src/components/ReviewerDemoPanel.tsx", "utf8");
const appSource = readFileSync("dashboard/src/App.tsx", "utf8");
const operatingRulesSource = readFileSync("dashboard/src/components/OperatingRules.tsx", "utf8");
const logViewerSource = readFileSync("dashboard/src/components/LogViewer.tsx", "utf8");

describe("backend-only dashboard UI", () => {
  it("does not expose wallet-connect or dry-run reviewer controls on the main dashboard", () => {
    expect(appSource).not.toContain("Connect Wallet");
    expect(appSource).not.toContain("Legacy agent telemetry");
    expect(reviewerPanelSource).not.toContain("Connect Wallet");
    expect(reviewerPanelSource).not.toContain("Dry-run demo");
    expect(reviewerPanelSource).not.toContain("Start Reviewer Demo");
    expect(reviewerPanelSource).not.toContain("Advanced settings");
    expect(operatingRulesSource).not.toContain("Connect Wallet");
  });

  it("presents the single backend seeded wallet action", () => {
    expect(reviewerPanelSource).toContain("Backend Seeded Wallet Swap Agent");
    expect(reviewerPanelSource.match(/Run Backend Agent/g)).toHaveLength(1);
    expect(reviewerPanelSource).toContain("send + mint");
    expect(appSource).toContain("Agent Telemetry");
    expect(appSource).toContain("telemetryRef.current?.scrollIntoView");
    expect(appSource).toContain("id=\"agent-telemetry\"");
    expect(appSource).toContain("telemetry-summary");
    expect(appSource).toContain("OperatingRules");
    expect(operatingRulesSource).toContain("Operating Rules");
    expect(operatingRulesSource).toContain("Auto market pairs");
    expect(operatingRulesSource).toContain("spendable wallet assets");
    expect(logViewerSource).toContain("rule tag");
    expect(logViewerSource).toContain("Rule");
  });
});
