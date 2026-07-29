"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthSplitLayout } from "@/components/auth-split-layout";
import { AUTH_IMAGES } from "@/lib/authImages";

export default function SignUpPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn("password", { email, password, flow: "signUp" });
      router.push("/verify-email");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthSplitLayout image={AUTH_IMAGES.signUp} eyebrow="Open an account">
      <div data-animate className="mb-10">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          We&apos;ll send a 6-digit code to verify your email before you can deposit or invest.
        </p>
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
            autoComplete="new-password"
            required
            minLength={8}
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
          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Sign up"}
          </Button>
        </div>
      </form>

      <p data-animate className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
