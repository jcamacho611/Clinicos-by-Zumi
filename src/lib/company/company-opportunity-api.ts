import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { CompanyOpportunityAccessError } from "@/lib/repositories/company-opportunity-repository";

export const COMPANY_OPPORTUNITY_NO_STORE = {
  "Cache-Control": "private, no-store",
} as const;

export function companyOpportunityAuthenticationRequired() {
  return NextResponse.json(
    { error: "Authentication required." },
    { status: 401, headers: COMPANY_OPPORTUNITY_NO_STORE },
  );
}

export function companyOpportunitySameOriginRequired() {
  return NextResponse.json(
    { error: "Same-origin request required." },
    { status: 403, headers: COMPANY_OPPORTUNITY_NO_STORE },
  );
}

export function companyOpportunityErrorResponse(error: unknown) {
  if (error instanceof ZodError || error instanceof SyntaxError) {
    return NextResponse.json(
      { error: "Company opportunity request is invalid." },
      { status: 400, headers: COMPANY_OPPORTUNITY_NO_STORE },
    );
  }
  if (error instanceof CompanyOpportunityAccessError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status, headers: COMPANY_OPPORTUNITY_NO_STORE },
    );
  }
  return NextResponse.json(
    { error: "Company opportunity request could not be completed." },
    { status: 500, headers: COMPANY_OPPORTUNITY_NO_STORE },
  );
}
