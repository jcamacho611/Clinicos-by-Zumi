import { redirect } from "next/navigation";
import type { GridIntentKind } from "@/lib/grid/intent-rules";

const allowedIntents = new Set<GridIntentKind>([
  "all",
  "work",
  "provider",
  "space",
  "product",
  "equipment",
  "service",
  "network",
  "education",
  "organization",
  "referral",
]);

type BrowseSearchParams = {
  intent?: string | string[];
  q?: string | string[];
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function GridBrowseCompatibilityPage({ searchParams }: { searchParams: Promise<BrowseSearchParams> }) {
  const params = await searchParams;
  const intent = first(params.intent);
  const q = first(params.q)?.trim().slice(0, 240);
  const destination = new URLSearchParams();

  if (intent && allowedIntents.has(intent as GridIntentKind) && intent !== "all") {
    destination.set("intent", intent);
  }
  if (q) destination.set("q", q);

  redirect(destination.size ? `/grid?${destination.toString()}` : "/grid");
}
