import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  root: ".",
  base: "./",
  build: {
    outDir: resolve(__dirname, "../app/src/main/assets"),
    emptyOutDir: true,
  },
});
