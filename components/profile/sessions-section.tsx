"use client";

import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function SessionsSection() {
  const sessions = useQuery(api.profile.listSessions);
  const revokeSession = useAction(api.profileActions.revokeSession);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  async function handleRevoke(sessionId: Id<"authSessions">) {
    setRevokingId(sessionId);
    try {
      await revokeSession({ sessionId });
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Active sessions</CardTitle>
        <CardDescription>
          Revoking a session signs it out immediately. This build tracks sessions by expiry only
          -- no device or location info.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sessions === undefined ? (
          <Skeleton className="h-16 w-full" />
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active sessions.</p>
        ) : (
          <div className="divide-y">
            {sessions.map((s) => (
              <div key={s._id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-muted-foreground">
                  Expires {new Date(s.expirationTime).toLocaleString()}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={revokingId === s._id}
                  onClick={() => handleRevoke(s._id)}
                >
                  {revokingId === s._id ? "Revoking..." : "Revoke"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
