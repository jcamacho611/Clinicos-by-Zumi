import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma",
  engine: "classic",
  datasource: {
    url: process.env.DATABASE_URL ?? "",
    directUrl: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL ?? "",
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
