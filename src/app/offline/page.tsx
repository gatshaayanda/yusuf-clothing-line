import Link from "next/link";

export const metadata = { title: "You're offline" };

export default function OfflinePage() {
  return <main className="yusufRequestPage"><section className="yusufRequestSuccess"><Link href="/" className="yusufFooterBrand">YUSUF <span>CLOTHING LINE</span></Link><p className="yusufEyebrow">CONNECTION INTERRUPTED</p><h1>Take a moment.<br /><em>Then reconnect.</em></h1><p>The site could not reach the latest information. Your browser may still have previously viewed pages, but new requests and account updates need an internet connection.</p><div className="yusufRequestActions"><Link href="/">Return to studio</Link><Link href="/request">Open request form</Link></div></section></main>;
}
