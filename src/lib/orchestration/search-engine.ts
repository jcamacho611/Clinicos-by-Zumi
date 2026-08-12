import type { ActorContext } from "@/lib/orchestration/contracts";

export type SearchEntityType = "patient" | "provider" | "path" | "task" | "grid" | "edu" | "referral" | "document" | "transaction" | "claim" | "action";

export type SearchRecord = {
  id: string;
  type: SearchEntityType;
  title: string;
  subtitle?: string | null;
  keywords: string[];
  href: string;
  organizationId?: string | null;
  patientId?: string | null;
  requiredRoles?: string[];
  requiredPermissions?: string[];
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function searchAuthorizedRecords(input: {
  context: ActorContext;
  query: string;
  records: readonly SearchRecord[];
  limit?: number;
}) {
  const query = normalize(input.query);
  if (!query) return [];
  const terms = query.split(/\s+/).filter(Boolean);
  const roles = new Set(input.context.roleKeys.map(normalize));
  const permissions = new Set(input.context.permissionKeys);

  return input.records
    .filter((record) => {
      if (record.organizationId && record.organizationId !== input.context.organizationId) return false;
      if (record.patientId && input.context.contextKind === "patient" && record.patientId !== input.context.patientId) return false;
      if ((record.requiredRoles ?? []).some((role) => !roles.has(normalize(role)))) return false;
      if ((record.requiredPermissions ?? []).some((permission) => !permissions.has(permission))) return false;
      return true;
    })
    .map((record) => {
      const haystack = normalize([record.title, record.subtitle ?? "", ...record.keywords].join(" "));
      const hits = terms.filter((term) => haystack.includes(term)).length;
      const exactTitle = normalize(record.title) === query ? 100 : 0;
      const startsTitle = normalize(record.title).startsWith(query) ? 30 : 0;
      return { record, score: exactTitle + startsTitle + hits * 10 };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, input.limit ?? 20)
    .map((entry) => entry.record);
}
