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
        <p className="mt-2 text-xs leading-6 text-white/45">These are direct conversion facts from the transaction-board records loaded for your organization. Klinikos does not collapse them into an invented marketplace score.</p>
        {!metrics.sourceWindowComplete ? (
          <p className="mt-3 rounded-xl border border-amber-300/15 bg-amber-300/[.05] px-3 py-2 text-[11px] leading-5 text-amber-100/75">
            This is a bounded transaction-board window because at least one source reached its display cap. Treat supply-gap and conversion values as directional for the loaded window, not exhaustive marketplace totals.
          </p>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <LiquidityMetric
          icon={SearchCheck}
          label="Needs getting offers"
          value={percent(metrics.demandOfferCoverageRate)}
          detail={`${metrics.activeDemandsWithOffers} of ${metrics.activeDemands} loaded active needs have at least one loaded offer.`}
        />
        <LiquidityMetric
          icon={UsersRound}
          label="Still need supply"
          value={String(metrics.unsuppliedActiveDemands)}
          detail={metrics.sourceWindowComplete ? "Active needs with no offer yet. These are the clearest places to seed supply or widen discovery." : "Loaded active needs with no loaded offer. Review the full marketplace before treating these as confirmed supply gaps."}
        />
        <LiquidityMetric
          icon={Handshake}
          label="Needs reaching reservations"
          value={percent(metrics.demandReservationRate)}
          detail={`${metrics.demandsWithReservations} of ${metrics.totalDemands} loaded needs have reached a loaded reservation.`}
        />
        <LiquidityMetric
          icon={CircleCheckBig}
          label="Reservations fulfilled"
          value={percent(metrics.reservationFulfillmentRate)}
          detail={`${metrics.fulfilledReservations} of ${metrics.totalReservations} loaded reservations are recorded as fulfilled.`}
        />
      </div>
    </section>
  );
}
