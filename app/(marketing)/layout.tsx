import { LiveChat } from "@/components/live-chat";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <LiveChat />
    </>
  );
}
