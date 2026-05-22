import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClipSync",
  description:
    "ClipSync is the ultimate fast, secure, and hassle-free clipboard syncing tool. Instantly share text, URLs, and code snippets across all your devices without any login required. Copy on one device, paste on another.",
  keywords: ["ClipSync", "clipboard sync", "share text online", "cross-device clipboard", "copy paste across devices", "secure clipboard sharing", "online clipboard"],
  openGraph: {
    title: "ClipSync",
    description: "Instantly sync text, links, and code snippets across all your devices without logging in. Fast, secure, and hassle-free clipboard sharing.",
    type: "website",
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
