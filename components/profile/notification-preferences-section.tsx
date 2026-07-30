"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const EVENTS: { key: keyof NonNullable<Doc<"users">["notificationPreferences"]>; label: string }[] = [
  { key: "depositApproved", label: "Deposit approved" },
  { key: "depositRejected", label: "Deposit rejected" },
  { key: "withdrawalApproved", label: "Withdrawal approved" },
  { key: "withdrawalRejected", label: "Withdrawal rejected" },
  { key: "investmentMatured", label: "Investment matured" },
  { key: "referralCommissionEarned", label: "Referral commission earned" },
];

const DEFAULT_PREFERENCES: NonNullable<Doc<"users">["notificationPreferences"]> = {
  depositApproved: true,
  depositRejected: true,
  withdrawalApproved: true,
  withdrawalRejected: true,
  investmentMatured: true,
  referralCommissionEarned: true,
};

export function NotificationPreferencesSection({ user }: { user: Doc<"users"> }) {
  const updatePreferences = useMutation(api.profile.updateNotificationPreferences);
  const [preferences, setPreferences] = useState(
    user.notificationPreferences ?? DEFAULT_PREFERENCES,
  );

  async function handleToggle(key: keyof typeof preferences, value: boolean) {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    await updatePreferences({ preferences: next });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Notification preferences</CardTitle>
        <CardDescription>
          Security emails (verification, password/2FA changes) always send regardless of these.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {EVENTS.map((event) => (
          <div key={event.key} className="flex items-center justify-between">
            <Label htmlFor={`pref-${event.key}`} className="font-normal">
              {event.label}
            </Label>
            <Switch
              id={`pref-${event.key}`}
              checked={preferences[event.key]}
              onCheckedChange={(checked) => handleToggle(event.key, checked)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
