// ============================================================
// src/layout/ScrollToTop.tsx
// ============================================================

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowUp } from "lucide-react";

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  const [showButton, setShowButton] = useState(false);

  // Scroll en haut quand la route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Afficher le bouton au scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowButton(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 p-3 rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700 transition-all duration-300 z-50 ${
        showButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
      }`}
      aria-label="Retour en haut"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
};

export default ScrollToTop;