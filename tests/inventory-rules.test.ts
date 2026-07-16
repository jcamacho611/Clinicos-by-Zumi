import { describe, expect, it } from "vitest";
import { createInventoryItemSchema, inventoryTransactionDelta, recordInventoryTransactionSchema } from "@/lib/inventory-rules";

describe("inventory and supply rules", () => {
  it("requires lot-aware catalog values and nonnegative balances", () => {
    expect(() => createInventoryItemSchema.parse({ sku: "A", name: "x", category: "x", quantityOnHand: -1, quantityReserved: 0 })).toThrow();
    expect(createInventoryItemSchema.parse({ sku: "DEMO-1", name: "Demo supply", category: "clinical", quantityOnHand: 4, quantityReserved: 1, controlledItem: true, coldChain: false }).controlledItem).toBe(true);
  });

  it("keeps transaction deltas explicit by custody type", () => {
    expect(inventoryTransactionDelta("receipt", 4)).toBe(4);
    expect(inventoryTransactionDelta("procedure_use", 2)).toBe(-2);
    expect(inventoryTransactionDelta("adjustment", 3, "decrease")).toBe(-3);
    expect(inventoryTransactionDelta("transfer", 3)).toBe(0);
  });

  it("requires notes and destination controls for governed transactions", () => {
    expect(() => recordInventoryTransactionSchema.parse({ inventoryItemId: "item-1", type: "receipt", quantity: 1, note: "short" })).toThrow();
    expect(recordInventoryTransactionSchema.parse({ inventoryItemId: "item-1", type: "transfer", quantity: 1, toLocationId: "loc-2", note: "Moved with receiving location confirmation." }).type).toBe("transfer");
  });
});
