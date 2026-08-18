import type { MetadataRoute } from "next";

const SITE_URL = "https://klinikos.io";

export const privateRoutePrefixes = [
  "/api/",
  "/access/",
  "/activate/",
  "/admin/",
  "/billing/",
  "/cases/",
  "/connections/",
  "/dashboard/",
  "/encounters/",
  "/follow-up/",
  "/front-desk/",
  "/login/",
  "/luxe-medi/",
  "/network/",
  "/owner/",
  "/patients/",
  "/payments/",
  "/portal/",
  "/provider/",
  "/quality/",
  "/referrals/",
  "/register/",
  "/settings/",
  "/tasks/",
  "/today/",
  "/grid/workspace/",
  "/grid/opportunities/",
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...privateRoutePrefixes],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
