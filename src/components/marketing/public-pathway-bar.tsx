import Link from "next/link";

const pathways = [
  { href: "/#surfaces", label: "Clinic workspace" },
  { href: "/grid", label: "The Grid" },
  { href: "/edu", label: "Klinikos EDU" },
  { href: "/capabilities", label: "Capabilities" },
  { href: "/founding-clinic", label: "Founding clinics" },
] as const;

export function PublicPathwayBar() {
  return (
    <nav
      aria-label="Klinikos product pathways"
      className="fixed inset-x-0 top-[72px] z-40 border-b border-white/10 bg-[#0b1e3a]/92 text-white backdrop-blur-xl"
    >
      <div className="mx-auto flex min-h-11 max-w-[1680px] items-center gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
        <span className="mr-3 shrink-0 text-[9px] font-extrabold uppercase tracking-[.2em] text-white/35">Explore</span>
        {pathways.map((pathway) => (
          <Link
            className="shrink-0 border-l border-white/10 px-3 py-2 text-[10px] font-bold text-white/62 transition hover:bg-white/[.05] hover:text-white sm:px-4"
            href={pathway.href}
            key={pathway.href}
          >
            {pathway.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
