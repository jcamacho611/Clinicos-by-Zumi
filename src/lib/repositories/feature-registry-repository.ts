import "server-only";

import { db } from "@/lib/db";

export async function listPriorityZeroRegistry() {
  return db.featureRegistrySection.findMany({
    orderBy: { number: "asc" },
    include: {
      capabilities: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          slug: true,
          name: true,
          priority: true,
          deliveryStatus: true,
          deliveryMode: true,
          completionPlan: true,
          canonVersion: true,
        },
      },
    },
  });
}

export async function getPriorityZeroRegistrySummary() {
  const [sectionCount, capabilityCount, statusGroups] = await Promise.all([
    db.featureRegistrySection.count(),
    db.featureRegistryCapability.count(),
    db.featureRegistryCapability.groupBy({ by: ["deliveryStatus"], _count: { _all: true } }),
  ]);

  return {
    sectionCount,
    capabilityCount,
    byStatus: Object.fromEntries(statusGroups.map((group) => [group.deliveryStatus, group._count._all])),
  };
}
