import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Acceptable Use Policy — Klinikos",
  description: "Rules protecting Klinikos users, systems, data, healthcare workflows, and intellectual property from misuse.",
};

const prohibited = [
  "Accessing, attempting to access, or testing accounts, tenants, organizations, patient records, systems, APIs, credentials, or data without authorization.",
  "Credential stuffing, password spraying, brute force, session theft, token replay, impersonation, phishing, social engineering, or bypassing authentication, MFA, role, tenant, payment, credential, consent, or patient-identity controls.",
  "Vulnerability scanning, penetration testing, endpoint enumeration, automated probing, exploit testing, denial-of-service activity, or security research without prior written authorization or an applicable published safe-harbor policy.",
  "Scraping, crawling, harvesting, bulk extraction, mirroring, systematic screenshot capture, browser automation, botting, rate-limit bypass, or automated collection beyond ordinary human use or standard search-engine indexing permitted by Klinikos.",
  "Reverse engineering, decompiling, disassembling, decoding, reconstructing source code, defeating technical controls, or extracting non-public product logic except to the extent applicable law expressly prohibits such a restriction.",
  "Using protected Klinikos materials, interfaces, workflows, architecture, prompts, documentation, confidential information, or datasets to build, train, benchmark, improve, market, or operate a competing or substantially similar service without written permission.",
  "Submitting malware, malicious code, destructive payloads, unauthorized scripts, or content intended to interfere with availability, integrity, confidentiality, monitoring, logging, or security controls.",
  "Uploading, disclosing, transmitting, or obtaining PHI, personal data, confidential information, copyrighted material, credentials, or other protected information without the legal right and required authorization to do so.",
  "Using public, demo, or qualification surfaces to submit real patient information when those surfaces explicitly prohibit PHI.",
  "Using Klinikos to independently diagnose, prescribe, authorize treatment, approve credentials, release records, submit consequential claims, or make other regulated high-risk decisions where licensed or authorized human review is required.",
  "Fraud, deceptive practices, false credentials, false licensure or insurance claims, billing fraud, coding manipulation, payment abuse, chargeback abuse, money laundering, sanctions evasion, or unlawful financial activity.",
  "Harassment, threats, stalking, exploitation, unlawful discrimination, trafficking, illegal services, or content or conduct that violates applicable law or the rights or safety of others.",
  "Creating accounts or listings using false identity information, sharing credentials, reselling access without permission, or misrepresenting affiliation with Klinikos, a clinic, provider, location, school, payer, regulator, or other organization.",
  "Using Klinikos in a manner that materially burdens infrastructure, interferes with another user, circumvents usage limits, or attempts to obtain functionality, entitlements, services, or payments that were not purchased or authorized.",
] as const;

export default function AcceptableUsePage() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-5xl items-center gap-4 px-5 sm:px-8">
          <Link className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-950" href="/legal/terms">
            <ArrowLeft className="size-4" aria-hidden="true" /> Website Terms
          </Link>
          <Link className="ml-auto text-sm font-extrabold" href="/">Klinikos</Link>
        </div>
      </header>

      <article className="mx-auto max-w-4xl px-5 py-14 sm:px-8">
        <p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#8a5550]">Security and platform integrity</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-[-.05em] sm:text-5xl">Acceptable Use Policy</h1>
        <p className="mt-6 max-w-3xl text-sm leading-7 text-slate-600">
          This policy applies to public and protected Klinikos surfaces in addition to the Website Terms and any role-specific agreement. It is designed to protect users, patients, clinics, providers, data, systems, and Klinikos intellectual property. If another signed agreement imposes stricter rules, the stricter applicable rule controls.
        </p>

        <section className="mt-10 rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <ShieldAlert className="size-5 text-rose-800" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-extrabold">No implied permission to test security.</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Public availability is not authorization to scan, probe, exploit, scrape, reverse engineer, or test Klinikos. Report suspected vulnerabilities using the security or contact method published on klinikos.io and stop before accessing data that is not yours.
          </p>
        </section>

        <section className="mt-10" aria-labelledby="prohibited-heading">
          <h2 className="text-2xl font-extrabold tracking-[-.035em]" id="prohibited-heading">Prohibited use</h2>
          <ol className="mt-6 space-y-4">
            {prohibited.map((item, index) => (
              <li className="grid grid-cols-[2rem_1fr] gap-3 border-t border-slate-200 pt-4 text-sm leading-7 text-slate-600" key={item}>
                <span className="font-extrabold text-slate-950">{index + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10 border-t border-slate-200 pt-8">
          <h2 className="text-xl font-extrabold">Enforcement</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Klinikos may investigate suspected misuse and, where reasonably necessary, throttle traffic, block requests, preserve security evidence, suspend or terminate access, remove content, restrict transactions, notify affected organizations, providers, payment processors, hosting providers, law enforcement, regulators, or other appropriate parties, and pursue available legal or equitable remedies. Enforcement remains subject to applicable law, contracts, privacy obligations, and the rights of affected persons.
          </p>
        </section>

        <section className="mt-8 border-t border-slate-200 pt-8">
          <h2 className="text-xl font-extrabold">Responsible reporting</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            A good-faith report should identify the affected URL or function, explain the issue, include only the minimum evidence necessary to reproduce it, and avoid patient data, credentials, destructive testing, persistence, lateral movement, or public disclosure that increases risk. A separate written authorization or published security safe-harbor policy is required before active testing.
          </p>
        </section>

        <p className="mt-10 text-xs leading-6 text-slate-500">
          Effective August 18, 2026. This policy is document-preparation assistance and should be reviewed by licensed counsel as Klinikos expands jurisdictions, marketplace activity, regulated workflows, and public security-reporting processes.
        </p>
      </article>
    </main>
  );
}
