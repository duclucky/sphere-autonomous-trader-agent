import { describe, expect, it } from "vitest";
import { getListenConfig } from "../src/api/listenConfig";

describe("getListenConfig", () => {
  it("uses Render-compatible host and platform port by default", () => {
    expect(getListenConfig({ PORT: "10000" })).toEqual({ host: "0.0.0.0", port: 10000 });
  });

  it("allows local host override for development", () => {
    expect(getListenConfig({ HOST: "127.0.0.1", PORT: "8787" })).toEqual({ host: "127.0.0.1", port: 8787 });
  });
});
