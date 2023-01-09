import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  build: {
    target: "esnext", // https://github.com/sveltejs/kit/issues/859
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
  },
});
