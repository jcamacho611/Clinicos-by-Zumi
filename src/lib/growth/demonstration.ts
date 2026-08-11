/**
 * The scripted Zumi demonstration and the guided product tour.
 *
 * This is fixed content, not a model call. `/zumi` and `/demo` show what Zumi does
 * without giving a visitor operational Zumi: there is no chat box, no prompt field,
 * and nothing on these pages reaches the AI gateway. Zumi is a paid capability, and a
 * demonstration that quietly hands it out for free is not a demonstration.
 *
 * Every number and name below is invented for illustration. The clinic does not
 * exist, and the surfaces that render this say so.
 *
 * Pure module. No database, no network, no AI.
 */

export const DEMONSTRATION_DATA_NOTICE =
  "This is a scripted demonstration using invented data. It shows how Klinikos presents work; it is not a live system, not a real clinic, and contains no real patient information.";

export type DemonstrationLine =
  | { speaker: "owner"; text: string }
  | { speaker: "zumi"; text: string; findings?: readonly DemonstrationFinding[]; opportunityCents?: number };

export type DemonstrationFinding = {
  label: string;
  count: number;
  /** Where in Klinikos this work lives, so the demonstration maps to real surfaces. */
  surface: string;
};

/**
 * The morning-briefing script.
 *
 * Deliberately opens with the question an owner actually asks and answers it with
 * counted, sourced work rather than an adjective. The revenue figure is described as
 * an estimate on the page, because a number presented as certain is a promise.
 */
export const morningBriefing: readonly DemonstrationLine[] = [
  { speaker: "owner", text: "Zumi, what needs my attention today?" },
  {
    speaker: "zumi",
    text: "Seventeen items are waiting on someone. Four of them have been waiting more than a week.",
    findings: [
      { label: "Leads with no follow-up", count: 4, surface: "CRM" },
      { label: "Appointments still unconfirmed", count: 3, surface: "Scheduling" },
      { label: "Patients with incomplete paperwork", count: 5, surface: "Intake" },
      { label: "Staff tasks past due", count: 2, surface: "Tasks" },
      { label: "Rebooking windows closing this week", count: 3, surface: "Retention" },
    ],
    opportunityCents: 485_000,
  },
  { speaker: "owner", text: "Why is the lead follow-up flagged?" },
  {
    speaker: "zumi",
    text: "Four consultation enquiries arrived between Thursday and Saturday. None has an assigned owner, and your own follow-up window is 24 hours. The oldest is now at 96 hours.",
  },
  { speaker: "owner", text: "Assign them." },
  {
    speaker: "zumi",
    text: "I have prepared four follow-up tasks assigned to the front desk, each marked Suggested by Zumi. Confirm to create them.",
  },
];

/**
 * The seven-step guided tour on `/demo`.
 *
 * A sequence, not a sandbox. The visitor advances through it and cannot issue their
 * own commands, which keeps the demonstration honest about what it is.
 */
export type TourStep = {
  index: number;
  title: string;
  body: string;
  /** The Klinikos surface this step happens on. */
  surface: string;
  /** What the clinic would have lost without it, stated plainly. */
  withoutKlinikos: string;
};

export const guidedTour: readonly TourStep[] = [
  {
    index: 1,
    title: "A new lead arrives",
    body: "A consultation enquiry comes in on Thursday evening and lands in the Klinikos CRM with its source attached.",
    surface: "CRM",
    withoutKlinikos: "It sits in a shared inbox nobody owns after 5pm.",
  },
  {
    index: 2,
    title: "Nobody follows up",
    body: "Friday is busy. The enquiry is not assigned, and the weekend passes.",
    surface: "CRM",
    withoutKlinikos: "Nothing marks the enquiry as slipping. It is simply forgotten.",
  },
  {
    index: 3,
    title: "Klinikos notices",
    body: "The follow-up window the clinic set is 24 hours. At 24 hours the enquiry becomes an overdue signal with its evidence attached.",
    surface: "Operating map",
    withoutKlinikos: "The first time anyone notices is when the month's numbers are short.",
  },
  {
    index: 4,
    title: "Zumi explains it",
    body: "Zumi states what is overdue, how long it has been waiting, and which rule it broke — citing the records it read.",
    surface: "Zumi",
    withoutKlinikos: "Someone eventually asks why leads are not converting, and nobody can answer with evidence.",
  },
  {
    index: 5,
    title: "A person confirms the action",
    body: "Zumi prepares a follow-up task marked Suggested by Zumi. A human assigns and confirms it. Zumi does not act alone.",
    surface: "Tasks",
    withoutKlinikos: "The work depends on whoever happens to remember.",
  },
  {
    index: 6,
    title: "The lead books",
    body: "The follow-up goes out Monday morning. The consultation is booked for Thursday and the booking is linked back to the original enquiry.",
    surface: "Scheduling",
    withoutKlinikos: "The lead books somewhere else, and the clinic never learns why.",
  },
  {
    index: 7,
    title: "The owner sees what was recovered",
    body: "The owner's report shows the enquiry, the delay, the intervention, and the booking — one traceable chain rather than an anecdote.",
    surface: "Reporting",
    withoutKlinikos: "Revenue recovery stays a feeling instead of a number.",
  },
];

/** Problems Klinikos attacks, used on the homepage. Each maps to a real surface. */
export const operatingProblems = [
  { label: "Leads that never get a second contact", surface: "CRM and follow-up queues" },
  { label: "Follow-ups that depend on someone remembering", surface: "Tasks and operating map" },
  { label: "Paperwork that is incomplete when the patient arrives", surface: "Intake and forms" },
  { label: "Staff work with no clear owner", surface: "Task assignment" },
  { label: "No-shows nobody recovers", surface: "Scheduling and retention" },
  { label: "Encounters that never become billable", surface: "Billing readiness" },
  { label: "Results and referrals with no closing loop", surface: "Results and referral tracking" },
  { label: "An owner who cannot see any of it in one place", surface: "Owner reporting" },
] as const;

export function formatUsdFromCents(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
