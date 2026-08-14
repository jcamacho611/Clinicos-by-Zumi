import Link from "next/link";
import { BrandMark } from "@/components/clinic/brand-mark";
import { commandSurfaces } from "@/lib/design/command-system";
import { eduNavigationForRole } from "@/lib/edu/edu-navigation";
import type { EduPlatformRole } from "@/lib/edu/edu-roles";
import { SYNTHETIC_DATA_LABELS } from "@/lib/edu/edu-safety";

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
    <div className={`${commandSurfaces.shell} relative overflow-hidden`} data-klinikos-ds>
      <div aria-hidden="true" className={commandSurfaces.aegeanField} />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(131,31,39,.18),transparent_28%),radial-gradient(circle_at_85%_68%,rgba(230,129,123,.035),transparent_27%)]" />
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-[#e6817b] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-[#19090b]"
        href="#edu-main"
      >
        Skip to main content
      </a>

      <div className="relative lg:grid lg:grid-cols-[250px_1fr]">
        <div className="border-r border-[#e28b85]/10 bg-[#070304]/80 lg:min-h-screen">
          <div className="flex items-center gap-3 px-5 py-6">
            <BrandMark />
            <div>
              <p className="text-sm font-semibold text-[#f8efed]">Klinikos EDU</p>
              <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-[#efaaa1]">Virtual Clinic Lab</p>
            </div>
          </div>

          <nav aria-label="Klinikos EDU" className="px-3 pb-8">
            {groups.map((group) => (
              <div className="mt-5 first:mt-0" key={group.label}>
                <p className="px-2 text-[10px] font-semibold uppercase tracking-[.16em] text-[#8f7773]">{group.label}</p>
                <ul className="mt-2 space-y-0.5">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        className="block rounded-[12px] border border-transparent px-2.5 py-2 text-sm font-medium text-[#cbb6b2] transition hover:border-[#e6817b]/10 hover:bg-[#e6817b]/[.05] hover:text-[#fff8f6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e6817b]"
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
          <header className="border-b border-[#e28b85]/10 bg-[#090506]/70 backdrop-blur-xl" role="banner">
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-[#8f7773]">
                  {institutionName ?? "No institution linked"}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-[#f8efed]">
                  {userName} · <span className="font-medium text-[#a98f8b]">{roleLabels[role]}</span>
                </p>
              </div>
              <ul aria-label="Data classification" className="flex flex-wrap gap-1.5">
                {SYNTHETIC_DATA_LABELS.map((label) => (
                  <li
                    className="rounded-full border border-[#efaaa1]/24 bg-[#efaaa1]/[.06] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.12em] text-[#e8bbb4]"
                    key={label}
                  >
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </header>

          <main id="edu-main" className="text-[#f8efed]">{children}</main>
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
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e28b85]/10 px-5 py-6 sm:px-8">
      <div className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[#e6817b]">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-light tracking-[-.04em] text-[#f8efed] sm:text-3xl">{title}</h1>
        {description && <p className="mt-3 text-sm leading-6 text-[#bca5a1]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EduEmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="border border-dashed border-[#e28b85]/16 bg-[#12090b]/45 px-6 py-12 text-center">
      <p className="text-sm font-semibold text-[#f8efed]">{title}</p>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#9f8985]">{detail}</p>
    </div>
  );
}
