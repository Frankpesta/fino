"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthSplitLayout } from "@/components/auth-split-layout";
import { AUTH_IMAGES } from "@/lib/authImages";

export default function VerifyEmailPage() {
  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser);
  const verifyCode = useMutation(api.emailVerification.verifyCode);
  const resendCode = useMutation(api.emailVerification.resendCode);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (user?.emailVerified) {
      router.replace("/dashboard");
    }
  }, [user?.emailVerified, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await verifyCode({ code });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setError(null);
    setResendMessage(null);
    setIsResending(true);
    try {
      await resendCode({});
      setResendMessage("A new code has been sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend code");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <AuthSplitLayout image={AUTH_IMAGES.verifyEmail} eyebrow="Almost there">
      <div data-animate className="mb-10">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Verify your email
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Enter the 6-digit code sent to {user?.email ?? "your email"}. It expires in 15
          minutes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div data-animate className="space-y-2">
          <Label htmlFor="code">Verification code</Label>
          <Input
            id="code"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="text-center font-heading text-lg tracking-[0.5em]"
          />
        </div>
        {error && (
          <p data-animate className="text-sm text-destructive">
            {error}
          </p>
        )}
        {resendMessage && (
          <p data-animate className="text-sm text-success">
            {resendMessage}
          </p>
        )}
        <div data-animate>
          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Verifying..." : "Verify"}
          </Button>
        </div>
      </form>

      <div data-animate>
        <Button
          variant="ghost"
          className="mt-2 w-full"
          disabled={isResending}
          onClick={handleResend}
        >
          {isResending ? "Sending..." : "Resend code"}
        </Button>
      </div>
    </AuthSplitLayout>
  );
}
