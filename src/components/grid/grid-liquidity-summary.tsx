import { CircleCheckBig, Handshake, SearchCheck, UsersRound } from "lucide-react";
import type { GridLiquidityMetrics } from "@/lib/grid/liquidity-metrics";

function percent(value: number | null) {
  return value == null ? "—" : `${Math.round(value * 100)}%`;
}

function LiquidityMetric({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof SearchCheck;
}) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-white/[.04] p-4">
      <Icon className="size-4 text-cyan-200" aria-hidden="true" />
      <p className="mt-3 text-2xl font-black tracking-[-.05em] text-white">{value}</p>
      <p className="mt-1 text-[11px] font-extrabold text-white/75">{label}</p>
      <p className="mt-2 text-[11px] leading-5 text-white/35">{detail}</p>
    </div>
  );
}

export function GridLiquiditySummary({ metrics }: { metrics: GridLiquidityMetrics }) {
  return (
    <section className="rounded-[1.7rem] border border-cyan-300/10 bg-[#070b13] p-5 sm:p-6" aria-labelledby="grid-liquidity-summary-title">
      <div className="max-w-3xl">
        <p className="text-[11px] font-black uppercase tracking-[.18em] text-cyan-200">Network health</p>
        <h2 className="mt-2 text-2xl font-black tracking-[-.04em] text-white" id="grid-liquidity-summary-title">Is Grid actually connecting needs to supply?</h2>
        <p className="mt-2 text-xs leading-6 text-white/45">These are direct conversion facts from your organization&apos;s existing needs, offers, reservations, and fulfillment records. Klinikos does not collapse them into an invented marketplace score.</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <LiquidityMetric
          icon={SearchCheck}
          label="Needs getting offers"
          value={percent(metrics.demandOfferCoverageRate)}
          detail={`${metrics.activeDemandsWithOffers} of ${metrics.activeDemands} active needs have at least one offer.`}
        />
        <LiquidityMetric
          icon={UsersRound}
          label="Still need supply"
          value={String(metrics.unsuppliedActiveDemands)}
          detail="Active needs with no offer yet. These are the clearest places to seed supply or widen discovery."
        />
        <LiquidityMetric
          icon={Handshake}
          label="Needs reaching reservations"
          value={percent(metrics.demandReservationRate)}
          detail={`${metrics.demandsWithReservations} of ${metrics.totalDemands} recorded needs have reached a reservation.`}
        />
        <LiquidityMetric
          icon={CircleCheckBig}
          label="Reservations fulfilled"
          value={percent(metrics.reservationFulfillmentRate)}
          detail={`${metrics.fulfilledReservations} of ${metrics.totalReservations} reservations are recorded as fulfilled.`}
        />
      </div>
    </section>
  );
}