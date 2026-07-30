import type { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TriangleAlert } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PageHero } from "@/components/marketing/page-hero";

export function LegalPageLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <PageHero title={title} eyebrow="Fino / Legal" description="The policies and terms that govern how the platform operates." />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>

        <Alert className="mt-6">
          <TriangleAlert className="size-4" />
          <AlertTitle>Placeholder legal text</AlertTitle>
          <AlertDescription>
            This page uses standard placeholder language and hasn&apos;t been reviewed by a
            lawyer. Replace bracketed fields and have qualified counsel review this before
            launch.
          </AlertDescription>
        </Alert>

        <div className="prose-legal mt-8 rounded-3xl border bg-card p-6 text-sm leading-relaxed text-foreground shadow-sm sm:p-10 [&_h2]:font-heading [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:text-muted-foreground [&_li]:text-muted-foreground">
          {children}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
