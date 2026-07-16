import { describe, expect, it } from "vitest";
import { requestCapacitySchema } from "@/lib/capacity-rules";

describe("capacity exchange rules", () => {
  it("requires a listing, patient, and manual confirmation note", () => {
    expect(() => requestCapacitySchema.parse({ listingId: "capacity-mri-demo", patientId: "pt-1001", note: "short" })).toThrow();
    expect(requestCapacitySchema.parse({ listingId: "capacity-mri-demo", patientId: "pt-1001", note: "Please request this slot and confirm the facility manually." }).listingId).toBe("capacity-mri-demo");
  });
});
