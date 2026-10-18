import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import PwaRegister from "@/app/pwa-register";
import Script from "next/script";
import "./globals.css";
import "./pwa.css";

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const EMBEDDED_BROWSER_PATTERN = /WhatsApp|Instagram|FBAN|FBAV|Messenger|Line[/]|Twitter|TikTok|Snapchat/i;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Yusuf Clothing Line | Tailoring & Alterations", template: "%s | Yusuf Clothing Line" },
  description: "Custom tailoring, alterations and made-to-measure garments in Botswana.",
  applicationName: "Yusuf Clothing Line",
  keywords: ["Yusuf Clothing Line", "tailoring", "alterations", "made to measure", "Botswana"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Yusuf Clothing Line",
    title: "Yusuf Clothing Line | Tailoring & Alterations",
    description: "Made for you. Tailored in Botswana."
  },
  twitter: {
    card: "summary",
    title: "Yusuf Clothing Line | Tailoring & Alterations",
    description: "Made for you. Tailored in Botswana."
  },
  icons: { icon: [{ url: "/yusuf-icon-192.png", sizes: "192x192", type: "image/png" }, { url: "/yusuf-icon-512.png", sizes: "512x512", type: "image/png" }, { url: "/yusuf-icon.svg", sizes: "any", type: "image/svg+xml" }], apple: "/yusuf-icon-192.png" },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Yusuf Clothing", statusBarStyle: "default" }
};

export const viewport: Viewport = { themeColor: "#6B2636", colorScheme: "light" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const userAgent = requestHeaders.get("user-agent") || "";
  const requestedWith = requestHeaders.get("x-requested-with") || "";
  // A social referrer alone does not mean the browser is embedded.
  const embedded = EMBEDDED_BROWSER_PATTERN.test(userAgent)
    || (/Android/i.test(userAgent) && /\bwv\b/i.test(userAgent))
    || /^(com\.whatsapp|com\.instagram\.android|com\.facebook\.katana|com\.facebook\.lite|com\.facebook\.orca)$/i.test(requestedWith);
  const android = /Android/i.test(userAgent);

  return (
    <html lang="en">
      <body style={embedded ? { overflow: "hidden" } : undefined}>
        <Script id="yusuf-early-install-capture" strategy="beforeInteractive">{`
(function () {
  window.addEventListener("beforeinstallprompt", function (event) {
    var standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
    if (standalone || window.__yusufPwaListenerReady === true) return;
    event.preventDefault();
    window.__yusufInstallPrompt = event;
  });
})();
`}</Script>
        <PwaRegister initialEmbedded={embedded} initialAndroid={android} />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
