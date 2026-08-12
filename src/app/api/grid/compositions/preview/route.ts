import { NextResponse } from "next/server";
import { z } from "zod";
import { getClinicSession } from "@/lib/auth/session";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import {
  evaluateGridComposition,
  gridCompositionComponentSchema,
  gridCompositionTemplates,
} from "@/lib/grid/composition-engine";

const templateKeys = Object.keys(gridCompositionTemplates) as [keyof typeof gridCompositionTemplates, ...(keyof typeof gridCompositionTemplates)[]];

const compositionPreviewSchema = z.object({
  template: z.enum(templateKeys),
  components: z.array(gridCompositionComponentSchema).max(100),
});

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "grid", "read", { request });
  if (denied) return denied;

  try {
    const parsed = compositionPreviewSchema.parse(await request.json());
    const template = gridCompositionTemplates[parsed.template];
    const evaluation = evaluateGridComposition(template, parsed.components);

    return NextResponse.json({
      data: {
        template: {
          key: template.key,
          title: template.title,
          description: template.description,
          version: template.version,
          slots: template.slots,
        },
        evaluation,
      },
    });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
