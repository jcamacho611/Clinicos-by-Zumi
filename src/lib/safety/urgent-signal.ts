/**
 * Recognizing that someone may be describing an emergency.
 *
 * Klinikos already knew how to do this — `classifyWorkflow` has detected emergency
 * phrases since early on — but it only ran in the copilot, patient navigation, a demo
 * component and a standalone classify endpoint. The three most prominent text inputs in
 * the product ran none of it: the Living Home composer, the authenticated Zumi
 * conversation and the public Zumi conversation. Someone typing "chest pain" was routed
 * to a scheduling Path.
 *
 * This is the one vocabulary. `classifyWorkflow` delegates to it rather than keeping a
 * second list, because two emergency vocabularies means one of them is out of date and
 * nobody knows which.
 *
 * What this is not: it does not triage, diagnose, assess severity, or advise treatment.
 * It recognizes that routine automation must stop and that approved emergency language
 * must be shown. Those are the only claims it makes, and they are the only ones it can
 * support — matching a phrase is not a clinical finding.
 */

export type UrgentSignalCategory = "life_threatening" | "self_harm";

export type UrgentSignal =
  | { readonly urgent: false }
  | {
      readonly urgent: true;
      readonly category: UrgentSignalCategory;
      /** The phrase that matched, so a false positive can be reviewed rather than guessed at. */
      readonly matched: string;
      /** Approved language. Instruction only — never interpretation. */
      readonly message: string;
    };

/**
 * US emergency and crisis numbers.
 *
 * Hard-coded because Klinikos operates in the United States today. Anywhere this
 * product serves another country these become wrong rather than merely incomplete, so
 * they are named here as one obvious place to change rather than scattered through
 * response strings.
 */
export const EMERGENCY_NUMBER = "911";
export const CRISIS_LINE = "988";

export const LIFE_THREATENING_MESSAGE =
  `If this is a medical emergency, call ${EMERGENCY_NUMBER} now or go to the nearest emergency room. ` +
  "Klinikos cannot assess symptoms and has not contacted anyone for you.";

export const SELF_HARM_MESSAGE =
  `If you are thinking about harming yourself, call or text ${CRISIS_LINE} to reach the Suicide and Crisis Lifeline, ` +
  `or call ${EMERGENCY_NUMBER} if you are in immediate danger. ` +
  "Klinikos cannot provide crisis counseling and has not contacted anyone for you.";

/**
 * Phrases that stop routine automation.
 *
 * Matched on word boundaries. The original list matched bare substrings, which reads
 * "stroke" inside "stroke of luck" and "unconscious" inside "unconscious bias" — a false
 * positive here is not harmless, because it replaces the answer someone actually asked
 * for with emergency instructions.
 *
 * The list is deliberately broader than the original seven. Someone writing "he took too
 * many pills" or "she is not breathing" is in the same situation as someone writing
 * "chest pain", and the original vocabulary matched none of those.
 */
const LIFE_THREATENING_PHRASES = [
  "chest pain",
  "chest pains",
  "crushing chest",
  "heart attack",
  "cardiac arrest",
  "can't breathe",
  "cant breathe",
  "cannot breathe",
  "not breathing",
  "stopped breathing",
  "trouble breathing",
  "struggling to breathe",
  "choking",
  "stroke",
  "having a stroke",
  "face drooping",
  "slurred speech",
  "severe bleeding",
  "bleeding badly",
  "hemorrhaging",
  "unconscious",
  "unresponsive",
  "passed out",
  "collapsed",
  "seizure",
  "convulsing",
  "overdose",
  "overdosed",
  "took too many pills",
  "anaphylaxis",
  "anaphylactic",
  "severe allergic reaction",
];

/**
 * Concepts a fixed phrase list keeps getting wrong.
 *
 * "throat closing" misses "his throat is closing"; "won't stop bleeding" misses "the
 * bleeding won't stop". Word order and filler words vary in ways an exact-phrase list
 * cannot chase, and adding each new spelling one at a time is how the original list
 * ended up missing "not breathing" and "overdose" entirely.
 */
const LIFE_THREATENING_PATTERNS: readonly RegExp[] = [
  /throat (?:is |was )?clos/i,
  /(?:bleeding|blood)[^.!?]{0,20}(?:won'?t|will not|can'?t|cannot|does ?n'?t) stop/i,
  /(?:won'?t|can'?t|cannot) stop (?:the )?(?:bleeding|blood)/i,
  /(?:can'?t|cannot|not able to) (?:catch (?:my|his|her|their) breath|get air)/i,
];

const SELF_HARM_PHRASES = [
  "suicidal",
  "suicide",
  "kill myself",
  "killing myself",
  "end my life",
  "ending my life",
  "want to die",
  "wanna die",
  "hurt myself",
  "harm myself",
  "self harm",
  "self-harm",
  "no reason to live",
];

/**
 * Phrases whose plain meaning is not an emergency.
 *
 * Checked before the emergency vocabulary so a common idiom does not replace a real
 * question with emergency instructions. Anything not listed here still matches: the
 * default is to treat the signal as real.
 */
const KNOWN_NON_EMERGENCY_USES = [
  "stroke of luck",
  "stroke of genius",
  "different strokes",
  "unconscious bias",
  "stroke patient education",
  "stroke rehabilitation",
  "stroke clinic",
  "seizure disorder education",
  "suicide prevention training",
  "suicide prevention course",
];

function escapeForRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Word-boundary match that still works for phrases ending in punctuation-like characters
 * such as "can't breathe", where a trailing `\b` behaves differently.
 */
function containsPhrase(haystack: string, phrase: string) {
  return new RegExp(`(?:^|[^a-z0-9])${escapeForRegExp(phrase)}(?:$|[^a-z0-9])`, "i").test(haystack);
}

export function detectUrgentSignal(input: string): UrgentSignal {
  const normalized = ` ${input.trim().toLowerCase().replace(/\s+/g, " ")} `;

  if (KNOWN_NON_EMERGENCY_USES.some((phrase) => normalized.includes(phrase))) {
    return { urgent: false };
  }

  // Self-harm is checked first. Both categories stop automation, but the guidance differs,
  // and sending someone in crisis to an emergency room without naming the crisis line is
  // worse guidance than naming both.
  for (const phrase of SELF_HARM_PHRASES) {
    if (containsPhrase(normalized, phrase)) {
      return { urgent: true, category: "self_harm", matched: phrase, message: SELF_HARM_MESSAGE };
    }
  }

  for (const phrase of LIFE_THREATENING_PHRASES) {
    if (containsPhrase(normalized, phrase)) {
      return {
        urgent: true,
        category: "life_threatening",
        matched: phrase,
        message: LIFE_THREATENING_MESSAGE,
      };
    }
  }

  for (const pattern of LIFE_THREATENING_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      return {
        urgent: true,
        category: "life_threatening",
        matched: match[0].trim(),
        message: LIFE_THREATENING_MESSAGE,
      };
    }
  }

  return { urgent: false };
}
