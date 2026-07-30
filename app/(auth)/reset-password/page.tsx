"use client";

import { useState, Suspense, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthSplitLayout } from "@/components/auth-split-layout";
import { AUTH_IMAGES } from "@/lib/authImages";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirmReset = useAction(api.passwordResetActions.confirmReset);

  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await confirmReset({ email, code, newPassword });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthSplitLayout image={AUTH_IMAGES.verifyEmail} eyebrow="Account recovery">
      <div data-animate className="mb-10">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Reset your password
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Enter the code we emailed you and choose a new password.
        </p>
      </div>

      {success ? (
        <div data-animate className="space-y-5">
          <p className="text-sm text-success">
            Your password has been reset. Every other session has been signed out.
          </p>
          <Button className="w-full" size="lg" onClick={() => router.push("/sign-in")}>
            Sign in
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div data-animate className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input
              id="reset-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div data-animate className="space-y-2">
            <Label htmlFor="reset-code">Reset code</Label>
            <Input
              id="reset-code"
              inputMode="numeric"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="text-center font-heading text-lg tracking-[0.5em]"
            />
          </div>
          <div data-animate className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          {error && (
            <p data-animate className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div data-animate>
            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Resetting..." : "Reset password"}
            </Button>
          </div>
        </form>
      )}

      <p data-animate className="mt-8 text-center text-sm text-muted-foreground">
        <Link href="/forgot-password" className="text-primary underline-offset-4 hover:underline">
          Request a new code
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
