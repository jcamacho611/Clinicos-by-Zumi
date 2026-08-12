# Klinikos Supabase Workspace

This directory is reserved exclusively for Klinikos.

## Isolation rule

Never link this directory to an LWA Supabase organization, project, branch, database, Storage bucket, Edge Function, or secret set. The eventual remote project must live inside a Klinikos-specific Supabase organization.

## Ownership model

Prisma remains the application schema owner during the initial Supabase adoption. Supabase is introduced as a Klinikos platform layer for hosted PostgreSQL, Realtime, Storage, and Edge Functions where they add value. Do not create duplicate patient, Grid, billing, or clinical schemas simply to mirror Prisma.

Supabase-specific migrations should be limited to platform features that Prisma does not own, such as RLS policies for exposed Data API objects, Storage policies, Realtime publication configuration, helper views/functions where justified, and Supabase-native operational infrastructure.

## Production data boundary

Until production security, contractual, BAA, risk-analysis, access-control, audit, retention, backup, and incident-response gates are approved:

- use synthetic data only;
- do not store PHI or patient identifiers in Supabase Storage or exposed tables;
- do not enable anonymous access to healthcare data;
- do not expose service-role or secret keys to the browser;
- keep privileged Edge Functions JWT-protected unless a separately reviewed webhook/auth design requires otherwise.

## Remote naming

Recommended organization: `Klinikos`

Recommended production project: `klinikos-core`

Recommended development project/branch naming: `klinikos-dev`, `klinikos-staging`, or Supabase development branches attached only to the Klinikos production project.

## Local workflow

The checked-in `supabase/config.toml` identifies the local project as `klinikos`. Supabase CLI local state under `.temp` and `.branches` must remain untracked.

The local Supabase stack is development-only. It must never be exposed as production infrastructure.

## Remote activation checklist

1. Create a Supabase organization named `Klinikos`.
2. Create `klinikos-core` in an approved US region.
3. Link only this repo's `supabase/` workspace to that project.
4. Configure environment variables through deployment secret management, never source control.
5. Run security and performance advisors before production use.
6. Preserve Prisma migration ownership unless an explicit schema-ownership migration is approved.
7. Add RLS to every table exposed through the Supabase Data API and test both positive and negative authorization cases.
8. Create separate Storage buckets by data class and apply least-privilege policies before uploads are enabled.
9. Enable Realtime only for explicit tables/events that need it.
10. Keep all demonstrations synthetic until production-readiness gates are satisfied.
