import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { CostToServeItem, MonthlyCostEvidence } from "@/lib/commercial/clinic-economics";

/**
 * What it costs Klinikos to serve one clinic for a month.
 *
 * This exists because the margin machinery was disconnected from reality. The
 * customer-funded usage ledger — reserve, settle, release, allowances — is fully
 * implemented and has **zero callers** outside its own module, so nothing in the product
 * has ever metered a cent into it. Any gross-margin figure computed from it today would
 * have been zero by omission, which is worse than no figure at all, because zero looks
 * like an answer.
 *
 * So this module does two separate things and never mixes them up.
 *
 * It MEASURES what is actually recorded. Every Zumi turn already writes a
 * `ZumiInvocation` row carrying real `costMicroUsd` from the provider, so intelligence
 * spend per organization is evidence rather than an estimate, and is marked `known`.
 *
 * It DECLARES what is not measured, line by line, with the unit and the driver, and
 * marks the rate `unknown`. It does not guess a hosting bill or an SMS rate. A cost
 * model that invents its own inputs produces a margin nobody can defend, and the first
 * number a CFO disproves discredits the rest.
 *
 * The consequence is deliberate: until the unknown rates are supplied,
 * `calculateClinicEconomics` will report `claimSafety: "insufficient"` and refuse to
 * state a margin. That is the correct answer to "what is our gross margin" right now.
 */

const MICRO_USD_PER_CENT = 10_000;

/** A cost line Klinikos can incur, and how it is driven. */
export interface CostLineDeclaration {
  readonly key: string;
  readonly label: string;
  readonly category: CostToServeItem["category"];
  /** What makes this cost go up. Written so a founder can price it from an invoice. */
  readonly driver: string;
  /** The vendor's billing unit, so a published rate can be entered without conversion. */
  readonly billingUnit: string;
  readonly fixedOrVariable: "fixed" | "variable";
  /** True when the cost belongs to one tenant; false when it is shared platform spend. */
  readonly tenantAttributable: boolean;
  /** Configured from a real invoice or rate card, or null while genuinely unknown. */
  readonly monthlyCentsPerClinic: number | null;
  readonly source: string | null;
  readonly asOf: string | null;
}

/**
 * Every material variable cost Klinikos can trigger, derived from the services this
 * repository is actually configured to call rather than from a generic SaaS checklist.
 * A rate of null means nobody has supplied it yet — that is a gap to fill, not a zero.
 */
export const COST_LINES: readonly CostLineDeclaration[] = [
  { key: "hosting", label: "Application hosting and compute", category: "infrastructure", driver: "Instances and request volume", billingUnit: "USD/month per service", fixedOrVariable: "fixed", tenantAttributable: false, monthlyCentsPerClinic: null, source: null, asOf: null },
  { key: "database", label: "Postgres", category: "infrastructure", driver: "Instance size, storage, connections", billingUnit: "USD/month", fixedOrVariable: "fixed", tenantAttributable: false, monthlyCentsPerClinic: null, source: null, asOf: null },
  { key: "object_storage", label: "Document and file storage", category: "infrastructure", driver: "GB stored plus egress", billingUnit: "USD/GB-month", fixedOrVariable: "variable", tenantAttributable: true, monthlyCentsPerClinic: null, source: null, asOf: null },
  { key: "backups", label: "Backups and retention", category: "infrastructure", driver: "Snapshot size and retention window", billingUnit: "USD/GB-month", fixedOrVariable: "variable", tenantAttributable: false, monthlyCentsPerClinic: null, source: null, asOf: null },
  { key: "observability", label: "Logging and monitoring", category: "infrastructure", driver: "Ingested log volume", billingUnit: "USD/GB ingested", fixedOrVariable: "variable", tenantAttributable: false, monthlyCentsPerClinic: null, source: null, asOf: null },

  // Intelligence is measured rather than declared — see measuredIntelligenceCost below.

  { key: "sms", label: "SMS and MMS", category: "communications", driver: "Messages sent and received", billingUnit: "USD/segment", fixedOrVariable: "variable", tenantAttributable: true, monthlyCentsPerClinic: null, source: null, asOf: null },
  { key: "voice", label: "Voice minutes", category: "communications", driver: "Call minutes", billingUnit: "USD/minute", fixedOrVariable: "variable", tenantAttributable: true, monthlyCentsPerClinic: null, source: null, asOf: null },
  { key: "email", label: "Transactional email", category: "communications", driver: "Messages sent", billingUnit: "USD/1k emails", fixedOrVariable: "variable", tenantAttributable: true, monthlyCentsPerClinic: null, source: null, asOf: null },
  { key: "telemedicine", label: "Video visits", category: "communications", driver: "Participant minutes", billingUnit: "USD/participant-minute", fixedOrVariable: "variable", tenantAttributable: true, monthlyCentsPerClinic: null, source: null, asOf: null },

  { key: "eligibility", label: "Eligibility checks", category: "healthcare_transactions", driver: "Transactions submitted", billingUnit: "USD/transaction", fixedOrVariable: "variable", tenantAttributable: true, monthlyCentsPerClinic: null, source: null, asOf: null },
  { key: "clearinghouse", label: "Claims and ERA", category: "healthcare_transactions", driver: "Claims submitted", billingUnit: "USD/claim", fixedOrVariable: "variable", tenantAttributable: true, monthlyCentsPerClinic: null, source: null, asOf: null },
  { key: "erx", label: "ePrescribing", category: "healthcare_transactions", driver: "Prescriber seats or transactions", billingUnit: "USD/prescriber-month", fixedOrVariable: "variable", tenantAttributable: true, monthlyCentsPerClinic: null, source: null, asOf: null },
  { key: "credential_verification", label: "Credential and background checks", category: "healthcare_transactions", driver: "Checks performed", billingUnit: "USD/check", fixedOrVariable: "variable", tenantAttributable: true, monthlyCentsPerClinic: null, source: null, asOf: null },
  { key: "esign", label: "Electronic signature", category: "healthcare_transactions", driver: "Envelopes sent", billingUnit: "USD/envelope", fixedOrVariable: "variable", tenantAttributable: true, monthlyCentsPerClinic: null, source: null, asOf: null },

  { key: "maps", label: "Maps and geocoding", category: "location", driver: "Map loads and geocode requests", billingUnit: "USD/1k requests", fixedOrVariable: "variable", tenantAttributable: true, monthlyCentsPerClinic: null, source: null, asOf: null },

  { key: "payment_processing", label: "Payment processing", category: "payments", driver: "Amount processed", billingUnit: "percent + fixed per transaction", fixedOrVariable: "variable", tenantAttributable: true, monthlyCentsPerClinic: null, source: null, asOf: null },
  { key: "disputes", label: "Disputes and chargebacks", category: "payments", driver: "Disputes raised", billingUnit: "USD/dispute", fixedOrVariable: "variable", tenantAttributable: true, monthlyCentsPerClinic: null, source: null, asOf: null },

  { key: "onboarding_labor", label: "Onboarding and migration labour", category: "customer_delivery", driver: "Hours per implementation", billingUnit: "USD/hour", fixedOrVariable: "variable", tenantAttributable: true, monthlyCentsPerClinic: null, source: null, asOf: null },
  { key: "support", label: "Support and account management", category: "customer_delivery", driver: "Tickets and accounts per person", billingUnit: "USD/month per clinic", fixedOrVariable: "variable", tenantAttributable: true, monthlyCentsPerClinic: null, source: null, asOf: null },
];

