import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/room/",
    },
    sitemap: "https://onlineclip.vercel.app/sitemap.xml",
  };
}
