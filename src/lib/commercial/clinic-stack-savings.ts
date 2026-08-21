/**
 * What a clinic already pays for, and what Klinikos would and would not replace.
 *
 * The commercial problem this solves: "$995/month" next to a $199 EHR seat is a
 * comparison Klinikos loses, and it is also the wrong comparison. A clinic does not run
 * on an EHR. It runs on an EHR plus scheduling plus texting plus forms plus documents
 * plus tasks plus follow-up, and it pays for all of them. Priced against that stack the
 * number reads completely differently, so the stack has to be on screen before the price
 * is.
 *
 * The hard rule here is that nothing may be invented. A savings figure a buyer cannot
 * check is worse than no savings figure, because the first one they disprove costs the
 * whole conversation. So:
 *
 *   - Every line the clinic enters is SELF-REPORTED and labelled as such.
 *   - Category defaults are ESTIMATED typical ranges, never presented as this clinic's cost.
 *   - Whether Klinikos replaces a category is a product fact, not a sales opinion, and
 *     categories that must stay external say so plainly.
 *   - Operational value — recovered no-shows, faster follow-up — is deliberately absent
 *     from the savings total. It is real and it is not evidence, and mixing the two makes
 *     the checkable part unbelievable too.
 *
 * This module is pure arithmetic over declared inputs. It runs on the client so a
 * visitor can explore without an account, which also means it must never be the thing
 * that decides a price: `clinicPlans` remains the server-owned commercial truth.
 */

export type StackConfidence = "self_reported" | "estimated" | "unknown";

/** Whether Klinikos takes the work over, or connects to something that must remain. */
export type StackDisposition =
  /** Klinikos does this work, so the separate bill can stop. */
  | "replaced"
  /** Real external infrastructure. Klinikos connects to it; the bill continues. */
  | "connected"
  /** Klinikos does some of it; the tool may shrink rather than disappear. */
  | "partial";

export interface StackCategory {
  readonly key: string;
  readonly label: string;
  readonly examples: string;
  readonly disposition: StackDisposition;
  /** Why this category is treated this way, in language a buyer can challenge. */
  readonly reason: string;
  /** A typical monthly range, for orientation only. Never used as a clinic's own cost. */
  readonly typicalMonthlyCents: readonly [number, number] | null;
}

export const STACK_CATEGORIES: readonly StackCategory[] = [
  { key: "ehr", label: "EHR / charting", examples: "athenahealth, Tebra, eClinicalWorks, Practice Fusion", disposition: "partial",
    reason: "Klinikos runs the operation around the chart today. Charting capability is growing, but a clinic on a certified EHR should expect to keep it during transition.",
    typicalMonthlyCents: [19_900, 60_000] },
  { key: "practice_management", label: "Practice management", examples: "Scheduling, registration, front-desk tooling", disposition: "replaced",
    reason: "Scheduling, front desk and patient operations are core Klinikos surfaces.", typicalMonthlyCents: [10_000, 40_000] },
  { key: "texting", label: "Patient texting", examples: "Klara, Weave, Podium", disposition: "replaced",
    reason: "Patient messaging and follow-up run inside Klinikos with consent recorded.", typicalMonthlyCents: [9_900, 39_900] },
  { key: "forms", label: "Forms and intake", examples: "JotForm, Formstack, intake portals", disposition: "replaced",
    reason: "Forms, intake and e-signature are built in and attach to the record they belong to.", typicalMonthlyCents: [3_000, 20_000] },
  { key: "documents", label: "Document management", examples: "Dropbox, Box, scanning tools", disposition: "replaced",
    reason: "Documents are governed inside Klinikos with custody events and human review.", typicalMonthlyCents: [3_000, 15_000] },
  { key: "tasks", label: "Task and project tools", examples: "Asana, Trello, Monday, shared spreadsheets", disposition: "replaced",
    reason: "Work items, owners and escalations are native, tied to the patient or the operation.", typicalMonthlyCents: [2_000, 15_000] },
  { key: "crm", label: "CRM and lead follow-up", examples: "HubSpot, Salesforce, spreadsheets", disposition: "replaced",
    reason: "Lead capture, follow-up and recovery are Klinikos surfaces.", typicalMonthlyCents: [5_000, 40_000] },
  { key: "ai_tools", label: "Separate AI subscriptions", examples: "Scribes, chat assistants, note tools", disposition: "replaced",
    reason: "Zumi works inside the operation with the clinic's own context, rather than as a separate tool.", typicalMonthlyCents: [2_000, 30_000] },
  { key: "telehealth", label: "Telehealth", examples: "Doxy.me, Zoom for Healthcare", disposition: "partial",
    reason: "Visit coordination is in Klinikos. The video transport itself may remain a separate vendor.", typicalMonthlyCents: [3_000, 20_000] },
  { key: "billing_rcm", label: "Billing and revenue tools", examples: "Billing software, coding assistance", disposition: "partial",
    reason: "Claim readiness, denials and balances are in Klinikos. Submission stays with the clearinghouse.", typicalMonthlyCents: [10_000, 60_000] },
  { key: "clearinghouse", label: "Clearinghouse", examples: "Availity, Change, Waystar", disposition: "connected",
    reason: "A clearinghouse is real external infrastructure with payer enrolment behind it. Klinikos connects; it does not replace.", typicalMonthlyCents: [7_500, 30_000] },
  { key: "erx", label: "ePrescribing", examples: "Surescripts-connected prescribing", disposition: "connected",
    reason: "Prescription routing is a regulated external network. It stays.", typicalMonthlyCents: [5_000, 20_000] },
  { key: "labs", label: "Lab interfaces", examples: "Quest, LabCorp, hospital interfaces", disposition: "connected",
    reason: "Lab connectivity is a contracted external interface. Klinikos connects to it.", typicalMonthlyCents: [0, 25_000] },
  { key: "phone", label: "Phone system", examples: "RingCentral, Ooma, VoIP", disposition: "connected",
    reason: "Telephony is a carrier relationship. Klinikos works alongside it and captures what comes out of it.", typicalMonthlyCents: [5_000, 30_000] },
];

