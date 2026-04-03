import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClipSync — Real-Time Multi-Device Clipboard",
  description:
    "Share text, links, and code snippets instantly across all your devices. No login required — just create a room and paste.",
  keywords: ["clipboard", "real-time", "sync", "cross-device", "share text"],
  openGraph: {
    title: "ClipSync",
    description: "Real-time clipboard sync across all your devices",
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
