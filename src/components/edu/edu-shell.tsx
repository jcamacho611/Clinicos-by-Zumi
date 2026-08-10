import Link from "next/link";
import { BrandMark } from "@/components/clinic/brand-mark";
import { commandSurfaces } from "@/lib/design/command-system";
import { eduNavigationForRole } from "@/lib/edu/edu-navigation";
import type { EduPlatformRole } from "@/lib/edu/edu-roles";
import { SYNTHETIC_DATA_LABELS } from "@/lib/edu/edu-safety";

/**
 * Authenticated Klinikos EDU shell.
 *
 * Renders on the shared command ground so the lab reads as the same product as the
 * clinic command center rather than a bolted-on LMS. Tokens come from the design
 * system; nothing here defines a colour of its own.
 *
 * One dominant work surface per page. The shell contributes a rail and a command
 * header and then gets out of the way — no hero, no card grid, no KPI boxes.
 *
 * Landmarks are explicit (`banner`, `navigation`, `main`) and the skip link targets
 * the main surface so keyboard users are not walked through the rail on every page.
 */

const roleLabels: Record<EduPlatformRole, string> = {
  edu_admin: "Institution administrator",
  edu_instructor: "Instructor",
  edu_assistant: "Teaching assistant",
  edu_student: "Student",
  edu_observer: "Program reviewer",
};

export function EduShell({
  role,
  userName,
  institutionName,
  children,
}: {
  role: EduPlatformRole;
  userName: string;
  institutionName: string | null;
  children: React.ReactNode;
}) {
  const groups = eduNavigationForRole(role);

  return (
    <div className={commandSurfaces.shell}>
      <div aria-hidden="true" className={commandSurfaces.aegeanField} />
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-cyan-300 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-[#05090f]"
        href="#edu-main"
      >
        Skip to main content
      </a>

      <div className="relative lg:grid lg:grid-cols-[250px_1fr]">
        <div className="border-r border-white/10 lg:min-h-screen">
          <div className="flex items-center gap-3 px-5 py-6">
            <BrandMark />
            <div>
              <p className="text-sm font-extrabold">Klinikos EDU</p>
              <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#e6c55b]">Virtual Clinic Lab</p>
            </div>
          </div>

          <nav aria-label="Klinikos EDU" className="px-3 pb-8">
            {groups.map((group) => (
              <div className="mt-5 first:mt-0" key={group.label}>
                <p className="px-2 text-[10px] font-extrabold uppercase tracking-[.16em] text-slate-400">{group.label}</p>
                <ul className="mt-2">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        className="block px-2 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e6c55b]"
                        href={item.href}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="min-w-0">
          <header className="border-b border-white/10" role="banner">
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">
                  {institutionName ?? "No institution linked"}
                </p>
                <p className="mt-0.5 text-sm font-extrabold text-white">
                  {userName} · <span className="font-semibold text-slate-400">{roleLabels[role]}</span>
                </p>
              </div>
              <ul aria-label="Data classification" className="flex flex-wrap gap-1.5">
                {SYNTHETIC_DATA_LABELS.map((label) => (
                  <li
                    className="border border-[#e6c55b]/40 bg-[#e6c55b]/[.08] px-2 py-1 text-[9px] font-extrabold uppercase tracking-[.12em] text-[#f0dda0]"
                    key={label}
                  >
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </header>

          <main id="edu-main">{children}</main>
        </div>
      </div>
    </div>
  );
}

/** Command header for a single work surface. One page, one dominant surface. */
export function EduCommandHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 px-5 py-6 sm:px-8">
      <div className="max-w-3xl">
        <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#e6c55b]">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-[-.04em] text-white sm:text-3xl">{title}</h1>
        {description && <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/**
 * Honest empty state. Says what is missing and what would fill it, rather than
 * occupying the surface with decoration.
 */
export function EduEmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="border border-dashed border-white/15 bg-white/[.02] px-6 py-12 text-center">
      <p className="text-sm font-extrabold text-white">{title}</p>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">{detail}</p>
    </div>
  );
}
