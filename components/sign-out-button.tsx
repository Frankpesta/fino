"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const { signOut } = useAuthActions();
  const router = useRouter();

  return (
    <Button
      variant="outline"
      onClick={async () => {
        await signOut();
        router.push("/sign-in");
      }}
    >
      Sign out
    </Button>
  );
}
