import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // En production uniquement : retire console.* et debugger du bundle (le
  // développement local garde tous ses logs). Pour garder les erreurs, remplacer
  // par pure: ["console.log", "console.debug", "console.info", "console.warn"].
  esbuild: {
    drop: command === "build" ? ["console", "debugger"] : [],
  },
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        // This will transform your SVG to a React component
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
  server: {
    host: true,      // Écoute sur toutes les interfaces réseau
    port: 5173,      // Port par défaut
    strictPort: true, // Utiliser le port 5173 même s'il est occupé
    cors: true,      // Activer CORS
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    },
    // ✅ SOLUTION : Ajouter l'URL ngrok aux hôtes autorisés
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.ngrok-free.app', // Autorise tous les sous-domaines ngrok
      // OU spécifiquement votre URL :
      // '841c-196-127-20-215.ngrok-free.app',
    ],
  },
  build: {
    sourcemap: true,
  },
}));
