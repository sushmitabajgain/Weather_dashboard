import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function getPackageChunkName(id) {
  const normalized = id.split("node_modules/")[1];
  if (!normalized) return undefined;

  const parts = normalized.split("/");
  const packageName = parts[0].startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0];

  if (packageName === "react" || packageName === "react-dom" || packageName === "scheduler") {
    return "react-core";
  }
  if (packageName === "react-map-gl" || packageName === "maplibre-gl") {
    return "map";
  }
  if (packageName === "mapbox-gl") {
    return "mapbox-gl";
  }
  if (packageName === "@apollo/client" || packageName === "graphql") {
    return "apollo";
  }
  if (packageName === "recharts") {
    return "charts";
  }
  if (packageName === "react-select") {
    return "select";
  }
  if (packageName === "react-router-dom" || packageName === "@remix-run/router") {
    return "router";
  }
  return undefined;
}

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return getPackageChunkName(id);
          }
        },
      },
    },
  },
});
