import Link from "next/link";
import { ArrowRight, CalendarClock, MapPin, PackageSearch, ShieldCheck } from "lucide-react";

type PublicGridResource = {
  id: string;
  organizationId: string;
  resourceType: string;
  subtype: string | null;
  title: string;
  description: string;
  policyClass: string;
  city: string | null;
  state: string | null;
  timezone: string;
  latitude: number | null;
  longitude: number | null;
  pricingModel: string;
  priceCents: number | null;
  capacity: number;
  credentialRequirements: unknown[];
  insuranceRequirements: unknown[];
  operatorRequirements: unknown[];
  usageRestrictions: unknown[];
  availability: Array<{ startsAt: string; endsAt: string; capacity: number }>;
};

const intentResourceTypes: Record<string, string[]> = {
  all: ["space", "product", "equipment", "service", "organization_capacity", "education", "referral"],
  space: ["space"],
  product: ["product"],
  equipment: ["equipment"],
  service: ["service"],
  network: ["organization_capacity", "referral"],
  education: ["education"],
  organization: ["organization_capacity"],
  referral: ["referral"],
};

function money(resource: PublicGridResource) {
  if (resource.pricingModel === "quote" || resource.priceCents == null) return "Request quote";
  const amount = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(resource.priceCents / 100);
  const suffix: Record<string, string> = { fixed: "", hourly: "/hr", daily: "/day", per_unit: "/unit", per_seat: "/seat" };
  return `${amount}${suffix[resource.pricingModel] ?? ""}`;
}

function nextAvailability(resource: PublicGridResource) {
  const slot = resource.availability[0];
  if (!slot) return "Availability by request";
  const date = new Date(slot.startsAt);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export function UniversalResourceBrowser({ resources, intent }: { resources: PublicGridResource[]; intent: string }) {
  const allowedTypes = intentResourceTypes[intent] ?? intentResourceTypes.all;
  const visible = resources.filter((resource) => allowedTypes.includes(resource.resourceType));
  if (["work", "provider"].includes(intent)) return null;

  return <section className="border-t border-[#e8ded9] bg-[#f2ece8]">
    <div className="mx-auto max-w-[1500px] px-5 py-12 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-[12px] font-extrabold uppercase tracking-[.2em] text-[#a8474e]">Reviewed Grid resources</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-.05em] text-[#241517] sm:text-4xl">Real published capacity, not placeholder inventory.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#756461]">Only resources that completed the applicable human review and publication gate appear here. Restricted product classes and generic clinical services remain blocked from this transaction path.</p>
        </div>
        <div className="rounded-full border border-[#d7c7c1] bg-[#fffdf9] px-4 py-2 text-[12px] font-extrabold uppercase tracking-[.12em] text-[#756461]">{visible.length} published</div>
      </div>

      {visible.length === 0 ? <div className="mt-8 rounded-[18px] border border-dashed border-[#d7c7c1] bg-[#fffdf9] px-6 py-10">
        <PackageSearch className="size-6 text-[#a8474e]" />
        <p className="mt-4 text-lg font-semibold tracking-[-.03em] text-[#241517]">No reviewed resources are published in this lane yet.</p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#756461]">Grid will not manufacture inventory to make the marketplace look busy. Listings appear only after a real owner draft reaches the applicable review gate.</p>
      </div> : <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((resource) => <article className="rounded-[18px] border border-[#dfd2cc] bg-[#fffdf9] p-5 shadow-[0_14px_40px_rgba(65,31,35,.04)]" key={resource.id}>
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#a8474e]">{label(resource.resourceType)}</p><h3 className="mt-2 text-xl font-semibold tracking-[-.04em] text-[#241517]">{resource.title}</h3></div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[.11em] text-emerald-700"><ShieldCheck className="size-3" />Reviewed</span>
          </div>
          <p className="mt-4 line-clamp-3 text-[12px] leading-6 text-[#756461]">{resource.description}</p>
          <div className="mt-5 grid gap-2 border-t border-[#ece3df] pt-4 text-[11px] text-[#756461]">
            <div className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5 text-[#a8474e]" />{[resource.city, resource.state].filter(Boolean).join(", ") || "Location by match"}</span><span className="text-[11px] font-extrabold uppercase tracking-[.1em] text-[#6d5c58]">Location</span></div>
            <div className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-1.5"><CalendarClock className="size-3.5 text-[#a8474e]" />{nextAvailability(resource)}</span><span>Capacity {resource.capacity}</span></div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-extrabold uppercase tracking-[.1em] text-[#655451]"><span className="rounded-full border border-[#e3d8d3] px-2 py-1">{label(resource.policyClass)}</span>{resource.subtype && <span className="rounded-full border border-[#e3d8d3] px-2 py-1">{resource.subtype}</span>}</div>
          <div className="mt-5 flex items-end justify-between gap-4 border-t border-[#ece3df] pt-4"><span className="text-[11px] font-extrabold uppercase tracking-[.1em] text-[#6d5c58]">Terms / rate</span><strong className="text-sm text-[#241517]">{money(resource)}</strong></div>
          <Link className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#a8474e] px-4 text-[11px] font-extrabold text-[#a8474e] hover:bg-[#a8474e] hover:text-white" href={`/login?returnTo=${encodeURIComponent(`/grid/resources/request/${resource.id}?from=discovery`)}`}>Start governed request <ArrowRight className="size-3.5" /></Link>
        </article>)}
      </div>}
    </div>
  </section>;
}
