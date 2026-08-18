import type { MetadataRoute } from "next";

/**
 * Robots rules are defense-in-depth, not authorization. Every protected route must
 * still enforce authentication/authorization server-side. These rules reduce crawler
 * discovery, cached snippets, and accidental indexing of private workflow URLs.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/access/",
        "/login",
        "/portal/",
        "/dashboard",
        "/front-desk",
        "/provider",
        "/patients",
        "/schedule",
        "/encounters",
        "/telemedicine",
        "/labs",
        "/imaging",
        "/medications",
        "/documents",
        "/forms",
        "/knowledge",
        "/remote-monitoring",
        "/inventory",
        "/billing",
        "/claim-readiness",
        "/insurance",
        "/cases",
        "/injury-episodes",
        "/quality",
        "/crm",
        "/messages",
        "/tasks",
        "/escalations",
        "/network",
        "/referrals",
        "/care-teams",
        "/capacity-exchange",
        "/provider-network",
        "/health-passport",
        "/intake-passport",
        "/patient-navigation",
        "/access-controls",
        "/identity-resolution",
        "/integrations",
        "/settings",
        "/system-health",
        "/feature-registry",
        "/admin/",
        "/owner/",
        "/zumi",
        "/paths",
        "/payments/",
      ],
    },
    sitemap: "https://klinikos.io/sitemap.xml",
    host: "https://klinikos.io",
  };
}
