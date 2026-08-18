import { CircleCheck, ShieldCheck, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { briefingSentence, type AttentionItem } from "@/lib/home/attention";
import type { QualityPicture } from "@/lib/quality/quality-attention";

/**
 * Quality, as an outcome rather than a rules engine.
 *
 * The screen this replaces was written entirely in the source: `rate: 74, target: 80,
 * gaps: 8`, an "overall compliance 78%" tile, "30 open care gaps", and an outreach queue
 * of named patients. A clinic owner reading it would reasonably have believed they were
 * looking at their own clinic. None of it came from anywhere — and this organization's
 * `quality_measures` table is in fact empty.
 *
 * Three states, and the middle one is the honest answer most organizations get today:
 *
 *   - not measured yet  → say so, and say what it would take. Not a zeroed dashboard.
 *   - measured, clean   → "Everything is current." A real answer, not an empty state.
 *   - measured, open    → what needs review, counted in people, one action each.
 *
 * Built on the shared design tokens rather than generic greys, so Quality reads as part
 * of Klinikos instead of a bolted-on admin console. Measure keys, definitions and
 * evaluation internals stay out of this surface; they belong to the deeper authorized
 * view. The owner sees what may fall through the cracks, not the machinery that looks.
 */

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="space-y-[var(--space-5)]">{children}</div>;
}

function Heading({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-2xl font-light tracking-[-.04em] sm:text-3xl" style={{ color: "var(--text-primary)" }}>
        {title}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
        {description}
      </p>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-[var(--radius-lg,18px)] border p-[var(--space-6)]"
      style={{ borderColor: "var(--line-dark)", background: "var(--surface-secondary)" }}
    >
      {children}
    </div>
  );
}

function AttentionRow({ item }: { item: AttentionItem }) {
  const overdue = item.due.kind === "overdue";
  const measureName = item.evidence.replace(/^Open quality gap records for /, "").replace(/\.$/, "");
  return (
    <div className="grid gap-3 py-[var(--space-4)] sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{measureName}</p>
          {/* Status never rides on colour alone — the word and the icon carry it too, so
              this survives greyscale, colour blindness and forced-colors mode. */}
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{
              color: overdue ? "var(--status-signal)" : "var(--status-analyzing)",
              border: `1px solid ${overdue ? "var(--status-signal)" : "var(--status-analyzing)"}`,
            }}
          >
            <TriangleAlert aria-hidden="true" className="size-3" />
            {overdue ? "Overdue" : "Needs review"}
          </span>
        </div>
        <p className="mt-1.5 text-[13px] leading-6" style={{ color: "var(--text-secondary)" }}>
          {briefingSentence(item)}
        </p>
      </div>
      <Link
        className="inline-flex min-h-11 items-center justify-center rounded-full px-5 text-xs font-semibold transition"
        href={item.action.href}
        style={{ background: "var(--accent-intelligence)", color: "var(--obsidian)" }}
      >
        {item.action.label}
      </Link>
    </div>
  );
}

export function QualityWorkspace({ picture }: { picture: QualityPicture }) {
  if (picture.measures === null) {
    return (
      <Shell>
        <Heading
          title="Quality is not available for your role."
          description="Quality review is limited to the people responsible for it. Ask an administrator if you need access."
        />
      </Shell>
    );
  }

  if (!picture.configured) {
    return (
      <Shell>
        <Heading
          title="Quality is not being measured yet."
          description="Klinikos will show what may fall through the cracks once measures are configured for this organization."
        />
        <Panel>
          <ShieldCheck aria-hidden="true" className="size-6" style={{ color: "var(--text-secondary)" }} />
          <p className="mt-4 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            No measures are configured.
          </p>
          <p className="mt-2 max-w-2xl text-[13px] leading-7" style={{ color: "var(--text-secondary)" }}>
            There is nothing to report — not zero gaps, which would imply this clinic had been checked and
            found clean. Nothing has been evaluated yet. A measure defines what Klinikos watches for and when
            a patient counts as due.
          </p>
          <p className="mt-4 max-w-2xl text-[var(--text-micro)] leading-6" style={{ color: "var(--text-secondary)" }}>
            Defining measures and their clinical criteria is deliberate setup work. Klinikos will not guess
            them on your behalf.
          </p>
        </Panel>
      </Shell>
    );
  }

  if (picture.everythingCurrent) {
    const count = picture.measures.length;
    return (
      <Shell>
        <Heading
          title="Everything is current."
          description={`Nothing is open across the ${count} ${count === 1 ? "measure" : "measures"} Klinikos is watching.`}
        />
        <Panel>
          <CircleCheck aria-hidden="true" className="size-6" style={{ color: "var(--status-resolved)" }} />
          <p className="mt-4 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            No one is waiting on review.
          </p>
          <p className="mt-2 max-w-2xl text-[13px] leading-7" style={{ color: "var(--text-secondary)" }}>
            Klinikos will raise something here the moment a patient becomes due.
          </p>
        </Panel>
      </Shell>
    );
  }

  const peopleWaiting = picture.attention.reduce((total, item) => total + item.count, 0);
  const things = picture.attention.length;

  return (
    <Shell>
      <Heading
        title={`${things} ${things === 1 ? "thing needs" : "things need"} review.`}
        description={`${peopleWaiting} ${peopleWaiting === 1 ? "person is" : "people are"} waiting on a decision that has not been made yet.`}
      />
      <Panel>
        <div className="divide-y" style={{ borderColor: "var(--line-dark)" }}>
          {picture.attention.map((item) => (
            <AttentionRow item={item} key={item.id} />
          ))}
        </div>
      </Panel>
    </Shell>
  );
}
