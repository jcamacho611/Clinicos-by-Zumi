/**
 * Which capability modules an organization currently holds.
 *
 * Derived from server-side subscription rows and nothing else. The constitution is
 * explicit that entitlement state is never read from the request, so there is no
 * input to this function a caller could forge — it takes rows, not claims.
 *
 * This reads `ClinicSubscription.modules`, which is the entitlement source that
 * exists in the schema today. When the Whop-backed entitlement layer lands it becomes
 * a second source to union in here, in one place, rather than a second answer.
 *
 * Pure module. No database, no network.
 */

export type SubscriptionRow = {
  status: string;
  modules: string[];
  trialEndsAt: Date | null;
  currentPeriodEndsAt: Date | null;
};

/**
 * Statuses that grant access.
 *
 * `past_due` is deliberately absent. A clinic in dunning keeps its data and its
 * workspace; what it loses is the paid AI capabilities, which is the lever that
 * actually prompts payment without holding records hostage.
 */
const ENTITLING_STATUSES = new Set(["active", "trialing"]);

export function subscriptionIsEntitling(row: SubscriptionRow, now: Date): boolean {
  if (!ENTITLING_STATUSES.has(row.status)) return false;

  // An expired window does not entitle, whatever the status column still says. A
  // status that was never advanced by a webhook is the common failure here, and
  // trusting it would hand out paid capabilities indefinitely.
  if (row.status === "trialing") {
    return row.trialEndsAt === null || row.trialEndsAt > now;
  }
  return row.currentPeriodEndsAt === null || row.currentPeriodEndsAt > now;
}

export function entitlementsFromSubscriptions(rows: readonly SubscriptionRow[], now = new Date()): string[] {
  const modules = new Set<string>();
  for (const row of rows) {
    if (!subscriptionIsEntitling(row, now)) continue;
    for (const entry of row.modules) {
      const normalized = entry.trim();
      if (normalized) modules.add(normalized);
    }
  }
  return [...modules].sort();
}
