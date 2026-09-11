import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode; // Button text or content
  size?: "xs" | "sm" | "md" | "lg"; // Button size
  variant?: "primary" | "secondary" | "outline" | "ghost" | "success" | "error" | "warning" | "danger" | "destructive";  // Button variant
  startIcon?: ReactNode; // Icon before the text
  endIcon?: ReactNode; // Icon after the text
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void; // Click handler
  disabled?: boolean; // Disabled state
  className?: string; // Disabled state
  title?: string;
  type?: "button" | "submit" | "reset";
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  onClick,
  className = "",
  disabled = false,
  title,
  type = "button",
  isLoading = false,
}) => {
  // Size Classes
  const sizeClasses = {
    xs: "px-2 py-1 text-xs",
    sm: "px-4 py-3 text-sm",
    md: "px-5 py-3.5 text-sm",
    lg: "px-6 py-4 text-base",
  };

  // Variant Classes
  const variantClasses = {
    primary:
      "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300",
    secondary:
      "bg-gray-500 text-white shadow-theme-xs hover:bg-gray-600 disabled:bg-gray-300",
    outline:
      "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300",
    ghost:
      "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300",
    success:
      "bg-success-500 text-white shadow-theme-xs hover:bg-success-600 disabled:bg-success-300",
    error:
      "bg-error-500 text-white shadow-theme-xs hover:bg-error-600 disabled:bg-error-300",
    warning:
      "bg-warning-500 text-white shadow-theme-xs hover:bg-warning-600 disabled:bg-warning-300",
    danger:
      "bg-warning-700 text-white shadow-theme-xs hover:bg-warning-800 disabled:bg-warning-300",
    destructive:
      "bg-warning-700 text-white shadow-theme-xs hover:bg-warning-800 disabled:bg-warning-300",
  };

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg transition ${className} ${
        sizeClasses[size]
      } ${variantClasses[variant]} ${
        disabled || isLoading ? "cursor-not-allowed opacity-50" : ""
      }`}
      onClick={onClick}
      disabled={disabled || isLoading}
      title={title}
    >
      {startIcon && <span className="flex items-center">{startIcon}</span>}
      {children}
      {endIcon && <span className="flex items-center">{endIcon}</span>}
    </button>
  );
};

export default Button;
