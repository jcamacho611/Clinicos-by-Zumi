# Klinikos Zero-Cost Production Failover Design

## Problem

Klinikos production is serving an old commit while current `main` contains hundreds of intentional product, UX, clinical, Grid, EDU, Zumi, revenue, and governance commits. The existing Render service receives new commits but cannot start builds because the Render account exhausted its included build-pipeline minutes and the additional spend limit is `$0.00`. GitHub Actions cannot substitute as a build engine because the private repository currently receives no runner (`runner_id: 0`, zero steps), consistent with an exhausted or zero-spend Actions allowance.

The production-recovery design must preserve all current `main` history and must not solve the incident by resetting, discarding, rewriting, or selectively re-creating product work.

## Goal

Create a zero-cost hosting failover path that can deploy the existing Next.js application from the same GitHub repository while preserving the current Neon production database and all existing product truth boundaries. The immediate target is Vercel Hobby because the application is Next.js 15 and Vercel provides a native Next.js runtime and build path. The existing Render service remains untouched until a replacement deployment is proven healthy.

## Non-goals

- Do not rebuild Klinikos as a second product.
- Do not fork identity, Grid, Care, EDU, Zumi, financial, or clinical domains.
- Do not move production data away from Neon as part of this incident response.
- Do not run `prisma db push`.
- Do not apply production migrations from a Vercel build.
- Do not cut `klinikos.io` to a replacement host until the replacement proves the intended commit and smoke tests pass.
- Do not represent the replacement as production-live until DNS/domain evidence and live health evidence exist.

## Architecture

The failover separates application deployment from database migration authority.

```text
GitHub main
   |
   v
Vercel native Next.js build
   |
   |  npm install/postinstall -> Prisma client generation only
   |  npm run build -> capture release + prisma generate + next build
   |  NO production migration command
   v
Vercel preview deployment
   |
   +--> existing Neon production database through DATABASE_URL
   +--> existing external providers through explicitly configured environment variables
   |
   v
/api/health proves Vercel Git commit SHA
   |
   v
smoke tests /, /api/health, login, Living Home, Grid, EDU, patient/provider surfaces
   |
   v
custom-domain cutover only after proof
```

The existing Render migration policy remains authoritative for Render. Vercel is intentionally host-portable: it builds with the ordinary application build command and never invokes `render:build`.

## Deployment contract

### Build

- Install dependencies with production build dependencies available.
- `postinstall` may generate the Prisma client; it must not mutate the database when `RENDER !== "true"`.
- Build command is `npm run build`.
- Build must not execute `prisma migrate deploy`, `prisma db push`, or `npm run render:build`.

### Runtime

- Next.js runtime remains the application's runtime authority.
- Neon remains the database authority.
- External integrations remain controlled by their existing environment flags and truth registries.
- A missing optional integration must remain unavailable/pending rather than fabricated live.

### Release identity

`/api/health` must resolve release identity in this order:

1. Render host commit variables when on Render.
2. Vercel Git commit/ref variables when on Vercel.
3. generic `GIT_COMMIT_SHA`.
4. `release-identity.json` generated at build time.

The endpoint must expose only non-secret commit/ref identity.

## Environment transfer

The failover does not justify copying every `.env.example` value blindly. Required values are grouped by runtime consequence:

### Required for core runtime

- `DATABASE_URL`
- `DIRECT_DATABASE_URL` when server operations require the direct Neon connection
- `AUTH_SECRET`
- `NEXT_PUBLIC_APP_URL` set to the preview URL for preview validation, then `https://klinikos.io` only after domain cutover

### Required only if the corresponding capability is already production-approved

Examples include Stripe, Resend, Twilio, external AI providers, maps/geocoding, storage, healthcare transaction adapters, telemedicine, and other provider credentials. These values must be copied only from current approved production configuration. Missing credentials must preserve truthful unavailable/pending states.

### Never infer or invent

- PHI approval flags
- legal execution flags
- backup-verification timestamps
- live integration claims
- recurring billing activation
- credentials or secrets

## Database migration boundary

Application deployment and schema mutation remain distinct.

- Vercel build never applies production migrations.
- Any migration needed for a future release follows the existing reviewed production migration process or a separately approved provider-independent migration workflow.
- A preview may point to production only after its code is schema-compatible with the currently verified production schema.
- The incident does not relax destructive-migration controls.

## Cutover sequence

1. Prepare host-portable repository contract.
2. Create Vercel project from the existing GitHub repository on the free Hobby plan.
3. Configure only required/approved environment values.
4. Build preview from current `main`.
5. Verify `/api/health` returns the exact current GitHub SHA.
6. Smoke-test public homepage and critical authorized routes.
7. Confirm no unexpected runtime errors.
8. Attach `klinikos.io` only after preview proof.
9. Verify DNS, HTTPS, canonical URL, cookies/auth, and `/api/health` on the custom domain.
10. Keep Render as rollback/reference until the replacement is stable; do not delete it during incident recovery.

## Permanent anti-drift rule

A merge is not a deployment.

Klinikos release truth must track at minimum:

- `main` SHA
- latest production SHA
- host
- deployment timestamp
- health status
- migration status when relevant
- explicit `DEPLOYED`, `BLOCKED`, or `STALE` state

If production SHA does not match the intended release SHA, the system must surface a release incident. Product work may continue in branches, but production-facing merges should not silently accumulate without a visible stale-production signal.

## Safety and rollback

- Existing Render production remains untouched until Vercel proves healthy.
- DNS/domain cutover is the last consequential action.
- If Vercel preview fails, fix forward without changing production traffic.
- If custom-domain cutover causes a regression, restore DNS/routing to the last known healthy host while preserving database state.

## Success criteria

The failover is complete only when all are true:

1. Current intended `main` commit is deployed by the replacement host.
2. `/api/health` reports that exact commit.
3. Core public and authenticated smoke tests pass.
4. Existing Neon production data remains intact.
5. No production migration was executed by the Vercel build.
6. `klinikos.io` resolves to the verified deployment with HTTPS.
7. Release monitoring can detect future `main` versus production drift.
