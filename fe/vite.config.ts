import { defineConfig } from "vite";

export default defineConfig({
  css: {
    modules: {
      localsConvention: "camelCase",
    },
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
      },
    },
  },
});
