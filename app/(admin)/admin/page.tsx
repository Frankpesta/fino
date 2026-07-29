import { fetchQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@/convex/_generated/api";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AdminHomePage() {
  const token = await convexAuthNextjsToken();
  const user = await fetchQuery(api.users.getCurrentUser, {}, { token });

  return (
    <div className="p-8">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Admin</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>
      <p className="text-muted-foreground">
        Signed in as {user?.email} (admin). Platform stats and approval queues land in Phase 4.
      </p>
    </div>
  );
}
