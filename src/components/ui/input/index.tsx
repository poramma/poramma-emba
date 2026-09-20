// src/components/ui/input/Input.tsx (version complète)

import type React from "react";
import type { FC, ReactNode } from "react";
import { Calendar } from "lucide-react";
import { DateField } from "./DateField";

interface InputProps {
  type?: "text" | "number" | "email" | "password" | "date" | "time" | "datetime-local" | "tel" | "url";
  id?: string;
  name?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  className?: string;
  min?: string;
  max?: string;
  maxLength?: number;
  minLength?: number;
  step?: number;
  disabled?: boolean;
  required?: boolean;
  success?: boolean;
  error?: boolean;
  helperText?: string;
  hint?: string;
  label?: string;
  rows?: number;
  multiline?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
  readOnly?: boolean;
}

export const Input: FC<InputProps> = ({
  type = "text",
  id,
  name,
  placeholder,
  value,
  onChange,
  onKeyPress,
  onKeyDown,
  onFocus,
  onBlur,
  startIcon,
  endIcon,
  className = "",
  min,
  max,
  maxLength,
  minLength,
  step,
  disabled = false,
  required = false,
  success = false,
  error = false,
  helperText,
  hint,
  label,
  rows = 3,
  multiline = false,
  autoFocus = false,
  autoComplete,
  readOnly = false,
}) => {
  // Un champ de date/heure est un vrai sélecteur (calendrier), jamais une saisie brute.
  const isDate = type === "date" || type === "datetime-local";

  // Calcul du padding en fonction des icônes
  const paddingLeft = startIcon ? "pl-10" : "pl-4";
  const paddingRight = endIcon || isDate ? "pr-10" : "pr-4";

  // Classes de base
  const baseClasses = `
    w-full 
    rounded-lg 
    border 
    appearance-none 
    text-sm 
    shadow-theme-xs 
    focus:outline-none 
    focus:ring-2 
    transition-all 
    duration-200
    dark:bg-gray-900 
    dark:text-white/90 
    dark:placeholder:text-white/30 
    ${paddingLeft}
    ${paddingRight}
    ${className}
  `;

  // Classes d'état
  let stateClasses = "";
  if (disabled) {
    stateClasses = ` text-gray-500 border-gray-300 opacity-60 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
  } else if (error) {
    stateClasses = ` border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800`;
  } else if (success) {
    stateClasses = ` border-success-500 focus:border-success-300 focus:ring-success-500/20 dark:text-success-400 dark:border-success-500 dark:focus:border-success-800`;
  } else {
    stateClasses = ` bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800`;
  }

  // Classes de hauteur
  const heightClasses = multiline 
    ? `min-h-[${rows * 24 + 32}px] py-2.5` 
    : "h-11";

  const inputClasses = `${baseClasses} ${stateClasses} ${heightClasses}`;

  // Classes pour les icônes
  const iconClasses = `
    absolute 
    inset-y-0 
    flex 
    items-center 
    pointer-events-none 
    text-gray-400 
    dark:text-gray-500
  `;

  // Gestion du clic sur l'icône (pour les champs de type password par exemple)
  const handleIconClick = (e: React.MouseEvent) => {
    // Si l'icône a un onClick, on le propage
    if (startIcon && (startIcon as any).props?.onClick) {
      (startIcon as any).props.onClick(e);
    }
    if (endIcon && (endIcon as any).props?.onClick) {
      (endIcon as any).props.onClick(e);
    }
  };

  return (
    <div className="relative w-full">
      {label && (
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Icône de début */}
        {startIcon && (
          <div 
            className={`${iconClasses} left-0 pl-3`}
            onClick={handleIconClick}
          >
            {startIcon}
          </div>
        )}

        {/* Input ou Textarea */}
        {multiline ? (
          <textarea
            id={id}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onKeyPress={onKeyPress}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            onBlur={onBlur}
            disabled={disabled}
            required={required}
            readOnly={readOnly}
            rows={rows}
            autoFocus={autoFocus}
            className={inputClasses}
          />
        ) : isDate ? (
          <DateField
            mode={type === "date" ? "date" : "datetime"}
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            min={min}
            max={max}
            placeholder={placeholder ?? (type === "date" ? "jj/mm/aaaa" : "jj/mm/aaaa hh:mm")}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            autoFocus={autoFocus}
            className={inputClasses}
          />
        ) : (
          <input
            type={type}
            id={id}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onKeyPress={onKeyPress}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            onBlur={onBlur}
            min={min}
            max={max}
            maxLength={maxLength}
            minLength={minLength}
            step={step}
            disabled={disabled}
            required={required}
            readOnly={readOnly}
            autoFocus={autoFocus}
            autoComplete={autoComplete}
            className={inputClasses}
          />
        )}

        {/* Icône calendrier des champs de date */}
        {isDate && !endIcon && (
          <div className={`${iconClasses} right-0 pr-3`}>
            <Calendar className="w-4 h-4" />
          </div>
        )}

        {/* Icône de fin */}
        {endIcon && (
          <div 
            className={`${iconClasses} right-0 pr-3`}
            onClick={handleIconClick}
          >
            {endIcon}
          </div>
        )}
      </div>

      {/* Hint / Message d'erreur */}
      {hint && (
        <p
          className={`mt-1.5 text-xs ${
            error
              ? "text-error-500 dark:text-error-400"
              : success
              ? "text-success-500 dark:text-success-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {hint}
        </p>
      )}
      {helperText && (
        <p
          className={`mt-1.5 text-xs ${
            error
              ? "text-error-500 dark:text-error-400"
              : success
              ? "text-success-500 dark:text-success-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;