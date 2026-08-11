/**
 * First-party visitor identity.
 *
 * A pseudonymous id in an httpOnly cookie, used to stitch a person's browsing to
 * their enquiry once they identify themselves, and to hold a referral click until a
 * prospect exists.
 *
 * What it is not: a cross-site identifier, an advertising id, or anything shared with
 * a third party. It identifies a browser to Klinikos and to nothing else, it is
 * httpOnly so page scripts cannot read it, and it carries no personal data itself.
 */

export const VISITOR_COOKIE = "klinikos_visitor";

/** 180 days. Long enough to span a considered software purchase, not indefinite. */
export const VISITOR_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

/**
 * Read the visitor id from a request.
 *
 * Returns null rather than minting one: creating an identifier is a side effect, and
 * a read helper that quietly assigns identity is how tracking spreads to pages that
 * never intended it.
 */
export function readVisitorId(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;

  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === VISITOR_COOKIE) {
      const value = rest.join("=").trim();
      return isVisitorId(value) ? value : null;
    }
  }
  return null;
}

/** Only a UUID is accepted, so a crafted cookie cannot become an injection vector. */
export function isVisitorId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export const VISITOR_COOKIE_NOTICE =
  "Klinikos sets one first-party cookie to recognise your browser across visits to this site. It is not shared with advertising networks and is not used to identify you anywhere else.";
