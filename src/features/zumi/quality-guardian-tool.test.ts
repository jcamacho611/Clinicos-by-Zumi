import { describe, expect, it } from "vitest";
import { getZumiTool, resolveZumiToolReadiness } from "@/features/zumi/tool-catalog";

describe("Zumi Quality Guardian tool registration", () => {
  it("registers the bounded persisted-gap Quality Guardian integration as internal without external egress", () => {
    const tool = getZumiTool("quality_guardian");
    expect(tool).not.toBeNull();
    expect(tool?.sendsDataExternally).toBe(false);
    expect(tool?.actions).toEqual(["read", "compute", "draft"]);
    expect(tool?.description).toContain("persisted active QualityGap backlog");
    expect(tool && resolveZumiToolReadiness(tool, {})).toBe("active");
  });
});
