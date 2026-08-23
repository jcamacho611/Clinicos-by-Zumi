export interface GridLiquidityDemand {
  readonly id: string;
  readonly status: string;
}

export interface GridLiquidityOffer {
  readonly id: string;
  readonly demandId: string;
  readonly status: string;
}

export interface GridLiquidityReservation {
  readonly id: string;
  readonly demandId: string;
  readonly offerId: string;
  readonly fulfillmentStatus: string;
}

export interface GridLiquidityMetrics {
  readonly totalDemands: number;
  readonly activeDemands: number;
  readonly demandsWithOffers: number;
  readonly activeDemandsWithOffers: number;
  readonly unsuppliedActiveDemands: number;
  readonly demandsWithReservations: number;
  readonly totalOffers: number;
  readonly totalReservations: number;
  readonly fulfilledReservations: number;
  readonly demandOfferCoverageRate: number | null;
  readonly demandReservationRate: number | null;
  readonly offerToReservationRate: number | null;
  readonly reservationFulfillmentRate: number | null;
}

const terminalDemandStatuses = new Set(["fulfilled", "cancelled", "expired"]);

function rate(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : null;
}

export function computeGridLiquidityMetrics(input: {
  demands: readonly GridLiquidityDemand[];
  offers: readonly GridLiquidityOffer[];
  reservations: readonly GridLiquidityReservation[];
}): GridLiquidityMetrics {
  const activeDemands = input.demands.filter((demand) => !terminalDemandStatuses.has(demand.status));
  const demandIdsWithOffers = new Set(input.offers.map((offer) => offer.demandId));
  const demandIdsWithReservations = new Set(input.reservations.map((reservation) => reservation.demandId));
  const demandsWithOffers = input.demands.filter((demand) => demandIdsWithOffers.has(demand.id)).length;
  const activeDemandsWithOffers = activeDemands.filter((demand) => demandIdsWithOffers.has(demand.id)).length;
  const demandsWithReservations = input.demands.filter((demand) => demandIdsWithReservations.has(demand.id)).length;
  const fulfilledReservations = input.reservations.filter((reservation) => reservation.fulfillmentStatus === "fulfilled").length;

  return {
    totalDemands: input.demands.length,
    activeDemands: activeDemands.length,
    demandsWithOffers,
    activeDemandsWithOffers,
    unsuppliedActiveDemands: activeDemands.length - activeDemandsWithOffers,
    demandsWithReservations,
    totalOffers: input.offers.length,
    totalReservations: input.reservations.length,
    fulfilledReservations,
    demandOfferCoverageRate: rate(activeDemandsWithOffers, activeDemands.length),
    demandReservationRate: rate(demandsWithReservations, input.demands.length),
    offerToReservationRate: rate(input.reservations.length, input.offers.length),
    reservationFulfillmentRate: rate(fulfilledReservations, input.reservations.length),
  };
}