import Link from "next/link";
import { ArrowLeft, Building2, Check, MapPin, ShieldCheck } from "lucide-react";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";
import { CapacityIntakeForm } from "@/components/grid/capacity-intake-form";

export const metadata = { title: "List space or organization capacity — Klinikos Grid" };

const steps = [
  ["1", "What are you listing?", "Clinic, room, chair, office, lab capacity, imaging capacity, training space, or organization access."],
  ["2", "Where is it?", "City, state, service area, and where the capacity can be used."],
  ["3", "When is it available?", "An actual availability window and the amount of capacity Grid can reserve."],
  ["4", "What can it be used for?", "Permitted use and the boundaries Grid must preserve before a match can proceed."],
  ["5", "What do you want for it?", "Hourly, daily, flat, or request-based pricing."],
] as const;

export default async function GridLocationJoinPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const organizationMode = type === "organization";
  const mode = organizationMode ? "organization" : "space";

  return <main className="min-h-screen bg-[#fffdf9] text-[#241517]">
    <header className="border-b border-[#e8ded9] bg-[#fffdf9]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1400px] items-center px-5 sm:px-8">
        <KlinikosWordmark href="/grid" framed markClassName="h-10 w-10" textClassName="h-[20px] w-[176px]" className="gap-3" />
        <span className="ml-4 hidden text-[11px] font-extrabold uppercase tracking-[.17em] text-[#a8474e] sm:block">{organizationMode ? "Organization capacity" : "Space & capacity"}</span>
        <Link className="ml-auto inline-flex items-center gap-2 text-xs font-semibold text-[#756461] hover:text-[#241517]" href="/grid"><ArrowLeft className="size-4"/>Back to Grid</Link>
      </div>
    </header>

    <section className="relative overflow-hidden border-b border-[#e6817b]/12 bg-[#090405] text-[#fff8f6]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_0%,rgba(157,45,57,.24),transparent_38%),linear-gradient(135deg,rgba(230,129,123,.05),transparent_58%)]" />
      <div className="relative mx-auto grid max-w-[1400px] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_.8fr] lg:items-end">
        <div>
          <p className="text-[12px] font-extrabold uppercase tracking-[.2em] text-[#efaaa1]">{organizationMode ? "I represent an organization" : "I have space"}</p>
          <h1 className="mt-4 text-5xl font-semibold leading-[.95] tracking-[-.06em] sm:text-6xl">{organizationMode ? "Put real organization capacity into Grid." : "Turn unused space into capacity Grid can fill."}</h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-[#b59b97]">Create the account and the first real capacity record together. The resource stays unavailable to public transactions until the applicable Grid review succeeds.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.25rem] border border-[#e6817b]/12 bg-[#14090c]/70 p-5"><MapPin className="size-5 text-[#efaaa1]"/><p className="mt-4 text-sm font-semibold">Map-first discovery</p><p className="mt-2 text-xs leading-5 text-[#9f8985]">Marketplace-visible capacity can appear in geographic discovery only after review and publication.</p></div>
          <div className="rounded-[1.25rem] border border-[#d6b787]/12 bg-[#d6b787]/[.04] p-5"><ShieldCheck className="size-5 text-[#d6b787]"/><p className="mt-4 text-sm font-semibold">One governed Grid account</p><p className="mt-2 text-xs leading-5 text-[#9f8985]">The owner can sign in after enrollment, add resources, review offers, track bookings, and see economic state without collapsing those states together.</p></div>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8">
      <div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr]">
        <aside>
          <p className="text-[12px] font-extrabold uppercase tracking-[.18em] text-[#a8474e]">Real setup</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-.05em]">Create the account and resource once.</h2>
          <p className="mt-4 text-sm leading-7 text-[#756461]">This path writes to the Grid resource registry. A successful screen means the account and resource actually exist; it does not mean the resource has been approved.</p>
          <div className="mt-7 border-t border-[#e8ded9]">{steps.map(([n,title,body])=><div className="grid gap-3 border-b border-[#e8ded9] py-4 sm:grid-cols-[40px_1fr_auto] sm:items-center" key={n}><span className="grid size-8 place-items-center rounded-full bg-[#a8474e] text-xs font-extrabold text-white">{n}</span><div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-[11px] leading-5 text-[#756461]">{body}</p></div><Check className="size-4 text-[#7e6538]"/></div>)}</div>
        </aside>
        <div className="rounded-[1.5rem] border border-[#e8ded9] bg-white p-1 shadow-[0_24px_80px_rgba(36,21,23,.06)]"><CapacityIntakeForm mode={mode} /></div>
      </div>
    </section>
  </main>;
}
