import type { MetadataRoute } from "next";

const baseUrl = "https://klinikos.io";

const publicRoutes = [
  "/",
  "/about",
  "/how-it-works",
  "/pricing",
  "/trust",
  "/grid",
  "/edu",
  "/ecosystem",
  "/founding-clinic",
  "/sales",
  "/legal/terms",
  "/legal/privacy",
  "/legal/acceptable-use",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-08-18T00:00:00.000Z");
  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route.startsWith("/legal/") ? 0.3 : 0.7,
  }));
}
