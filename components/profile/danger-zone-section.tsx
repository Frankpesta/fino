"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TriangleAlert } from "lucide-react";

export function DangerZoneSection({ user }: { user: Doc<"users"> }) {
  const requestDeletion = useMutation(api.profile.requestAccountDeletion);
  const cancelDeletion = useMutation(api.profile.cancelAccountDeletionRequest);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRequest() {
    setIsSubmitting(true);
    try {
      await requestDeletion({});
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel() {
    setIsSubmitting(true);
    try {
      await cancelDeletion({});
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-base font-medium text-destructive">Danger zone</CardTitle>
        <CardDescription>
          Requests are reviewed by an admin -- your financial records are never deleted, only
          your account access.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {user.deletionRequestedAt ? (
          <div className="space-y-3">
            <Alert>
              <TriangleAlert className="size-4" />
              <AlertTitle>Deletion requested</AlertTitle>
              <AlertDescription>
                Requested {new Date(user.deletionRequestedAt).toLocaleString()}. An admin will
                follow up.
              </AlertDescription>
            </Alert>
            <Button variant="outline" disabled={isSubmitting} onClick={handleCancel}>
              Cancel request
            </Button>
          </div>
        ) : (
          <Button variant="destructive" disabled={isSubmitting} onClick={handleRequest}>
            Request account deletion
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
