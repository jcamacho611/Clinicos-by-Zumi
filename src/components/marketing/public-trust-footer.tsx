import Link from "next/link";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";

const primary = [
  ["About", "/about"],
  ["Clinics", "/founding-clinic"],
  ["Pricing", "/pricing"],
  ["Grid", "/grid"],
  ["EDU", "/edu"],
  ["Trust", "/trust"],
] as const;

const legal = [
  ["Privacy", "/legal/privacy"],
  ["Access terms", "/legal/access-terms"],
  ["Legal status", "/legal/terms"],
] as const;

export function PublicTrustFooter() {
  return (
    <footer
      className="border-t border-[var(--k-line)] bg-[var(--k-public-bg)] px-5 pb-24 pt-9 text-[var(--k-text)] sm:px-8"
      data-public-trust-footer="true"
      data-public-utility-clearance="true"
    >
      <div className="mx-auto grid max-w-[1500px] gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <span className="inline-flex rounded-[12px] bg-[#070304] p-1.5">
            <KlinikosWordmark
              className="gap-2.5"
              frameClassName="size-8"
              framed
              href="/"
              inverse
              markClassName="h-full w-full"
              textClassName="h-[17px] w-[150px]"
            />
          </span>
          <p className="mt-3 max-w-2xl text-xs leading-6 text-[var(--k-muted)]">
            Helping clinics, healthcare professionals, learners, and patients move the right work forward with clearer next steps.
          </p>
          <nav className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-xs font-semibold text-[var(--k-muted)]" aria-label="Company">
            {primary.map(([label, href]) => <Link className="inline-flex min-h-11 items-center hover:text-[var(--k-text)]" href={href} key={href}>{label}</Link>)}
          </nav>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-3 text-[11px] font-semibold text-[var(--k-muted)]" aria-label="Legal and trust">
          {legal.map(([label, href]) => <Link className="inline-flex min-h-11 items-center hover:text-[var(--k-text)]" href={href} key={href}>{label}</Link>)}
        </nav>
      </div>
    </footer>
  );
}
