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

  return <section className="border-t border-[var(--k-line)] bg-[var(--k-work-bg)]">
    <div className="mx-auto max-w-[1500px] px-5 py-12 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-[var(--k-accent)]">Reviewed Grid resources</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-.05em] text-[var(--k-text)] sm:text-4xl">Real published capacity, not placeholder inventory.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--k-muted)]">Only resources that completed the applicable human review and publication gate appear here. Restricted product classes and generic clinical services remain blocked from this transaction path.</p>
        </div>
        <div className="border border-[var(--k-line)] bg-[var(--k-public-surface)] px-4 py-2 text-xs font-extrabold uppercase tracking-[.12em] text-[var(--k-muted)]">{visible.length} published</div>
      </div>

      {visible.length === 0 ? <div className="mt-8 border border-dashed border-[var(--k-line)] bg-[var(--k-public-surface)] px-6 py-10">
        <PackageSearch className="size-6 text-[var(--k-accent)]" />
        <p className="mt-4 text-lg font-semibold tracking-[-.03em] text-[var(--k-text)]">No reviewed resources are published in this lane yet.</p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--k-muted)]">Grid will not manufacture inventory to make the marketplace look busy. Listings appear only after a real owner draft reaches the applicable review gate.</p>
      </div> : <div data-grid-ledger="resources" className="mt-8 overflow-hidden border-y border-[var(--k-line)] bg-[var(--k-public-surface)]">
        {visible.map((resource) => <article data-grid-ledger-row="resource" className="grid gap-5 border-b border-[var(--k-line)] px-4 py-5 last:border-b-0 sm:px-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(160px,.52fr)_minmax(190px,.62fr)_minmax(150px,.46fr)] lg:items-center lg:gap-6 lg:px-6" key={resource.id}>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[var(--k-accent)]">{label(resource.resourceType)}</p>
              <span className="inline-flex items-center gap-1 border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-extrabold uppercase tracking-[.1em] text-emerald-700"><ShieldCheck className="size-3" />Reviewed</span>
            </div>
            <h3 className="mt-2 text-xl font-semibold tracking-[-.04em] text-[var(--k-text)]">{resource.title}</h3>
            <p className="mt-3 line-clamp-2 max-w-2xl text-[13px] leading-6 text-[var(--k-muted)]">{resource.description}</p>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-[var(--k-muted)]"><span>{label(resource.policyClass)}</span>{resource.subtype && <span>{resource.subtype}</span>}</div>
          </div>

          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--k-muted)]">Location / capacity</p>
            <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-[var(--k-text)]"><MapPin className="size-3.5 text-[var(--k-accent)]" />{[resource.city, resource.state].filter(Boolean).join(", ") || "Location by match"}</p>
            <p className="mt-2 text-xs text-[var(--k-muted)]">Capacity {resource.capacity}</p>
          </div>

          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--k-muted)]">Availability</p>
            <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-[var(--k-text)]"><CalendarClock className="size-3.5 text-[var(--k-accent)]" />{nextAvailability(resource)}</p>
            <p className="mt-2 text-xs leading-5 text-[var(--k-muted)]">Published capacity remains subject to the governed request path.</p>
          </div>

          <div className="lg:text-right">
            <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--k-muted)]">Terms / rate</p>
            <strong className="mt-2 block text-base tabular-nums text-[var(--k-text)]">{money(resource)}</strong>
            <Link className="mt-3 inline-flex min-h-11 items-center gap-2 text-xs font-extrabold text-[var(--k-accent)] underline decoration-[var(--k-accent)]/45 underline-offset-4" href={`/grid/resource/${resource.id}`}>View details <ArrowRight className="size-3.5" /></Link>
          </div>
        </article>)}
      </div>}
    </div>
  </section>;
}
