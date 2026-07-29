import { redirect } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@/convex/_generated/api";
import { AdminShell } from "@/components/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = await convexAuthNextjsToken();
  const user = await fetchQuery(api.users.getCurrentUser, {}, { token });

  if (!user || user.role !== "admin") {
    redirect("/dashboard");
  }

  return <AdminShell email={user.email}>{children}</AdminShell>;
}
