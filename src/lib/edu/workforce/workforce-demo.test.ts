import { describe, expect, it } from "vitest";

import { SCWDB_HEALTHCARE_EVALUATOR_DEMO } from "./workforce-demo";

describe("SCWDB healthcare evaluator demo", () => {
  it("is explicitly synthetic and uses the merged healthcare pathway", () => {
    expect(SCWDB_HEALTHCARE_EVALUATOR_DEMO.syntheticOnly).toBe(true);
    expect(SCWDB_HEALTHCARE_EVALUATOR_DEMO.pathwayKey).toBe("healthcare");
  });

  it("contains the submitted-versus-approved failure and clinical-boundary escalation", () => {
    expect(SCWDB_HEALTHCARE_EVALUATOR_DEMO.hiddenFailure.authoritativeStatus).toBe("submitted");
    expect(SCWDB_HEALTHCARE_EVALUATOR_DEMO.hiddenFailure.aiClaim).toBe("approved");
    expect(SCWDB_HEALTHCARE_EVALUATOR_DEMO.clinicalBoundary.requiredAction).toBe("stop_and_escalate");
  });

  it("does not give Zumi completion authority", () => {
    expect(SCWDB_HEALTHCARE_EVALUATOR_DEMO.authority.aiMayApproveCompletion).toBe(false);
  });
});
