import Script from "next/script";

const SMARTSUPP_KEY = "14dad113fefd5e7ca4f77a3db656e013a25413aa";

export function LiveChat() {
  return (
    <Script id="smartsupp" strategy="lazyOnload">
      {`
var _smartsupp = _smartsupp || {};
_smartsupp.key = '${SMARTSUPP_KEY}';
window.smartsupp||(function(d) {
  var s,c,o=smartsupp=function(){ o._.push(arguments)};o._=[];
  s=d.getElementsByTagName('script')[0];c=d.createElement('script');
  c.type='text/javascript';c.charset='utf-8';c.async=true;
  c.src='https://www.smartsuppchat.com/loader.js?';s.parentNode.insertBefore(c,s);
})(document);
`}
    </Script>
  );
}
