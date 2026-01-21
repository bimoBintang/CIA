// Prisma 7 config for Neon PostgreSQL
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Neon connection string from environment
    url: process.env["DATABASE_URL"],
  },
});
