import "server-only";

import { RiskLevel } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { createInventoryItemSchema, inventoryTransactionDelta, recordInventoryTransactionSchema } from "@/lib/inventory-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

function dateOrNull(value?: string | null) { return value ? new Date(value) : null; }

export async function listInventoryWorkspace(session: ClinicSession) {
  if (!can(session.role, "inventory", "read")) throw new NetworkAccessError("Inventory access is not permitted for this role.", 403);
  const [locations, patients, items, transactions] = await Promise.all([
    db.location.findMany({ where: { organizationId: session.organizationId, status: "active" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.patient.findMany({ where: { organizationId: session.organizationId, status: "active" }, select: { id: true, firstName: true, lastName: true, mrn: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] }),
    db.inventoryItem.findMany({ where: { organizationId: session.organizationId }, include: { location: { select: { name: true } } }, orderBy: [{ status: "asc" }, { expiresAt: "asc" }, { name: "asc" }], take: 200 }),
    db.inventoryTransaction.findMany({ where: { organizationId: session.organizationId }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  const now = Date.now();
  const itemsView = items.map((item) => {
    const onHand = Number(item.quantityOnHand);
    const reserved = Number(item.quantityReserved);
    const reorderPoint = item.reorderPoint === null ? null : Number(item.reorderPoint);
    const expiresSoon = item.expiresAt ? item.expiresAt.getTime() <= now + 30 * 24 * 60 * 60 * 1000 : false;
    return { id: item.id, sku: item.sku, name: item.name, category: item.category, location: item.location?.name ?? "Unassigned", locationId: item.locationId, lotNumber: item.lotNumber, serialNumber: item.serialNumber, expiresAt: item.expiresAt?.toISOString() ?? null, quantityOnHand: onHand, quantityReserved: reserved, reorderPoint, unitCostCents: item.unitCostCents, vendor: item.vendor, controlledItem: item.controlledItem, coldChain: item.coldChain, recallStatus: item.recallStatus, status: item.status, lowStock: reorderPoint !== null && onHand - reserved <= reorderPoint, expiresSoon };
  });
  await db.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "inventory.accessed", resourceType: "inventory_workspace", resourceId: session.organizationId, metadata: { itemCount: items.length, transactionCount: transactions.length } } });
  return {
    locations,
    patients,
    items: itemsView,
    transactions: transactions.map((transaction) => ({ id: transaction.id, inventoryItemId: transaction.inventoryItemId, type: transaction.type, quantity: Number(transaction.quantity), direction: transaction.direction, note: transaction.note, patientId: transaction.patientId, status: transaction.status, createdAt: transaction.createdAt.toISOString() })),
    lowStockCount: itemsView.filter((item) => item.lowStock).length,
    expiryCount: itemsView.filter((item) => item.expiresSoon).length,
  };
}

export type InventoryWorkspace = Awaited<ReturnType<typeof listInventoryWorkspace>>;

export async function createInventoryItem(session: ClinicSession, rawInput: unknown) {
  if (!can(session.role, "inventory", "create")) throw new NetworkAccessError("Inventory creation is not permitted for this role.", 403);
  const input = createInventoryItemSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    if (input.locationId) {
      const location = await tx.location.findFirst({ where: { id: input.locationId, organizationId: session.organizationId, status: "active" } });
      if (!location) throw new NetworkAccessError("Inventory location not found for this organization.", 404);
    }
    const item = await tx.inventoryItem.create({ data: { organizationId: session.organizationId, sku: input.sku, name: input.name, category: input.category, locationId: input.locationId ?? null, lotNumber: input.lotNumber ?? null, serialNumber: input.serialNumber ?? null, expiresAt: dateOrNull(input.expiresAt), quantityOnHand: input.quantityOnHand, quantityReserved: input.quantityReserved, reorderPoint: input.reorderPoint ?? null, unitCostCents: input.unitCostCents ?? null, vendor: input.vendor ?? null, controlledItem: input.controlledItem, coldChain: input.coldChain } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "inventory.item_created", resourceType: "inventory_item", resourceId: item.id, metadata: { sku: item.sku, lotNumber: item.lotNumber, manualFallback: true } } });
    return item;
  });
}

export async function recordInventoryTransaction(session: ClinicSession, rawInput: unknown) {
  if (!can(session.role, "inventory", "update")) throw new NetworkAccessError("Inventory transactions are not permitted for this role.", 403);
  const input = recordInventoryTransactionSchema.parse(rawInput);
  if (["adjustment", "reconciliation"].includes(input.type) && !input.direction) throw new NetworkAccessError("Adjustment and reconciliation transactions require an increase or decrease direction.", 400);
  if (input.type === "transfer" && !input.toLocationId) throw new NetworkAccessError("Transfers require a destination location.", 400);
  return db.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findFirst({ where: { id: input.inventoryItemId, organizationId: session.organizationId } });
    if (!item) throw new NetworkAccessError("Inventory item not found for this organization.", 404);
    if (input.toLocationId) {
      const location = await tx.location.findFirst({ where: { id: input.toLocationId, organizationId: session.organizationId, status: "active" } });
      if (!location) throw new NetworkAccessError("Destination location not found for this organization.", 404);
    }
    if (input.patientId) {
      const patient = await tx.patient.findFirst({ where: { id: input.patientId, organizationId: session.organizationId, status: "active" } });
      if (!patient) throw new NetworkAccessError("Patient not found for this organization.", 404);
    }
    const delta = inventoryTransactionDelta(input.type, input.quantity, input.direction);
    const nextQuantity = Number(item.quantityOnHand) + delta;
    if (nextQuantity < 0) throw new NetworkAccessError("Inventory cannot go below zero; record a reconciliation or verify the quantity.", 409);
    const updated = await tx.inventoryItem.update({ where: { id: item.id }, data: { quantityOnHand: nextQuantity, locationId: input.type === "transfer" ? input.toLocationId : item.locationId, status: input.type === "recall" ? "recalled" : item.status } });
    const transaction = await tx.inventoryTransaction.create({ data: { organizationId: session.organizationId, inventoryItemId: item.id, type: input.type, quantity: input.quantity, direction: input.direction ?? null, note: input.note, patientId: input.patientId ?? null, fromLocationId: item.locationId, toLocationId: input.toLocationId ?? null, actorId: session.userId } });
    const lowStock = updated.reorderPoint !== null && Number(updated.quantityOnHand) - Number(updated.quantityReserved) <= Number(updated.reorderPoint);
    let taskId: string | null = null;
    if (lowStock) {
      const task = await tx.task.create({ data: { organizationId: session.organizationId, category: "inventory_low_stock", title: `Reorder inventory: ${updated.name}`, details: `item:${updated.id} ${input.note}`, priority: "high", riskLevel: RiskLevel.NEEDS_STAFF, dueAt: new Date(), status: "open", createdBy: session.userId } });
      taskId = task.id;
    }
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `inventory.${input.type}`, resourceType: "inventory_item", resourceId: item.id, changes: { quantityOnHand: { from: Number(item.quantityOnHand), to: nextQuantity }, status: { from: item.status, to: updated.status } }, metadata: { transactionId: transaction.id, patientId: input.patientId, taskId, manualFallback: true } } });
    return { item: updated, transaction, lowStock, taskId };
  });
}
