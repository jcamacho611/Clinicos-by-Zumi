import Link from "next/link";
import { commandSurfaces } from "@/lib/design/command-system";
import { PLATFORM_BOUNDARY_NOTICE } from "@/lib/design/command-system";

/**
 * The public site shell.
 *
 * Marketing surfaces, so Nolan governs: the ground is obsidian, the argument is
 * carried by sequence, and the one signature device is the Zumi orb. What does not
 * relax here is copy law, the token set, or the boundary notice — a visitor reading
 * the marketing site must be able to learn what Klinikos is not without leaving it.
 */

const NAV = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/zumi", label: "Zumi" },
  { href: "/demo", label: "Demo" },
  { href: "/pricing", label: "Pricing" },
  { href: "/operational-audit", label: "Operational Audit" },
] as const;

const SOLUTIONS = [
  { href: "/solutions/medical-spa", label: "Medical spa" },
  { href: "/solutions/primary-care", label: "Primary care" },
  { href: "/solutions/independent-clinic", label: "Independent clinic" },
] as const;

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={commandSurfaces.shell}>
      <div aria-hidden className={commandSurfaces.aegeanField} />
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}

function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#05090f]/90 backdrop-blur">
      <nav aria-label="Klinikos" className="mx-auto flex max-w-[1500px] items-center gap-6 px-5 py-4 sm:px-8">
        <Link className="text-sm font-extrabold tracking-[-.03em] text-white" href="/">
          Klinikos <span className="text-[#e6c55b]">by Zumi</span>
        </Link>
        <ul className="hidden items-center gap-5 lg:flex">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link className="text-[13px] font-semibold text-slate-300 transition-colors hover:text-white" href={item.href}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          className={`${commandSurfaces.interactive} ml-auto inline-flex items-center border border-[#e6c55b]/40 bg-[#e6c55b]/[.09] px-4 text-[13px] font-extrabold text-[#f0dda0]`}
          href="/pricing"
        >
          Get Klinikos
        </Link>
      </nav>
    </header>
  );
}

function MarketingFooter() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto grid max-w-[1500px] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="text-sm font-extrabold tracking-[-.03em] text-white">Klinikos by Zumi</p>
          <p className="mt-4 max-w-md text-[12px] leading-6 text-slate-400">{PLATFORM_BOUNDARY_NOTICE}</p>
        </div>
        <FooterColumn heading="Product" links={NAV} />
        <FooterColumn heading="For your clinic" links={SOLUTIONS} />
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-6 gap-y-2 px-5 py-6 text-[11px] text-slate-500 sm:px-8">
          <Link className="hover:text-slate-300" href="/legal/privacy">Privacy</Link>
          <Link className="hover:text-slate-300" href="/legal/access-terms">Terms</Link>
          <Link className="hover:text-slate-300" href="/contact">Contact</Link>
          <span className="ml-auto">Klinikos by Zumi</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ heading, links }: { heading: string; links: readonly { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="text-[11px] font-extrabold uppercase tracking-[.16em] text-slate-500">{heading}</h2>
      <ul className="mt-4 grid gap-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link className="text-[13px] text-slate-300 transition-colors hover:text-white" href={link.href}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Section heading used across the marketing pages, so the rhythm stays identical. */
export function MarketingSection({
  eyebrow,
  title,
  lead,
  children,
  id,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  children?: React.ReactNode;
  id: string;
}) {
  return (
    <section aria-labelledby={`${id}-heading`} className="border-b border-white/10">
      <div className="mx-auto max-w-[1500px] px-5 py-16 sm:px-8 lg:py-20">
        {eyebrow && <p className={commandSurfaces.eyebrow}>{eyebrow}</p>}
        <h2 className={`${commandSurfaces.headline} mt-3 max-w-3xl text-3xl sm:text-4xl`} id={`${id}-heading`}>
          {title}
        </h2>
        {lead && <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">{lead}</p>}
        {children}
      </div>
    </section>
  );
}
