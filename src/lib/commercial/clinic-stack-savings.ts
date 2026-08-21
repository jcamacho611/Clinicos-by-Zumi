/**
 * What a clinic already pays for, what Klinikos is designed to replace, and what it is
 * safe to count as replaceable in the current commercial conversation.
 *
 * The hard rule is stronger than "do not invent costs": a built internal workflow is
 * not automatically permission to tell a clinic it can cancel an external vendor. If a
 * production connector, storage boundary, PHI approval, or runtime proof is still
 * pending, that spend stays out of the savings claim until implementation closes the
 * dependency.
 *
 * This module is pure arithmetic over self-reported buyer inputs. It never decides the
 * server-owned Klinikos price.
 */

export type StackConfidence = "self_reported" | "estimated" | "unknown";

/** Whether Klinikos ultimately owns the work or must keep an external relationship. */
export type StackDisposition =
  | "replaced"
  | "connected"
  | "partial";

/**
 * Current commercial readiness for a category whose long-term disposition is replaced.
 *
 * `counted_now` does not mean "cancel the vendor before implementation". It means the
 * native path has no known external dependency that requires us to exclude the line from
 * a software-savings comparison. Every real cutover still requires tenant-specific
 * migration, security, data, and operational review.
 */
export type StackReplacementReadiness =
  | "counted_now"
  | "transition_only"
  | "external_connection_required"
  | "not_applicable";

export interface StackCategory {
  readonly key: string;
  readonly label: string;
  readonly examples: string;
  readonly disposition: StackDisposition;
  readonly replacementReadiness: StackReplacementReadiness;
  /** Why the product owns or connects this category in the long-term architecture. */
  readonly reason: string;
  /** Why this line is or is not allowed into the current replaceable-spend subtotal. */
  readonly readinessReason: string;
  /** Orientation only. Never used as the buyer's cost. */
  readonly typicalMonthlyCents: readonly [number, number] | null;
}

export const STACK_CATEGORIES: readonly StackCategory[] = [
  {
    key: "ehr",
    label: "EHR / charting",
    examples: "athenahealth, Tebra, eClinicalWorks, Practice Fusion",
    disposition: "partial",
    replacementReadiness: "not_applicable",
    reason: "Klinikos runs the operation around the chart today. Charting capability is growing, but a clinic on a certified EHR should expect to keep it during transition.",
    readinessReason: "The EHR bill is not counted as eliminated. Clinical record, certification, eRx, lab and payer dependencies require a deliberate migration strategy.",
    typicalMonthlyCents: [19_900, 60_000],
  },
  {
    key: "practice_management",
    label: "Practice management",
    examples: "Scheduling, registration, front-desk tooling",
    disposition: "replaced",
    replacementReadiness: "counted_now",
    reason: "Scheduling, front desk and patient operations are native Klinikos surfaces.",
    readinessReason: "The operating path is native. A clinic still validates data migration, tenant configuration and launch readiness before cancelling its incumbent tool.",
    typicalMonthlyCents: [10_000, 40_000],
  },
  {
    key: "texting",
    label: "Patient texting",
    examples: "Klara, Weave, Podium",
    disposition: "replaced",
    replacementReadiness: "external_connection_required",
    reason: "Klinikos owns the messaging and follow-up workflow rather than treating communication as a detached inbox.",
    readinessReason: "Do not count the separate texting bill as removable yet. The outbound SMS rail still requires production Messaging Service/runtime proof, and PHI-bearing SMS remains fail-closed until the exact approved contractual/security posture exists.",
    typicalMonthlyCents: [9_900, 39_900],
  },
  {
    key: "forms",
    label: "Forms and intake",
    examples: "JotForm, Formstack, intake portals",
    disposition: "replaced",
    replacementReadiness: "counted_now",
    reason: "Forms, intake and native signing are built into the operation and attach to the record they belong to.",
    readinessReason: "The native workflow can be evaluated as replacement scope, subject to the clinic's migration, consent, retention and production-data approval.",
    typicalMonthlyCents: [3_000, 20_000],
  },
  {
    key: "documents",
    label: "Document management",
    examples: "Dropbox, Box, scanning tools",
    disposition: "replaced",
    replacementReadiness: "transition_only",
    reason: "Klinikos has governed document workflows, custody events and human review.",
    readinessReason: "Do not count the external document bill as eliminated until the clinic's approved production object-storage, retention, backup and migration posture is verified.",
    typicalMonthlyCents: [3_000, 15_000],
  },
  {
    key: "tasks",
    label: "Task and project tools",
    examples: "Asana, Trello, Monday, shared spreadsheets",
    disposition: "replaced",
    replacementReadiness: "counted_now",
    reason: "Work items, owners, waiting states and escalations are native Klinikos operations.",
    readinessReason: "The native task/action path is built and does not depend on a separate external transaction rail.",
    typicalMonthlyCents: [2_000, 15_000],
  },
  {
    key: "crm",
    label: "CRM and lead follow-up",
    examples: "HubSpot, Salesforce, spreadsheets",
    disposition: "replaced",
    replacementReadiness: "counted_now",
    reason: "Lead capture, follow-up, ownership and recovery are native Klinikos surfaces.",
    readinessReason: "The operating CRM path is native. Customer-specific data migration and communication dependencies are still reviewed at implementation.",
    typicalMonthlyCents: [5_000, 40_000],
  },
  {
    key: "ai_tools",
    label: "Separate AI subscriptions",
    examples: "Scribes, chat assistants, note tools",
    disposition: "replaced",
    replacementReadiness: "external_connection_required",
    reason: "Zumi is designed to put governed intelligence inside the operation rather than leave AI as a detached tool.",
    readinessReason: "Do not count external AI subscriptions as removable yet. The governed gateway is built, but the exact production provider/runtime proof remains environment-specific and PHI-capable external inference stays blocked until approved. Klinikos also must not imply that Zumi replaces a specialized scribe unless that workflow is actually implemented.",
    typicalMonthlyCents: [2_000, 30_000],
  },
  {
    key: "telehealth",
    label: "Telehealth",
    examples: "Doxy.me, Zoom for Healthcare",
    disposition: "partial",
    replacementReadiness: "not_applicable",
    reason: "Visit coordination is in Klinikos. The video transport itself may remain a separate vendor.",
    readinessReason: "Telemedicine transport is an external dependency, so no full vendor savings is claimed.",
    typicalMonthlyCents: [3_000, 20_000],
  },
  {
    key: "billing_rcm",
    label: "Billing and revenue tools",
    examples: "Billing software, coding assistance",
    disposition: "partial",
    replacementReadiness: "not_applicable",
    reason: "Claim readiness, denials and balances are Klinikos workflows. Submission remains tied to external clearinghouse/payer infrastructure.",
    readinessReason: "The calculator does not guess what portion of a billing/RCM bill disappears.",
    typicalMonthlyCents: [10_000, 60_000],
  },
  {
    key: "clearinghouse",
    label: "Clearinghouse",
    examples: "Availity, Change, Waystar",
    disposition: "connected",
    replacementReadiness: "not_applicable",
    reason: "A clearinghouse is external infrastructure with payer enrollment behind it. Klinikos connects; it does not replace.",
    readinessReason: "The bill remains outside Klinikos and is never counted as saved.",
    typicalMonthlyCents: [7_500, 30_000],
  },
  {
    key: "erx",
    label: "ePrescribing",
    examples: "Surescripts-connected prescribing",
    disposition: "connected",
    replacementReadiness: "not_applicable",
    reason: "Prescription routing is a regulated external network. It stays.",
    readinessReason: "The external network/credential cost remains and is never counted as saved.",
    typicalMonthlyCents: [5_000, 20_000],
  },
  {
    key: "labs",
    label: "Lab interfaces",
    examples: "Quest, Labcorp, hospital interfaces",
    disposition: "connected",
    replacementReadiness: "not_applicable",
    reason: "Lab connectivity is a contracted external interface. Klinikos connects to it.",
    readinessReason: "The external interface/relationship remains and is never counted as saved.",
    typicalMonthlyCents: [0, 25_000],
  },
  {
    key: "phone",
    label: "Phone system",
    examples: "RingCentral, Ooma, VoIP",
    disposition: "connected",
    replacementReadiness: "not_applicable",
    reason: "Telephony is a carrier relationship. Klinikos works alongside it and captures what comes out of it.",
    readinessReason: "The carrier bill remains and is never counted as saved.",
    typicalMonthlyCents: [5_000, 30_000],
  },
];

