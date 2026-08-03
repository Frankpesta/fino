import { redirect } from "next/navigation";
import Script from "next/script";
import { fetchQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const token = await convexAuthNextjsToken();
  const user = await fetchQuery(api.users.getCurrentUser, {}, { token });

  if (!user) {
    redirect("/sign-in");
  }
  if (!user.emailVerified) {
    redirect("/verify-email");
  }

  return (
    <>
      <AppShell email={user.email}>{children}</AppShell>
      <Script id="chatway" strategy="lazyOnload" src="https://cdn.chatway.app/widget.js?id=WKFKBlnQ218D" />
    </>
  );
}
