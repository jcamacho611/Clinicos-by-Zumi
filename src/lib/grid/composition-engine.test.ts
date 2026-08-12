import { describe, expect, it } from "vitest";
import {
  evaluateGridComposition,
  gridCompositionTemplates,
  type GridCompositionComponent,
} from "@/lib/grid/composition-engine";

function component(slotKey: string, resourceId: string, overrides: Partial<GridCompositionComponent> = {}): GridCompositionComponent {
  return {
    slotKey,
    resourceId,
    resourceKind: slotKey,
    eligibilityVerified: true,
    authorizationVerified: true,
    availabilityVerified: true,
    evidence: [],
    ...overrides,
  };
}

describe("Grid composition engine", () => {
  it("marks a complete verified staffing shift ready for offer", () => {
    const result = evaluateGridComposition(gridCompositionTemplates.staffingShift, [
      component("organization", "org_1"),
      component("professional", "provider_1"),
      component("time", "window_1"),
    ]);

    expect(result.complete).toBe(true);
    expect(result.readyForOffer).toBe(true);
    expect(result.missingRequiredSlots).toEqual([]);
  });

  it("does not allow missing required resources to become offer-ready", () => {
    const result = evaluateGridComposition(gridCompositionTemplates.clinicalService, [
      component("professional", "provider_1"),
      component("location", "location_1"),
      component("time", "window_1"),
    ]);

    expect(result.complete).toBe(false);
    expect(result.readyForOffer).toBe(false);
    expect(result.missingRequiredSlots).toEqual(["authorization", "payment"]);
  });

  it("keeps eligibility outside structural completion", () => {
    const result = evaluateGridComposition(gridCompositionTemplates.roomRental, [
      component("participant", "participant_1", { eligibilityVerified: false }),
      component("space", "space_1"),
      component("time", "window_1"),
      component("agreement", "agreement_1"),
      component("payment", "payment_1"),
    ]);

    expect(result.complete).toBe(true);
    expect(result.readyForOffer).toBe(false);
    expect(result.ineligibleComponents).toEqual(["participant_1"]);
  });

  it("rejects unknown and overfilled slot assignments", () => {
    const result = evaluateGridComposition(gridCompositionTemplates.staffingShift, [
      component("organization", "org_1"),
      component("professional", "provider_1"),
      component("professional", "provider_2"),
      component("time", "window_1"),
      component("equipment", "equipment_1"),
    ]);

    expect(result.complete).toBe(false);
    expect(result.readyForOffer).toBe(false);
    expect(result.overfilledSlots).toEqual(["professional"]);
    expect(result.unknownSlotKeys).toEqual(["equipment"]);
  });
});
