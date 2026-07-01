import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = "https://www.sdakawangware.org";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/dashboard/", "/api/", "/login/", "/verify-otp/", "/confirmation/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
