import { defineConfig } from "prisma/config";

try {
  process.loadEnvFile(".env");
} catch {
  // .env may not exist in all environments
}

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
