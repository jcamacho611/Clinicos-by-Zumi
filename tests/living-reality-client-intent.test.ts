import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const intentPath = "src/lib/living-reality/reality-client-intent.ts";
const source = existsSync(intentPath) ? readFileSync(intentPath, "utf8") : "";

const permitted = [
  "FOCUS_OBJECT",
  "INSPECT_OBJECT",
  "OPEN_ROUTE",
  "CHANGE_LENS",
  "REQUEST_ACTION_PANEL",
  "CHANGE_TIME_VIEW",
  "ENTER_MISSION_ROOM",
  "EXIT_MISSION_ROOM",
  "SHOW_RELATIONSHIPS",
  "RECENTER_CAMERA",
] as const;

const forbidden = [
  "APPROVE",
  "SIGN",
  "DIAGNOSE",
  "PRESCRIBE",
  "ORDER",
  "VERIFY_CREDENTIAL",
  "AUTHORIZE_ORGANIZATION",
  "HIRE",
  "CLASSIFY_WORKER",
  "PAY",
  "SETTLE",
  "SUBMIT_CLAIM",
  "AWARD_COMPETENCY",
  "ACCEPT_LEGAL_TERMS",
] as const;

describe("RealityClientIntent authority boundary", () => {
  it("defines the canonical presentation-only intent surface", () => {
    expect(existsSync(intentPath)).toBe(true);
    for (const intent of permitted) expect(source).toContain(`\"${intent}\"`);
  });

  it("cannot encode consequential authority verbs", () => {
    for (const intent of forbidden) expect(source).not.toContain(`kind: \"${intent}\"`);
  });
});
