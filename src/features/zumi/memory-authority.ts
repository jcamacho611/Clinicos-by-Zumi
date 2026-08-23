export type ZumiGovernedContextScope = "user" | "organization" | "global";

export type ZumiGovernedContextAuthority =
  | "human_confirmed_personal"
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
};

function terms(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length >= 3);
}

function authorityWeight(item: ZumiGovernedContextItem) {
  if (item.authority === "human_approved_organization") return 4;
  if (item.authority === "human_approved_global_reference") return 3;
  return 1;
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
