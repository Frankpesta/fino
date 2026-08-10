"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthSplitLayout } from "@/components/auth-split-layout";
import { AUTH_IMAGES } from "@/lib/authImages";

export default function AdminLoginPage() {
  const { signIn, signOut } = useAuthActions();
  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [needs2FA, setNeeds2FA] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Resolved once the reactive getCurrentUser query catches up after
  // signIn() completes. Non-admin accounts are signed back out immediately --
  // this route grants nothing beyond confirming a session exists.
  useEffect(() => {
    if (!submitted || user === undefined) return;
    if (user === null) {
      setSubmitted(false);
      return;
    }
    if (user.role === "admin") {
      router.replace("/admin");
    } else {
      signOut().finally(() => {
        setSubmitted(false);
        setIsSubmitting(false);
        setError("This account does not have admin access.");
      });
    }
  }, [submitted, user, router, signOut]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn("password", {
        email,
        password,
        flow: "signIn",
        ...(needs2FA ? { code } : {}),
      });
      setSubmitted(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("2FA_REQUIRED")) {
        setNeeds2FA(true);
      } else if (needs2FA) {
        setError("Invalid code");
      } else {
        setError(message || "Invalid email or password");
      }
      setIsSubmitting(false);
    }
  }

  return (
    <AuthSplitLayout image={AUTH_IMAGES.adminLogin} eyebrow="Admin console">
      <div data-animate className="mb-10">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {needs2FA ? "Enter your code" : "Admin sign in"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {needs2FA
            ? "Enter the 6-digit code from your authenticator app."
            : "Restricted access. Admin credentials only."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {needs2FA ? (
          <div data-animate className="space-y-2">
            <Label htmlFor="totp-code">Authentication code</Label>
            <Input
              id="totp-code"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="text-center font-heading text-lg tracking-[0.5em]"
            />
          </div>
        ) : (
          <>
            <div data-animate className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                className="py-5 shadow-none rounded-lg"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div data-animate className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                className="py-5 shadow-none rounded-lg"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </>
        )}
        {error && (
          <p data-animate className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div data-animate>
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting || submitted}
          >
            {isSubmitting ? "Signing in..." : needs2FA ? "Verify" : "Sign in"}
          </Button>
        </div>
        {needs2FA && (
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              setNeeds2FA(false);
              setCode("");
              setError(null);
            }}
          >
            Back
          </Button>
        )}
      </form>
    </AuthSplitLayout>
  );
}
