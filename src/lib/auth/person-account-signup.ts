import { z } from "zod";

/**
 * Free entry: the contract shared by the signup route and the page.
 *
 * Deliberately kept free of `server-only` and of any database import so the page and
 * the route can share one definition of what free entry asks for and what it means.
 * The transactional creation lives in `person-account-repository.ts`, which is
 * server-only.
 *
 * Klinikos collects the minimum an account needs. A Social Security number is never
 * blanket signup information, and the schema strips anything it was not asked for
 * rather than carrying it into the request.
 *
 * The legal portion is intentionally bounded: the browser may affirm the exact versions
 * it was shown, but it never supplies trusted document text, hashes, or legal status.
 */
export const personAccountSignupSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  displayName: z.string().trim().min(2, "Tell us what to call you.").max(140),
  // Length is the honest lever here. A long passphrase beats a short one with a symbol
  // rule bolted on, and the credential store hashes whatever arrives.
  password: z.string().min(12, "Use at least 12 characters.").max(256),
  legalAcceptances: z.object({
    websiteTermsAccepted: z.literal(true, { error: "Agree to the Website Terms to continue." }),
    websiteTermsVersion: z.string().trim().min(1).max(100),
    privacyPolicyAcknowledged: z.literal(true, { error: "Acknowledge the Privacy Policy to continue." }),
    privacyPolicyVersion: z.string().trim().min(1).max(100),
  }),
});

export type PersonAccountSignupInput = z.infer<typeof personAccountSignupSchema>;

/**
 * What a free account is not. Shown to the person during signup and asserted in tests,
 * so no future change can quietly widen what "free" appears to mean.
 */
export const PERSON_ACCOUNT_SIGNUP_LAWS = [
  "Joining is free and takes no card.",
  "A free account is not verified — evidence is checked separately, by whoever issues it.",
  "A free account is not eligible for every opportunity; requirements are evaluated per opportunity.",
  "A free account is not authorized to see patient records or act on anyone's behalf.",
  "Your identity stays yours across roles, employers and organizations.",
] as const;
