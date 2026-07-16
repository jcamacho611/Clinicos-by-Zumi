import { z } from "zod";

export const createInventoryItemSchema = z.object({
  sku: z.string().trim().min(2).max(80),
  name: z.string().trim().min(3).max(180),
  category: z.string().trim().min(3).max(80),
  locationId: z.string().trim().min(1).optional().nullable(),
  lotNumber: z.string().trim().max(120).optional().nullable(),
  serialNumber: z.string().trim().max(120).optional().nullable(),
  expiresAt: z.string().datetime({ offset: true }).optional().nullable(),
  quantityOnHand: z.number().min(0),
  quantityReserved: z.number().min(0),
  reorderPoint: z.number().min(0).optional().nullable(),
  unitCostCents: z.number().int().min(0).optional().nullable(),
  vendor: z.string().trim().max(180).optional().nullable(),
  controlledItem: z.boolean().default(false),
  coldChain: z.boolean().default(false),
});

export const recordInventoryTransactionSchema = z.object({
  inventoryItemId: z.string().min(1),
  type: z.enum(["receipt", "adjustment", "procedure_use", "waste", "transfer", "recall", "reconciliation"]),
  quantity: z.number().positive(),
  direction: z.enum(["increase", "decrease"]).optional(),
  note: z.string().trim().min(12).max(1000),
  patientId: z.string().trim().min(1).optional().nullable(),
  toLocationId: z.string().trim().min(1).optional().nullable(),
});

export function inventoryTransactionDelta(type: string, quantity: number, direction?: string) {
  if (type === "receipt") return quantity;
  if (["procedure_use", "waste", "recall"].includes(type)) return -quantity;
  if (type === "adjustment" || type === "reconciliation") return direction === "decrease" ? -quantity : quantity;
  return 0;
}
