/**
 * The canonical way Klinikos describes itself.
 *
 * This exists because of a specific, expensive failure. An external evaluator from
 * Caduceus reviewed klinikos.io and reported that he could not determine the value
 * proposition or what the product does, and asked for a pitch deck instead. The website
 * is what outbound links to, so a website that needs a deck to be understood is a
 * website that does not work.
 *
 * The cause was visible in the markup: the entire first viewport was an orb, the word
 * "Klinikos", the headline "What needs to happen?", and a chat box. Nothing on screen
 * said what the product is, who it is for, or why it differs from an EHR. A visitor had
 * to talk to a bot to find out what the company sells.
 *
 * Every public surface reads its description from here rather than writing its own, so
 * the homepage, metadata, structured data, the investor path and the sales language
 * cannot drift into four different stories. Changing how Klinikos describes itself is a
 * deliberate edit to this file, not an accident somewhere in a component.
 *
 * Rules that hold for everything in here:
 *   - Plain language a clinic owner reads without translating. No "orchestration
 *     substrate", no "accountable next-action layer", no "operational fabric".
 *   - Never claim a certification, a live external connection, or a customer outcome
 *     the product cannot evidence.
 *   - Price is never stated without the stack it is meant to replace, because
 *     "$995" beside a $199 EHR is a losing comparison and a false one.
 */

/** One line. The answer to "what is this?" — used in metadata, outbound, and the hero. */
export const KLINIKOS_ONE_LINE = "Run your clinic from one intelligent operating system.";

/** The supporting sentence. Names the work, the intelligence, and the honest boundary. */
export const KLINIKOS_SUPPORTING =
  "Klinikos brings the work around care into one governed system, from scheduling and follow-up to team "
  + "workflows, documents, revenue operations and Zumi intelligence, while connecting the healthcare "
  + "infrastructure that still needs to remain.";

/** Roughly thirty seconds of speech. For the investor path and outbound. */
export const KLINIKOS_THIRTY_SECOND =
  "Clinics run on a stack of disconnected software: an EHR for the chart, and then separate tools for "
  + "scheduling, texting, forms, documents, tasks, follow-up and revenue work. The work that keeps a clinic "
  + "running happens between those tools, where nothing tracks it. Klinikos is the operating system for that "
  + "work. It brings clinic operations into one governed system, uses Zumi to surface what needs attention "
  + "and coordinate it, and connects to the external healthcare infrastructure that has to stay external. "
  + "The clinic replaces several bills with one and gets an operation it can actually see.";

/**
 * What each part of the ecosystem is, in one sentence each.
 *
 * The order is the hierarchy, and the hierarchy is commercial: a clinic buyer should
 * meet the operating system first and the network second. Showing all four at once is
 * what makes a visitor ask whether this is an EHR, a marketplace, or a school.
 */
export const KLINIKOS_ECOSYSTEM = [
  {
    name: "Klinikos",
    role: "The operating system",
    sentence: "One governed workspace for the operational work of running a clinic.",
  },
  {
    name: "Zumi",
    role: "The intelligence",
    sentence: "Surfaces what needs attention and helps coordinate it, while people keep authority over decisions that matter.",
  },
  {
    name: "Grid",
    role: "The network",
    sentence: "Connects clinics to reviewed people, space, equipment and services when they need capacity they do not have.",
  },
  {
    name: "Klinikos EDU",
    role: "The learning system",
    sentence: "Practises healthcare operations in synthetic environments, without exposing real patient data.",
  },
] as const;

/**
 * The economic thesis, stated the only way that survives comparison.
 *
 * A clinic does not compare Klinikos to nothing; it compares Klinikos to the stack it
 * already pays for. Presenting a monthly price without that stack invites the wrong
 * comparison against a cheap EHR seat, which is the comparison Klinikos loses.
 */
export const KLINIKOS_ECONOMIC_THESIS =
  "Most clinics pay for an EHR and then pay again for scheduling, texting, forms, documents, tasks and "
  + "follow-up. Klinikos is priced against that whole stack, not against a single EHR seat.";

/** Answers "is the AI deciding things?" before a buyer has to ask. */
export const KLINIKOS_HUMAN_AUTHORITY =
  "Zumi organises and surfaces work. Clinical and regulated decisions stay with the people licensed to make them.";

/** The question the composer asks, kept as the label it always was — no longer the headline. */
export const ZUMI_COMPOSER_PROMPT = "What needs to happen?";

/** Search and social. Written for a person scanning a result, not for a keyword crawler. */
export const KLINIKOS_META = {
  title: "Klinikos | The operating system for running a clinic",
  description:
    "Klinikos brings clinic operations into one governed system — scheduling, follow-up, team workflows, "
    + "documents and revenue work — with Zumi intelligence surfacing what needs attention. "
    + "Built to replace fragmented software while connecting the healthcare systems that must stay external.",
} as const;

/**
 * Root discovery describes the whole governed network. Clinic-specific acquisition
 * pages retain KLINIKOS_META; the universal front door must not collapse patients,
 * professionals, learners, partners, or institutions into one clinic-buyer story.
 */
export const KLINIKOS_PUBLIC_META = {
  title: "Klinikos | The operating network for healthcare",
  description:
    "Klinikos connects care, work, education, capacity, and healthcare operations in one governed network, "
    + "with Zumi helping each person understand what needs to happen next while authority stays with the people and systems qualified to decide.",
} as const;
