import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import {
  COMPANY_OPPORTUNITY_NO_STORE,
  companyOpportunityAuthenticationRequired,
  companyOpportunityErrorResponse,
  companyOpportunitySameOriginRequired,
} from "@/lib/company/company-opportunity-api";
import {
  appendCompanyOpportunityEvidence,
  appendCompanyOpportunityEvidenceSchema,
} from "@/lib/repositories/company-opportunity-repository";
import { evaluateSameOriginMutation } from "@/lib/security/same-origin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ opportunityId: string }> },
) {
  if (!evaluateSameOriginMutation(request).allowed) return companyOpportunitySameOriginRequired();
  const session = await getClinicSession();
  if (!session) return companyOpportunityAuthenticationRequired();
  const denied = await enforceApiPermission(session, "company", "update", { request });
  if (denied) return denied;

  try {
    const { opportunityId } = await params;
    const input = appendCompanyOpportunityEvidenceSchema.parse(await request.json());
    const data = await appendCompanyOpportunityEvidence(session, opportunityId, input);
    return NextResponse.json({ data }, { status: 201, headers: COMPANY_OPPORTUNITY_NO_STORE });
  } catch (error) {
    return companyOpportunityErrorResponse(error);
  }
}
