import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      include: [
        'src/lib/**',
        'src/hooks/**',
        'src/contexts/**',
        'src/components/**',
        'src/pages/**'
      ],
      exclude: ['src/components/ui/**']
    }
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
