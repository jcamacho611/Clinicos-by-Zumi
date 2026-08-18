import "server-only";

/**
 * The structured state behind every count, badge and briefing sentence on Home.
 *
 * The correction this file implements: a badge must never discover its number by
 * parsing a natural-language sentence. Text-scraping looks harmless in a prototype —
 * the sentence and the badge always agree, because one is made from the other — and
 * then it fails in the ways language fails. Pluralisation changes the digits. A
 * translated string has none. "Two patients" stops matching `/\d+/`. Someone rewords
 * the sentence for clarity and the badge silently reads zero.
 *
 * So the direction of derivation is fixed here and enforced by
 * `tests/attention-contract.test.ts`:
 *
 *     structured server state → count, severity, record ids, due state, next action
 *                             ├── briefingSentence(item)  → the sentence
 *                             └── badgeFor(item)          → the number
 *
 * Both outputs read the same fields. Neither reads the other.
 *
 * `recordIds` is what makes an item checkable: a person who does not believe the
 * number can open exactly the records it came from. An item that cannot name its
 * records is not evidence, it is an assertion.
 */

export type AttentionSeverity = "critical" | "due" | "open" | "informational";

export type AttentionDueState =
  | { readonly kind: "overdue"; readonly since: Date }
  | { readonly kind: "due_by"; readonly at: Date }
  | { readonly kind: "no_deadline" };

export interface AttentionAction {
  /** Verb phrase, in the words a person would use. "Review", "Send reminder". */
  readonly label: string;
  readonly href: string;
}

export interface AttentionItem {
  readonly id: string;
  /** What this is about, in plain language. "Patients still need forms". */
  readonly subject: string;
  /** Singular form of the counted noun. "patient". */
  readonly noun: string;
  /** Plural form. Supplied rather than derived, because English does not cooperate. */
  readonly pluralNoun: string;
  readonly count: number;
  readonly severity: AttentionSeverity;
  /** The exact records this count came from. Never a sample, never a guess. */
  readonly recordIds: readonly string[];
  readonly due: AttentionDueState;
  /**
   * The one thing to do about it. Exactly one — an attention item offering three
   * equally-weighted buttons has not decided what matters, and makes the person decide
   * instead.
   */
  readonly action: AttentionAction;
  /** Where the number came from, shown when someone asks why. */
  readonly evidence: string;
}

/** A count and its record set must agree, or the count is not evidence. */
export function attentionItemIsConsistent(item: AttentionItem): boolean {
  return item.count === item.recordIds.length;
}

/**
 * The badge number. Reads the structured count, and nothing else.
 *
 * Returns null rather than 0 when there is nothing: a badge showing "0" is visual
 * noise that trains people to ignore badges.
 */
export function badgeFor(item: AttentionItem): number | null {
  return item.count > 0 ? item.count : null;
}

/** The rail's total. Sums structured counts; never counts sentences. */
export function badgeTotal(items: readonly AttentionItem[]): number | null {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  return total > 0 ? total : null;
}

function dueClause(due: AttentionDueState, now: Date): string {
  if (due.kind === "no_deadline") return "";
  if (due.kind === "overdue") {
    const days = Math.max(1, Math.round((now.getTime() - due.since.getTime()) / 86_400_000));
    return days === 1 ? " since yesterday" : ` for ${days} days`;
  }
  const hours = Math.round((due.at.getTime() - now.getTime()) / 3_600_000);
  if (hours <= 0) return " now";
  return hours < 24 ? ` before ${hours === 1 ? "the next hour is out" : `${hours} hours from now`}` : " this week";
}

/**
 * The briefing sentence. Built from the same structured fields the badge reads, so the
 * two cannot disagree — and so rewording this function can never change a number.
 */
export function briefingSentence(item: AttentionItem, now: Date = new Date()): string {
  if (item.count === 0) return `No ${item.pluralNoun} need attention.`;
  const noun = item.count === 1 ? item.noun : item.pluralNoun;
  const verb = item.count === 1 ? "needs" : "need";
  return `${item.count} ${noun} ${verb} ${item.subject}${dueClause(item.due, now)}.`;
}

/**
 * Ordering for the briefing. Severity first, then how overdue, then size — a single
 * critical item outranks a large pile of informational ones, which is the judgement a
 * person would make and the reason the briefing is worth reading.
 */
const severityRank: Record<AttentionSeverity, number> = {
  critical: 0,
  due: 1,
  open: 2,
  informational: 3,
};

export function orderAttention(items: readonly AttentionItem[]): readonly AttentionItem[] {
  return [...items].sort((left, right) => {
    const bySeverity = severityRank[left.severity] - severityRank[right.severity];
    if (bySeverity !== 0) return bySeverity;
    const overdue = Number(right.due.kind === "overdue") - Number(left.due.kind === "overdue");
    if (overdue !== 0) return overdue;
    return right.count - left.count;
  });
}

/**
 * Everything-handled is a real answer, not an empty state to be filled. When nothing is
 * open, the briefing should say so plainly rather than manufacturing something to show.
 */
export function everythingHandled(items: readonly AttentionItem[]): boolean {
  return items.every((item) => item.count === 0);
}
