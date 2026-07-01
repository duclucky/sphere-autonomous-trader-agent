import { describe, expect, it } from "vitest";
import { chooseSpendableCoinId } from "../src/adapters/coinSelection";

describe("coin selection", () => {
  it("prefers the largest spendable coin object for the requested token symbol", () => {
    const selected = chooseSpendableCoinId(
      [
        { coinId: "coin-small", symbol: "UCT", totalAmount: "4" },
        { coinId: "coin-large", symbol: "UCT", totalAmount: "100" },
        { coinId: "other-token", symbol: "USDC", totalAmount: "999" }
      ],
      "UCT",
      1
    );

    expect(selected).toBe("coin-large");
  });

  it("skips coin objects that cannot cover the requested amount", () => {
    const selected = chooseSpendableCoinId(
      [
        { coinId: "coin-too-small", symbol: "UCT", totalAmount: "0" },
        { coinId: "coin-enough", symbol: "UCT", totalAmount: "2" }
      ],
      "UCT",
      1
    );

    expect(selected).toBe("coin-enough");
  });
});
