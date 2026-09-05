import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  reservationFindUnique: vi.fn(),
  reservationUpdate: vi.fn(),
  eventCreate: vi.fn(),
  auditCreate: vi.fn(),
}));

vi.mock("@/lib/db", () => {
  const tx = {
    $queryRaw: mocks.queryRaw,
    demoReservation: {
      findUnique: mocks.reservationFindUnique,
      update: mocks.reservationUpdate,
    },
    demoReservationEvent: {
      create: mocks.eventCreate,
    },
    auditLog: {
      create: mocks.auditCreate,
    },
  };

  return {
    db: {
      $transaction: <T>(callback: (client: typeof tx) => Promise<T>) => callback(tx),
    },
  };
});

import { reconcileVerifiedAnalysisPayment } from "@/lib/commercial/sales-payment-fulfillment";

const link = {
  id: "checkout-ready-event-1",
  reservationId: "reservation-1",
  salesOwnerOrganizationId: "org-sales",
};

const reservation = {
  id: "reservation-1",
  salesOwnerOrganizationId: "org-sales",
  selectedOffer: "private_workflow_demo",
  priceCents: 50_000,
  status: "inquiry",
  paymentStatus: "pending",
};

const payment = {
  checkoutIntentId: "intent-analysis-1",
  organizationId: "org-sales",
  paymentEventId: "payment-event-1",
  provider: "stripe",
  amountCents: 50_000,
};

function primeExactReservation(overrides: Partial<typeof reservation> = {}) {
  mocks.queryRaw.mockResolvedValueOnce([link]);
  mocks.reservationFindUnique.mockResolvedValue({ ...reservation, ...overrides });
}

describe("Clinic Operating Analysis payment reconciliation", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.eventCreate.mockResolvedValue({ id: "event-created" });
    mocks.auditCreate.mockResolvedValue({ id: "audit-created" });
  });

  it("advances the exact verified $500 Analysis reservation through the allowed sales states", async () => {
    primeExactReservation();
    mocks.queryRaw.mockResolvedValueOnce([]);
    mocks.reservationUpdate.mockResolvedValue({
      id: "reservation-1",
      status: "reserved",
      paymentStatus: "payment_recorded",
    });

    const result = await reconcileVerifiedAnalysisPayment(payment);

    expect(result).toEqual({
      status: "reserved",
      reservationId: "reservation-1",
      reservationStatus: "reserved",
    });
    expect(mocks.reservationUpdate).toHaveBeenCalledWith({
      where: { id: "reservation-1" },
      data: { paymentStatus: "payment_recorded", status: "reserved" },
      select: { id: true, status: true, paymentStatus: true },
    });
    expect(mocks.eventCreate).toHaveBeenCalledTimes(2);
    expect(mocks.eventCreate.mock.calls[0]?.[0]).toMatchObject({
      data: {
        eventType: "payment_verified_qualification",
        fromStatus: "inquiry",
        toStatus: "qualified",
      },
    });
    expect(mocks.eventCreate.mock.calls[1]?.[0]).toMatchObject({
      data: {
        eventType: "processor_payment_verified",
        fromStatus: "qualified",
        toStatus: "reserved",
        metadata: {
          checkoutIntentId: "intent-analysis-1",
          amountCents: 50_000,
          processorVerified: true,
          transitionPath: ["inquiry", "qualified", "reserved"],
        },
      },
    });
    expect(mocks.auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "sales.analysis_payment_fulfillment_reconciled",
          resourceId: "reservation-1",
        }),
      }),
    );
  });

  it("fails closed when the processor amount does not equal the server-owned offer amount", async () => {
    primeExactReservation();

    const result = await reconcileVerifiedAnalysisPayment({ ...payment, amountCents: 49_999 });

    expect(result).toEqual({
      status: "reconciliation_required",
      reservationId: "reservation-1",
    });
    expect(mocks.reservationUpdate).not.toHaveBeenCalled();
    expect(mocks.eventCreate).not.toHaveBeenCalled();
    expect(mocks.auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "sales.analysis_payment_reconciliation_required",
          metadata: expect.objectContaining({
            reason: "reservation_scope_offer_or_amount_mismatch",
            observedAmountCents: 49_999,
          }),
        }),
      }),
    );
  });

  it.each([
    ["zero", []],
    ["multiple", [link, { ...link, id: "checkout-ready-event-2" }]],
  ])("fails closed when checkout-ready evidence is %s instead of unique", async (_label, rows) => {
    mocks.queryRaw.mockResolvedValueOnce(rows);

    const result = await reconcileVerifiedAnalysisPayment(payment);

    expect(result).toEqual({ status: "reconciliation_required" });
    expect(mocks.reservationFindUnique).not.toHaveBeenCalled();
    expect(mocks.reservationUpdate).not.toHaveBeenCalled();
    expect(mocks.auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "sales.analysis_payment_reconciliation_required",
        }),
      }),
    );
  });

  it("is idempotent when the same checkout already has processor-payment evidence", async () => {
    primeExactReservation({ status: "reserved", paymentStatus: "payment_recorded" });
    mocks.queryRaw.mockResolvedValueOnce([{ id: "prior-payment-evidence" }]);

    const result = await reconcileVerifiedAnalysisPayment(payment);

    expect(result).toEqual({
      status: "idempotent",
      reservationId: "reservation-1",
      reservationStatus: "reserved",
    });
    expect(mocks.reservationUpdate).not.toHaveBeenCalled();
    expect(mocks.eventCreate).not.toHaveBeenCalled();
  });

  it.each(["refunded", "credited_forward"])(
    "preserves the protected %s payment state and requires human reconciliation",
    async (paymentStatus) => {
      primeExactReservation({ status: "reserved", paymentStatus });
      mocks.queryRaw.mockResolvedValueOnce([]);

      const result = await reconcileVerifiedAnalysisPayment(payment);

      expect(result).toEqual({
        status: "reconciliation_required",
        reservationId: "reservation-1",
        reservationStatus: "reserved",
      });
      expect(mocks.reservationUpdate).not.toHaveBeenCalled();
      expect(mocks.eventCreate).toHaveBeenCalledOnce();
      expect(mocks.eventCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: "processor_payment_verified",
            metadata: expect.objectContaining({
              processorVerified: true,
              fulfillmentReviewRequired: true,
              preservedPaymentStatus: paymentStatus,
            }),
          }),
        }),
      );
    },
  );
});
