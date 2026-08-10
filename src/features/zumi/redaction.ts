/**
 * Egress redaction.
 *
 * Anything leaving Klinikos for a model provider passes through here first. The
 * design is deliberately belt-and-braces: callers are expected to send only
 * allow-listed operational fields, and this scrubs identifier-shaped strings anyway,
 * because "the caller will remember" is not a control.
 *
 * This reduces exposure. It is not a substitute for a BAA, and the code says so
 * rather than implying redaction makes an unsigned provider safe.
 *
 * Pure module. No database, no network.
 */

export const REDACTION_PLACEHOLDER = "[REDACTED]";

type Rule = { name: string; pattern: RegExp };

/**
 * Identifier shapes, ordered most specific first so a broader rule cannot consume
 * a string a narrower rule would have labelled better.
 */
const RULES: Rule[] = [
  { name: "ssn", pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
  { name: "email", pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
  // North American phone shapes, with or without separators and country code.
  { name: "phone", pattern: /(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g },
  { name: "date_of_birth", pattern: /\b(?:0?[1-9]|1[0-2])[/-](?:0?[1-9]|[12]\d|3[01])[/-](?:19|20)\d{2}\b/g },
  { name: "mrn", pattern: /\bMRN[:\s#-]*[A-Za-z0-9-]{4,}\b/gi },
  { name: "member_id", pattern: /\b(?:member|policy|subscriber)\s*(?:id|#|number)[:\s#-]*[A-Za-z0-9-]{5,}\b/gi },
  { name: "npi", pattern: /\bNPI[:\s#-]*\d{10}\b/gi },
  { name: "card", pattern: /\b(?:\d[ -]?){13,19}\b/g },
];

export type RedactionResult = { text: string; redactions: { rule: string; count: number }[]; redactedAny: boolean };

export function redactText(input: string): RedactionResult {
  let text = input;
  const redactions: { rule: string; count: number }[] = [];

  for (const rule of RULES) {
    let count = 0;
    text = text.replace(rule.pattern, () => {
      count += 1;
      return REDACTION_PLACEHOLDER;
    });
    if (count > 0) redactions.push({ rule: rule.name, count });
  }

  return { text, redactions, redactedAny: redactions.length > 0 };
}

/**
 * Recursively redact a payload.
 *
 * Object keys are preserved — they are schema, not content — while string values are
 * scrubbed. Keys whose names announce sensitive content are dropped entirely rather
 * than pattern-matched, since a free-text note cannot be reliably scrubbed.
 */
const DROPPED_KEYS = [
  "ssn", "socialsecurity", "dob", "dateofbirth", "birthdate",
  "address", "street", "phone", "email", "mrn", "memberid", "policynumber",
  "note", "notes", "narrative", "chiefcomplaint", "diagnosis", "medication",
  "password", "token", "secret", "apikey", "authorization",
];

function keyIsDropped(key: string) {
  const normalized = key.toLowerCase().replace(/[^a-z]/g, "");
  return DROPPED_KEYS.some((dropped) => normalized === dropped || normalized.endsWith(dropped));
}

export function redactPayload(value: unknown, depth = 0): { value: unknown; redactedAny: boolean; droppedKeys: string[] } {
  // Depth cap prevents a pathological nested object from stalling the request.
  if (depth > 12) return { value: REDACTION_PLACEHOLDER, redactedAny: true, droppedKeys: [] };

  if (typeof value === "string") {
    const result = redactText(value);
    return { value: result.text, redactedAny: result.redactedAny, droppedKeys: [] };
  }
  if (Array.isArray(value)) {
    let redactedAny = false;
    const dropped: string[] = [];
    const mapped = value.map((entry) => {
      const result = redactPayload(entry, depth + 1);
      redactedAny = redactedAny || result.redactedAny;
      dropped.push(...result.droppedKeys);
      return result.value;
    });
    return { value: mapped, redactedAny, droppedKeys: dropped };
  }
  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    let redactedAny = false;
    const dropped: string[] = [];

    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (keyIsDropped(key)) {
        dropped.push(key);
        redactedAny = true;
        continue;
      }
      const result = redactPayload(entry, depth + 1);
      output[key] = result.value;
      redactedAny = redactedAny || result.redactedAny;
      dropped.push(...result.droppedKeys);
    }
    return { value: output, redactedAny, droppedKeys: dropped };
  }

  return { value, redactedAny: false, droppedKeys: [] };
}

/**
 * Whether a payload still looks like it carries identifiers after redaction.
 *
 * Used as a fail-closed check immediately before egress: if this returns true,
 * something slipped past the rules and the request must not be sent.
 */
export function containsLikelyIdentifiers(text: string) {
  return RULES.some((rule) => {
    rule.pattern.lastIndex = 0;
    return rule.pattern.test(text);
  });
}

export const REDACTION_LIMITATION_NOTICE =
  "Redaction reduces exposure before content leaves Klinikos. It is not a substitute for a Business Associate Agreement with the model provider, and no provider should receive protected health information until one is executed and the deployment is approved for it.";
