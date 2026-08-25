import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CRISIS_LINE,
  EMERGENCY_NUMBER,
  detectUrgentSignal,
} from "@/lib/safety/urgent-signal";
import { classifyWorkflow } from "@/lib/workflow-rules";

describe("urgent signal recognition", () => {
  it("recognizes the phrases the original vocabulary already covered", () => {
    for (const phrase of [
      "chest pain",
      "I can't breathe",
      "he is unconscious",
      "severe bleeding",
      "I think she is having a stroke",
    ]) {
      expect(detectUrgentSignal(phrase).urgent, phrase).toBe(true);
    }
  });

  it("recognizes emergencies the original vocabulary missed entirely", () => {
    // Someone writing any of these is in the same situation as someone writing
    // "chest pain". None of them matched before.
    for (const phrase of [
      "she is not breathing",
      "he took too many pills",
      "I think it's a heart attack",
      "my son had a seizure",
      "his throat is closing",
      "she collapsed and is unresponsive",
      "the bleeding won't stop",
      "possible overdose",
    ]) {
      expect(detectUrgentSignal(phrase).urgent, phrase).toBe(true);
    }
  });

  it("separates self-harm, because the right number is not the same number", () => {
    const signal = detectUrgentSignal("I want to kill myself");

    expect(signal.urgent).toBe(true);
    if (!signal.urgent) return;
    expect(signal.category).toBe("self_harm");
    expect(signal.message).toContain(CRISIS_LINE);
    expect(signal.message).toContain(EMERGENCY_NUMBER);
  });

  it("directs a physical emergency to emergency services", () => {
    const signal = detectUrgentSignal("crushing chest pain");

    expect(signal.urgent).toBe(true);
    if (!signal.urgent) return;
    expect(signal.category).toBe("life_threatening");
    expect(signal.message).toContain(EMERGENCY_NUMBER);
  });

  /**
   * A false positive is not harmless here: it replaces the answer someone actually
   * asked for with emergency instructions. Substring matching read "stroke" inside
   * "stroke of luck".
   */
  it("does not fire on ordinary language that merely contains an emergency word", () => {
    for (const phrase of [
      "that was a stroke of luck",
      "we should review unconscious bias in intake",
      "schedule the stroke rehabilitation follow-up",
      "enroll staff in the suicide prevention training",
      "book a seizure disorder education session",
      "different strokes for different folks",
    ]) {
      expect(detectUrgentSignal(phrase).urgent, phrase).toBe(false);
    }
  });

  it("does not fire on unrelated clinic questions", () => {
    for (const phrase of [
      "who hasn't completed intake tomorrow?",
      "find coverage for Saturday",
      "what claims are unbilled?",
      "reschedule my appointment",
    ]) {
      expect(detectUrgentSignal(phrase).urgent, phrase).toBe(false);
    }
  });

  it("never interprets, advises treatment, or claims to have contacted anyone", () => {
    for (const input of ["chest pain", "I want to die"]) {
      const signal = detectUrgentSignal(input);
      expect(signal.urgent).toBe(true);
      if (!signal.urgent) return;

      // It states what to do, and states plainly what Klinikos did not do.
      expect(signal.message).toContain("has not contacted anyone for you");
      expect(signal.message).not.toMatch(/\byou (?:have|are having|may have)\b/i);
      expect(signal.message).not.toMatch(/\b(diagnos|prescrib|dose|treatment plan)/i);
      expect(signal.message).not.toMatch(/\b(we have|staff have|someone has) (?:been )?(?:alerted|notified)\b/i);
    }
  });

  it("reports which phrase matched so a false positive can be reviewed", () => {
    const signal = detectUrgentSignal("he is unresponsive");
    expect(signal.urgent).toBe(true);
    if (!signal.urgent) return;
    expect(signal.matched).toBe("unresponsive");
  });
});

/**
 * Detection is worth nothing where it is not applied. Emergency handling existed for a
 * long time and ran only in the copilot, patient navigation, a demo component and a
 * standalone classify endpoint — never on the three inputs people actually type into.
 * These assert it now runs there, and that it runs *first*.
 */
describe("the surfaces people actually type into", () => {
  /**
   * Read from the POST body onward. Imports sit at the top of every file, so an
   * ordering assertion over the whole source is satisfied by an import line rather than
   * by the call order that actually matters.
   */
  function postBody(relative: string) {
    const source = readFileSync(join(process.cwd(), relative), "utf8");
    return source.slice(source.indexOf("export async function POST"));
  }

  const pathsRoute = readFileSync(join(process.cwd(), "src/app/api/paths/route.ts"), "utf8");
  const publicZumi = postBody("src/app/api/zumi/public/route.ts");
  const authedZumi = postBody("src/app/api/zumi/route.ts");

  it("checks the Living Home composer before resolving intent", () => {
    const detect = pathsRoute.indexOf("detectUrgentSignal(text)");
    const resolve = pathsRoute.indexOf("resolveIntentDeterministically(text)");
    const create = pathsRoute.indexOf("createPathInstance(session, { pathId");

    expect(detect).toBeGreaterThan(-1);
    expect(resolve).toBeGreaterThan(detect);
    expect(create).toBeGreaterThan(detect);
  });

  it("checks the public conversation before spending anything on a model", () => {
    const detect = publicZumi.indexOf("detectUrgentSignal(parsed.data.question)");
    const quota = publicZumi.indexOf("publicZumiDurableQuotaAttested");
    const turn = publicZumi.indexOf("resolvePublicZumiTurn");

    expect(detect).toBeGreaterThan(-1);
    expect(quota).toBeGreaterThan(detect);
    expect(turn).toBeGreaterThan(detect);
  });

  it("checks the authenticated conversation before conversation state or a model", () => {
    const detect = authedZumi.indexOf("detectUrgentSignal(parsed.data.question)");
    const open = authedZumi.indexOf("openZumiConversation");

    expect(detect).toBeGreaterThan(-1);
    expect(open).toBeGreaterThan(detect);
  });

  it("does not let a rate-limit refusal be the last thing an emergency reads", () => {
    // The body is not parsed at that point, so the guidance is unconditional rather
    // than detected — short, always true, and free.
    const refusal = publicZumi.indexOf('error: "Too many messages');
    const emergency = publicZumi.indexOf("emergency: LIFE_THREATENING_MESSAGE");

    expect(refusal).toBeGreaterThan(-1);
    expect(emergency).toBeGreaterThan(refusal);
  });

  it("stops rather than routes, on every surface", () => {
    // The urgent branch must return, not fall through into ordinary handling.
    for (const [name, source] of [
      ["paths", pathsRoute],
      ["public zumi", publicZumi],
      ["authenticated zumi", authedZumi],
    ] as const) {
      const branch = source.slice(source.indexOf("urgent.urgent"), source.indexOf("urgent.urgent") + 700);
      expect(branch, name).toContain("return");
    }
  });
});

describe("one emergency vocabulary, not two", () => {
  it("keeps classifyWorkflow agreeing with the shared recognizer", () => {
    // classifyWorkflow kept its own list of seven phrases. Two vocabularies means one is
    // stale and nobody knows which, so it now delegates.
    for (const phrase of ["chest pain", "she is not breathing", "possible overdose", "I want to die"]) {
      expect(classifyWorkflow(phrase).category, phrase).toBe("Emergency Symptom");
    }
  });

  it("still classifies non-emergency workflows as before", () => {
    expect(classifyWorkflow("what does my lab result mean?").category).toBe("BFM Lab Question");
    expect(classifyWorkflow("that was a stroke of luck").category).not.toBe("Emergency Symptom");
  });
});
