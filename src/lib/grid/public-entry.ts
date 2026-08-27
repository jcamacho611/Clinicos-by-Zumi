import type { GridIntentKind } from "@/lib/grid/intent-rules";

export type GridPublicEntryContext = {
  source: "public-zumi";
  intent: GridIntentKind;
  initialQuery: string;
  title: string;
  body: string;
};

const PUBLIC_ZUMI_GRID_ENTRY: Record<string, GridPublicEntryContext> = {
  staffing: {
    source: "public-zumi",
    intent: "provider",
    initialQuery: "I need a healthcare professional",
    title: "Continue the staffing need you started with Zumi",
    body: "Add the role, location, timing, and any requirements. Grid will narrow real supply without making you start over.",
  },
  grid: {
    source: "public-zumi",
    intent: "all",
    initialQuery: "",
    title: "Continue in Grid",
    body: "Tell Grid what you need or what you have. Your public Zumi context brought you here without carrying private free text into the URL.",
  },
};

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Convert only bounded public continuation metadata into a Grid starting point.
 *
 * Raw Public Zumi conversation text is intentionally absent. This function never
 * reconstructs clinical, employment, financial, or other private free text from URL
 * state. It only resumes the small structured intent that was already approved for
 * public continuation.
 */
export function gridPublicEntryContext(
  source: string | string[] | undefined,
  intent: string | string[] | undefined,
) {
  const sourceValue = firstQueryValue(source);
  const intentValue = firstQueryValue(intent);
  if (sourceValue !== "public-zumi" || !intentValue) return null;
  return PUBLIC_ZUMI_GRID_ENTRY[intentValue] ?? null;
}