export interface StackLineInput {
  readonly key: string;
  /** What the clinic says it pays each month, in cents. */
  readonly monthlyCents: number;
}

export interface StackSavingsResult {
  readonly currentMonthlyCents: number;
  readonly currentAnnualCents: number;
  /** Spend safe to include in the current software-replacement comparison. */
  readonly replaceableMonthlyCents: number;
  /** Long-term replacement targets deliberately excluded until current readiness gates close. */
  readonly transitionMonthlyCents: number;
  readonly partialMonthlyCents: number;
  readonly connectedMonthlyCents: number;
  readonly klinikosMonthlyCents: number;
  readonly netMonthlyChangeCents: number;
  readonly netAnnualChangeCents: number;
  readonly implementationCents: number;
  readonly paybackMonths: number | null;
  readonly confidence: StackConfidence;
  readonly unansweredCategories: readonly string[];
  readonly transitionCategories: readonly string[];
}

function categoryFor(key: string) {
  return STACK_CATEGORIES.find((category) => category.key === key) ?? null;
}

export function computeStackSavings(
  lines: readonly StackLineInput[],
  klinikosMonthlyCents: number,
  implementationCents: number,
): StackSavingsResult {
  let replaceable = 0;
  let transition = 0;
  let partial = 0;
  let connected = 0;
  const answered = new Set<string>();
  const transitionCategories = new Set<string>();

  for (const line of lines) {
    if (line.monthlyCents <= 0) continue;
    const category = categoryFor(line.key);
    if (!category) continue;
    answered.add(line.key);

    if (category.disposition === "replaced") {
      if (category.replacementReadiness === "counted_now") replaceable += line.monthlyCents;
      else {
        transition += line.monthlyCents;
        transitionCategories.add(category.label);
      }
    } else if (category.disposition === "partial") partial += line.monthlyCents;
    else connected += line.monthlyCents;
  }

  const current = replaceable + transition + partial + connected;
  const netMonthlyChange = replaceable - klinikosMonthlyCents;

  return {
    currentMonthlyCents: current,
    currentAnnualCents: current * 12,
    replaceableMonthlyCents: replaceable,
    transitionMonthlyCents: transition,
    partialMonthlyCents: partial,
    connectedMonthlyCents: connected,
    klinikosMonthlyCents,
    netMonthlyChangeCents: netMonthlyChange,
    netAnnualChangeCents: netMonthlyChange * 12,
    implementationCents,
    paybackMonths: netMonthlyChange > 0 ? Math.ceil(implementationCents / netMonthlyChange) : null,
    confidence: answered.size === 0 ? "unknown" : "self_reported",
    unansweredCategories: STACK_CATEGORIES
      .filter((category) => !answered.has(category.key))
      .map((category) => category.label),
    transitionCategories: [...transitionCategories],
  };
}
