import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, CircleAlert, ClipboardList, GraduationCap, Network, Stethoscope } from "lucide-react";
import { Badge, DsSurface } from "@/components/ds";
import type { HomeOperatingRail, RailDestination } from "@/lib/home/operating-rail";

function iconFor(destination: RailDestination) {
  if (destination.key === "grid") return BriefcaseBusiness;
  if (destination.key === "edu") return GraduationCap;
  if (destination.key === "network") return Network;
  if (destination.key === "work") return ClipboardList;
  return Stethoscope;
}

export function HomeOperatingRailPanel({ rail }: { rail: HomeOperatingRail }) {
  return (
    <DsSurface className="-mx-4 border-y border-[var(--line-dark)] bg-[var(--surface-primary)] text-[var(--text-primary)] sm:-mx-6 lg:-mx-8">
      <section className="mx-auto max-w-[var(--container-max)] px-5 py-10 sm:px-8 lg:px-12" aria-labelledby="operating-rail-title">
        <div className="grid gap-8 lg:grid-cols-[.78fr_1.22fr] lg:items-start lg:gap-16">
          <div>
            <p className="text-[var(--text-secondary)] text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)]">Live operating rail</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[var(--tracking-tight)]" id="operating-rail-title">Only what your role can actually open.</h2>
            <p className="mt-4 max-w-lg text-xs leading-6 text-[var(--text-secondary)]">Counts appear only when Klinikos counted persisted work. A missing count is not converted into a fake zero or estimate.</p>

            {rail.opportunity ? (
              <div className="mt-7 border-l-2 border-[var(--accent-signal)] pl-5">
                <div className="flex items-center gap-2">
                  <CircleAlert className="size-4 text-[var(--accent-signal)]" />
                  <Badge tone="analyzing">Real action waiting</Badge>
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-[var(--tracking-tight)]">{rail.opportunity.title}</h3>
                <p className="mt-3 text-xs leading-6 text-[var(--text-secondary)]">{rail.opportunity.body}</p>
                <p className="mt-3 text-[var(--text-micro)] leading-5 text-[var(--text-secondary)]">{rail.opportunity.evidence}</p>
                <Link className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[var(--accent-intelligence)]" href={rail.opportunity.href}>
                  {rail.opportunity.action} <ArrowUpRight className="size-3.5" />
                </Link>
              </div>
            ) : (
              <div className="mt-7 border-y border-[var(--line-dark)] py-5">
                <p className="text-sm font-semibold">No additional counted action is waiting in this rail.</p>
                <p className="mt-2 text-xs leading-6 text-[var(--text-secondary)]">Klinikos leaves the space quiet instead of inventing an opportunity.</p>
              </div>
            )}
          </div>

          <div className={`divide-y divide-[var(--line-dark)] border-y border-[var(--line-dark)] ${rail.destinations.length >= 3 ? "lg:grid lg:grid-cols-3 lg:divide-x lg:divide-y-0" : "sm:grid sm:grid-cols-2 sm:divide-x sm:divide-y-0"}`}>
            {rail.destinations.map((destination) => {
              const Icon = iconFor(destination);
              const liveLabel = destination.live
                ? `${destination.live.count} ${destination.live.count === 1 ? destination.live.singular : destination.live.noun}`
                : null;
              return (
                <Link className="group flex min-h-32 items-start gap-4 py-6 sm:px-6 sm:first:pl-0 sm:last:pr-0" href={destination.href} key={destination.key}>
                  <Icon className="mt-1 size-5 shrink-0 text-[var(--accent-signal)]" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{destination.label}</span>
                    <span className="mt-2 block text-xs leading-5 text-[var(--text-secondary)]">{destination.description}</span>
                    {liveLabel ? <span className="mt-4 inline-flex text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--accent-intelligence)]">{liveLabel}</span> : null}
                  </span>
                  <ArrowUpRight className="mt-1 size-4 shrink-0 text-[var(--text-secondary)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </DsSurface>
  );
}
