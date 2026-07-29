import { describe, it, expect } from "vitest";
import { formatAmount, DISPLAY_DECIMALS } from "./currency";

describe("formatAmount", () => {
  it("formats stablecoins to 2 decimal places", () => {
    expect(formatAmount(1234.5, "USDT")).toBe("1,234.50");
    expect(formatAmount(0, "USDC")).toBe("0.00");
  });

  it("formats BTC to 8 decimal places", () => {
    expect(formatAmount(0.5, "BTC")).toBe("0.50000000");
  });

  it("formats ETH and BNB to 6 decimal places", () => {
    expect(formatAmount(1.2, "ETH")).toBe("1.200000");
    expect(formatAmount(1.2, "BNB")).toBe("1.200000");
  });

  it("uses thousands separators", () => {
    expect(formatAmount(1000000, "USDT")).toBe("1,000,000.00");
  });

  it("every declared currency has a decimals config", () => {
    for (const currency of Object.keys(DISPLAY_DECIMALS) as (keyof typeof DISPLAY_DECIMALS)[]) {
      expect(typeof DISPLAY_DECIMALS[currency]).toBe("number");
    }
  });
});
