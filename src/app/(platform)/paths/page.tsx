import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, GraduationCap, Route, ShieldCheck, Sparkles, Users } from "lucide-react";
import { requireClinicSession } from "@/lib/auth/session";
import { klinikosPathCatalog, type KlinikosPathAvailability, type KlinikosPathGroup } from "@/lib/paths/catalog";

const groupMeta: Record<KlinikosPathGroup, { label: string; description: string; icon: typeof Route }> = {
  individual: { label: "Individual", description: "Learning, readiness, work, professional mobility, and patient-safe entry routes.", icon: Users },
  clinic: { label: "Clinic", description: "Operations, staffing, revenue, services, capacity, and expansion routes.", icon: Building2 },
  organization: { label: "Organization", description: "New organization contexts and institutional participation routes.", icon: Route },
  education: { label: "Education", description: "Placement, preceptor, learner, and institution-connected routes.", icon: GraduationCap },
};

const availabilityMeta: Record<KlinikosPathAvailability, { label: string; className: string }> = {
  available_now: { label: "Available now", className: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200" },
  requires_setup: { label: "Requires setup", className: "border-[#d6b787]/20 bg-[#d6b787]/10 text-[#efd8ad]" },
  requires_verification: { label: "Requires verification", className: "border-[#e6817b]/24 bg-[#e6817b]/10 text-[#efaaa1]" },
  requires_organization_connection: { label: "Requires organization connection", className: "border-violet-300/20 bg-violet-300/10 text-violet-200" },
  defined: { label: "Defined path", className: "border-white/10 bg-white/[.04] text-[#b89f9b]" },
};

export const metadata = {
  title: "Routes | Klinikos",
  description: "Klinikos routes current state to desired state across learning, readiness, opportunity, operations, and growth.",
};

export default async function KlinikosRouteRegistryPage() {
  await requireClinicSession();

  return (
    <div className="mx-auto max-w-[1480px] space-y-12 text-[#f8efed]">
      <section className="relative overflow-hidden rounded-[32px] border border-[#e6817b]/14 bg-[#0b0507] px-6 py-10 shadow-[0_30px_90px_rgba(0,0,0,.24)] sm:px-9 lg:px-12 lg:py-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_12%,rgba(169,55,65,.22),transparent_31%),radial-gradient(circle_at_15%_92%,rgba(230,129,123,.06),transparent_24%)]" />
        <div className="relative grid gap-9 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
          <div>
            <p className="text-[12px] font-extrabold uppercase tracking-[.24em] text-[#e6817b]">Klinikos Route Registry</p>
            <h1 className="mt-5 max-w-4xl text-balance text-5xl font-light leading-[.94] tracking-[-.06em] sm:text-6xl lg:text-7xl">Pages are destinations. Routes are how people move.</h1>
            <p className="mt-6 max-w-3xl text-sm leading-7 text-[#b89f9b] sm:text-base">Start with where you are and what you want. Klinikos shows what is missing, which governed path is available, and the next real action without pretending that education, payment, licensure, placement, or setup is already complete.</p>
          </div>
          <div className="border-y border-[#e6817b]/12 py-6 lg:border-l lg:border-y-0 lg:pl-8">
            <div className="flex items-start gap-3"><Sparkles className="mt-1 size-5 text-[#e6817b]" /><div><p className="text-sm font-semibold">Zumi resolves intent into these routes.</p><p className="mt-2 text-xs leading-6 text-[#9f8985]">AI can interpret and explain. Authorization, eligibility, clinical governance, credentials, and financial truth remain deterministic.</p></div></div>
            <Link className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-[#efaaa1]" href="/zumi">Ask Zumi where to start <ArrowRight className="size-3.5" /></Link>
          </div>
        </div>
      </section>

      {(Object.keys(groupMeta) as KlinikosPathGroup[]).map((group) => {
        const meta = groupMeta[group];
        const Icon = meta.icon;
        const paths = klinikosPathCatalog.filter((path) => path.group === group);
        if (!paths.length) return null;
        return (
          <section key={group} aria-labelledby={`route-group-${group}`}>
            <div className="flex flex-col gap-3 border-b border-[#e6817b]/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-start gap-4"><span className="grid size-11 place-items-center rounded-full border border-[#e6817b]/16 bg-[#e6817b]/[.06] text-[#e6817b]"><Icon className="size-5" /></span><div><h2 className="text-2xl font-light tracking-[-.04em]" id={`route-group-${group}`}>{meta.label}</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-[#9f8985]">{meta.description}</p></div></div>
              <p className="text-[12px] font-bold uppercase tracking-[.15em] text-[#806965]">{paths.length} {paths.length === 1 ? "route" : "routes"}</p>
            </div>

            <div className="grid gap-3 pt-5 md:grid-cols-2 xl:grid-cols-3">
              {paths.map((path) => {
                const status = availabilityMeta[path.availability];
                return (
                  <article className="group flex min-h-[310px] flex-col rounded-[22px] border border-[#e6817b]/11 bg-[#100708]/72 p-6 transition hover:border-[#e6817b]/25 hover:bg-[#14090b]" key={path.id}>
                    <div className="flex items-start justify-between gap-4">
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[.11em] ${status.className}`}>{status.label}</span>
                      {path.availability === "available_now" ? <BadgeCheck className="size-4 text-emerald-300" /> : <ShieldCheck className="size-4 text-[#8f7773]" />}
                    </div>
                    <h3 className="mt-5 text-xl font-semibold tracking-[-.035em] text-[#fff8f6]">{path.title}</h3>
                    <p className="mt-3 text-xs leading-6 text-[#9f8985]">{path.summary}</p>
                    <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-[12px]">
                      <span className="rounded-xl border border-[#e6817b]/10 bg-[#090405]/70 p-3 text-[#d8c1bd]">{path.from}</span>
                      <ArrowRight className="size-3.5 text-[#e6817b]" />
                      <span className="rounded-xl border border-[#e6817b]/10 bg-[#090405]/70 p-3 text-[#d8c1bd]">{path.to}</span>
                    </div>
                    <p className="mt-5 flex-1 border-l border-[#d6b787]/28 pl-3 text-[12px] leading-5 text-[#ad9893]">{path.governance}</p>
                    <Link className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#efaaa1]" href={`/paths/${path.id}`}>Open route <ArrowRight className="size-3.5 transition group-hover:translate-x-1" /></Link>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
