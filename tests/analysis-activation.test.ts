import { createHmac } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { openActivationReference, sealActivationReference } from "@/lib/commercial/analysis-activation-token";

const env = { AUTH_SECRET: "activation-test-secret-not-a-real-secret" } as unknown as NodeJS.ProcessEnv;

describe("the activation reference is signed, not guessed", () => {
  it("round-trips the reservation it was sealed for", () => {
    const token = sealActivationReference("res_abc123", {}, env);
    expect(token).toBeTruthy();
    const opened = openActivationReference(token, env);
    expect(opened).toEqual({ ok: true, reservationId: "res_abc123" });
  });

  it("refuses a token whose payload was edited", () => {
    // The attack the raw id invited: point the return at somebody else's reservation.
    const token = sealActivationReference("res_abc123", {}, env)!;
    const [, signature] = token.split(".");
    const forgedBody = Buffer.from(JSON.stringify({
      v: 1, reservationId: "res_victim", issuedAt: 0, expiresAt: 4_000_000_000,
    }), "utf8").toString("base64url");
    expect(openActivationReference(`${forgedBody}.${signature}`, env)).toEqual({ ok: false, reason: "bad_signature" });
  });

  it("refuses a token signed with a different secret", () => {
    const token = sealActivationReference("res_abc123", {}, { AUTH_SECRET: "someone-elses-secret" } as unknown as NodeJS.ProcessEnv);
    expect(openActivationReference(token, env).ok).toBe(false);
  });

  it("refuses an expired token", () => {
    // Sign a genuinely past token with the same secret, so expiry is the only thing
    // wrong with it. Passing a negative TTL to the sealer would be clamped to the floor
    // and would prove nothing.
    const past = Math.floor(Date.now() / 1000) - 10;
    const body = Buffer.from(JSON.stringify({
      v: 1, reservationId: "res_abc123", issuedAt: past - 60, expiresAt: past,
    }), "utf8").toString("base64url");
    const signature = createHmac("sha256", env.AUTH_SECRET!)
      .update(`klinikos-analysis-activation:${body}`)
      .digest("base64url");

    expect(openActivationReference(`${body}.${signature}`, env)).toEqual({ ok: false, reason: "expired" });
    // And the same payload one second in the future still opens, so this is expiry and
    // not some other rejection.
    const futureBody = Buffer.from(JSON.stringify({
      v: 1, reservationId: "res_abc123", issuedAt: past, expiresAt: Math.floor(Date.now() / 1000) + 60,
    }), "utf8").toString("base64url");
    const futureSignature = createHmac("sha256", env.AUTH_SECRET!)
      .update(`klinikos-analysis-activation:${futureBody}`)
      .digest("base64url");
    expect(openActivationReference(`${futureBody}.${futureSignature}`, env).ok).toBe(true);
  });

  it("treats an absent token as missing", () => {
    expect(openActivationReference("", env)).toEqual({ ok: false, reason: "missing" });
    expect(openActivationReference(null, env)).toEqual({ ok: false, reason: "missing" });
  });

  it("refuses malformed input rather than throwing", () => {
    for (const bad of ["nonsense", "a.b", "....", "%%%.%%%"]) {
      const result = openActivationReference(bad, env);
      expect(result.ok).toBe(false);
    }
  });

  it("issues nothing when no signing secret is configured", () => {
    expect(sealActivationReference("res_abc123", {}, {} as NodeJS.ProcessEnv)).toBeNull();
    expect(openActivationReference("anything", {} as NodeJS.ProcessEnv)).toEqual({ ok: false, reason: "not_configured" });
  });
});

