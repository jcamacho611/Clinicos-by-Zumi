import "server-only";
import { db } from "@/lib/db";
import { can } from "@/lib/auth/rbac";
import type { ClinicRole } from "@/lib/auth/rbac";
import type { AttentionItem, AttentionSeverity } from "@/lib/home/attention";

/**
 * Quality, read from the quality tables rather than invented.
 *
 * What this replaces was a component with `rate: 74, target: 80, gaps: 8` written into
 * the source and rendered as though the clinic had been measured — "78% overall
 * compliance", "30 open care gaps", named patients in an outreach queue. None of it
 * came from anywhere. A clinic owner reading that screen would have believed they were
 * looking at their own performance.
 *
 * So the rule here is that every number traces to rows, and when there are no rows the
 * answer is that there are no rows. `QualityGap` and `QualityMeasure` are the source;
 * an organization that has never configured a measure gets told exactly that, which is
 * a truthful and actionable state, rather than a plausible-looking dashboard.
 *
 * The normal clinic owner is meant to experience the *outcome* of assurance — what may
 * fall through the cracks — not the machinery. Measure keys, definitions and evaluation
 * internals stay out of this shape; they belong to the deeper authorized view.
 */

export interface QualityMeasureAttention {
  readonly measureId: string;
  /** The measure's human name, as configured. Never a key or a definition. */
  readonly name: string;
  readonly openGaps: number;
  readonly overdueGaps: number;
  readonly highImpactGaps: number;
  readonly lastEvaluatedAt: Date | null;
}

export interface QualityPicture {
  /** Null when the role may not read quality at all — not zero, which would be a lie. */
  readonly measures: readonly QualityMeasureAttention[] | null;
  readonly attention: readonly AttentionItem[];
  /**
   * True only when quality is genuinely being measured and nothing is open. An
   * organization with no measures configured is not "current" — it is unmeasured, and
   * `configured` distinguishes the two.
   */
  readonly everythingCurrent: boolean;
  readonly configured: boolean;
}

function severityFor(measure: QualityMeasureAttention): AttentionSeverity {
  if (measure.overdueGaps > 0) return "critical";
  if (measure.highImpactGaps > 0) return "due";
  return "open";
}

/** Only the identity fields this actually needs, so callers need not fabricate a session. */
export interface QualityViewer {
  readonly organizationId: string;
  readonly role: ClinicRole;
}

export async function getQualityPicture(session: QualityViewer, now: Date = new Date()): Promise<QualityPicture> {
  if (!can(session.role, "quality", "read")) {
    return { measures: null, attention: [], everythingCurrent: false, configured: false };
  }

  const measures = await db.qualityMeasure.findMany({
    where: { organizationId: session.organizationId, status: "active" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  if (measures.length === 0) {
    return { measures: [], attention: [], everythingCurrent: false, configured: false };
  }

  const [gaps, evaluations] = await Promise.all([
    db.qualityGap.findMany({
      where: { organizationId: session.organizationId, status: "open" },
      select: { id: true, measureId: true, dueAt: true, impact: true },
    }),
    db.patientQualityStatus.groupBy({
      by: ["measureId"],
      where: { organizationId: session.organizationId },
      _max: { evaluatedAt: true },
    }),
  ]);

  const lastEvaluated = new Map(evaluations.map((row) => [row.measureId, row._max.evaluatedAt ?? null]));

  const summaries: QualityMeasureAttention[] = measures.map((measure) => {
    const own = gaps.filter((gap) => gap.measureId === measure.id);
    return {
      measureId: measure.id,
      name: measure.name,
      openGaps: own.length,
      overdueGaps: own.filter((gap) => gap.dueAt !== null && gap.dueAt < now).length,
      highImpactGaps: own.filter((gap) => gap.impact === "high").length,
      lastEvaluatedAt: lastEvaluated.get(measure.id) ?? null,
    };
  });

  const attention: AttentionItem[] = summaries
    .filter((measure) => measure.openGaps > 0)
    .map((measure) => {
      const own = gaps.filter((gap) => gap.measureId === measure.measureId);
      const overdue = own.filter((gap) => gap.dueAt !== null && gap.dueAt < now);
      // The earliest overdue date is what "overdue since" honestly means when several
      // are late; reporting the most recent would understate the wait.
      const earliestOverdue = overdue.reduce<Date | null>(
        (earliest, gap) => (gap.dueAt && (!earliest || gap.dueAt < earliest) ? gap.dueAt : earliest),
        null,
      );
      const nextDue = own
        .map((gap) => gap.dueAt)
        .filter((due): due is Date => due !== null && due >= now)
        .sort((left, right) => left.getTime() - right.getTime())[0];

      return {
        id: `quality-${measure.measureId}`,
        subject: "review",
        noun: "person",
        pluralNoun: "people",
        count: measure.openGaps,
        severity: severityFor(measure),
        // Gap ids, so anyone who does not believe the number can open the rows it came
        // from. A count that cannot name its records is an assertion, not evidence.
        recordIds: own.map((gap) => gap.id),
        due: earliestOverdue
          ? { kind: "overdue" as const, since: earliestOverdue }
          : nextDue
            ? { kind: "due_by" as const, at: nextDue }
            : { kind: "no_deadline" as const },
        action: { label: "Review", href: `/quality?measure=${encodeURIComponent(measure.measureId)}` },
        evidence: `Open quality gap records for ${measure.name}.`,
      };
    });

  return {
    measures: summaries,
    attention,
    everythingCurrent: attention.length === 0,
    configured: true,
  };
}
