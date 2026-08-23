export type ZumiGovernedContextScope = "user" | "organization" | "global";

export type ZumiGovernedContextAuthority =
  | "human_confirmed_personal"
  | "verified_outcome_evidence"
  | "human_approved_organization"
  | "human_approved_global_reference";

export type ZumiGovernedContextItem = {
  id: string;
  scope: ZumiGovernedContextScope;
  authority: ZumiGovernedContextAuthority;
  title: string;
  content: string;
  sourceName: string;
  sourceDate: string | null;
  effectiveAt: string | null;
  expiresAt: string | null;
  version: number;
  evidenceIds?: string[];
};

function terms(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length >= 3);
}

function normalizedTitle(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function authorityWeight(item: ZumiGovernedContextItem) {
  if (item.authority === "human_approved_organization") return 4;
  if (item.authority === "human_approved_global_reference") return 3;
  if (item.authority === "verified_outcome_evidence") return 2;
  return 1;
}

export function zumiGovernedContextMatchesQuestion(item: ZumiGovernedContextItem, question: string) {
  const queryTerms = new Set(terms(question));
  if (queryTerms.size === 0) return false;
  const haystack = `${item.title} ${item.content} ${item.sourceName}`.toLowerCase();
  return [...queryTerms].some((term) => haystack.includes(term));
}

export function resolveZumiGovernedContextConflicts(items: readonly ZumiGovernedContextItem[]) {
  const grouped = new Map<string, ZumiGovernedContextItem[]>();
  for (const item of items) {
    const key = normalizedTitle(item.title) || item.id;
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }

  const resolved: ZumiGovernedContextItem[] = [];
  for (const candidates of grouped.values()) {
    const organizationItems = candidates.filter((item) => item.scope === "organization");
    const globalItems = candidates.filter((item) => item.scope === "global");
    const personalItems = candidates.filter((item) => item.scope === "user");
    const preferred = organizationItems.length
      ? organizationItems
      : globalItems.length
        ? globalItems
        : personalItems;

    const distinctContent = new Set(preferred.map((item) => item.content.trim()));
    if (distinctContent.size > 1) continue;

    const newest = [...preferred].sort((a, b) => b.version - a.version)[0];
    if (newest) resolved.push(newest);
  }

  return resolved;
}

export function rankZumiGovernedContext(
  items: readonly ZumiGovernedContextItem[],
  question: string,
  take = 8,
) {
  const queryTerms = new Set(terms(question));
  return [...items]
    .map((item) => {
      const title = item.title.toLowerCase();
      const haystack = `${item.title} ${item.content} ${item.sourceName}`.toLowerCase();
      const lexicalScore = [...queryTerms].reduce((score, term) => {
        if (title.includes(term)) return score + 6;
        if (haystack.includes(term)) return score + 2;
        return score;
      }, 0);
      return { item, score: lexicalScore + authorityWeight(item) };
    })
    .sort((a, b) => b.score - a.score || b.item.version - a.item.version)
    .slice(0, Math.max(1, Math.min(take, 20)))
    .map(({ item }) => item);
}

export function formatZumiGovernedContext(items: readonly ZumiGovernedContextItem[]) {
  return items
    .map((item) => {
      const metadata = [
        `authority=${item.authority}`,
        `scope=${item.scope}`,
        "operational_authority=false",
        `source=${item.sourceName}`,
        `version=${item.version}`,
        item.effectiveAt ? `effective_at=${item.effectiveAt}` : null,
        item.expiresAt ? `expires_at=${item.expiresAt}` : null,
      ]
        .filter(Boolean)
        .join(" ");
      return `- [${metadata}] ${item.title}: ${item.content}`;
    })
    .join("\n");
}
