import type { MetadataRoute } from "next";
import { publicSitemapEntries } from "@/lib/screen-experience-route-presentation";

const SITE_URL = "https://klinikos.io";

export const publicSitemapPaths = publicSitemapEntries.map((route) => route.path);

export default function sitemap(): MetadataRoute.Sitemap {
  return publicSitemapEntries.map((route) => ({
    url: new URL(route.path, SITE_URL).toString(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
