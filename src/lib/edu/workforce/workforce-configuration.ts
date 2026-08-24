import {
  careerReadinessWorkshop,
  industryAcceleratorPathways,
  workforceAiReadinessProgram,
} from "@/lib/edu/workforce-ai-program";

export type WorkforceConfiguration = {
  product: "edu";
  configuration: "workforce";
  customer: {
    key: string;
    label: string;
  };
  serviceFamilies: readonly ["industry_accelerator", "career_readiness"];
  pathwayKeys: readonly (typeof industryAcceleratorPathways)[number]["key"][];
  deliveryModes: typeof workforceAiReadinessProgram.deliveryModes;
  serviceLevels: {
    implementationPlanBusinessDays: 15;
    launchCalendarDays: 30;
    attendanceCompletionBusinessDays: 2;
    surveyBusinessDays: 5;
    monthlyPerformanceReport: true;
    quarterlyCurriculumReview: true;
  };
  authority: {
    completion: "human";
    attendanceVerification: "human_or_authoritative_system";
    aiMayApproveCompletion: false;
  };
  participantAccess: {
    personalPaidAiSubscriptionRequired: false;
    standardAccessibleMaterialsIncluded: true;
    ordinaryCaptioningIncluded: true;
  };
};

export const SCWDB_WORKFORCE_CONFIGURATION: WorkforceConfiguration = {
  product: "edu",
  configuration: "workforce",
  customer: {
    key: "scwdb-kentucky-ai-workforce-readiness",
    label: "South Central Workforce Development Board",
  },
  serviceFamilies: ["industry_accelerator", "career_readiness"],
  pathwayKeys: industryAcceleratorPathways.map((pathway) => pathway.key),
  deliveryModes: workforceAiReadinessProgram.deliveryModes,
  serviceLevels: {
    implementationPlanBusinessDays: 15,
    launchCalendarDays: 30,
    attendanceCompletionBusinessDays: 2,
    surveyBusinessDays: 5,
    monthlyPerformanceReport: true,
    quarterlyCurriculumReview: true,
  },
  authority: {
    completion: "human",
    attendanceVerification: "human_or_authoritative_system",
    aiMayApproveCompletion: false,
  },
  participantAccess: {
    personalPaidAiSubscriptionRequired: false,
    standardAccessibleMaterialsIncluded: true,
    ordinaryCaptioningIncluded: true,
  },
};

export function getWorkforcePathwayKeys() {
  return [...SCWDB_WORKFORCE_CONFIGURATION.pathwayKeys];
}

void careerReadinessWorkshop;