export interface StackLineInput {
  readonly key: string;
  /** What the clinic says it pays each month, in cents. Self-reported, never inferred. */
  readonly monthlyCents: number;
}

export interface StackSavingsResult {
  readonly currentMonthlyCents: number;
  readonly currentAnnualCents: number;
  readonly replaceableMonthlyCents: number;
  readonly partialMonthlyCents: number;
  readonly connectedMonthlyCents: number;
  readonly klinikosMonthlyCents: number;
  /** Can be negative. A clinic with a thin stack should see that honestly. */
  readonly netMonthlyChangeCents: number;
  readonly netAnnualChangeCents: number;
  readonly implementationCents: number;
  /** Null when the change is not a saving, because payback is then meaningless. */
  readonly paybackMonths: number | null;
  readonly confidence: StackConfidence;
  /** Categories the clinic left blank — named, so the total is read for what it is. */
  readonly unansweredCategories: readonly string[];
}

function categoryFor(key: string) {
  return STACK_CATEGORIES.find((category) => category.key === key) ?? null;
}

/**
 * Compute the comparison.
 *
 * `partial` spend is counted separately and NOT claimed as saved. Klinikos may shrink
 * those bills, but "may shrink" is not a number, and putting it in the total would make
 * the total unfalsifiable.
 */
export function computeStackSavings(
  lines: readonly StackLineInput[],
  klinikosMonthlyCents: number,
  implementationCents: number,
): StackSavingsResult {
  let replaceable = 0;
  let partial = 0;
  let connected = 0;
  const answered = new Set<string>();

  for (const line of lines) {
    if (line.monthlyCents <= 0) continue;
    const category = categoryFor(line.key);
    if (!category) continue;
    answered.add(line.key);
    if (category.disposition === "replaced") replaceable += line.monthlyCents;
    else if (category.disposition === "partial") partial += line.monthlyCents;
    else connected += line.monthlyCents;
  }

  const current = replaceable + partial + connected;
  // Only the replaced spend actually goes away. Connected spend continues, and partial
  // spend is left where it is rather than guessed at.
  const netMonthlyChange = replaceable - klinikosMonthlyCents;

  return {
    currentMonthlyCents: current,
    currentAnnualCents: current * 12,
    replaceableMonthlyCents: replaceable,
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
  };
}
