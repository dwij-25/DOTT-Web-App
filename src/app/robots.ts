import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/profile", "/invoice/"],
      },
    ],
    sitemap: "https://www.dottdrop.com/sitemap.xml",
  };
}
