"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function SidebarLogout({ email, collapsed }: { email?: string; collapsed: boolean }) {
  const { signOut } = useAuthActions();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    await signOut();
    router.push("/sign-in");
  }

  return (
    <div className="shrink-0 border-t border-white/10 p-3">
      {!collapsed && email && (
        <div className="mb-1 flex items-center gap-2.5 rounded-xl px-3 py-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/80">
            {email.slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1 truncate text-xs text-white/55">{email}</span>
        </div>
      )}
      <button
        type="button"
        onClick={handleSignOut}
        disabled={pending}
        title={collapsed ? "Log out" : undefined}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400/80 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-60",
          collapsed && "justify-center px-0",
        )}
      >
        <LogOut className="size-4 shrink-0" />
        {!collapsed && (pending ? "Signing out…" : "Log out")}
      </button>
    </div>
  );
}
