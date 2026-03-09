import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    host: true, // listen on all interfaces (0.0.0.0)
    port: 5174, // match your systemd port
    strictPort: true, // fail if port is in use
    allowedHosts: [
      "erp-frontend.izyanehub.com", // allow your reverse proxy host
      "localhost",
      "127.0.0.1",
      "192.168.100.17", // your internal IP
      "192.168.100.37"  // optional if you access from another IP
    ]
  }
});