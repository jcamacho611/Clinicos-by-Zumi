import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarClock, MapPin, ShieldCheck, TriangleAlert } from "lucide-react";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";
import { findPublicGridResource } from "@/lib/grid/public-resource-detail";

export const dynamic = "force-dynamic";

const getResource = cache(findPublicGridResource);

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function money(pricingModel: string, priceCents: number | null) {
  if (pricingModel === "quote" || priceCents == null) return "Request quote";
  const amount = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(priceCents / 100);
  const suffix: Record<string, string> = { fixed: "", hourly: "/hr", daily: "/day", per_unit: "/unit", per_seat: "/seat" };
  return `${amount}${suffix[pricingModel] ?? ""}`;
}

function formatAvailability(value: string, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
    timeZoneName: "short",
  }).format(new Date(value));
}

export async function generateMetadata({ params }: { params: Promise<{ resourceId: string }> }): Promise<Metadata> {
  const { resourceId } = await params;
  const resource = await getResource(resourceId);
  if (!resource) return { title: "Grid resource — Klinikos" };

  return {
    title: `${resource.title} — Klinikos Grid`,
    description: resource.description.slice(0, 160),
  };
}

export default async function GridResourceDetailPage({ params }: { params: Promise<{ resourceId: string }> }) {
  const { resourceId } = await params;
  const resource = await getResource(resourceId);
  if (!resource) notFound();

  const location = [resource.city, resource.state].filter(Boolean).join(", ") || "Location shared through the governed request path";
  const requestReturnTo = `/grid/resources/request/${resource.id}?from=resource-detail`;
  const requirementItems = [
    resource.requirements.credentialRequirementsApply ? "Credential requirements apply" : null,
    resource.requirements.insuranceRequirementsApply ? "Insurance requirements apply" : null,
    resource.requirements.operatorRequirementsApply ? "Operator requirements apply" : null,
    resource.requirements.usageRestrictionsApply ? "Usage restrictions apply" : null,
  ].filter((item): item is string => Boolean(item));

  return (
    <main className="min-h-screen bg-[#fffdf9] text-[#241517]">
      <header className="border-b border-[#e8ded9] bg-[#fffdf9]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 max-w-[1240px] items-center gap-4 px-5 sm:px-8">
          <KlinikosWordmark href="/grid" framed markClassName="h-10 w-10" textClassName="h-[20px] w-[176px]" className="gap-3" />
          <span className="hidden text-[11px] font-extrabold uppercase tracking-[.17em] text-[#a8474e] md:block">Grid resource</span>
          <Link className="ml-auto inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-[#756461] hover:text-[#241517]" href="/grid/browse"><ArrowLeft className="size-4" />Back to discovery</Link>
        </div>
      </header>

      <section className="border-b border-[#e8ded9] bg-[#f7f3ef]">
        <div className="mx-auto max-w-[1240px] px-5 py-12 sm:px-8 lg:py-16">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[.12em] text-emerald-700"><ShieldCheck className="size-3.5" />Reviewed Grid resource</span>
            <span className="rounded-full border border-[#d7c7c1] bg-white px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#756461]">{label(resource.resourceType)}</span>
            {resource.subtype ? <span className="rounded-full border border-[#d7c7c1] bg-white px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#756461]">{resource.subtype}</span> : null}
          </div>

          <div className="mt-7 grid gap-10 lg:grid-cols-[1fr_340px] lg:items-start">
            <div>
              <h1 className="max-w-4xl text-4xl font-semibold tracking-[-.055em] sm:text-6xl">{resource.title}</h1>
              <p className="mt-6 max-w-3xl text-sm leading-7 text-[#756461] sm:text-base">{resource.description}</p>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-[12px] font-semibold text-[#655451]">
                <span className="inline-flex items-center gap-2"><MapPin className="size-4 text-[#a8474e]" />{location}</span>
                <span>Capacity {resource.capacity}</span>
                <span>{label(resource.policyClass)}</span>
              </div>
            </div>

            <aside className="rounded-[24px] border border-[#dfd2cc] bg-white p-5 shadow-[0_20px_55px_rgba(65,31,35,.06)]">
              <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#756461]">Terms / rate</p>
              <p className="mt-2 text-2xl font-semibold tracking-[-.04em]">{money(resource.pricingModel, resource.priceCents)}</p>
              <p className="mt-2 text-[11px] leading-5 text-[#756461]">Final eligibility, availability, contract, payment, and transaction terms remain governed by the applicable Grid policy.</p>
              <Link className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#a8474e] px-5 text-xs font-extrabold text-white hover:bg-[#8f3941]" href={`/login?returnTo=${encodeURIComponent(requestReturnTo)}`}>Request this resource <ArrowRight className="size-4" /></Link>
            </aside>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1240px] gap-6 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_.8fr] lg:py-14">
        <section className="rounded-[22px] border border-[#e8ded9] bg-white p-5 sm:p-6" aria-labelledby="resource-availability-title">
          <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#a8474e]">Published capacity</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-.04em]" id="resource-availability-title">Availability</h2>
          {resource.availability.length ? (
            <div className="mt-5 divide-y divide-[#ece3df] border-y border-[#ece3df]">
              {resource.availability.slice(0, 8).map((slot) => (
                <div className="flex flex-wrap items-center justify-between gap-3 py-4" key={`${slot.startsAt}-${slot.endsAt}`}>
                  <span className="inline-flex items-center gap-2 text-xs font-semibold"><CalendarClock className="size-4 text-[#a8474e]" />{formatAvailability(slot.startsAt, resource.timezone)}</span>
                  <span className="text-[11px] text-[#756461]">to {formatAvailability(slot.endsAt, resource.timezone)} · capacity {slot.capacity}</span>
                </div>
              ))}
            </div>
          ) : <p className="mt-5 rounded-[16px] border border-dashed border-[#d7c7c1] bg-[#f7f3ef] p-5 text-xs leading-6 text-[#756461]">No future public availability slot is currently published. Availability may still be discussed through the governed request path.</p>}
        </section>

        <section className="rounded-[22px] border border-[#e8ded9] bg-white p-5 sm:p-6" aria-labelledby="resource-requirements-title">
          <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#a8474e]">Before a transaction</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-.04em]" id="resource-requirements-title">Requirements</h2>
          {requirementItems.length ? <ul className="mt-5 space-y-3">{requirementItems.map((item) => <li className="flex gap-2 text-xs leading-5 text-[#655451]" key={item}><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#9b7c45]" />{item}. Exact evidence remains inside the governed review/request workflow.</li>)}</ul> : <p className="mt-5 text-xs leading-6 text-[#756461]">No additional requirement category is published on this resource projection. Transaction eligibility can still depend on policy, jurisdiction, contract, and current availability.</p>}
        </section>
      </div>

      <section className="border-y border-[#e8ded9] bg-[#f7f3ef]">
        <div className="mx-auto max-w-[1240px] px-5 py-8 sm:px-8">
          <p className="flex max-w-4xl gap-3 text-[12px] leading-6 text-[#756461]"><TriangleAlert className="mt-1 size-4 shrink-0 text-[#9b7c45]" /><span><strong className="text-[#4d3c39]">Listing does not equal authorization.</strong> Human review allowed this resource to be discoverable. It does not by itself prove professional eligibility, clinical appropriateness, legal permission, insurance coverage, final availability, payment, fulfillment, or settlement.</span></p>
        </div>
      </section>

      <footer className="mx-auto max-w-[1240px] px-5 py-8 sm:px-8">
        <div className="flex flex-wrap gap-5 text-[11px] font-semibold text-[#756461]"><Link href="/grid">Grid home</Link><Link href="/grid/browse">Browse Grid</Link><Link href="/legal/grid">Grid marketplace terms</Link><Link href="/legal/privacy">Privacy notice</Link></div>
        <p className="mt-4 text-[10px] text-[#9b8782]">Resource information reflects the current published Grid record. Updated {new Date(resource.updatedAt).toLocaleDateString()}.</p>
      </footer>
    </main>
  );
}
