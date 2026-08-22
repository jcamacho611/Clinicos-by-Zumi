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

    // Tamper at the byte level, not the character level. The token is one base64url blob
    // of iv + tag + ciphertext, and depending on how the final byte aligns, several
    // different last characters decode to identical bytes — so flipping the last
    // character sometimes produced a token that decoded the same and still verified.
    // That is why this test failed intermittently rather than never: the alignment
    // changes with every freshly generated token.
    const bytes = Buffer.from(token, "base64url");
    bytes[bytes.length - 1] ^= 0xff;
    expect(openLuxeAcquisitionJourney(bytes.toString("base64url"), now + 60_000)).toBeNull();

    // And a flipped byte in the IV, so neither end of the envelope is trusted.
    const ivTampered = Buffer.from(token, "base64url");
    ivTampered[0] ^= 0xff;
    expect(openLuxeAcquisitionJourney(ivTampered.toString("base64url"), now + 60_000)).toBeNull();
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
