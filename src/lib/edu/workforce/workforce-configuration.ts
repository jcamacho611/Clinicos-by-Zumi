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
  services: {
    industryAccelerator: {
      label: string;
      durationHours: { min: number; max: number };
    };
    careerReadiness: {
      label: string;
      durationHours: { min: number; max: number };
    };
  };
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
  delivery: {
    routineLiveRemote: true;
    strategicInPerson: true;
  };
  classSize: {
    careerReadiness: {
      dedicatedPlanningMinimum: 6;
      recommended: 18;
      leadInstructorMaximum: 24;
      maximumWithSecondFacilitator: 40;
    };
    industryAccelerator: {
      dedicatedPlanningMinimum: 6;
      recommended: 15;
      leadInstructorMaximum: 20;
      maximumWithSecondFacilitator: 30;
    };
    inPersonRecommended: { min: 12; max: 20 };
  };
  authority: {
    completion: "human";
    attendanceVerification: "human_or_authoritative_system";
    aiMayApproveCompletion: false;
    certificateConveysLicensure: false;
    trainingEstablishesEmploymentEligibility: false;
  };
  participantAccess: {
    personalPaidAiSubscriptionRequired: false;
    standardAccessibleMaterialsIncluded: true;
    ordinaryCaptioningIncluded: true;
    languageAccess: "scwdb_approved_human_reviewed";
  };
  technology: {
    approvedToolDisclosureRequired: true;
    publicUnapprovedAiMayReceiveRestrictedData: false;
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
  services: {
    industryAccelerator: {
      label: workforceAiReadinessProgram.industryAccelerator.label,
      durationHours: workforceAiReadinessProgram.industryAccelerator.durationHours,
    },
    careerReadiness: {
      label: careerReadinessWorkshop.label,
      durationHours: careerReadinessWorkshop.durationHours,
    },
  },
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
  delivery: {
    routineLiveRemote: true,
    strategicInPerson: true,
  },
  classSize: {
    careerReadiness: {
      dedicatedPlanningMinimum: 6,
      recommended: 18,
      leadInstructorMaximum: 24,
      maximumWithSecondFacilitator: 40,
    },
    industryAccelerator: {
      dedicatedPlanningMinimum: 6,
      recommended: 15,
      leadInstructorMaximum: 20,
      maximumWithSecondFacilitator: 30,
    },
    inPersonRecommended: { min: 12, max: 20 },
  },
  authority: {
    completion: "human",
    attendanceVerification: "human_or_authoritative_system",
    aiMayApproveCompletion: false,
    certificateConveysLicensure: false,
    trainingEstablishesEmploymentEligibility: false,
  },
  participantAccess: {
    personalPaidAiSubscriptionRequired: false,
    standardAccessibleMaterialsIncluded: true,
    ordinaryCaptioningIncluded: true,
    languageAccess: "scwdb_approved_human_reviewed",
  },
  technology: {
    approvedToolDisclosureRequired: true,
    publicUnapprovedAiMayReceiveRestrictedData: false,
  },
};

export function getWorkforcePathwayKeys() {
  return [...SCWDB_WORKFORCE_CONFIGURATION.pathwayKeys];
}
