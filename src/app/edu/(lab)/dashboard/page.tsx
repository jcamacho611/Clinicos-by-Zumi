import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, Layers3 } from "lucide-react";
import { EduCommandHeader, EduEmptyState } from "@/components/edu/edu-shell";
import styles from "@/components/edu/edu-black-label.module.css";
import { db } from "@/lib/db";
import { eduInstitutionFilter, resolveEduIdentity } from "@/lib/edu/edu-session";
import { isEduInstructorRole } from "@/lib/edu/edu-roles";

export const dynamic = "force-dynamic";

export default async function EduDashboardPage() {
  const identity = await resolveEduIdentity();
  if (!identity) return null;
  const staff = isEduInstructorRole(identity.role);

  const [courses, cohorts, openSubmissions] = process.env.DATABASE_URL
    ? await Promise.all([
        db.educationCourse.count({ where: eduInstitutionFilter(identity) }),
        db.educationCohort.count({ where: eduInstitutionFilter(identity) }),
        db.educationSubmission.count({ where: { ...eduInstitutionFilter(identity), status: staff ? "submitted" : "in_progress" } }),
      ])
    : [0, 0, 0];

  const activeHref = staff ? "/edu/grading" : "/edu/lab";
  const activeLabel = staff ? "Submissions awaiting grading" : "Scenarios in progress";
  const activeDetail = staff
    ? "Instructor-reviewed work waiting for a real grading decision. Zumi does not establish competency or release grades."
    : "Your currently saved simulation work. Completion and competency remain governed by the course and instructor evidence rules.";

  return (
    <>
      <EduCommandHeader
        description={staff
          ? "Courses you run, cohorts in progress, and evidence waiting on your review."
          : "Your learning environment, simulation work, and progress through the Virtual Clinic Lab."}
        eyebrow="Klinikos EDU"
        title={staff ? "Instructor dashboard" : "My lab"}
      />
      <div className={styles.dashboard}>
        <section className={styles.activeWork} data-edu-active-work aria-labelledby="edu-active-work-title">
          <div className={styles.activeWorkMain}>
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[var(--k-accent,#a84d55)]">What needs attention</p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
              <div className="max-w-2xl">
                <h2 id="edu-active-work-title" className="text-2xl font-semibold tracking-[-.04em] text-[var(--k-text,#311d20)] sm:text-3xl">{activeLabel}</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--k-muted,#765f61)]">{activeDetail}</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-semibold tabular-nums tracking-[-.05em] text-[var(--k-text,#311d20)]">{openSubmissions}</p>
                <Link className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--k-line,rgba(84,43,47,.16))] bg-[var(--k-public-raised,#f2e9e5)] px-4 text-xs font-semibold text-[var(--k-text,#311d20)]" href={activeHref}>Open work <ArrowRight className="size-4" aria-hidden="true" /></Link>
              </div>
            </div>
          </div>

          <div className={styles.activityStrip} aria-label="Current EDU context">
            <div className={styles.activityItem}><div className="flex items-center gap-2"><BookOpen className="size-4 text-[var(--k-accent,#a84d55)]" aria-hidden="true" /><p className={styles.activityLabel}>Courses</p></div><p className={styles.activityValue}>{courses}</p></div>
            <div className={styles.activityItem}><div className="flex items-center gap-2"><GraduationCap className="size-4 text-[var(--k-accent,#a84d55)]" aria-hidden="true" /><p className={styles.activityLabel}>Cohorts</p></div><p className={styles.activityValue}>{cohorts}</p></div>
            <div className={styles.activityItem}><div className="flex items-center gap-2"><Layers3 className="size-4 text-[var(--k-accent,#a84d55)]" aria-hidden="true" /><p className={styles.activityLabel}>{staff ? "Review queue" : "Active simulations"}</p></div><p className={styles.activityValue}>{openSubmissions}</p></div>
          </div>
        </section>

        {!identity.institutionId && (
          <div className="mt-6 max-w-2xl">
            <EduEmptyState
              detail="This account is not linked to an education institution yet. An administrator creates the institution before courses and cohorts can exist."
              title="No institution linked"
            />
          </div>
        )}
      </div>
    </>
  );
}
