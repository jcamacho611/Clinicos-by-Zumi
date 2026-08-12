/**
 * The canonical public URL for this deployment.
 *
 * Four call sites were each resolving this differently, and two of them produced links
 * that could not be opened. Activation links became `/activate?token=…` with no host —
 * an email a provider happily accepted and a buyer could not use. The Whop checkout
 * builder dropped `redirect_url` entirely, so a buyer stayed on Whop and never reached
 * the return leg that verifies their purchase. A third hard-coded the production domain,
 * which is wrong on every preview deploy.
 *
 * The order matters. `NEXT_PUBLIC_APP_URL` is what an operator sets deliberately, so it
 * wins. `RENDER_EXTERNAL_URL` is injected by the platform and is the documented
 * fallback. Localhost is last and only useful in development — a production deployment
 * that reaches it has a configuration problem worth seeing rather than papering over.
 */
export function canonicalAppUrl(env: Record<string, string | undefined> = process.env) {
  const configured = env.NEXT_PUBLIC_APP_URL?.trim();
  const platform = env.RENDER_EXTERNAL_URL?.trim();
  return (configured || platform || "http://localhost:3000").replace(/\/+$/, "");
}

/**
 * Whether a link built from this environment can actually be opened by someone else.
 *
 * Callers that are about to send a link somewhere — an activation email, a checkout
 * redirect — use this to refuse rather than deliver something unusable. A localhost URL
 * in an email is not a link; it is a dead end that looks like one.
 */
export function canonicalAppUrlIsPublic(env: Record<string, string | undefined> = process.env) {
  const url = canonicalAppUrl(env);
  return !url.startsWith("http://localhost") && !url.startsWith("http://127.");
}
