import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

function sourceFiles(root: string): string[] {
  const absolute = path.join(process.cwd(), root);
  const output: string[] = [];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const next = path.join(absolute, entry.name);
    if (entry.isDirectory()) output.push(...sourceFiles(path.relative(process.cwd(), next)));
    else if (/\.(?:ts|tsx|js|jsx)$/.test(entry.name)) output.push(next);
  }
  return output;
}

describe("public surface security hardening", () => {
  const nextConfig = read("next.config.ts");
  const platformLayout = read("src/app/(platform)/layout.tsx");
  const robots = read("src/app/robots.ts");
  const securityHeaders = read("src/lib/security/headers.ts");
  const health = read("src/app/api/health/route.ts");

  it("keeps authenticated workspaces server-gated and non-indexable", () => {
    expect(platformLayout).toContain("requireClinicSession()");
    expect(platformLayout).toContain("index: false");
    expect(platformLayout).toContain("follow: false");
  });

  it("adds no-store and noindex headers to private/API surfaces", () => {
    expect(nextConfig).toContain('source: "/api/:path*"');
    expect(nextConfig).toContain('source: "/access"');
    expect(nextConfig).toContain('source: "/login"');
    expect(nextConfig).toContain('source: "/portal/:path*"');
    expect(nextConfig).toContain('source: "/payments/:path*"');
    expect(nextConfig).toContain("PRIVATE_NO_STORE_HEADERS");
    expect(nextConfig).toContain("X-Robots-Tag");
  });

  it("keeps protected and transactional routes out of crawler discovery", () => {
    for (const route of ["/api/", "/access", "/portal/", "/private-demo", "/dashboard", "/patients", "/admin/", "/owner/", "/payments/"]) {
      expect(robots).toContain(JSON.stringify(route));
    }
  });

  it("ships baseline anti-framing, MIME, permissions, cross-origin and transport protections", () => {
    for (const header of [
      "X-Content-Type-Options",
      "X-Frame-Options",
      "Referrer-Policy",
      "Permissions-Policy",
      "Content-Security-Policy",
      "Cross-Origin-Opener-Policy",
      "Cross-Origin-Resource-Policy",
      "Strict-Transport-Security",
    ]) {
      expect(securityHeaders).toContain(header);
    }
  });

  it("keeps unauthenticated health deliberately information-poor", () => {
    expect(health).toContain('{ status: "ok" }');
    expect(health).toContain("PRIVATE_NO_STORE_HEADERS");
    for (const leakedDiagnostic of ["RENDER_GIT_COMMIT", "RENDER_GIT_BRANCH", "databaseConfigured", "liveIntegrations", "source:", "mode:"]) {
      expect(health).not.toContain(leakedDiagnostic);
    }
  });

  it("does not expose known server-secret environment variables through NEXT_PUBLIC names", () => {
    const banned = [
      "NEXT_PUBLIC_STRIPE_SECRET_KEY",
      "NEXT_PUBLIC_DATABASE_URL",
      "NEXT_PUBLIC_AUTH_SECRET",
      "NEXT_PUBLIC_SESSION_SECRET",
      "NEXT_PUBLIC_RESEND_API_KEY",
      "NEXT_PUBLIC_TWILIO_API_SECRET",
      "NEXT_PUBLIC_STEDI_API_KEY",
      "NEXT_PUBLIC_CLOUDFLARE_API_TOKEN",
      "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY",
    ];
    const joined = sourceFiles("src").map((file) => fs.readFileSync(file, "utf8")).join("\n");
    for (const name of banned) expect(joined).not.toContain(name);
  });
});

describe("public legal protection", () => {
  const terms = read("src/app/legal/terms/page.tsx");
  const privacy = read("src/app/legal/privacy/page.tsx");
  const acceptableUse = read("src/app/legal/acceptable-use/page.tsx");
  const publicZumi = read("src/components/marketing/public-living-gateway.tsx");
  const footer = read("src/components/marketing/public-trust-footer.tsx");
  const access = read("src/app/access/page.tsx");
  const accessGate = read("src/lib/legal/access-gate.ts");
  const privateDemo = read("src/app/private-demo/page.tsx");
  const trust = read("src/app/trust/page.tsx");

  it("publishes substantive website terms rather than an internal readiness-status page", () => {
    expect(terms).toContain("Agreement to these Terms");
    expect(terms).toContain("Ownership and intellectual property");
    expect(terms).toContain("Prohibited conduct");
    expect(terms).toContain("Disclaimer of warranties");
    expect(terms).toContain("Limitation of liability");
    expect(terms).toContain("Indemnification");
    expect(terms).toContain("Governing law and disputes");
    expect(terms).not.toContain("Governed legal-document status");
  });

  it("publishes an operative public privacy notice with a no-PHI boundary", () => {
    expect(privacy).toContain("Klinikos Privacy Notice");
    expect(privacy).toContain("do not submit patient information or PHI");
    expect(privacy).toContain("Information collected automatically");
    expect(privacy).toContain("Artificial intelligence");
    expect(privacy).toContain("Your choices and privacy rights");
  });

  it("publishes explicit anti-abuse and no-unauthorized-testing rules", () => {
    expect(acceptableUse).toContain("No implied permission to test security");
    expect(acceptableUse).toContain("Vulnerability scanning");
    expect(acceptableUse).toContain("Scraping");
    expect(acceptableUse).toContain("Reverse engineering");
  });

  it("puts website terms beside public interaction and purchase handoff", () => {
    expect(publicZumi).toContain('href="/legal/terms"');
    expect(publicZumi).toContain("By sending a message");
    expect(privateDemo).toContain("Submitting the reservation and continuing to payment confirms");
    expect(privateDemo).toContain("This purchase is the one-time analysis only");
    expect(footer).toContain("PUBLIC_USE_NOTICE");
  });

  it("uses affirmative protected-access clickwrap and stores website-terms evidence server-side", () => {
    expect(access).toContain("Website Terms of Use");
    expect(access).toContain("Acceptable Use Policy");
    expect(access).toContain('required type="checkbox"');
    expect(accessGate).toContain("WEBSITE_TERMS_VERSION");
    expect(accessGate).toContain("protected-access-clickwrap");
  });

  it("does not publish infrastructure vendors, CI state, or deployment configuration on the trust page", () => {
    for (const internalDetail of ["Stripe", "Twilio", "GitHub Actions", "feature gate", "webhook endpoint", "deployed application SHA"]) {
      expect(trust).not.toContain(internalDetail);
    }
    expect(trust).toContain("without publishing the security blueprint");
  });

  it("removes the dynamic public legal readiness route", () => {
    expect(fs.existsSync(path.join(process.cwd(), "src/app/legal/[document]/page.tsx"))).toBe(false);
  });
});
