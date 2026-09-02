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
  createCompanyOpportunitySchema,
  createCompanyOpportunity,
  listCompanyOpportunities,
} from "@/lib/repositories/company-opportunity-repository";
import { evaluateSameOriginMutation } from "@/lib/security/same-origin";

export async function GET(request: Request) {
  const session = await getClinicSession();
  if (!session) return companyOpportunityAuthenticationRequired();
  const denied = await enforceApiPermission(session, "company", "read", { request });
  if (denied) return denied;

  try {
    const url = new URL(request.url);
    const limit = url.searchParams.get("limit");
    const data = await listCompanyOpportunities(session, {
      cursor: url.searchParams.get("cursor") || undefined,
      limit: limit === null ? 25 : Number(limit),
    });
    return NextResponse.json({ data }, { headers: COMPANY_OPPORTUNITY_NO_STORE });
  } catch (error) {
    return companyOpportunityErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!evaluateSameOriginMutation(request).allowed) return companyOpportunitySameOriginRequired();
  const session = await getClinicSession();
  if (!session) return companyOpportunityAuthenticationRequired();
  const denied = await enforceApiPermission(session, "company", "create", { request });
  if (denied) return denied;

  try {
    const input = createCompanyOpportunitySchema.parse(await request.json());
    const data = await createCompanyOpportunity(session, input);
    return NextResponse.json(
      { data },
      { status: 201, headers: COMPANY_OPPORTUNITY_NO_STORE },
    );
  } catch (error) {
    return companyOpportunityErrorResponse(error);
  }
}
