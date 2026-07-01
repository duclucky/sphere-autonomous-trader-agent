import { describe, expect, it } from "vitest";
import packageJson from "../package.json";

describe("Render runtime dependencies", () => {
  it("declares ws as a direct runtime dependency for the Sphere SDK Node runtime", () => {
    expect(packageJson.dependencies).toHaveProperty("ws");
  });

  it("loads the Sphere SDK Node provider module used by the API server", async () => {
    const nodeProviders = await import("@unicitylabs/sphere-sdk/impl/nodejs");

    expect(nodeProviders.createNodeProviders).toEqual(expect.any(Function));
  });
});
