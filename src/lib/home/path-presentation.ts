/**
 * What the browser is allowed to know about a Path.
 *
 * Living Home used to answer this for itself by calling the path catalog and the path
 * runtime engine directly. That worked, but it meant the browser bundle carried the
 * entire path catalog, the intent taxonomy behind it, and the rules that decide which
 * step comes next — the orchestration Klinikos sells, readable by anyone who opens
 * devtools.
 *
 * The interface only ever rendered three facts from all of that: a title, a percentage,
 * and an id to link to. Those are what this type carries. The reasoning that produces
 * them stays on the server.
 *
 * Deliberately free of imports so a Client Component can hold this type without pulling
 * a server module into the bundle behind it.
 */
export type PathPresentation = {
  readonly instanceId: string;
  readonly pathId: string;
  /** The catalog definition's own id, used for links. */
  readonly definitionId: string;
  readonly title: string;
  /**
   * Whole percent, 0-100, already rounded.
   *
   * Rounding server-side keeps one definition of progress. When the client rounded a
   * raw fraction, the displayed number was a second opinion about completion that could
   * drift from the one the server reports elsewhere.
   */
  readonly progressPercent: number;
};

/** A surface Klinikos can answer with directly, once the server has confirmed access. */
export type SurfaceAnswerView = {
  readonly answer: string;
  readonly label: string;
  readonly href: string;
  readonly topic: string;
};

export function findPathPresentation(
  presentations: readonly PathPresentation[],
  instanceId: string | null | undefined,
): PathPresentation | null {
  if (!instanceId) return null;
  return presentations.find((entry) => entry.instanceId === instanceId) ?? null;
}
