import { defineConfig } from "@tanstack/react-start/config";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: {
    preset: "netlify",
  },
  tsr: {
    appDirectory: "src",
  },
  vite: {
    plugins: [
      tsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
      // Type mismatch between tailwindcss and vite under vinxi
      // Tanstack Start plans to remove vinxi as a dependency in the future
      // so this can be ported to vite where this works
      // @ts-expect-error
      tailwindcss(),
    ],
  },
});
