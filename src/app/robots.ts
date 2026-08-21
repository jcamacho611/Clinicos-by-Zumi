import type { MetadataRoute } from "next";

const SITE_URL = "https://klinikos.io";

// robots.txt is crawl guidance, never access control. Every route below must still
// enforce its own authentication/authorization and private metadata boundaries.
export const privateRoutePrefixes = [
  "/api",
  "/access",
  "/activate",
  "/admin",
  "/action-center",
  "/billing",
  "/cases",
  "/care-teams",
  "/capacity-exchange",
  "/connections",
  "/crm",
  "/dashboard",
  "/documents",
  "/encounters",
  "/follow-up",
  "/front-desk",
  "/health-passport",
  "/identity-resolution",
  "/injury-episodes",
  "/intake-passport",
  "/login",
  "/luxe-medi",
  "/network",
  "/owner",
  "/patients",
  "/payments",
  "/portal",
  "/provider",
  "/quality",
  "/referrals",
  "/register",
  "/settings",
  "/tasks",
  "/today",
  "/zumi",
  "/grid/workspace",
  "/grid/opportunities",
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