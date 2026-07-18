import { z } from "zod";

export const portalLoginSchema = z.object({
  organization: z.string().trim().toLowerCase().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(256),
});
