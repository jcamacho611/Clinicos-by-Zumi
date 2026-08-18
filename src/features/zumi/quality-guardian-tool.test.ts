import { describe, expect, it } from "vitest";
import { getZumiTool, resolveZumiToolReadiness } from "@/features/zumi/tool-catalog";

describe("Zumi Quality Guardian tool registration", () => {
  it("registers Quality Guardian without implying a live data loader or external egress", () => {
    const tool = getZumiTool("quality_guardian");
    expect(tool).not.toBeNull();
    expect(tool?.sendsDataExternally).toBe(false);
    expect(tool?.actions).toEqual(["read", "compute", "draft"]);
    expect(tool && resolveZumiToolReadiness(tool, {})).toBe("available_to_wire");
  });
});
