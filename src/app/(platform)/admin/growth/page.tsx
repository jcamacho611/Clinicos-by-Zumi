import { redirect } from "next/navigation";
import { can } from "@/lib/auth/rbac";
import { requireClinicSession } from "@/lib/auth/session";
import { commandSurfaces } from "@/lib/design/command-system";
import { loadFounderDashboard, PIPELINE_BASIS_NOTICE } from "@/lib/growth/founder-dashboard";

/**
 * The founder acquisition dashboard.
 *
 * Answers "who should I contact today", not "how is traffic". Gated on sales:manage,
 * because it lists named prospects with contact details and a read of how close each
 * is to buying — commercially sensitive, and not something every clinic role needs.
 */

export const dynamic = "force-dynamic";

export const metadata = { title: "Growth — Klinikos" };

export default async function GrowthDashboardPage() {
  const session = await requireClinicSession();
  if (!can(session.role, "sales", "manage")) redirect("/dashboard");

  if (!process.env.DATABASE_URL) {
    return (
      <div className="px-5 py-8 sm:px-8">
        <p className={`${commandSurfaces.panel} p-5 text-sm text-slate-300`}>
          The growth database is not configured in this environment.
        </p>
      </div>
    );
  }

  const { funnel, priority, pipelineCents, windowDays } = await loadFounderDashboard();

  const tiles = [
    { label: "Visitors", value: funnel.visitors },
    { label: "Walkthrough views", value: funnel.demoViews },
    { label: "Pricing views", value: funnel.pricingViews },
    { label: "Audit views", value: funnel.auditViews },
    { label: "Leads", value: funnel.newLeads },
    { label: "High intent", value: funnel.highIntent },
    { label: "Checkouts started", value: funnel.checkoutStarted },
    { label: "Paid", value: funnel.paid },
  ];

  return (
    <div className="px-5 py-8 sm:px-8">
      <p className={commandSurfaces.eyebrow}>Klinikos growth · last {windowDays} days</p>
      <h1 className={`${commandSurfaces.headline} mt-3 text-3xl`}>Who to contact today</h1>

      <ul className="mt-8 grid gap-px bg-white/10 sm:grid-cols-4">
        {tiles.map((tile) => (
          <li className="bg-[#05090f] p-4" key={tile.label}>
            <p className="text-[11px] font-extrabold uppercase tracking-[.12em] text-slate-500">{tile.label}</p>
            <p className="mt-2 text-3xl font-extrabold tabular-nums tracking-[-.05em] text-white">{tile.value.toLocaleString("en-US")}</p>
          </li>
        ))}
      </ul>

      <div className={`${commandSurfaces.panelReview} mt-6 p-4`}>
        <p className="text-[11px] font-extrabold uppercase tracking-[.12em] text-[#e6c55b]">Pipeline floor</p>
        <p className="mt-1.5 text-2xl font-extrabold tabular-nums tracking-[-.04em] text-white">
          ${(pipelineCents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}
        </p>
        <p className="mt-2 text-[11px] leading-5 text-slate-400">{PIPELINE_BASIS_NOTICE}</p>
      </div>

      <h2 className={`${commandSurfaces.headline} mt-12 text-xl`}>Highest-intent prospects</h2>
      <p className="mt-2 text-[13px] leading-6 text-slate-400">
        Capped at twelve. A list nobody can work in a morning is a list nobody works.
      </p>

      <div className="mt-5 overflow-x-auto border border-white/10">
        <table className="w-full min-w-[860px] text-left text-sm">
          <caption className="sr-only">Prospects ranked by buying intent</caption>
          <thead className="bg-white/[.04] text-[11px] uppercase tracking-[.1em] text-slate-400">
            <tr>
              <th className="px-4 py-3 font-extrabold" scope="col">Clinic</th>
              <th className="px-4 py-3 font-extrabold" scope="col">Contact</th>
              <th className="px-4 py-3 font-extrabold" scope="col">Recent activity</th>
              <th className="px-4 py-3 font-extrabold" scope="col">Status</th>
              <th className="px-4 py-3 text-right font-extrabold" scope="col">Score</th>
            </tr>
          </thead>
          <tbody>
            {priority.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-slate-400" colSpan={5}>
                  No prospect has reached high intent in this window.
                </td>
              </tr>
            )}
            {priority.map((prospect) => (
              <tr className="border-t border-white/10 align-top" key={prospect.id}>
                <th className="px-4 py-3 font-bold text-white" scope="row">
                  {prospect.clinicName}
                  <span className={`mt-1 block text-[11px] font-extrabold uppercase tracking-[.1em] ${prospect.band === "urgent" ? "text-rose-300" : "text-[#e6c55b]"}`}>
                    {prospect.band}
                  </span>
                </th>
                <td className="px-4 py-3 text-slate-300">
                  {prospect.contactName}
                  <span className="mt-1 block text-[12px] text-slate-500">{prospect.email}</span>
                </td>
                <td className="px-4 py-3 text-slate-400">
                  <ul className="grid gap-1">
                    {prospect.recentActivity.map((activity, index) => (
                      <li className="text-[12px] leading-5" key={`${prospect.id}-${index}`}>{activity}</li>
                    ))}
                  </ul>
                  <p className="mt-1.5 text-[11px] text-slate-500">{prospect.guidance}</p>
                </td>
                <td className="px-4 py-3 text-[12px] text-slate-400">{prospect.status.replace(/_/g, " ")}</td>
                <td className="px-4 py-3 text-right text-lg font-extrabold tabular-nums text-white">{prospect.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
