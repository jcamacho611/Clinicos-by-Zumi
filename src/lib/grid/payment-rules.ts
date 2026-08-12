import { z } from "zod";

export const manualGridReservationPaymentSchema = z.object({
  externalReference: z.string().trim().min(2).max(200),
  note: z.string().trim().min(8).max(1_000),
});

export type ManualGridReservationPayment = z.infer<typeof manualGridReservationPaymentSchema>;
