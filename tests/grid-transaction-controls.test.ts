import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The Grid transaction surface tells the truth about what it did and who owes whom.
 *
 * Every defect guarded here was invisible until the Grid held data. The transaction
 * chain is fully implemented and the MVP journey proves it end to end, but the journey
 * deletes its own organizations when it finishes, so no demo organization had ever held
 * a Grid record and the populated surface had never been looked at. All three of these
 * were found in the first minute of looking at it with rows in it.
 */

const source = fs.readFileSync(
  path.join(process.cwd(), "src/components/grid/grid-transaction-command.tsx"),
  "utf8",
);

describe("grid transaction controls", () => {
  it("does not offer to reserve an offer that is already reserved", () => {
    // Clicking "Reserve capacity" on an already-reserved offer returned 201 — the API is
    // idempotent and hands back the existing reservation, so no double booking was ever
    // possible — and the surface then reported "Grid recorded the action." in green for
    // an action that changed nothing. A control must not claim an effect it did not have.
    expect(source).toContain("reservedOfferIds");
    expect(source).toMatch(/reservedOfferIds\.has\(offer\.id\)\s*\?/);
  });

  it("keeps the reserve control for an accepted offer that has no reservation yet", () => {
    // The fix must gate the dead case without removing the live one.
    expect(source).toContain("Reserve capacity");
    expect(source).toContain("reserveOffer(offer.id)");
  });

  it("names the in-flight metric for what it counts", () => {
    // The card rendered `awaitingFulfillment` under the word "Fulfillment", so a clinic
    // with a fulfilled reservation on the same screen was shown "Fulfillment 0".
    expect(source).toContain('labelText="Awaiting fulfillment"');
    expect(source).not.toMatch(/labelText="Fulfillment"/);
  });

  it("distinguishes money owed to you from money you owe", () => {
    // Obligations were all painted in the earnings colour, so a buying organization saw
    // what it owed rendered exactly like income.
    expect(source).toContain('line.beneficiaryReference === board.organizationId');
    expect(source).toContain("You owe");
    expect(source).toContain("To you");
  });
});
