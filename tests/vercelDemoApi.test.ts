import { describe, expect, it } from "vitest";
import { decisionsPayload, executionsPayload, statusPayload } from "../dashboard/api/_demo";

describe("Vercel demo API payloads", () => {
  it("returns dashboard-compatible demo state without claiming real execution", () => {
    expect(statusPayload().mode).toBe("dry-run");
    expect(decisionsPayload().some((decision) => decision.action === "IGNORE")).toBe(true);
    expect(executionsPayload()[0].mode).toBe("dry-run");
    expect(executionsPayload()[0].note).toContain("No real testnet value moved");
  });
});
