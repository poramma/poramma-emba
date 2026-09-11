// src/components/ui/modal/Modal.tsx

import { useRef, useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  isFullscreen?: boolean;
  title?: string;
  titleComponent?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  noPadding?: boolean;
  footer?: React.ReactNode;
  footerClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className,
  showCloseButton = true,
  isFullscreen = false,
  title,
  titleComponent,
  size = "md",
  noPadding = false,
  footer,
  footerClassName,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[90vw]",
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* 
        ═══════════════════════════════════════════════════════════
        MODAL CONTAINER SCROLLABLE
        Le conteneur extérieur gère le scroll global si le modal
        dépasse la hauteur de l'écran. C'est ce wrapper qui permet
        le scroll sur mobile et desktop quand le contenu est trop grand.
        ═══════════════════════════════════════════════════════════
      */}
      <div
        className="relative z-50 flex w-full items-center justify-center max-h-screen overflow-y-auto p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 
          ═══════════════════════════════════════════════════════════
          MODAL REF + DIMENSIONS
          Le modal lui-même a une hauteur max contrainte pour que
          le flex layout interne puisse fonctionner correctement.
          ═══════════════════════════════════════════════════════════
        */}
        <div
          ref={modalRef}
          className={`
            relative
            w-full
            ${isFullscreen ? "h-full" : sizeClasses[size]}
            ${isFullscreen ? "max-h-screen" : "max-h-[90vh]"}
            animate-modal-slide-in
          `}
        >
          {/* 
            ═══════════════════════════════════════════════════════════
            MODAL CONTENT
            Flex column avec hauteur limitée. Le point clé est
            max-h-[90vh] (ou h-full en fullscreen) pour que le
            layout flex puisse distribuer l'espace correctement.
            ═══════════════════════════════════════════════════════════
          */}
          <div
            className={`
              relative
              flex
              flex-col
              bg-white
              dark:bg-gray-900
              shadow-2xl
              overflow-hidden
              ${isFullscreen ? "h-full rounded-none" : "max-h-[90vh] rounded-2xl"}
            `}
          >
            {/* ═══════ HEADER ═══════ */}
            {(title || titleComponent || showCloseButton) && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                {title && (
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {titleComponent ? titleComponent : title}
                  </h2>
                )}
                {showCloseButton && (
                  <button
                    type="button"
                    aria-label="Fermer la fenêtre"
                    onClick={onClose}
                    className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* 
              ═══════════════════════════════════════════════════════════
              BODY SCROLLABLE
              flex-1 : prend tout l'espace restant entre header et footer
              min-h-0 : INDISPENSABLE dans un flex column pour que le
                         navigateur accepte de réduire la hauteur et
                         d'activer overflow-y-auto
              overflow-y-auto : active le scroll vertical quand le contenu
                                dépasse l'espace disponible
              ═══════════════════════════════════════════════════════════
            */}
            <div
              className={`
                flex-1
                min-h-0
                overflow-y-auto
                custom-scrollbar
                ${!noPadding ? "px-6 py-4" : ""}
                ${className ?? ""}
              `}
            >
              {children}
            </div>

            {/* ═══════ FOOTER ═══════ */}
            {footer && (
              <div
                className={`
                  flex items-center justify-end gap-3
                  px-6 py-4
                  border-t border-gray-200 dark:border-gray-700
                  flex-shrink-0
                  ${footerClassName ?? ""}
                `}
              >
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;