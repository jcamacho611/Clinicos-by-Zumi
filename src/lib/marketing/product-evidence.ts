import type { ActionCenter } from "@/lib/home/action-center";

/**
 * Example content for the public product demonstration.
 *
 * An external reviewer read the Klinikos website and reported that he could not tell
 * what the product does, and asked for a pitch deck instead. The site described the
 * product in categories — "appointments, intake, tasks, documents, follow-up" — and
 * never once showed the work. This exists so the public site can answer that question
 * with the product rather than with more prose.
 *
 * Two rules govern what may live here.
 *
 * It renders through the real `ActionCenterWorkspace`, not a drawing of it. A mock would
 * drift from the product the first time the component changed, and a picture of a screen
 * that no longer exists is a false claim about what a buyer is buying. Because the real
 * component renders it, this data has to satisfy the real `ActionCenter` type, and the
 * page shows exactly the layout, wording and states a clinic gets.
 *
 * Nothing here describes a real person or a real clinic. No name, no date of birth, no
 * contact detail, no clinical finding — items are described by category, risk and team,
 * which is the same discipline the component itself follows because this summary ends up
 * on shared screens. The surrounding figure states plainly that the content is
 * illustrative, so a reader is never invited to read it as a live clinic.
 *
 * `taskId` is null on every row on purpose. It is what makes the component render
 * without its claim/complete controls: those call authenticated APIs, and a public page
 * must not present buttons that cannot work. It also means this file cannot accidentally
 * become interactive if someone reuses it.
 */
export const PUBLIC_ACTION_CENTER_EXAMPLE: ActionCenter = {
  needsYouBadge: 3,
  everythingHandled: false,
  buckets: [
    {
      key: "needs_you",
      label: "Needs you",
      count: 3,
      items: [
        {
          id: "example-auth",
          taskId: null,
          title: "Prior authorization expires in 2 days",
          detail: "revenue operations · assigned to you",
          urgency: "due_soon",
          dueAt: null,
          href: "/login",
          canClaim: false,
          canComplete: false,
        },
        {
          id: "example-lab",
          taskId: null,
          title: "Abnormal result needs a clinician acknowledgement",
          detail: "urgent risk · clinical provider",
          urgency: "overdue",
          dueAt: null,
          href: "/login",
          canClaim: false,
          canComplete: false,
        },
        {
          id: "example-note",
          taskId: null,
          title: "Visit note from Tuesday is still unsigned",
          detail: "documentation · assigned to you",
          urgency: "open",
          dueAt: null,
          href: "/login",
          canClaim: false,
          canComplete: false,
        },
      ],
    },
    {
      key: "waiting_on_others",
      label: "Waiting on others",
      count: 2,
      items: [
        {
          id: "example-referral",
          taskId: null,
          title: "Cardiology referral awaiting the receiving clinic",
          detail: "referrals and follow-up · sent Monday",
          urgency: "open",
          dueAt: null,
          href: "/login",
          canClaim: false,
          canComplete: false,
        },
        {
          id: "example-coverage",
          taskId: null,
          title: "Friday injector coverage offer is out on Grid",
          detail: "staffing · 3 reviewed candidates notified",
          urgency: "open",
          dueAt: null,
          href: "/login",
          canClaim: false,
          canComplete: false,
        },
      ],
    },
    {
      key: "completed_recently",
      label: "Completed recently",
      count: 2,
      items: [
        {
          id: "example-intake",
          taskId: null,
          title: "New patient intake reviewed and filed",
          detail: "intake · completed by the front desk",
          urgency: "open",
          dueAt: null,
          href: "/login",
          canClaim: false,
          canComplete: false,
        },
        {
          id: "example-callback",
          taskId: null,
          title: "Post-procedure callback closed with a note",
          detail: "follow-up · completed yesterday",
          urgency: "open",
          dueAt: null,
          href: "/login",
          canClaim: false,
          canComplete: false,
        },
      ],
    },
  ],
};
