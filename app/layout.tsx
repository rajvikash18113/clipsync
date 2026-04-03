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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <div className="mesh-bg" />
        <main style={{ position: "relative", zIndex: 1 }}>{children}</main>
      </body>
    </html>
  );
}
