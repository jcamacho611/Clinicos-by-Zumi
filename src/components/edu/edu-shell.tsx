import type { ReactNode } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/clinic/brand-mark";
import { eduNavigationForRole } from "@/lib/edu/edu-navigation";
import type { EduPlatformRole } from "@/lib/edu/edu-roles";
import { SYNTHETIC_DATA_LABELS } from "@/lib/edu/edu-safety";
import styles from "./edu-black-label.module.css";

const roleLabels: Record<EduPlatformRole, string> = {
  edu_admin: "Institution administrator",
  edu_instructor: "Instructor",
  edu_assistant: "Teaching assistant",
  edu_student: "Student",
  edu_observer: "Program reviewer",
};

type EduNavigationGroup = ReturnType<typeof eduNavigationForRole>[number];

function EduNavGroups({ groups }: { groups: EduNavigationGroup[] }) {
  return <>{groups.map((group) => <div className={styles.navGroup} key={group.label}>
    <p className={styles.navLabel}>{group.label}</p>
    <ul className={styles.navList}>
      {group.items.map((item) => <li key={item.href}><Link className={styles.navLink} href={item.href}>{item.label}</Link></li>)}
    </ul>
  </div>)}</>;
}

export function EduShell({
  role,
  userName,
  institutionName,
  children,
}: {
  role: EduPlatformRole;
  userName: string;
  institutionName: string | null;
  children: ReactNode;
}) {
  const groups = eduNavigationForRole(role);

  return (
    <div className={styles.shell} data-klinikos-ds data-edu-role={role}>
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-[var(--k-accent,#e6817b)] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-[#19090b]"
        href="#edu-main"
      >
        Skip to main content
      </a>

      <div className={styles.frame}>
        <aside className={styles.rail}>
          <div className={styles.railHeader}>
            <BrandMark />
            <div>
              <p className="text-sm font-semibold text-[#f8efed]">Klinikos EDU</p>
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-[.16em] text-[#efaaa1]">Virtual Clinic Lab</p>
            </div>
          </div>

          <nav aria-label="Klinikos EDU" className={styles.desktopNav}>
            <EduNavGroups groups={groups} />
          </nav>

          <details className={styles.mobileNav}>
            <summary>Browse EDU</summary>
            <nav aria-label="Klinikos EDU mobile" className="px-3 pb-5">
              <EduNavGroups groups={groups} />
            </nav>
          </details>
        </aside>

        <div className={styles.workspace}>
          <header className={styles.topbar} role="banner">
            <div className={styles.topbarInner}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.13em] text-[var(--k-muted,#765f61)]">
                  {institutionName ?? "No institution linked"}
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--k-text,#311d20)]">
                  {userName} · <span className="font-medium text-[var(--k-muted,#765f61)]">{roleLabels[role]}</span>
                </p>
              </div>
              <ul aria-label="Data classification" className={styles.classification}>
                {SYNTHETIC_DATA_LABELS.map((label) => <li className={styles.classificationItem} key={label}>{label}</li>)}
              </ul>
            </div>
          </header>

          <main id="edu-main" className={styles.main}>{children}</main>
        </div>
      </div>
    </div>
  );
}

export function EduCommandHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className={styles.commandHeader}>
      <div className="max-w-3xl">
        <p className={styles.commandEyebrow}>{eyebrow}</p>
        <h1 className={styles.commandTitle}>{title}</h1>
        {description && <p className={styles.commandDescription}>{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EduEmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className={styles.empty}>
      <p className="text-sm font-semibold text-[var(--k-text,#311d20)]">{title}</p>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--k-muted,#765f61)]">{detail}</p>
    </div>
  );
}
