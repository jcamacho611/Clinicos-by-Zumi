import "server-only";

import { db } from "@/lib/db";

const LUXE_ORGANIZATION_SLUG = process.env.LUXE_MEDI_ORGANIZATION_SLUG?.trim() || "luxe-medi";

export type PublicLuxeServiceOption = {
  name: string;
  category: string | null;
};

export async function listPublicLuxeServiceOptions(): Promise<PublicLuxeServiceOption[]> {
  if (!process.env.DATABASE_URL) return [];

  const organization = await db.organization.findFirst({
    where: { slug: LUXE_ORGANIZATION_SLUG, status: "active" },
    select: { id: true },
  });
  if (!organization) return [];

  const services = await db.luxeService.findMany({
    where: { organizationId: organization.id, status: "active" },
    select: { name: true, category: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    take: 100,
  });

  return services.map((service) => ({
    name: service.name,
    category: service.category || null,
  }));
}
