"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthSplitLayout } from "@/components/auth-split-layout";
import { AUTH_IMAGES } from "@/lib/authImages";

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Role/verification-based landing page, resolved once the reactive
  // getCurrentUser query catches up after signIn() completes.
  useEffect(() => {
    if (!submitted || user === undefined || user === null) return;
    if (user.role === "admin") {
      router.replace("/admin");
    } else if (!user.emailVerified) {
      router.replace("/verify-email");
    } else {
      router.replace("/dashboard");
    }
  }, [submitted, user, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn("password", { email, password, flow: "signIn" });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthSplitLayout image={AUTH_IMAGES.signIn} eyebrow="Welcome back">
      <div data-animate className="mb-10">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-3 text-sm text-muted-foreground">Access your desk.</p>
      </div>

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
        <div data-animate className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
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
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </div>
      </form>

      <p data-animate className="mt-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="text-primary underline-offset-4 hover:underline">
          Sign up
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
