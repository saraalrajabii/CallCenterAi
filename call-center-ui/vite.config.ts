import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The bot (call_center.py) runs on http://localhost:7860.
// Proxying its routes lets the UI call them as same-origin requests.
const BOT_URL = process.env.BOT_URL ?? "http://localhost:7860";

export default defineConfig(({ command }) => ({
  // The built UI is served by the bot at http://localhost:7860/client/
  base: command === "build" ? "/client/" : "/",
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/start": BOT_URL,
      "/api": BOT_URL,
      "/sessions": BOT_URL,
    },
  },
}));