describe("the post-payment surface tells the truth about money", () => {
  const activation = fs.readFileSync(path.join(process.cwd(), "src/lib/commercial/analysis-activation.ts"), "utf8");
  const experience = fs.readFileSync(path.join(process.cwd(), "src/components/commercial/payment-return-experience.tsx"), "utf8");
  const route = fs.readFileSync(path.join(process.cwd(), "src/app/api/sales/reservations/route.ts"), "utf8");
  const api = fs.readFileSync(path.join(process.cwd(), "src/app/api/sales/activation/route.ts"), "utf8");

  it("derives verification from stored state, never from the browser arriving", () => {
    expect(activation).toContain("VERIFIED_PAYMENT_STATUSES");
    expect(activation).toContain("paymentVerified: VERIFIED_PAYMENT_STATUSES.has(reservation.paymentStatus)");
    // Nothing on this path may write a payment status.
    expect(activation).not.toMatch(/paymentStatus:\s*["']/);
  });

  it("still says a browser return is not payment while nothing is verified", () => {
    expect(experience).toContain("never marks an engagement paid");
    expect(experience).toContain("signed server evidence");
  });

  it("only claims the analysis is reserved when payment is actually recorded", () => {
    expect(experience).toMatch(/verified\s*\?\s*"Your Clinic Operating Analysis is reserved\."/);
  });

  it("carries a signed reference in the return URL rather than a raw reservation id", () => {
    expect(route).toContain("sealActivationReference(result.reservation.id)");
    expect(route).not.toContain("reservation=${encodeURIComponent(result.reservation.id)}");
  });

  it("lets the activation surface write clinic details and nothing consequential", () => {
    for (const forbidden of ["priceCents", "paymentStatus", "selectedOffer", "status:"]) {
      expect(activation.split("db.demoReservation.update")[1]?.split("})")[0] ?? "")
        .not.toContain(forbidden);
    }
  });

  it("rate limits an unauthenticated write and does not leak which references exist", () => {
    expect(api).toContain("checkSalesIntakeRateLimit");
    // One answer for a bad signature and for a missing reservation, so the endpoint
    // cannot be used to probe which references are real.
    expect(api).toContain("This activation link is not valid.");
    expect(api).not.toMatch(/unknown_reference[\s\S]{0,120}not_found/);
  });

  it("records a next action so a paid engagement has an owner", () => {
    expect(activation).toContain("activation_details_received");
    expect(activation).toContain("nextAction");
  });

  it("stores an unanswered question as null rather than zero", () => {
    expect(activation).toContain("Prisma.DbNull");
    const form = fs.readFileSync(path.join(process.cwd(), "src/components/commercial/analysis-activation-form.tsx"), "utf8");
    expect(form).toContain("Number.isFinite(parsed) && parsed > 0 ? parsed : null");
    // Skipping is a real outcome, not an abandoned form.
    expect(form).toContain("Skip for now");
  });

  it("keeps the page out of search results", () => {
    const page = fs.readFileSync(path.join(process.cwd(), "src/app/payments/success/page.tsx"), "utf8");
    expect(page).toContain("robots: { index: false, follow: false }");
  });
});

describe("processor verification and the activation surface are one chain", () => {
  const fulfillment = fs.readFileSync(path.join(process.cwd(), "src/lib/commercial/sales-payment-fulfillment.ts"), "utf8");
  const activation = fs.readFileSync(path.join(process.cwd(), "src/lib/commercial/analysis-activation.ts"), "utf8");

  it("shows as verified exactly the status signed processor evidence writes", () => {
    // These two files were written independently: one turns signed Stripe evidence into
    // a recorded payment, the other decides what a buyer is told. If they disagree about
    // the status string, a genuinely paid customer keeps seeing "we're confirming this"
    // forever — and nothing else in the suite would notice.
    const written = [...fulfillment.matchAll(/paymentStatus:\s*"([a-z_]+)"/g)].map((match) => match[1]);
    expect(written).toContain("payment_recorded");

    const recognized = activation.match(/VERIFIED_PAYMENT_STATUSES = new Set\(\[([^\]]+)\]\)/)?.[1] ?? "";
    for (const status of new Set(written)) {
      // Only success statuses must be recognized; a preserved refund is not a payment.
      if (status === "payment_recorded") expect(recognized).toContain(`"${status}"`);
    }
  });

  it("never lets the activation surface be the thing that records payment", () => {
    expect(fulfillment).toContain('paymentStatus: "payment_recorded"');
    expect(activation).not.toContain('paymentStatus: "payment_recorded"');
  });
});
