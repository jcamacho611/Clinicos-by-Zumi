/**
 * What an API route may not put in front of a browser.
 *
 * Split out of the gate script so the rules can be tested directly. They could not be
 * before, and it showed: the payload rules matched a fixed character window after every
 * `.json(`, so a `process.env` guard eleven lines below an unrelated
 * `NextResponse.json({ error: "Authentication required." })` was reported as that
 * response serializing environment state. Six of nine findings were that false positive.
 *
 * A gate that reports things which are not true trains people to stop reading it, which
 * is worse than not having the gate. The payload rules now read the argument actually
 * being serialized.
 */

/** Rules that examine the object handed to `.json(...)`. */
export const PAYLOAD_RULES = [
  {
    key: "raw-process-env-response",
    pattern: /process\.env(?:\.|\[)/,
    message: "API JSON must not serialize process.env state",
  },
  {
    key: "raw-sensitive-object-spread",
    pattern: /\.\.\.(?:session|config|current)\b/,
    message:
      "session/configuration objects must be projected into an explicit browser DTO before response",
  },
  {
    key: "raw-error-stack",
    pattern: /\b(?:stack|stackTrace|trace)\s*:\s*(?:error|err|cause)(?:\.stack)?\b/,
    message: "exception stack/trace detail must remain server-side",
  },
  {
    key: "raw-error-message",
    pattern: /\berror\s*:\s*(?:error|err|cause)\.message\b/,
    message: "unexpected exception messages must be normalized before browser delivery",
  },
  {
    /**
     * Raw passthrough only. `issues: error.issues` dumps Zod's internal shape, including
     * received values. An explicit projection to field and message is how a form tells a
     * person which box to fix, so it is not the same disclosure and is not reported.
     */
    key: "raw-validation-details",
    pattern: /\b(?:details|issues)\s*:\s*[A-Za-z_$][\w$.]*\.issues\s*(?![\s.]*\.?\s*map\s*\()/,
    message: "raw validation issue arrays must remain server-side",
  },
];

/** Rules about field names, which are meaningful anywhere in a route. */
export const FIELD_RULES = [
  {
    key: "environment-secret-name",
    pattern:
      /\b(?:requiredServerSecret|secretEnv|secretEnvironment|missingEnv|environmentVariable)\s*:/,
    message: "credential/environment topology must not be an API response field",
  },
  {
    key: "ai-internal-telemetry",
    pattern:
      /\b(?:providerKey|modelId|promptVersion|costMicroUsd|auditLogId|cognitionTrace|toolGraph)\s*:/,
    message:
      "AI provider/cost/prompt/internal orchestration telemetry is not browser presentation data",
  },
];

const OPENERS = { "(": ")", "[": "]", "{": "}" };
const CLOSERS = new Set([")", "]", "}"]);

/**
 * Blank out everything that is text rather than code, preserving length.
 *
 * Two things depend on this. Balancing needs literals gone so a `)` inside an error
 * message does not close a call. Rule matching needs them gone so a message that
 * mentions `process.env` is not read as serializing it — an error string telling an
 * operator which variable to set is advice, not disclosure.
 *
 * Interpolated expressions inside a template literal stay visible, because
 * `` `${process.env.DATABASE_URL}` `` in a response really is disclosure. Only the
 * literal chunks and the delimiters are blanked. Offsets are unchanged, so reported line
 * numbers still point at the real source.
 */
export function maskNonCode(text) {
  const output = text.split("");
  const blank = (from, to) => {
    for (let index = from; index < to && index < output.length; index += 1) {
      if (output[index] !== "\n") output[index] = " ";
    }
  };

  let cursor = 0;
  while (cursor < text.length) {
    const character = text[cursor];

    if (character === "/" && text[cursor + 1] === "/") {
      const end = text.indexOf("\n", cursor);
      const stop = end === -1 ? text.length : end;
      blank(cursor, stop);
      cursor = stop;
      continue;
    }
    if (character === "/" && text[cursor + 1] === "*") {
      const end = text.indexOf("*/", cursor + 2);
      const stop = end === -1 ? text.length : end + 2;
      blank(cursor, stop);
      cursor = stop;
      continue;
    }
    if (character === "'" || character === '"') {
      let scan = cursor + 1;
      while (scan < text.length) {
        if (text[scan] === "\\") {
          scan += 2;
          continue;
        }
        if (text[scan] === character) break;
        scan += 1;
      }
      blank(cursor, Math.min(scan + 1, text.length));
      cursor = scan + 1;
      continue;
    }
    if (character === "`") {
      blank(cursor, cursor + 1);
      let scan = cursor + 1;
      while (scan < text.length) {
        if (text[scan] === "\\") {
          blank(scan, scan + 2);
          scan += 2;
          continue;
        }
        if (text[scan] === "`") {
          blank(scan, scan + 1);
          scan += 1;
          break;
        }
        if (text[scan] === "$" && text[scan + 1] === "{") {
          // Blank the delimiters, leave the expression between them readable.
          blank(scan, scan + 2);
          let depth = 1;
          let inner = scan + 2;
          while (inner < text.length && depth > 0) {
            if (text[inner] === "{") depth += 1;
            else if (text[inner] === "}") {
              depth -= 1;
              if (depth === 0) blank(inner, inner + 1);
            }
            inner += 1;
          }
          scan = inner;
          continue;
        }
        blank(scan, scan + 1);
        scan += 1;
      }
      cursor = scan;
      continue;
    }

    cursor += 1;
  }

  return output.join("");
}

/**
 * The span of the first argument of every `.json(...)` call.
 *
 * Balanced scan rather than a character budget, so what is reported is what is actually
 * being sent. `.json(` is matched on any receiver: NextResponse, Response, and the local
 * `json()` helpers routes define for themselves all serialize to the same browser.
 */
export function responsePayloadRegions(text) {
  const regions = [];
  const masked = maskNonCode(text);
  const call = /\bjson\s*\(/g;

  for (const match of masked.matchAll(call)) {
    const start = (match.index ?? 0) + match[0].length;
    let cursor = start;
    let depth = 0;

    while (cursor < masked.length) {
      const character = masked[cursor];
      if (character in OPENERS) {
        depth += 1;
      } else if (CLOSERS.has(character)) {
        // Depth 0 here is the closing paren of the json( call itself.
        if (depth === 0) break;
        depth -= 1;
      } else if (character === "," && depth === 0) {
        // End of the first argument; a second argument is status/headers, not payload.
        break;
      }
      cursor += 1;
    }

    if (cursor > start) regions.push({ start, end: cursor });
  }

  return regions;
}

function lineForOffset(text, offset) {
  return text.slice(0, offset).split("\n").length;
}

/**
 * Every disclosure failure in one route's source, as `{ line, key, message }`.
 */
export function findDisclosureFailures(text) {
  const failures = [];
  const masked = maskNonCode(text);

  for (const region of responsePayloadRegions(text)) {
    const payload = masked.slice(region.start, region.end);
    for (const rule of PAYLOAD_RULES) {
      const expression = new RegExp(rule.pattern.source, `${rule.pattern.flags}g`);
      for (const match of payload.matchAll(expression)) {
        failures.push({
          line: lineForOffset(text, region.start + (match.index ?? 0)),
          key: rule.key,
          message: rule.message,
        });
      }
    }
  }

  for (const rule of FIELD_RULES) {
    const expression = new RegExp(rule.pattern.source, `${rule.pattern.flags}g`);
    for (const match of masked.matchAll(expression)) {
      failures.push({
        line: lineForOffset(text, match.index ?? 0),
        key: rule.key,
        message: rule.message,
      });
    }
  }

  return failures.sort((left, right) => left.line - right.line);
}
