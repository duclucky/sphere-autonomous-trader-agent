import { describe, expect, it } from "vitest";
import { isResolvableCounterparty, normalizeMarketCounterparty } from "../src/utils/counterparty";

describe("counterparty utilities", () => {
  it("marks unknown fallback counterparties as not resolvable", () => {
    expect(isResolvableCounterparty("unknown-counterparty")).toBe(false);
  });

  it("normalizes market nametags to SDK-resolvable @nametag form", () => {
    expect(normalizeMarketCounterparty(undefined, "alice")).toBe("@alice");
    expect(normalizeMarketCounterparty("@bob", "alice")).toBe("@bob");
  });
});
