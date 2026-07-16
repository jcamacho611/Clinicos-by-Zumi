import { z } from "zod";

export const requestCapacitySchema = z.object({
  listingId: z.string().min(1),
  patientId: z.string().min(1),
  note: z.string().min(8).max(500),
});
