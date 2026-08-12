import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
    <section aria-labelledby="explore-klinikos" className="border-y border-[#0b1e3a]/12 py-10 sm:py-12">
      <div className="max-w-3xl">
        <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#1677a8]">More when you need it</p>
        <h2 className="mt-3 text-2xl font-extrabold tracking-[-.045em] text-[#0b1e3a] sm:text-3xl" id="explore-klinikos">
          Home keeps the important work up front.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#0b1e3a]/60">
          Open a section only when you need something specific. Klinikos already filters this list to what your role can use.
        </p>
      </div>

      <div className="mt-8 grid gap-3 md:grid-cols-2">
        {detailedGroups.map((group) => (
          <details className="group rounded-2xl border border-[#0b1e3a]/9 bg-white px-5 py-1 shadow-[0_10px_30px_rgba(11,30,58,.035)]" key={group.label}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-extrabold text-[#0b1e3a] marker:hidden">
              <span>{group.label}</span>
              <span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#0b1e3a]/35">{group.items.length} options</span>
            </summary>
            <div className="divide-y divide-[#0b1e3a]/8 border-t border-[#0b1e3a]/8 pb-2">
              {group.items.map((item) => (
                <Link className="group/item flex items-start gap-4 py-4" href={item.href} key={item.href}>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-extrabold text-[#0b1e3a] transition group-hover/item:text-[#0f658f]">{item.label}</span>
                    <span className="mt-1.5 block text-[11px] leading-5 text-[#0b1e3a]/52">{item.description}</span>
                  </span>
                  <ArrowUpRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#0b1e3a]/28 transition group-hover/item:-translate-y-0.5 group-hover/item:translate-x-0.5 group-hover/item:text-[#1677a8]" />
                </Link>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
