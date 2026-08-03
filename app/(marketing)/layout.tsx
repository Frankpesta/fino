import Script from "next/script";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Script id="chatway" strategy="lazyOnload" src="https://cdn.chatway.app/widget.js?id=WKFKBlnQ218D" />
    </>
  );
}
