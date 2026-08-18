import Link from "next/link";

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
    <footer className="border-t border-[#e6817b]/14 bg-[#050303] px-5 py-9 text-[#f8efed] sm:px-8">
      <div className="mx-auto grid max-w-[1500px] gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm font-semibold">Klinikos</p>
          <p className="mt-2 max-w-2xl text-xs leading-6 text-[#ad928d]">
            Helping clinics, healthcare professionals, learners, and patients move the right work forward with clearer next steps.
          </p>
          <nav className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-xs font-semibold text-[#d8c1bd]" aria-label="Company">
            {primary.map(([label, href]) => <Link className="hover:text-white" href={href} key={href}>{label}</Link>)}
          </nav>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-3 text-[11px] font-semibold text-[#ad928d]" aria-label="Legal and trust">
          {legal.map(([label, href]) => <Link className="hover:text-white" href={href} key={href}>{label}</Link>)}
        </nav>
      </div>
    </footer>
  );
}
