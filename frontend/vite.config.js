import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command, mode }) => {
  // Fail the production build instead of shipping an app that points at
  // localhost because VITE_API_BASE_URL was forgotten.
  if (command === "build") {
    const env = loadEnv(mode, ".", "VITE_");

    if (!env.VITE_API_BASE_URL) {
      throw new Error(
        "VITE_API_BASE_URL is not set. Set it to the backend API URL, e.g. https://api.example.com/api",
      );
    }

    if (/localhost|127\.0\.0\.1/.test(env.VITE_API_BASE_URL)) {
      throw new Error("VITE_API_BASE_URL must not point to localhost in a build.");
    }
  }

  return {
    plugins: [react(), tailwindcss()],
  };
});