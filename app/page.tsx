import RoomClient from "@/components/RoomClient";

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "OnlineClip",
    "alternateName": ["ClipSync", "Online Clip", "OnlineClipboard"],
    "url": "https://onlineclip.vercel.app",
    "image": "https://onlineclip.vercel.app/logo.png",
    "description": "OnlineClip is the fastest online clipboard and file sharing tool. Instantly share text, links, and files across all your devices with no registration required.",
    "applicationCategory": "UtilityApplication",
    "operatingSystem": "All",
    "browserRequirements": "Requires HTML5 and JavaScript support",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RoomClient code="PUBLIC" isHome={true} />
    </>
  );
}
