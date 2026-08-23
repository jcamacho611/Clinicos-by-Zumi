import "dotenv/config";
import { verifyAllActiveLegacyAccountCompatibility } from "../src/lib/auth/account-compatibility";
import { db } from "../src/lib/db";

async function main() {
  const report = await verifyAllActiveLegacyAccountCompatibility();
  console.log(JSON.stringify({
    total: report.total,
    compatibleCount: report.compatibleCount,
    incompatibleCount: report.incompatibleCount,
    allCompatible: report.allCompatible,
    incompatibleLegacyUserIds: report.results
      .filter((result) => !result.compatible)
      .map((result) => result.legacyUserId),
  }, null, 2));

  if (!report.allCompatible) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("Universal Account compatibility verification failed to execute.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
