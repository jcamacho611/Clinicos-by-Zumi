import type { MetadataRoute } from "next";

const SITE_URL = "https://klinikos.io";

const publicRoutes: Array<{
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/how-it-works", changeFrequency: "monthly", priority: 0.9 },
  { path: "/capabilities", changeFrequency: "monthly", priority: 0.8 },
  { path: "/ecosystem", changeFrequency: "monthly", priority: 0.8 },
  { path: "/pricing", changeFrequency: "weekly", priority: 0.9 },
  { path: "/trust", changeFrequency: "weekly", priority: 0.9 },
  { path: "/founding-clinic", changeFrequency: "weekly", priority: 0.9 },
  { path: "/operational-audit", changeFrequency: "weekly", priority: 0.8 },
  { path: "/sales", changeFrequency: "weekly", priority: 0.7 },
  { path: "/start", changeFrequency: "weekly", priority: 0.8 },
  { path: "/grid", changeFrequency: "daily", priority: 0.8 },
  { path: "/grid/browse", changeFrequency: "daily", priority: 0.7 },
  { path: "/grid/pricing", changeFrequency: "weekly", priority: 0.7 },
  { path: "/edu", changeFrequency: "weekly", priority: 0.7 },
];

export const publicSitemapPaths = publicRoutes.map((route) => route.path);

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route) => ({
    url: new URL(route.path, SITE_URL).toString(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}