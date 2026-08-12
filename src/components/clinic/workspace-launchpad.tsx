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
  if (href === "/edu") return true;
  return canAccessWorkspace(role, href.slice(1));
}

const gridTools: readonly LaunchItem[] = [
  { href: "/grid/workspace", label: "Grid workspace", description: "Open your Grid overview, active needs, offers, and transaction flow." },
  { href: "/grid/browse", label: "Browse Grid", description: "Search published people, services, spaces, products, equipment, organizations, and capacity." },
  { href: "/grid/providers", label: "Grid providers", description: "Review participating professionals and provider capacity." },
  { href: "/grid/services", label: "Grid services", description: "Review services available through the exchange." },
  { href: "/grid/requests", label: "Grid requests", description: "Track requests moving through the marketplace." },
  { href: "/grid/availability", label: "Grid availability", description: "Manage availability across participating resources." },
  { href: "/grid/locations", label: "Grid locations", description: "See participating locations and usable capacity." },
  { href: "/grid/handoffs", label: "Grid handoffs", description: "Follow marketplace handoffs and ownership changes." },
  { href: "/grid/transactions", label: "Grid transactions", description: "See obligations, reservations, earnings, and fulfillment state." },
  { href: "/grid/payouts", label: "Grid payouts", description: "Review provider payout estimates and compatibility records." },
  { href: "/grid/founding-network", label: "Founding network", description: "See the founding Grid network and participation path." },
] as const;

const networkTools: readonly LaunchItem[] = [
  { href: "/network/directory", label: "Network directory", description: "Find organizations and relationships in the connected-care network." },
  { href: "/network/map", label: "Network map", description: "See connected-care relationships spatially." },
  { href: "/network/handoffs", label: "Network handoffs", description: "Track care handoffs that need ownership and closure." },
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
    ...(canOpen(role, "/grid") ? [{ label: "Grid tools", items: gridTools }] : []),
    ...(canOpen(role, "/network") ? [{ label: "Network views", items: networkTools }] : []),
  ];

  return (
    <section aria-labelledby="explore-klinikos" className="border-y border-[#0b1e3a]/12 py-10 sm:py-12">
      <div className="max-w-3xl">
        <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#1677a8]">Everything you can use</p>
        <h2 className="mt-3 text-2xl font-extrabold tracking-[-.045em] text-[#0b1e3a] sm:text-3xl" id="explore-klinikos">
          Find any Klinikos pathway from Home.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#0b1e3a]/60">
          Your role decides what appears here. Choose the outcome you need without having to understand how Klinikos is organized behind the scenes.
        </p>
      </div>

      <div className="mt-10 grid gap-x-10 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
        {detailedGroups.map((group) => (
          <div key={group.label}>
            <h3 className="border-b border-[#0b1e3a]/12 pb-3 text-[10px] font-extrabold uppercase tracking-[.18em] text-[#0b1e3a]/48">
              {group.label}
            </h3>
            <div className="divide-y divide-[#0b1e3a]/8">
              {group.items.map((item) => (
                <Link
                  className="group flex items-start gap-4 py-4"
                  href={item.href}
                  key={item.href}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-extrabold text-[#0b1e3a] transition group-hover:text-[#0f658f]">{item.label}</span>
                    <span className="mt-1.5 block text-[11px] leading-5 text-[#0b1e3a]/52">{item.description}</span>
                  </span>
                  <ArrowUpRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#0b1e3a]/28 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#1677a8]" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
