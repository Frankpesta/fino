"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthSplitLayout } from "@/components/auth-split-layout";
import { AUTH_IMAGES } from "@/lib/authImages";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const requestReset = useMutation(api.passwordReset.requestReset);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await requestReset({ email });
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthSplitLayout image={AUTH_IMAGES.verifyEmail} eyebrow="Account recovery">
      <div data-animate className="mb-10">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Forgot your password?
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a code to reset it.
        </p>
      </div>

      {submitted ? (
        <div data-animate className="space-y-5">
          <p className="text-sm text-success">
            If an account exists for that email, a reset code is on its way.
          </p>
          <Button
            className="w-full"
            size="lg"
            onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)}
          >
            Enter code
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div data-animate className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div data-animate>
            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send reset code"}
            </Button>
          </div>
        </form>
      )}

      <p data-animate className="mt-8 text-center text-sm text-muted-foreground">
        <Link href="/sign-in" className="text-primary underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
