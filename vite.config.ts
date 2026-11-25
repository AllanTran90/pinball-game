import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // Reads the "@/*" alias from tsconfig.json, so it's defined in one place.
  resolve: { tsconfigPaths: true },
  server: {
    // Only watch this project, never the parent folder with other projects.
    fs: { strict: true },
    watch: { ignored: ["**/dist/**", "**/.git/**"] },
  },
});
