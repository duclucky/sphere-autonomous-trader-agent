import { describe, expect, it } from "vitest";
import { backendOfflineMessage } from "../dashboard/src/backendOffline";

describe("backendOfflineMessage", () => {
  it("does not expose endpoint or HTTP status details in the user-facing fallback", () => {
    const message = backendOfflineMessage(new Error("GET /api/negotiations failed: 404"));

    expect(message).toBe("Backend offline. Showing demo data.");
    expect(message).not.toContain("/api/");
    expect(message).not.toContain("404");
  });
});
