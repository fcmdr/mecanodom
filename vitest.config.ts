import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Fuseau fixe pour des tests déterministes (les libellés d'heures dépendent du TZ).
process.env.TZ = "UTC";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
