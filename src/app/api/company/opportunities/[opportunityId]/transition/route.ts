import { NextResponse } from "next/server";
import { getClinicSession } from "@/lib/auth/session";
import {
  COMPANY_OPPORTUNITY_NO_STORE,
  companyOpportunityAuthenticationRequired,
  companyOpportunityErrorResponse,
  companyOpportunitySameOriginRequired,
} from "@/lib/company/company-opportunity-api";
import {
  transitionCompanyOpportunity,
  transitionCompanyOpportunitySchema,
} from "@/lib/repositories/company-opportunity-repository";
import { evaluateSameOriginMutation } from "@/lib/security/same-origin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ opportunityId: string }> },
) {
  if (!evaluateSameOriginMutation(request).allowed) return companyOpportunitySameOriginRequired();
  const session = await getClinicSession();
  if (!session) return companyOpportunityAuthenticationRequired();

  try {
    const { opportunityId } = await params;
    const input = transitionCompanyOpportunitySchema.parse(await request.json());
    const data = await transitionCompanyOpportunity(session, opportunityId, input);
    return NextResponse.json({ data }, { headers: COMPANY_OPPORTUNITY_NO_STORE });
  } catch (error) {
    return companyOpportunityErrorResponse(error);
  }
}