/**
 * Real intelligence spend for one organization over a window, from recorded turns.
 *
 * Marked `known` because it is measured: each row was written from what the provider
 * reported for that call. It is only as true as the adapters are — an adapter that
 * reports zero for paid inference makes this number optimistic, which is exactly why
 * the Cloudflare adapter no longer does.
 */
export async function measuredIntelligenceCost(organizationId: string, since: Date): Promise<CostToServeItem> {
  // The FROM clause names the mapped table, not the Prisma model. ZumiInvocation is
  // @@map'd to zumi_invocations, and raw SQL naming the model type-checks, lints, and
  // then throws 42P01 the first time it runs. (The comment lives out here because
  // backticks inside a tagged template terminate it.)
  const rows = await db.$queryRaw<{ micro: bigint | null }[]>(Prisma.sql`
    SELECT SUM("costMicroUsd")::bigint AS micro
    FROM "zumi_invocations"
    WHERE "organizationId" = ${organizationId} AND "createdAt" >= ${since}
  `);
  const micro = Number(rows[0]?.micro ?? 0);
  const cost: MonthlyCostEvidence = {
    monthlyCents: Math.round(micro / MICRO_USD_PER_CENT),
    evidence: "known",
    source: "zumi_invocations.costMicroUsd",
    asOf: new Date().toISOString(),
    note: "Summed from recorded provider-reported cost for this organization.",
  };
  return { key: "intelligence", label: "Zumi intelligence", category: "intelligence", cost };
}

/** The declared lines, as economics inputs. Unknown stays unknown. */
export function declaredCostLines(): CostToServeItem[] {
  return COST_LINES.map((line) => ({
    key: line.key,
    label: line.label,
    category: line.category,
    cost: line.monthlyCentsPerClinic === null
      ? { monthlyCents: null, evidence: "unknown", note: `${line.driver} · billed per ${line.billingUnit}` }
      : { monthlyCents: line.monthlyCentsPerClinic, evidence: "known", source: line.source ?? undefined, asOf: line.asOf ?? undefined },
  }));
}

/** Cost lines still missing a rate. This list is the work, and it should be visible. */
export function unpricedCostLines(): readonly CostLineDeclaration[] {
  return COST_LINES.filter((line) => line.monthlyCentsPerClinic === null);
}

/** Everything known and unknown together, ready for `calculateClinicEconomics`. */
export async function costToServeFor(organizationId: string, since: Date): Promise<CostToServeItem[]> {
  return [await measuredIntelligenceCost(organizationId, since), ...declaredCostLines()];
}
