export function luxeLeadClaimDecision(assignedTo: string | null, userId: string) {
  if (!assignedTo) return "claim" as const;
  if (assignedTo === userId) return "already_owned" as const;
  return "owned_by_other" as const;
}
