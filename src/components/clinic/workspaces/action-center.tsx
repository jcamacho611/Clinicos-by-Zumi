import Link from "next/link";
import { CircleCheck, Clock3, TriangleAlert } from "lucide-react";
import { ActionCenterControls } from "@/components/clinic/action-center-controls";
import type { ActionCenter, ActionItem } from "@/lib/home/action-center";

/**
 * Needs you, waiting on others, done recently.
 *
 * The split is the point. An inbox shows everything that happened; this shows only work
 * that has not reached its owner yet, divided by whose hands it is in — so a person can
 * put down what is not theirs. That is worth more than a notification bell, and it is
 * why "Waiting on others" earns its place beside the things demanding action.
 *
 * Urgency is carried by a word and an icon as well as a colour, so it survives greyscale
 * and forced-colors. No item names a patient: escalations are described by category,
 * risk and team, because a glanceable summary ends up on shared screens.
 */

function urgencyLabel(item: ActionItem) {
  if (item.urgency === "overdue") return { text: "Overdue", tone: "var(--status-signal)" };
  if (item.urgency === "due_soon") return { text: "Due soon", tone: "var(--status-analyzing)" };
  return null;
}

function Row({ item, userId }: { item: ActionItem; userId: string }) {
  const urgency = urgencyLabel(item);
  const actionable = item.taskId !== null && (item.canClaim || item.canComplete);

  /* The title is the link and the buttons are siblings of it, rather than the whole row
     being one anchor. A button nested inside an anchor is invalid, and it also makes
     "claim" ambiguous with "open" for anyone using a keyboard or a screen reader. */
  return (
    <div className="flex flex-wrap items-center gap-3 px-[var(--space-5)] py-[var(--space-4)] transition hover:bg-[var(--surface-raised)]">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            className="text-sm font-semibold underline-offset-4 hover:underline"
            href={item.href}
            style={{ color: "var(--text-primary)" }}
          >
            {item.title}
          </Link>
          {urgency ? (
            <span
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
              style={{ color: urgency.tone, borderColor: urgency.tone }}
            >
              <TriangleAlert aria-hidden="true" className="size-3" />
              {urgency.text}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-[13px]" style={{ color: "var(--text-secondary)" }}>{item.detail}</p>
      </div>
      {actionable && item.taskId ? (
        <ActionCenterControls
          canClaim={item.canClaim}
          canComplete={item.canComplete}
          taskId={item.taskId}
          userId={userId}
        />
      ) : null}
    </div>
  );
}

export function ActionCenterWorkspace({ center, userId }: { center: ActionCenter; userId: string }) {
  if (center.buckets === null) {
    return (
      <div className="space-y-[var(--space-5)]">
        <h2 className="text-2xl font-light tracking-[-.04em]" style={{ color: "var(--text-primary)" }}>
          There is nothing here for your role.
        </h2>
        <p className="max-w-2xl text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
          The action centre draws on tasks and escalations. Ask an administrator if you need access.
        </p>
      </div>
    );
  }

  if (center.everythingHandled) {
    return (
      <div className="space-y-[var(--space-5)]">
        <h2 className="text-2xl font-light tracking-[-.04em] sm:text-3xl" style={{ color: "var(--text-primary)" }}>
          Nothing is waiting on anyone.
        </h2>
        <p className="max-w-2xl text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
          No open work is assigned to you or to anyone else right now. Klinikos will raise something here the
          moment that changes.
        </p>
      </div>
    );
  }

  const needsYou = center.buckets.find((bucket) => bucket.key === "needs_you");

  return (
    <div className="space-y-[var(--space-5)]">
      <div>
        <h2 className="text-2xl font-light tracking-[-.04em] sm:text-3xl" style={{ color: "var(--text-primary)" }}>
          {needsYou && needsYou.count > 0
            ? `${needsYou.count} ${needsYou.count === 1 ? "thing needs" : "things need"} you.`
            : "Nothing needs you right now."}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
          Everything else below is either with someone else or already done.
        </p>
      </div>

      {center.buckets.map((bucket) => (
        <section key={bucket.key}>
          <div className="flex items-center gap-2">
            {bucket.key === "completed_recently"
              ? <CircleCheck aria-hidden="true" className="size-4" style={{ color: "var(--status-resolved)" }} />
              : <Clock3 aria-hidden="true" className="size-4" style={{ color: "var(--text-secondary)" }} />}
            <h3 className="text-[12px] font-semibold uppercase tracking-[.14em]" style={{ color: "var(--text-secondary)" }}>
              {bucket.label}
              {/* A zero is never drawn as a count — an always-present number stops being read. */}
              {bucket.count > 0 ? ` · ${bucket.count}` : ""}
            </h3>
          </div>

          <div
            className="mt-3 divide-y overflow-hidden rounded-[var(--radius-lg,18px)] border"
            style={{ borderColor: "var(--line-dark)", background: "var(--surface-secondary)" }}
          >
            {bucket.items.length === 0 ? (
              <p className="px-[var(--space-5)] py-[var(--space-4)] text-[13px]" style={{ color: "var(--text-secondary)" }}>
                {bucket.key === "needs_you"
                  ? "Nothing is assigned to you."
                  : bucket.key === "waiting_on_others"
                    ? "Nothing is sitting with anyone else."
                    : "Nothing was completed in the last week."}
              </p>
            ) : (
              <>
                {bucket.items.map((item) => <Row item={item} key={item.id} userId={userId} />)}
                {/* The count is the truth; the list is a page of it. When more exists than
                    fits at a glance, say so rather than letting the shorter list quietly
                    contradict the number above it. */}
                {bucket.count > bucket.items.length ? (
                  <Link
                    className="block px-[var(--space-5)] py-[var(--space-4)] text-[13px] font-semibold transition hover:bg-[var(--surface-raised)]"
                    href={bucket.items[0].href}
                    style={{ color: "var(--accent-intelligence)" }}
                  >
                    Showing {bucket.items.length} of {bucket.count} — open all
                  </Link>
                ) : null}
              </>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
