"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import QRCode from "qrcode";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export function TwoFactorSection({ user }: { user: Doc<"users"> }) {
  const begin2FASetup = useMutation(api.profile.begin2FASetup);
  const confirm2FASetup = useMutation(api.profile.confirm2FASetup);
  const disable2FA = useMutation(api.profile.disable2FA);

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [manualSecret, setManualSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleStartSetup() {
    setError(null);
    setIsSubmitting(true);
    try {
      const { secret, uri } = await begin2FASetup({});
      setManualSecret(secret);
      setQrDataUrl(await QRCode.toDataURL(uri));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirm() {
    setError(null);
    setIsSubmitting(true);
    try {
      await confirm2FASetup({ code });
      setQrDataUrl(null);
      setManualSecret(null);
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDisable() {
    setError(null);
    setIsSubmitting(true);
    try {
      await disable2FA({ code });
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-medium">Two-factor authentication</CardTitle>
          <Badge variant={user.twoFactorEnabled ? "default" : "outline"}>
            {user.twoFactorEnabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
        <CardDescription>Authenticator app (TOTP) -- Google Authenticator, Authy, etc.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {user.twoFactorEnabled ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="disable-2fa-code">Enter a code to disable 2FA</Label>
              <Input
                id="disable-2fa-code"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="max-w-[160px] text-center tracking-[0.3em]"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button variant="destructive" disabled={isSubmitting} onClick={handleDisable}>
              {isSubmitting ? "Disabling..." : "Disable 2FA"}
            </Button>
          </div>
        ) : qrDataUrl ? (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="2FA QR code" className="size-48 rounded-md border" />
            {manualSecret && (
              <p className="text-xs text-muted-foreground">
                Can&apos;t scan? Enter manually: <span className="font-mono">{manualSecret}</span>
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="confirm-2fa-code">Enter the 6-digit code from your app</Label>
              <Input
                id="confirm-2fa-code"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="max-w-[160px] text-center tracking-[0.3em]"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button disabled={isSubmitting} onClick={handleConfirm}>
              {isSubmitting ? "Confirming..." : "Confirm & enable"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button disabled={isSubmitting} onClick={handleStartSetup}>
              {isSubmitting ? "Starting..." : "Set up 2FA"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
