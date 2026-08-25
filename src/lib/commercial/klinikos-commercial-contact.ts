import "server-only";

/**
 * Where commercial enquiries go.
 *
 * This lived beside the offer catalog, which meant every Client Component that imported
 * a price or an offer name also pulled in a module-scope `process.env` read. Next
 * replaces non-public environment values with `undefined` in the browser bundle, so the
 * address did not actually escape — it silently became an empty string instead, and any
 * surface rendering it would have shown nothing while looking like it worked.
 *
 * Kept separate and `server-only` so the offer catalog stays free of environment access
 * and safe to import from anywhere. Read it on the server and pass the address down as a
 * prop, which is what the one caller already does.
 */
export const klinikosCommercialContact = {
  email: process.env.KLINIKOS_SALES_EMAIL ?? process.env.KLINIKOS_CONTACT_EMAIL ?? "",
};
