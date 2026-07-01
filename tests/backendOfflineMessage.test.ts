import { describe, expect, it } from "vitest";
import { backendOfflineMessage } from "../dashboard/src/backendOffline";

describe("backendOfflineMessage", () => {
  it("does not expose endpoint, HTTP status, or scary offline wording in the user-facing fallback", () => {
    const message = backendOfflineMessage(new Error("GET /api/negotiations failed: 404"));

    expect(message).toBe("Reviewer demo is ready. Showing simulated legacy agent data.");
    expect(message).not.toContain("/api/");
    expect(message).not.toContain("404");
    expect(message).not.toContain("offline");
  });
});
