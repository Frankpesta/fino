export type NotificationEventKey =
  | "depositApproved"
  | "depositRejected"
  | "withdrawalApproved"
  | "withdrawalRejected"
  | "investmentMatured"
  | "referralCommissionEarned";

export type NotificationPreferences = Record<NotificationEventKey, boolean>;

/**
 * Security-critical emails (verification, password/2FA changes) always
 * send regardless of preferences -- callers for those never go through this
 * check at all. Everything else respects the user's toggle, defaulting to
 * "send" if they've never set preferences (matches
 * schema.ts's defaultNotificationPreferences).
 */
export function shouldSendNotification(
  preferences: NotificationPreferences | undefined,
  key: NotificationEventKey,
): boolean {
  if (!preferences) return true;
  return preferences[key];
}
