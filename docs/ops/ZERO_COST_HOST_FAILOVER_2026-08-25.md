# Klinikos Zero-Cost Host Failover Runbook — 2026-08-25

## Purpose

Restore current Klinikos `main` to a production-capable host without paying for additional Render or GitHub Actions build minutes, without discarding any merged work, and without moving or mutating production data as part of the hosting cutover.

## Incident truth

- The existing Render service remains the current rollback/reference host.
- Render is receiving commits but cannot start new builds because the account exhausted included build-pipeline minutes and the additional pipeline spend limit is `$0.00`.
- GitHub Actions is not a usable substitute while the private repository receives no runner (`runner_id: 0`, zero steps).
- The repository contains the intended product work. The incident is a deployment-compute blockage, not a reason to reset or reconstruct `main`.
- Vercel is the zero-cost failover target because Klinikos is a Next.js application and the repository can use Vercel's native Next.js build/runtime path.

## Hard boundaries

1. **Neon remains the production database.** Do not create a replacement database for this incident.
2. The Vercel build **never runs production migrations**. It runs the ordinary `npm run build` application build only.
3. Do not run `prisma db push`.
4. Do not infer or enable integrations, legal gates, PHI flags, payment rails, or other production capabilities merely because a new host exists.
5. Do not delete, reset, force-push, squash away, or selectively recreate the existing `main` history.
6. Do not attach `klinikos.io` until the preview deployment proves the exact intended release and passes smoke tests.

## Stage 1 — Create the Vercel project

Use a free Vercel Hobby workspace and import the existing GitHub repository:

`jcamacho611/Clinicos-by-Zumi`

Use the repository as-is. Do not create a generated copy or second Klinikos codebase.

Vercel should detect Next.js. The repository-level `vercel.json` is the deployment contract:

- framework: Next.js
- build command: `npm run build`
- no Render-specific build command
- no production migration command

## Stage 2 — Transfer only required runtime environment

Start with the minimum core runtime values already authoritative in the current production environment:

- `DATABASE_URL`
- `DIRECT_DATABASE_URL` where the server requires the direct Neon connection
- `AUTH_SECRET`
- `NEXT_PUBLIC_APP_URL`

For preview validation, set `NEXT_PUBLIC_APP_URL` to the actual Vercel preview/candidate URL if the application requires its canonical URL at build/runtime. Do not set it to `https://klinikos.io` until the custom-domain cutover is actually being prepared.

### Capability-specific credentials

Copy a provider credential only when that provider/capability is already approved and authoritative in production. Examples can include Stripe, Resend, Twilio, AI-provider credentials, maps/geocoding, object storage, healthcare transaction adapters, and telemedicine.

**Do not copy blank or unverified capability flags as `true`.**

Use only **production-approved credentials** and current authoritative configuration. Missing optional credentials must preserve truthful pending/unavailable behavior.

Never invent or infer:

- `ZUMI_PHI_EGRESS_APPROVED`
- legal execution/enforcement values
- backup verification timestamps
- recurring billing activation
- live integration status
- credentials or API secrets

## Stage 3 — Database boundary

The Vercel deployment is an application-host failover only.

- Neon remains the production database.
- The Vercel build never runs production migrations.
- `postinstall` on a non-Render host generates the Prisma client only.
- `npm run build` captures release identity, generates Prisma, and builds Next.js.
- Future schema changes continue through the reviewed production migration process. Hosting convenience does not weaken migration authority.

Before preview traffic is treated as valid, confirm current `main` is compatible with the already-verified production schema.

## Stage 4 — Deploy preview from current main

Deploy the exact current `main` commit.

Do not use an old release branch or a cherry-picked subset of the product history.

Record:

- exact current `main` SHA
- Vercel deployment ID/URL
- deployment timestamp
- build result

## Stage 5 — Prove release identity

Request:

`/api/health`

The response must report:

- `status: "ok"`
- `service: "klinikos"`
- `release.commit` equal to the **exact current `main` SHA**
- `databaseConfigured: true` when the production Neon connection is intentionally configured

A healthy page with the wrong SHA is still a failed release.

## Stage 6 — Smoke-test the replacement

Before domain cutover, verify the routes that are actually available in the intended environment. At minimum:

1. `/`
2. `/api/health`
3. `/login`
4. Living Home / dashboard entry
5. Grid browse/discovery
6. EDU public/institutional entry surfaces
7. patient portal entry
8. provider workspace entry
9. Current Visit path using a valid authorized context when available
10. billing/front-desk paths using valid authorized contexts when available

For each route verify:

- no 5xx
- no infinite redirect
- no broken static assets
- no obvious hydration/runtime failure
- authorization remains fail-closed
- unavailable integrations remain truthful

Do not manufacture data merely to make a smoke test look successful.

## Stage 7 — Review runtime errors

Inspect Vercel runtime/build logs after the smoke pass.

Any material error involving authentication, database connectivity, tenant isolation, payment evidence, clinical data, or repeated 5xx responses blocks domain cutover.

Warnings that reflect intentionally unavailable external providers should remain truthfully classified and should not be converted into fake production-live state.

## Stage 8 — Custom-domain cutover

Only after Stages 4–7 pass:

1. Set the canonical production URL to `https://klinikos.io` where required.
2. Redeploy if the canonical URL is consumed at build time.
3. Attach `klinikos.io` to the verified Vercel project.
4. Apply the DNS instructions Vercel provides through the current domain/DNS provider.
5. Do not remove the old Render service during this change.

## Stage 9 — Verify the actual public production domain

On `https://klinikos.io`, re-run:

- `/api/health`
- homepage
- login/auth round trip
- representative public Grid/EDU routes
- representative authorized application route

Verify:

- HTTPS certificate valid
- canonical domain correct
- cookies/session behavior correct
- no cross-domain auth redirect loop
- assets load from the expected host
- `/api/health` still reports the exact release SHA that was approved

Only then mark the release `DEPLOYED`.

## Rollback

During stabilization, keep the prior Render service intact.

If the Vercel custom-domain deployment causes a material regression:

1. Stop new cutover changes.
2. Preserve Neon data as-is.
3. Restore domain routing to the last known healthy production host if that host remains viable.
4. Record the Vercel release SHA and failure evidence.
5. Fix forward in a branch and repeat preview proof before another cutover.

Do not roll back the database merely because the application host changed unless a separately reviewed database recovery procedure requires it.

## Permanent anti-drift rule

**Merged does not equal deployed.**

Every production release check must compare:

- intended/current `main` SHA
- actual production `/api/health` SHA
- host
- deployment status
- last successful deployment timestamp

If the SHAs differ, production is `STALE` or `BLOCKED`; it is never silently treated as current.

A provider billing limit, build-minute exhaustion, missing runner, migration gate, or host failure is a release incident and must be surfaced immediately rather than allowing hundreds of commits to accumulate unnoticed.

## Completion evidence

Zero-cost failover is complete only when:

- Vercel builds the existing repository successfully
- no production migration command ran in the Vercel build
- `/api/health` reports the exact approved `main` SHA
- production Neon remains intact
- smoke tests pass
- runtime error review passes
- `klinikos.io` serves the verified release over HTTPS
- the old Render service is retained until the replacement is stable
