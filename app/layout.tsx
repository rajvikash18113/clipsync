import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://onlineclip.vercel.app"),
  title: {
    default: "OnlineClip | Instant Online Clipboard & Sharing",
    template: "%s | OnlineClip",
  },
  description:
    "OnlineClip is the fastest online clipboard and file sharing tool. Instantly share text, links, and files across all your devices with no registration required.",
  keywords: [
    "OnlineClip",
    "online clip",
    "online clipboard",
    "clipboard",
    "online sharing",
    "clipboard online",
    "clipboard sharing",
    "share clipboard online",
    "copy paste online",
    "temporary clipboard",
    "cross-device copy paste",
    "send text between devices",
    "send files between devices",
    "cloud clipboard",
    "web clipboard",
    "notes sharing",
    "clipboard sync",
    "instant file transfer"
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "OnlineClip | Instant Online Clipboard & Sharing",
    description: "Instantly sync text, links, and files across all your devices with no login required. Fast, secure, and registration-free.",
    url: "https://onlineclip.vercel.app",
    siteName: "OnlineClip",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "OnlineClip Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "OnlineClip | Instant Online Clipboard & Sharing",
    description: "Instantly sync text, links, and files across all your devices with no registration required.",
    images: ["/logo.png"],
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6c63ff" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Restore theme before paint to prevent flash
              (function() {
                try {
                  var t = localStorage.getItem('clipsync_theme');
                  if (t && t !== 'dark') document.documentElement.setAttribute('data-theme', t);
                } catch(e) {}
              })();
              // Register service worker
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </head>
      <body>
        <div className="mesh-bg" />
        <main style={{ position: "relative", zIndex: 1 }}>{children}</main>
      </body>
    </html>
  );
}
