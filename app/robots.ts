import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = "https://sdakawangwangware.site";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/dashboard/", "/api/", "/login/", "/verify-otp/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
