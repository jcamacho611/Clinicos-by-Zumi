import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import {
  COMPANY_OPPORTUNITY_NO_STORE,
  companyOpportunityAuthenticationRequired,
  companyOpportunityErrorResponse,
} from "@/lib/company/company-opportunity-api";
import { getCompanyOpportunity } from "@/lib/repositories/company-opportunity-repository";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ opportunityId: string }> },
) {
  const session = await getClinicSession();
  if (!session) return companyOpportunityAuthenticationRequired();
  const denied = await enforceApiPermission(session, "company", "read", { request });
  if (denied) return denied;

  try {
    const { opportunityId } = await params;
    const data = await getCompanyOpportunity(session, opportunityId);
    return NextResponse.json({ data }, { headers: COMPANY_OPPORTUNITY_NO_STORE });
  } catch (error) {
    return companyOpportunityErrorResponse(error);
  }
}
