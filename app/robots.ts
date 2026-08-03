import type { MetadataRoute } from "next";
import { SITE_URL, siteUrl } from "../lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: siteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
