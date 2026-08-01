"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Search, UserRound } from "lucide-react";

export type Recipient = { _id: Id<"users">; email: string; name?: string };

export function UserPicker({
  value,
  onChange,
}: {
  value: Recipient | null;
  onChange: (user: Recipient) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const results = useQuery(api.adminMessages.listRecipients, { search: search || undefined });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button type="button" variant="outline" className="w-full justify-between font-normal" />}
      >
        <span className={cn("flex min-w-0 items-center gap-2", !value && "text-muted-foreground")}>
          <UserRound className="size-4 shrink-0" />
          <span className="truncate">
            {value ? (value.name ? `${value.name} — ${value.email}` : value.email) : "Select a user…"}
          </span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 border-0 px-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {results === undefined ? (
            <div className="space-y-1 p-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No users found.</p>
          ) : (
            results.map((user) => {
              const active = value?._id === user._id;
              return (
                <button
                  key={user._id}
                  type="button"
                  onClick={() => {
                    onChange(user);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    active && "bg-accent/60",
                  )}
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {(user.name ?? user.email).slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    {user.name && <span className="block truncate font-medium">{user.name}</span>}
                    <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                  </span>
                  {active && <Check className="size-4 shrink-0 text-primary" />}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
