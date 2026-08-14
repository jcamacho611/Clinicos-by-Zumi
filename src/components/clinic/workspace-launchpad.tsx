import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DsSurface } from "@/components/ds";
import { navigation } from "@/lib/navigation";
import { canAccessWorkspace } from "@/lib/auth/workspace-authorization";
import type { ClinicRole } from "@/lib/auth/rbac";

type LaunchItem = {
  href: string;
  label: string;
  description: string;
};

type LaunchGroup = {
  label: string;
  items: readonly LaunchItem[];
};

function canOpen(role: ClinicRole, href: string) {
  return canAccessWorkspace(role, href.slice(1));
}

const gridTools: readonly LaunchItem[] = [
  { href: "/grid/workspace", label: "Grid home", description: "See your active needs, offers, bookings, and activity." },
  { href: "/grid/browse", label: "Find opportunities & resources", description: "Search people, services, spaces, products, equipment, organizations, and available capacity." },
  { href: "/grid/resources/browse", label: "Browse available resources", description: "Explore what people and organizations are making available through Grid." },
  { href: "/grid/resources", label: "What I offer", description: "Create and manage the work, space, services, equipment, products, or capacity you can offer." },
  { href: "/grid/resources/offers", label: "Offers & bookings", description: "Review offers, terms, reservations, and confirmed deals." },
  { href: "/grid/providers", label: "Professionals", description: "Find participating healthcare professionals and available capacity." },
  { href: "/grid/services", label: "Services", description: "Find services available through the network." },
  { href: "/grid/requests", label: "My requests", description: "Track what you asked Grid to help you find or fill." },
  { href: "/grid/availability", label: "Availability", description: "Manage when you or your resources are available." },
  { href: "/grid/locations", label: "Spaces & locations", description: "See participating locations and usable space." },
  { href: "/grid/handoffs", label: "Handoffs", description: "Follow work or care moving between people and organizations." },
  { href: "/grid/transactions", label: "Transactions", description: "Track reservations, obligations, earnings, and completion." },
  { href: "/grid/payouts", label: "Earnings & payouts", description: "Review payout estimates and reconciliation status." },
  { href: "/grid/founding-network", label: "Founding network", description: "See the founding Grid network and ways to participate." },
] as const;

const networkTools: readonly LaunchItem[] = [
  { href: "/network/directory", label: "Network directory", description: "Find organizations and relationships across connected care." },
  { href: "/network/map", label: "Network map", description: "See connected-care relationships spatially." },
  { href: "/network/handoffs", label: "Care handoffs", description: "Track care moving between organizations until someone owns the next step." },
] as const;

export function WorkspaceLaunchpad({ role }: { role: ClinicRole }) {
  const groups: LaunchGroup[] = navigation
    .map((group) => ({
      label: group.label,
      items: group.items
        .filter((item) => item.href !== "/dashboard" && canOpen(role, item.href))
        .map(({ href, label, description }) => ({ href, label, description })),
    }))
    .filter((group) => group.items.length > 0);

  const detailedGroups: LaunchGroup[] = [
    ...groups,
    ...(canOpen(role, "/grid") ? [{ label: "Grid", items: gridTools }] : []),
    ...(canOpen(role, "/network") ? [{ label: "Care network", items: networkTools }] : []),
  ];

  return (
    <DsSurface className="-mx-4 bg-[var(--surface-paper)] text-[var(--text-on-paper)] sm:-mx-6 lg:-mx-8">
      <section aria-labelledby="explore-klinikos" className="mx-auto max-w-[var(--container-max)] border-y border-[var(--line-light)] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[.78fr_1.22fr] lg:gap-16">
          <div className="max-w-xl">
            <p className="text-[var(--text-on-paper-dim)] text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wider)]">More when you need it</p>
            <h2
              className="mt-4 font-semibold tracking-[var(--tracking-tight)]"
              id="explore-klinikos"
              style={{ fontSize: "var(--text-h2)", lineHeight: "var(--leading-snug)" }}
            >
              Keep the whole product available without putting it all in your face.
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-[var(--text-on-paper-dim)]">
              These deeper areas stay collapsed until you need something specific. Klinikos only includes destinations your current role can open.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {detailedGroups.map((group) => (
              <details className="group border border-[var(--line-light)] bg-[var(--surface-paper-2)]" key={group.label}>
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 marker:hidden">
                  <span className="text-sm font-semibold">{group.label}</span>
                  <span className="text-[var(--text-on-paper-dim)] text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)]">{group.items.length} options</span>
                </summary>
                <div className="divide-y divide-[var(--line-light)] border-t border-[var(--line-light)] px-5 pb-2">
                  {group.items.map((item) => (
                    <Link className="group/item flex min-h-16 items-start gap-4 py-4" href={item.href} key={item.href}>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold transition-opacity group-hover/item:opacity-80">{item.label}</span>
                        <span className="mt-1.5 block text-[var(--text-on-paper-dim)] text-xs leading-5">{item.description}</span>
                      </span>
                      <ArrowUpRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--accent-signal)] transition-transform group-hover/item:-translate-y-0.5 group-hover/item:translate-x-0.5" />
                    </Link>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </DsSurface>
  );
}
