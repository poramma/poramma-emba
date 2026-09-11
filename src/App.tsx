// ============================================================
// src/App.tsx
// ============================================================

/**
 * POINT D'ENTRÉE DE L'APPLICATION
 * 
 * Configure:
 * - Router
 * - Providers globaux
 * - Thème initial
 */

import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { useEffect } from "react";
import { useUIStore } from "./store/uiStore";
import { ToastContainer } from './components/ui/Toast';

function App() {
  const { theme } = useUIStore();

  // Appliquer le thème au chargement
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      prefersDark ? root.classList.add('dark') : root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
    </>
  );
}

export default App;