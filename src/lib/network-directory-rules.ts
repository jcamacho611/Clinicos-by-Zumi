import { z } from "zod";
import { networkPurposeSchema } from "@/lib/network-access-rules";

const purposes = z.array(networkPurposeSchema).min(1).max(3).refine(
  (values) => new Set(values).size === values.length,
  "Network purposes must be unique.",
);

export const createNetworkConnectionSchema = z.object({
  targetOrganizationId: z.string().min(1),
  allowedPurposes: purposes,
});

export const transitionNetworkConnectionSchema = z.object({
  action: z.enum(["approve", "suspend", "restore"]),
  reason: z.string().trim().min(8).max(500),
});

export function canManageNetworkConnections(role: string) {
  return ["clinic_owner", "administrator"].includes(role);
}

export function connectionTransition(currentStatus: string, action: "approve" | "suspend" | "restore") {
  if (action === "approve" && currentStatus === "pending") return "active";
  if (action === "suspend" && currentStatus === "active") return "suspended";
  if (action === "restore" && currentStatus === "suspended") return "active";
  return null;
}
