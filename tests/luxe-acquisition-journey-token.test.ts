import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  luxeAcquisitionJourneyEnabled,
  openLuxeAcquisitionJourney,
  sealLuxeAcquisitionJourney,
} from "@/lib/luxe-acquisition-journey-token";

const originalSecret = process.env.LUXE_MEDI_JOURNEY_SECRET;
const secret = "test-only-luxe-journey-secret-that-is-long-enough-123";

beforeEach(() => {
  process.env.LUXE_MEDI_JOURNEY_SECRET = secret;
});

afterEach(() => {
  if (originalSecret === undefined) delete process.env.LUXE_MEDI_JOURNEY_SECRET;
  else process.env.LUXE_MEDI_JOURNEY_SECRET = originalSecret;
});

describe("Luxe acquisition journey token", () => {
  it("seals the internal lead reference into an opaque token and opens it server-side", () => {
    const now = Date.parse("2026-08-18T18:30:00.000Z");
    const token = sealLuxeAcquisitionJourney("lead-example-123456", now, 600);
    expect(token).toBeTruthy();
    expect(token).not.toContain("lead-example-123456");
    expect(openLuxeAcquisitionJourney(token, now + 60_000)?.leadId).toBe("lead-example-123456");
  });

  it("rejects a tampered token rather than trusting browser state", () => {
    const now = Date.parse("2026-08-18T18:30:00.000Z");
    const token = sealLuxeAcquisitionJourney("lead-example-123456", now, 600)!;
    const last = token.at(-1) === "A" ? "B" : "A";
    expect(openLuxeAcquisitionJourney(`${token.slice(0, -1)}${last}`, now + 60_000)).toBeNull();
  });

  it("rejects an expired journey", () => {
    const now = Date.parse("2026-08-18T18:30:00.000Z");
    const token = sealLuxeAcquisitionJourney("lead-example-123456", now, 300)!;
    expect(openLuxeAcquisitionJourney(token, now + 301_000)).toBeNull();
  });

  it("disables journey issuance when a suitably long separate secret is not configured", () => {
    process.env.LUXE_MEDI_JOURNEY_SECRET = "too-short";
    expect(luxeAcquisitionJourneyEnabled()).toBe(false);
    expect(sealLuxeAcquisitionJourney("lead-example-123456")).toBeNull();
  });
});
