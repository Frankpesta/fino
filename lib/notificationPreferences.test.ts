import { describe, it, expect } from "vitest";
import { shouldSendNotification, type NotificationPreferences } from "./notificationPreferences";

function prefs(overrides: Partial<NotificationPreferences> = {}): NotificationPreferences {
  return {
    depositApproved: true,
    depositRejected: true,
    withdrawalApproved: true,
    withdrawalRejected: true,
    investmentMatured: true,
    referralCommissionEarned: true,
    ...overrides,
  };
}

describe("shouldSendNotification", () => {
  it("defaults to true when preferences are undefined (never configured)", () => {
    expect(shouldSendNotification(undefined, "depositApproved")).toBe(true);
  });

  it("respects an explicit true", () => {
    expect(shouldSendNotification(prefs({ depositApproved: true }), "depositApproved")).toBe(
      true,
    );
  });

  it("respects an explicit false", () => {
    expect(shouldSendNotification(prefs({ depositApproved: false }), "depositApproved")).toBe(
      false,
    );
  });

  it("checks the specific key requested, not other keys", () => {
    const p = prefs({ depositApproved: false, withdrawalApproved: true });
    expect(shouldSendNotification(p, "depositApproved")).toBe(false);
    expect(shouldSendNotification(p, "withdrawalApproved")).toBe(true);
  });
});
