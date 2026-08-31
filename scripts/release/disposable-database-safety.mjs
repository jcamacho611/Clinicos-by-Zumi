/**
 * Proof that a database is safe to apply migrations to.
 *
 * `migrate deploy` is irreversible against a real database, so nothing may run it on the
 * strength of a flag alone. This is the check that earns the flag, and it lives here —
 * rather than inside either caller — so the release gate and the Render build cannot
 * drift into two different definitions of "disposable".
 *
 * Two independent conditions, because either one alone is bypassable:
 *
 *   1. The URL must not name a managed host. Cheap, catches the obvious mistake of
 *      pointing a verification run at production.
 *   2. The database must actually be EMPTY. This is the one that matters: a host list is
 *      never complete, and a self-hosted production database would sail past step 1. An
 *      empty public schema is positive evidence, not an absence of evidence.
 *
 * Throws on failure. Callers are expected to let it propagate and fail closed.
 */

/**
 * Hosts that indicate a managed database service. Not exhaustive — and deliberately not
 * relied upon as the only defence, which is why the emptiness check below is not optional.
 */
export const PRODUCTION_MARKERS = [
  "neon.tech", "supabase.co", "rds.amazonaws.com", "render.com", "railway.app",
  "planetscale", "azure.com", "digitalocean.com", "heroku",
];

/**
 * @param {string | undefined} url  The migration target.
 * @param {{ log?: (kind: string, message: string) => void }} [options]
 */
export async function assertDisposableDatabase(url, options = {}) {
  // Default to printing rather than swallowing: the one message this emits reports that a
  // safety check was deliberately bypassed, which must never be silent just because a
  // caller did not pass a logger.
  const log = options.log ?? ((kind, message) => console.warn(`[${kind}] ${message}`));

  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. The release gate reproduces Render against an EMPTY " +
      "disposable database and will not guess a target. Point it at a disposable database, " +
      "or run `npm run verify:code`.",
    );
  }

  if (process.env.VERIFY_ALLOW_PRODUCTION_DATABASE === "true") {
    log("info", "VERIFY_ALLOW_PRODUCTION_DATABASE=true — managed-host check bypassed by explicit request");
  } else {
    const marker = PRODUCTION_MARKERS.find((host) => url.includes(host));
    if (marker) {
      throw new Error(
        `DATABASE_URL points at ${marker}, which looks like a managed production host. ` +
        "This gate applies migrations and must never run there. " +
        "Set VERIFY_ALLOW_PRODUCTION_DATABASE=true only for a genuinely disposable target.",
      );
    }
  }

  // Note this check is NOT skipped by VERIFY_ALLOW_PRODUCTION_DATABASE. That escape hatch
  // exists for a disposable database on a managed host, not for writing to a populated one.
  const { PrismaClient } = await import("@prisma/client");
  const client = new PrismaClient({ datasources: { db: { url } } });
  try {
    const rows = await client.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS count FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name NOT LIKE '\\_prisma%'`,
    );
    const tables = Number(rows?.[0]?.count ?? 0);
    if (tables > 0) {
      throw new Error(
        `The target database already has ${tables} table(s). The migration path ` +
        "must be proven against an EMPTY database before release.",
      );
    }
  } finally {
    await client.$disconnect();
  }
}
