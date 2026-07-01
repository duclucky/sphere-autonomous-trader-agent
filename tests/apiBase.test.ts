import { describe, expect, it } from "vitest";
import { withApiBaseUrl } from "../dashboard/src/apiBase";

describe("withApiBaseUrl", () => {
  it("keeps local relative API paths when no public backend URL is configured", () => {
    expect(withApiBaseUrl("/api/status", undefined)).toBe("/api/status");
  });

  it("prefixes API paths with a configured Render backend URL", () => {
    expect(withApiBaseUrl("/api/status", "https://autointent-trader.onrender.com/")).toBe(
      "https://autointent-trader.onrender.com/api/status"
    );
  });
});
