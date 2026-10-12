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
      <Script
        id="smartsupp-livechat"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
var _smartsupp = _smartsupp || {};
_smartsupp.key = '14dad113fefd5e7ca4f77a3db656e013a25413aa';
window.smartsupp||(function(d) {
  var s,c,o=smartsupp=function(){ o._.push(arguments)};o._=[];
  s=d.getElementsByTagName('script')[0];c=d.createElement('script');
  c.type='text/javascript';c.charset='utf-8';c.async=true;
  c.src='https://www.smartsuppchat.com/loader.js?';s.parentNode.insertBefore(c,s);
})(document);
`,
        }}
      />
    </>
  );
}
