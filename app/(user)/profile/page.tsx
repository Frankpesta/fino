"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { BasicInfoSection } from "@/components/profile/basic-info-section";
import { ChangePasswordSection } from "@/components/profile/change-password-section";
import { TwoFactorSection } from "@/components/profile/two-factor-section";
import { SessionsSection } from "@/components/profile/sessions-section";
import { NotificationPreferencesSection } from "@/components/profile/notification-preferences-section";
import { DangerZoneSection } from "@/components/profile/danger-zone-section";

export default function ProfilePage() {
  const user = useQuery(api.users.getCurrentUser);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Account details, security, and notification preferences.
        </p>
      </div>

      {user === undefined ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : user === null ? null : (
        <>
          <BasicInfoSection user={user} />
          <ChangePasswordSection />
          <TwoFactorSection user={user} />
          <SessionsSection />
          <NotificationPreferencesSection user={user} />
          <DangerZoneSection user={user} />
        </>
      )}
    </div>
  );
}
